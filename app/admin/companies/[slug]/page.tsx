"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CompanyNotes } from "@/components/company-comments-sheet";
import {
  apiClient,
  type Cart,
  type Company,
  type DiscountRecord,
  type LeadStatus,
  type NotificationType,
  type Order,
  type OrderStatus,
  COMPANY_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  REGION_LABELS,
  ROLE_LABELS,
} from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DollarSignIcon,
  ImageIcon,
  RefreshCwIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  ShoppingCartIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react";

const INVITE_PRESETS = [
  { label: "Call follow-up", message: "As discussed on our call, here's your direct access to our wholesale menu." },
  { label: "Cold outreach", message: "We're reaching out to introduce SPFarms and provide direct access to our available inventory." },
] as const;

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
  const [memberLookup, setMemberLookup] = useState<{
    id: number; email: string; full_name: string | null;
    phone_number: string | null; deleted: boolean; already_member: boolean;
  } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [sendingInviteId, setSendingInviteId] = useState<number | null>(null);
  const [inviteModalMember, setInviteModalMember] = useState<{ id: number; email: string; full_name: string | null } | null>(null);
  const [inviteCustomMessage, setInviteCustomMessage] = useState("");
  const [cart, setCart] = useState<Cart | null>(null);
  const [allDiscounts, setAllDiscounts] = useState<DiscountRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartReminderOpen, setCartReminderOpen] = useState(false);
  const [cartReminderMessage, setCartReminderMessage] = useState("");
  const [sendingCartReminder, setSendingCartReminder] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupForm, setFollowupForm] = useState<{ notification_type: NotificationType; subject: string; body: string }>({ notification_type: "feedback_request", subject: "", body: "" });
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);

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
          const [cartData, discountsData, ordersData] = await Promise.all([
            apiClient.getCart(data.id),
            apiClient.getDiscounts(),
            apiClient.getOrders({ company_id: data.id }),
          ]);
          setCart(cartData);
          setAllDiscounts(discountsData);
          setOrders(ordersData);
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

  async function handleMemberEmailLookup(email: string) {
    if (!company || !email.trim() || !email.includes("@")) {
      setMemberLookup(null);
      return;
    }
    setLookingUp(true);
    try {
      const result = await apiClient.lookupCompanyMember(company.slug, email);
      setMemberLookup(result);
      if (result && !result.already_member) {
        setMemberForm((f) => ({
          ...f,
          full_name: result.full_name || f.full_name,
          phone_number: result.phone_number || f.phone_number,
        }));
      }
    } catch {
      setMemberLookup(null);
    } finally {
      setLookingUp(false);
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
      setMemberLookup(null);
      setMemberDialogOpen(false);
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setMemberSubmitting(false);
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!company) return;
    setRemovingMemberId(userId);
    try {
      await apiClient.removeCompanyMember(company.slug, userId);
      const updated = await apiClient.getCompany(slug);
      setCompany(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleSendInvite() {
    if (!inviteModalMember) return;
    setSendingInviteId(inviteModalMember.id);
    try {
      await apiClient.sendWelcomeEmail(inviteModalMember.id, inviteCustomMessage || undefined);
      const updated = await apiClient.getCompany(slug);
      setCompany(updated);
      setInviteModalMember(null);
      setInviteCustomMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSendingInviteId(null);
    }
  }

  async function handleApprove() {
    if (!company) return;
    try {
      const updated = await apiClient.updateCompany(company.slug, { active: true });
      setCompany(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve company");
    }
  }

  async function handleAddCartDiscount(discountId: number) {
    if (!company) return;
    try {
      const updated = await apiClient.addCartDiscount(company.id, discountId);
      setCart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add discount");
    }
  }

  async function handleRemoveCartDiscount(discountId: number) {
    if (!company) return;
    try {
      const updated = await apiClient.removeCartDiscount(company.id, discountId);
      setCart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove discount");
    }
  }

  async function handleSendCartReminder() {
    if (!company) return;
    setSendingCartReminder(true);
    try {
      await apiClient.sendCartReminder(company.slug, cartReminderMessage || undefined);
      setCartReminderOpen(false);
      setCartReminderMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send cart reminder");
    } finally {
      setSendingCartReminder(false);
    }
  }

  async function handleSendFollowup() {
    if (!company) return;
    setSendingFollowup(true);
    try {
      await apiClient.sendCompanyFollowup(company.slug, {
        notification_type: followupForm.notification_type,
        subject: followupForm.subject,
        body: followupForm.body || undefined,
      });
      setFollowupOpen(false);
      setFollowupForm({ notification_type: "feedback_request", subject: "", body: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send follow-up");
    } finally {
      setSendingFollowup(false);
    }
  }

  async function handleFetchLogo() {
    if (!company?.website) return;
    setFetchingLogo(true);
    try {
      const updated = await apiClient.fetchCompanyLogo(company.slug);
      setCompany(updated);
    } catch {
      toast.error("Couldn't find a logo on this website");
    } finally {
      setFetchingLogo(false);
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
            {company.website ? (
              <button
                type="button"
                onClick={handleFetchLogo}
                disabled={fetchingLogo}
                title={company.logo_url ? "Re-fetch logo from website" : "Fetch logo from website"}
                className="relative size-10 shrink-0 rounded-lg border overflow-hidden group cursor-pointer disabled:cursor-wait"
              >
                {company.logo_url ? (
                  <>
                    <img src={company.logo_url} alt="" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCwIcon className={`size-4 text-white ${fetchingLogo ? "animate-spin" : ""}`} />
                    </div>
                  </>
                ) : (
                  <div className="size-full flex items-center justify-center bg-muted">
                    <ImageIcon className={`size-4 text-muted-foreground ${fetchingLogo ? "animate-pulse" : ""}`} />
                  </div>
                )}
              </button>
            ) : company.logo_url ? (
              <img src={company.logo_url} alt="" className="size-10 rounded-lg object-cover border" />
            ) : null}
            <h2 className="text-2xl font-semibold">{company.name}</h2>
            <Badge variant="outline">
              {COMPANY_TYPE_LABELS[company.company_type]}
            </Badge>
            {company.active ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                Pending Approval
              </Badge>
            )}
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
          {!company.active && (
            <Button size="sm" onClick={handleApprove}>
              <CheckCircle2Icon className="mr-2 size-4" />
              Approve
            </Button>
          )}
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

      {/* Two-column layout: main content + notes */}
      <div className="flex gap-6">
        {/* Left column: main content */}
        <div className="flex-1 min-w-0 space-y-6">

      {/* Details & Contact */}
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
          <DetailRow
            label="Email"
            value={company.email ? (
              <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                {company.email}
              </a>
            ) : null}
          />
          <DetailRow label="Phone" value={company.phone_number} />
          <DetailRow
            label="Website"
            value={company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {company.website}
              </a>
            ) : null}
          />
          {socialEntries.map(([platform, handle]) => (
            <DetailRow
              key={platform}
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              value={handle}
            />
          ))}
        </dl>
      </div>

      {/* Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Members</h3>
          <Dialog open={memberDialogOpen} onOpenChange={(open) => {
              setMemberDialogOpen(open);
              if (!open) { setMemberLookup(null); setMemberError(""); }
            }}>
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
                    onChange={(e) => {
                      setMemberForm((f) => ({ ...f, email: e.target.value }));
                      setMemberLookup(null);
                    }}
                    onBlur={(e) => handleMemberEmailLookup(e.target.value)}
                  />
                  {lookingUp && (
                    <p className="text-xs text-muted-foreground">Looking up user...</p>
                  )}
                  {memberLookup && !memberLookup.already_member && !memberLookup.deleted && (
                    <p className="text-xs text-blue-600">
                      Existing user found — will be added to this company
                    </p>
                  )}
                  {memberLookup?.deleted && (
                    <p className="text-xs text-amber-600">
                      Deactivated account — will be restored and added
                    </p>
                  )}
                  {memberLookup?.already_member && (
                    <p className="text-xs text-destructive">
                      Already a member of this company
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-name">Full Name</Label>
                  <Input
                    id="member-name"
                    value={memberForm.full_name}
                    onChange={(e) => setMemberForm((f) => ({ ...f, full_name: e.target.value }))}
                    disabled={!!memberLookup && !memberLookup.already_member && !memberLookup.deleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-phone">Phone Number</Label>
                  <Input
                    id="member-phone"
                    value={memberForm.phone_number}
                    onChange={(e) => setMemberForm((f) => ({ ...f, phone_number: e.target.value }))}
                    disabled={!!memberLookup && !memberLookup.already_member && !memberLookup.deleted}
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
                  <Button type="submit" disabled={memberSubmitting || !!memberLookup?.already_member}>
                    {memberSubmitting ? "Adding..." : memberLookup && !memberLookup.already_member ? "Add Existing User" : "Add Member"}
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
                  <th className="px-4 py-3 w-10"></th>
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
                          onClick={() => {
                            setInviteCustomMessage("");
                            setInviteModalMember({ id: member.id, email: member.email, full_name: member.full_name });
                          }}
                        >
                          <SendIcon className="mr-1.5 size-3.5" />
                          Send Invite
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={removingMemberId === member.id}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.full_name || member.email} from {company.name}. They will lose access to the storefront.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

        {/* Cart Discounts */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TagIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Discounts</span>
            </div>
            {allDiscounts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusIcon className="mr-1.5 size-3.5" />
                    Add Discount
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {allDiscounts
                    .filter(
                      (d) => !cart?.discounts?.some((cd) => cd.id === d.id)
                    )
                    .map((discount) => (
                      <DropdownMenuItem
                        key={discount.id}
                        onClick={() => handleAddCartDiscount(discount.id)}
                      >
                        {discount.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {discount.discount_type === "percentage"
                            ? `${discount.value}%`
                            : `$${discount.value}`}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  {allDiscounts.filter(
                    (d) => !cart?.discounts?.some((cd) => cd.id === d.id)
                  ).length === 0 && (
                    <DropdownMenuItem disabled>
                      No available discounts
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {cart?.discounts && cart.discounts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cart.discounts.map((discount) => (
                <Badge
                  key={discount.id}
                  variant="secondary"
                  className="gap-1.5 pr-1.5"
                >
                  {discount.name}
                  <span className="text-xs text-muted-foreground">
                    {discount.discount_type === "percentage"
                      ? `${discount.value}%`
                      : `$${discount.value}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCartDiscount(discount.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No discounts assigned to this cart.
            </p>
          )}
        </div>
      </div>

      {/* Follow-up Emails */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Follow-up Emails</h3>
          </div>
          <div className="flex gap-2">
            {cart && cart.items.length > 0 && (
              <Dialog open={cartReminderOpen} onOpenChange={(open) => { setCartReminderOpen(open); if (!open) setCartReminderMessage(""); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ShoppingCartIcon className="mr-1.5 size-3.5" />
                    Cart Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Send Cart Reminder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Send a &quot;You have items waiting&quot; email to all members of <span className="font-medium text-foreground">{company?.name}</span>.
                    </p>
                    <Textarea
                      placeholder="Add a custom message (optional)..."
                      value={cartReminderMessage}
                      onChange={(e) => setCartReminderMessage(e.target.value)}
                      rows={2}
                    />
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cart items</p>
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{item.product_name}</span>
                            {item.strain_name && <span className="text-muted-foreground ml-1">({item.strain_name})</span>}
                            <span className="text-muted-foreground"> x{item.quantity}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {item.unit_price ? `$${parseFloat(item.unit_price).toFixed(2)}` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSendCartReminder} disabled={sendingCartReminder} className="w-full">
                      <SendIcon className="mr-2 size-4" />
                      {sendingCartReminder ? "Sending..." : "Send Cart Reminder"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={followupOpen} onOpenChange={(open) => { setFollowupOpen(open); if (!open) setFollowupForm({ notification_type: "feedback_request", subject: "", body: "" }); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MailIcon className="mr-1.5 size-3.5" />
                  Send Follow-up
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Send Follow-up Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Send an email to all members of <span className="font-medium text-foreground">{company?.name}</span>.
                  </p>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={followupForm.notification_type}
                      onChange={(e) => setFollowupForm((f) => ({ ...f, notification_type: e.target.value as NotificationType }))}
                    >
                      {(["feedback_request", "info_request", "product_update", "announcement"] as NotificationType[]).map((t) => (
                        <option key={t} value={t}>{NOTIFICATION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={followupForm.subject}
                      onChange={(e) => setFollowupForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder="Email subject line"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={followupForm.body}
                      onChange={(e) => setFollowupForm((f) => ({ ...f, body: e.target.value }))}
                      placeholder="Email body..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSendFollowup} disabled={sendingFollowup || !followupForm.subject.trim()} className="w-full">
                    <SendIcon className="mr-2 size-4" />
                    {sendingFollowup ? "Sending..." : "Send Follow-up"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {cart && cart.items.length > 0
              ? `${cart.item_count} item${cart.item_count !== 1 ? "s" : ""} in cart — use "Cart Reminder" to nudge this company.`
              : "Cart is empty. Use \"Send Follow-up\" for general emails."}
          </p>
        </div>
      </div>

      {/* Orders & Revenue */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardListIcon className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Orders</h3>
          {orders.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {orders.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSignIcon className="size-4" />
                Total Revenue
              </div>
              <p className="text-2xl font-semibold">
                ${orders
                  .filter((o) => o.status !== "cancelled")
                  .reduce((sum, o) => sum + parseFloat(o.total || "0"), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground mb-1">Confirmed Orders</div>
              <p className="text-2xl font-semibold">
                {orders.filter((o) => o.status !== "pending" && o.status !== "cancelled").length}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground mb-1">Pending</div>
              <p className="text-2xl font-semibold">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Order #</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Placed by</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.user?.full_name || order.user?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${parseFloat(order.total || "0").toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
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

        </div>{/* end left column */}

        {/* Right column: notes */}
        <div className="w-80 shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <CompanyNotes slug={company.slug} />
          </div>
        </div>
      </div>{/* end two-column layout */}

      {/* Invite modal */}
      <Dialog open={!!inviteModalMember} onOpenChange={(open) => { if (!open) { setInviteModalMember(null); setInviteCustomMessage(""); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To: <span className="font-medium text-foreground">{inviteModalMember?.email}</span>
            </p>

            {/* Tone presets */}
            <div className="flex flex-wrap gap-2">
              {INVITE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setInviteCustomMessage(preset.message)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    inviteCustomMessage === preset.message
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom sentence */}
            <Textarea
              placeholder="Add a custom sentence (optional)..."
              value={inviteCustomMessage}
              onChange={(e) => setInviteCustomMessage(e.target.value)}
              rows={2}
            />

            {/* Email preview */}
            <div className="rounded-lg border bg-white p-5 text-sm space-y-3 max-h-64 overflow-y-auto">
              <p className="text-lg font-bold">Hi {inviteModalMember?.full_name || "there"}</p>
              {inviteCustomMessage && (
                <p>{inviteCustomMessage}</p>
              )}
              <p>
                We've created wholesale access for you at SPFarms under <strong>{company?.name}</strong>.
              </p>
              <p>You can now:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>View available inventory</li>
                <li>Download COAs</li>
                <li>Order packaged</li>
                <li>Submit purchase requests directly</li>
              </ul>
              <div className="pt-1">
                <span className="inline-block rounded-lg bg-[#48A848] px-5 py-2 text-sm font-semibold text-white">
                  View Available Inventory
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                This secure link will log you in automatically. It expires in 30 days.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSendInvite}
              disabled={sendingInviteId === inviteModalMember?.id}
              className="w-full"
            >
              <SendIcon className="mr-2 size-4" />
              {sendingInviteId === inviteModalMember?.id ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
