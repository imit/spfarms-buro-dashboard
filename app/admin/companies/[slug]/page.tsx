"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Cart,
  type Company,
  type LeadStatus,
  COMPANY_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  REGION_LABELS,
  ROLE_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeftIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  ShoppingCartIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  idle: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  sampled: "bg-purple-100 text-purple-700",
  follow_up: "bg-amber-100 text-amber-700",
  negotiating: "bg-orange-100 text-orange-700",
  first_order: "bg-green-100 text-green-700",
  repeat: "bg-emerald-100 text-emerald-700",
  loyal: "bg-emerald-200 text-emerald-800",
  inactive: "bg-gray-100 text-gray-500",
  lost: "bg-red-100 text-red-700",
};

const LEAD_STATUSES = Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][];

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: "", full_name: "", phone_number: "", company_title: "" });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [sendingInviteId, setSendingInviteId] = useState<number | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchCompany() {
      try {
        const data = await apiClient.getCompany(slug);
        setCompany(data);
        try {
          const cartData = await apiClient.getCart(data.id);
          setCart(cartData);
        } catch {
          // Cart may not exist yet — that's fine
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load company"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompany();
  }, [isAuthenticated, slug]);

  async function handleDelete() {
    if (!company) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteCompany(company.slug);
      router.push("/admin/companies");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete company"
      );
      setIsDeleting(false);
    }
  }

  async function handleLeadStatusChange(status: string) {
    if (!company) return;
    try {
      const updated = await apiClient.updateCompany(company.slug, { lead_status: status });
      setCompany(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setMemberSubmitting(true);
    setMemberError("");
    try {
      await apiClient.inviteCompanyMember(company.slug, {
        email: memberForm.email,
        full_name: memberForm.full_name || undefined,
        phone_number: memberForm.phone_number || undefined,
        company_title: memberForm.company_title || undefined,
      });
      const updated = await apiClient.getCompany(slug);
      setCompany(updated);
      setMemberForm({ email: "", full_name: "", phone_number: "", company_title: "" });
      setMemberDialogOpen(false);
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setMemberSubmitting(false);
    }
  }

  async function handleSendInvite(memberId: number) {
    setSendingInviteId(memberId);
    try {
      await apiClient.sendWelcomeEmail(memberId);
      const updated = await apiClient.getCompany(slug);
      setCompany(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSendingInviteId(null);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/companies">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  if (!company) return null;

  const socialEntries = Object.entries(company.social_media || {}).filter(
    ([, v]) => v
  );

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/admin/companies">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <h2 className="text-2xl font-semibold">{company.name}</h2>
            <Badge variant="outline">
              {COMPANY_TYPE_LABELS[company.company_type]}
            </Badge>
            <Badge variant={company.active ? "default" : "secondary"}>
              {company.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="ml-11 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${LEAD_STATUS_COLORS[company.lead_status] || ""}`}
                >
                  {LEAD_STATUS_LABELS[company.lead_status] || company.lead_status}
                  <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-50">
                    <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {LEAD_STATUSES.map(([value, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => handleLeadStatusChange(value)}
                  >
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEAD_STATUS_COLORS[value]}`}
                    >
                      {label}
                    </span>
                    {value === company.lead_status && (
                      <span className="ml-auto text-xs text-muted-foreground">current</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {company.description && (
            <p className="text-sm text-muted-foreground ml-11">
              {company.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/companies/${company.slug}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete company?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {company.name} and all its
                locations. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow
              label="Type"
              value={COMPANY_TYPE_LABELS[company.company_type]}
            />
            <DetailRow label="License #" value={company.license_number} />
            <DetailRow label="Slug" value={company.slug} />
            <DetailRow
              label="Referred by"
              value={company.referred_by ? (
                <Link
                  href={`/admin/users/${company.referred_by.id}`}
                  className="text-primary hover:underline"
                >
                  {company.referred_by.full_name || company.referred_by.email}
                </Link>
              ) : null}
            />
            <DetailRow
              label="Created"
              value={new Date(company.created_at).toLocaleDateString()}
            />
          </dl>
        </div>

        {/* Contact */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Contact</h3>
          <Separator className="mb-3" />
          <div className="space-y-3">
            {company.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="size-4 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${company.email}`}
                  className="text-primary hover:underline"
                >
                  {company.email}
                </a>
              </div>
            )}
            {company.phone_number && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="size-4 text-muted-foreground shrink-0" />
                <span>{company.phone_number}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2 text-sm">
                <GlobeIcon className="size-4 text-muted-foreground shrink-0" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {!company.email && !company.phone_number && !company.website && (
              <p className="text-sm text-muted-foreground">
                No contact info added.
              </p>
            )}
          </div>
        </div>

        {/* Social Media */}
        {socialEntries.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Social Media</h3>
            <Separator className="mb-1" />
            <dl>
              {socialEntries.map(([platform, handle]) => (
                <DetailRow
                  key={platform}
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={handle}
                />
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Members</h3>
          <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="mr-2 size-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email *</Label>
                  <Input
                    id="member-email"
                    type="email"
                    required
                    value={memberForm.email}
                    onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-name">Full Name</Label>
                  <Input
                    id="member-name"
                    value={memberForm.full_name}
                    onChange={(e) => setMemberForm((f) => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-phone">Phone Number</Label>
                  <Input
                    id="member-phone"
                    value={memberForm.phone_number}
                    onChange={(e) => setMemberForm((f) => ({ ...f, phone_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-title">Title</Label>
                  <Input
                    id="member-title"
                    placeholder="e.g. Manager, Buyer"
                    value={memberForm.company_title}
                    onChange={(e) => setMemberForm((f) => ({ ...f, company_title: e.target.value }))}
                  />
                </div>
                {memberError && (
                  <p className="text-sm text-destructive">{memberError}</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={memberSubmitting}>
                    {memberSubmitting ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {!company.members || company.members.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No members yet.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Invite</th>
                </tr>
              </thead>
              <tbody>
                {company.members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/users/${member.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium">
                            {member.full_name || member.email}
                          </div>
                          {member.full_name && (
                            <div className="text-xs text-muted-foreground">
                              {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.company_title || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {member.invitation_sent_at ? (
                        <Badge variant="secondary" className="text-xs">
                          Sent {new Date(member.invitation_sent_at).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sendingInviteId === member.id}
                          onClick={() => handleSendInvite(member.id)}
                        >
                          <SendIcon className="mr-1.5 size-3.5" />
                          {sendingInviteId === member.id ? "Sending..." : "Send Invite"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Cart</h3>
          {cart && cart.items.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {cart.item_count} item{cart.item_count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {!cart || cart.items.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Cart is empty.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PackageIcon className="size-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          {item.strain_name && (
                            <div className="text-xs text-muted-foreground">{item.strain_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[item.product_type]}
                      {item.unit_weight && <span className="ml-1 text-xs">({item.unit_weight}g)</span>}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.unit_price ? `$${parseFloat(item.unit_price).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.unit_price
                        ? `$${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td colSpan={4} className="px-4 py-3 text-right font-medium">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${parseFloat(String(cart.subtotal)).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Locations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Locations</h3>
        {!company.locations || company.locations.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No locations added yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {company.locations.map((loc, i) => {
              const fullAddress = [loc.address, loc.city, loc.state, loc.zip_code]
                .filter(Boolean)
                .join(", ");

              return (
                <div key={loc.id ?? i} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {loc.name || `Location ${i + 1}`}
                    </span>
                    {loc.region && (
                      <Badge variant="outline" className="text-xs">
                        {REGION_LABELS[loc.region]}
                      </Badge>
                    )}
                  </div>
                  {fullAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="size-3.5 mt-0.5 shrink-0" />
                      <span>{fullAddress}</span>
                    </div>
                  )}
                  {loc.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <PhoneIcon className="size-3.5 shrink-0" />
                      <span>{loc.phone_number}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
