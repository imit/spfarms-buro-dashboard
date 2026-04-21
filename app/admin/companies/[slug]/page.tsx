"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { CompanyNotes } from "@/components/company-comments-sheet";
import {
  apiClient,
  type Cart,
  type Company,
  type Menu,
  type DiscountRecord,
  type LeadStatus,
  type Location,
  type NotificationType,
  type Order,
  type OrderStatus,
  type Region,
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
import { ErrorAlert } from "@/components/ui/error-alert";
import { showError } from "@/lib/errors";
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  DollarSignIcon,
  GlobeIcon,
  ImageIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  ShoppingCartIcon,
  StoreIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
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
  test: "bg-cyan-100 text-cyan-700",
  misc: "bg-stone-100 text-stone-600",
};

const LEAD_STATUSES = Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][];

type Tab = "overview" | "members" | "orders" | "transfer" | "emails";

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
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
  const [bulkListOpen, setBulkListOpen] = useState(false);
  const [bulkListMessage, setBulkListMessage] = useState("");
  const [sendingBulkList, setSendingBulkList] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [locationForm, setLocationForm] = useState({ name: "", address: "", city: "", state: "", zip_code: "", region: "" as string, phone_number: "", license_number: "" });
  const [locationSubmitting, setLocationSubmitting] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [assigningMenu, setAssigningMenu] = useState(false);

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
          const [cartData, discountsData, ordersData, menusData] = await Promise.all([
            apiClient.getCart(data.id),
            apiClient.getDiscounts(),
            apiClient.getOrders({ company_id: data.id }),
            apiClient.getMenus(),
          ]);
          setCart(cartData);
          setAllDiscounts(discountsData);
          setOrders(ordersData);
          setMenus(menusData.filter((m) => m.status === "active"));
        } catch {
          // Cart may not exist yet
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We couldn't load this company"
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
      setError(err instanceof Error ? err.message : "We couldn't delete this company");
      setIsDeleting(false);
    }
  }

  async function handleLeadStatusChange(status: string) {
    if (!company) return;
    try {
      const updated = await apiClient.updateCompany(company.slug, { lead_status: status });
      setCompany(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't update status");
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
      setMemberError(err instanceof Error ? err.message : "We couldn't add member");
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
      setError(err instanceof Error ? err.message : "We couldn't remove member");
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleSendInvite() {
    if (!inviteModalMember) return;
    setSendingInviteId(inviteModalMember.id);
    try {
      await apiClient.sendWelcomeEmail(inviteModalMember.id, { customMessage: inviteCustomMessage || undefined });
      const updated = await apiClient.getCompany(slug);
      setCompany(updated);
      setInviteModalMember(null);
      setInviteCustomMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send the invite");
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
      setError(err instanceof Error ? err.message : "We couldn't approve this company");
    }
  }

  async function handleAddCartDiscount(discountId: number) {
    if (!company) return;
    try {
      const updated = await apiClient.addCartDiscount(company.id, discountId);
      setCart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't add discount");
    }
  }

  async function handleRemoveCartDiscount(discountId: number) {
    if (!company) return;
    try {
      const updated = await apiClient.removeCartDiscount(company.id, discountId);
      setCart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't remove discount");
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
      setError(err instanceof Error ? err.message : "We couldn't send the cart reminder");
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
      setError(err instanceof Error ? err.message : "We couldn't send the follow-up");
    } finally {
      setSendingFollowup(false);
    }
  }

  async function handleSendBulkList() {
    if (!company) return;
    setSendingBulkList(true);
    try {
      const result = await apiClient.sendBulkFlowerList(company.slug, bulkListMessage.trim() || undefined);
      setBulkListOpen(false);
      setBulkListMessage("");
      toast.success(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send the bulk flower list");
    } finally {
      setSendingBulkList(false);
    }
  }

  const emptyLocationForm = { name: "", address: "", city: "", state: "", zip_code: "", region: "" as string, phone_number: "", license_number: "" };

  function openAddLocation() {
    setEditingLocationId(null);
    setLocationForm(emptyLocationForm);
    setLocationFormOpen(true);
  }

  function openEditLocation(loc: Location) {
    setEditingLocationId(loc.id);
    setLocationForm({
      name: loc.name || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      zip_code: loc.zip_code || "",
      region: loc.region || "",
      phone_number: loc.phone_number || "",
      license_number: loc.license_number || "",
    });
    setLocationFormOpen(true);
  }

  async function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setLocationSubmitting(true);
    try {
      const attrs: Record<string, unknown> = {
        name: locationForm.name || null,
        address: locationForm.address || null,
        city: locationForm.city || null,
        state: locationForm.state || null,
        zip_code: locationForm.zip_code || null,
        region: locationForm.region || null,
        phone_number: locationForm.phone_number || null,
        license_number: locationForm.license_number || null,
      };
      if (editingLocationId) attrs.id = editingLocationId;
      const updated = await apiClient.updateCompany(company.slug, {
        locations_attributes: [attrs],
      });
      setCompany(updated);
      setLocationFormOpen(false);
      setLocationForm(emptyLocationForm);
      setEditingLocationId(null);
    } catch (err) {
      showError(editingLocationId ? "update this location" : "add this location");
    } finally {
      setLocationSubmitting(false);
    }
  }

  async function handleDeleteLocation(locationId: number) {
    if (!company) return;
    setDeletingLocationId(locationId);
    try {
      const updated = await apiClient.updateCompany(company.slug, {
        locations_attributes: [{ id: locationId, _destroy: true }],
      });
      setCompany(updated);
    } catch {
      showError("delete this location");
    } finally {
      setDeletingLocationId(null);
    }
  }

  async function handleFetchLogo() {
    if (!company?.website) return;
    setFetchingLogo(true);
    try {
      const updated = await apiClient.fetchCompanyLogo(company.slug);
      setCompany(updated);
    } catch {
      showError("find a logo on this website");
    } finally {
      setFetchingLogo(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground p-10">Loading...</p>;
  }

  if (error && !company) {
    return (
      <div className="space-y-4 p-10">
        <ErrorAlert message={error} />
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

  const isSales = currentUser?.role === "sales";

  const socialEntries = Object.entries(company.social_media || {}).filter(
    ([, v]) => v
  );

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
  const confirmedOrders = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "members", label: "Members", count: company.members?.length || 0 },
    { key: "orders", label: "Orders", count: orders.length },
    { key: "transfer", label: "Transfer Info" },
    { key: "emails", label: "Emails & Cart" },
  ];

  return (
    <div className="space-y-6 px-10">
      {error && <ErrorAlert message={error} />}

      {/* Top bar */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/companies">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Companies</span>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">{company.name}</span>
      </div>

      {/* Hero card */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Logo */}
              {company.website ? (
                <button
                  type="button"
                  onClick={handleFetchLogo}
                  disabled={fetchingLogo}
                  title={company.logo_url ? "Re-fetch logo" : "Fetch logo from website"}
                  className="relative size-14 shrink-0 rounded-xl border overflow-hidden group cursor-pointer disabled:cursor-wait"
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
                      <ImageIcon className={`size-5 text-muted-foreground ${fetchingLogo ? "animate-pulse" : ""}`} />
                    </div>
                  )}
                </button>
              ) : company.logo_url ? (
                <img src={company.logo_url} alt="" className="size-14 rounded-xl object-cover border" />
              ) : (
                <div className="size-14 rounded-xl border bg-muted flex items-center justify-center">
                  <BuildingIcon className="size-6 text-muted-foreground" />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold">{company.name}</h1>
                  <Badge variant="outline">
                    {COMPANY_TYPE_LABELS[company.company_type]}
                  </Badge>
                  {!isSales && company.bulk_buyer && (
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Bulk</Badge>
                  )}
                  {company.active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      Pending Approval
                    </Badge>
                  )}
                </div>

                {/* Lead status dropdown — hidden for sales */}
                {!isSales && (
                  <div className="flex items-center gap-3">
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
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEAD_STATUS_COLORS[value]}`}>
                              {label}
                            </span>
                            {value === company.lead_status && (
                              <span className="ml-auto text-xs text-muted-foreground">current</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {company.description && (
                      <span className="text-sm text-muted-foreground">{company.description}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions — hidden for sales */}
            {!isSales && (
              <div className="flex gap-2 shrink-0">
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
            )}
          </div>
        </div>

        {/* Key info strip */}
        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-6 text-sm">
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <MailIcon className="size-3.5" />
                {company.email}
              </a>
            )}
            {company.phone_number && (
              <a href={`tel:${company.phone_number}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <PhoneIcon className="size-3.5" />
                {company.phone_number}
              </a>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <GlobeIcon className="size-3.5" />
                {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
            {company.license_number && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TagIcon className="size-3.5" />
                {company.license_number}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="size-3.5" />
              Since {new Date(company.created_at).toLocaleDateString()}
            </span>
            {!isSales && (
              <span className="flex items-center gap-1.5 text-muted-foreground" title={company.last_activity_at ? new Date(company.last_activity_at).toLocaleString() : "No activity yet"}>
                <ClockIcon className="size-3.5" />
                Last activity: {timeAgo(company.last_activity_at)}
              </span>
            )}
          </div>
        </div>

        {/* Stats strip — hidden for sales */}
        {!isSales && orders.length > 0 && (
          <div className="border-t px-6 py-3">
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-muted-foreground">Revenue</span>
                <span className="ml-2 font-semibold">${totalRevenue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Orders</span>
                <span className="ml-2 font-semibold">{confirmedOrders}</span>
              </div>
              {pendingOrders > 0 && (
                <div>
                  <span className="text-muted-foreground">Pending</span>
                  <span className="ml-2 font-semibold text-amber-600">{pendingOrders}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Members</span>
                <span className="ml-2 font-semibold">{company.members?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cart</span>
                <span className="ml-2 font-semibold">{cart?.item_count || 0} items</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs — hidden for sales */}
      {!isSales && (
        <div className="border-b">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sales: focused view */}
      {isSales && (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-6">

            {/* Orders indicator (no prices) */}
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <h3 className="font-medium mb-3">Orders</h3>
              <Separator className="mb-3" />
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <p className="text-sm">
                  <span className="text-2xl font-semibold">{orders.length}</span>
                  <span className="text-muted-foreground ml-2">
                    order{orders.length !== 1 ? "s" : ""}
                    {orders.filter((o) => o.status === "pending").length > 0 && (
                      <span className="ml-1">
                        ({orders.filter((o) => o.status === "pending").length} pending)
                      </span>
                    )}
                  </span>
                </p>
              )}
            </div>

            {/* Members */}
            <div className="space-y-4">
              <h3 className="font-medium">Members</h3>
              {!company.members || company.members.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.members.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-4"
                    >
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.full_name || member.email}</span>
                          {member.company_title && (
                            <span className="text-xs text-muted-foreground">{member.company_title}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <a href={`mailto:${member.email}`} className="hover:text-foreground">{member.email}</a>
                          {member.phone_number && (
                            <a href={`tel:${member.phone_number}`} className="hover:text-foreground">{member.phone_number}</a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {member.sign_in_count > 0 ? (
                          <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                            Signed in
                          </Badge>
                        ) : member.invitation_sent_at ? (
                          <Badge variant="secondary" className="text-xs">
                            Invited {new Date(member.invitation_sent_at).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            Not invited
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="space-y-4">
              <h3 className="font-medium">Locations</h3>
              {!company.locations || company.locations.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                  <p className="text-sm text-muted-foreground">No locations added yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {company.locations.map((loc, i) => {
                    const fullAddress = [loc.address, loc.city, loc.state, loc.zip_code]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div key={loc.id ?? i} className="rounded-xl border bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{loc.name || `Location ${i + 1}`}</span>
                          {loc.region && (
                            <Badge variant="outline" className="text-xs">
                              {REGION_LABELS[loc.region]}
                            </Badge>
                          )}
                        </div>
                        {loc.license_number && (
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <Badge variant="secondary" className="text-xs">OCM</Badge>
                            <span className="text-muted-foreground">{loc.license_number}</span>
                          </div>
                        )}
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

            {/* Follow-up email */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Follow-up</h3>
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

          </div>{/* end left column */}

          {/* Right column: notes */}
          <div className="w-80 shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <CompanyNotes slug={company.slug} />
            </div>
          </div>
        </div>
      )}

      {/* Tab content — hidden for sales */}
      {!isSales && <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === "overview" && (
            <>
              {/* Details */}
              <div className="rounded-xl border bg-card p-5 shadow-xs">
                <h3 className="font-medium mb-3">Details</h3>
                <Separator className="mb-1" />
                <dl className="divide-y divide-border/50">
                  <InfoRow label="Type" value={COMPANY_TYPE_LABELS[company.company_type]} />
                  <InfoRow label="License #" value={company.license_number} />
                  <InfoRow label="Slug" value={company.slug} />
                  <InfoRow
                    label="Referred by"
                    value={company.referred_by ? (
                      <Link href={`/admin/users/${company.referred_by.id}`} className="text-primary hover:underline">
                        {company.referred_by.full_name || company.referred_by.email}
                      </Link>
                    ) : null}
                  />
                  <InfoRow label="Created" value={new Date(company.created_at).toLocaleDateString()} />
                  <InfoRow
                    label="Last Activity"
                    value={company.last_activity_at
                      ? `${timeAgo(company.last_activity_at)} (${new Date(company.last_activity_at).toLocaleDateString()})`
                      : "No activity yet"
                    }
                  />
                  {socialEntries.map(([platform, handle]) => (
                    <InfoRow
                      key={platform}
                      label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      value={handle}
                    />
                  ))}
                </dl>
              </div>

              {/* Locations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Locations</h3>
                  <Button variant="outline" size="sm" onClick={openAddLocation}>
                    <PlusIcon className="mr-2 size-4" />
                    Add Location
                  </Button>
                </div>

                <LocationFormDialog
                  open={locationFormOpen}
                  onOpenChange={(open) => {
                    setLocationFormOpen(open);
                    if (!open) { setEditingLocationId(null); setLocationForm(emptyLocationForm); }
                  }}
                  editingLocationId={editingLocationId}
                  locationForm={locationForm}
                  setLocationForm={setLocationForm}
                  onSave={handleSaveLocation}
                  locationSubmitting={locationSubmitting}
                />

                {!company.locations || company.locations.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                    <p className="text-sm text-muted-foreground">No locations added yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {company.locations.map((loc, i) => {
                      const fullAddress = [loc.address, loc.city, loc.state, loc.zip_code]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <div key={loc.id ?? i} className="rounded-xl border bg-card p-4 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{loc.name || `Location ${i + 1}`}</span>
                            <div className="flex items-center gap-2">
                              {loc.region && (
                                <Badge variant="outline" className="text-xs">
                                  {REGION_LABELS[loc.region]}
                                </Badge>
                              )}
                              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => openEditLocation(loc)}>
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" disabled={deletingLocationId === loc.id}>
                                    <Trash2Icon className="size-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove location?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove {loc.name || "this location"} from {company.name}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteLocation(loc.id)}>Remove</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {loc.license_number && (
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <Badge variant="secondary" className="text-xs">OCM</Badge>
                              <span className="text-muted-foreground">{loc.license_number}</span>
                            </div>
                          )}
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

              {/* Assigned Menu */}
              <div className="rounded-xl border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <StoreIcon className="size-4" />
                    Storefront Menu
                  </h3>
                  {company.default_menu_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      disabled={assigningMenu}
                      onClick={async () => {
                        setAssigningMenu(true);
                        try {
                          const updated = await apiClient.updateCompany(company.slug, { default_menu_id: null } as Record<string, unknown>);
                          setCompany(updated);
                          toast.success("Reset to default storefront menu");
                        } catch { showError("reset menu"); }
                        finally { setAssigningMenu(false); }
                      }}
                    >
                      Reset to default
                    </Button>
                  )}
                </div>
                <Separator className="mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {company.default_menu_id
                    ? <>This company sees a custom menu: <Link href={`/admin/menus/${company.default_menu_slug}`} className="text-primary hover:underline font-medium">{menus.find(m => m.id === company.default_menu_id)?.name || company.default_menu_slug}</Link></>
                    : "This company sees the default storefront. Assign a custom menu to show different products or pricing."
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {menus
                    .filter((m) => !m.is_default)
                    .map((m) => (
                      <Button
                        key={m.id}
                        variant={company.default_menu_id === m.id ? "default" : "outline"}
                        size="sm"
                        disabled={assigningMenu}
                        onClick={async () => {
                          if (company.default_menu_id === m.id) return;
                          setAssigningMenu(true);
                          try {
                            const updated = await apiClient.updateCompany(company.slug, { default_menu_id: m.id } as Record<string, unknown>);
                            setCompany(updated);
                            toast.success(`Assigned "${m.name}" menu`);
                          } catch { showError("assign menu"); }
                          finally { setAssigningMenu(false); }
                        }}
                      >
                        {m.name}
                        {m.item_count != null && (
                          <span className="ml-1.5 text-xs opacity-60">({m.item_count})</span>
                        )}
                      </Button>
                    ))}
                  {menus.filter(m => !m.is_default).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No custom menus yet.{" "}
                      <Link href="/admin/menus/new" className="text-primary hover:underline">Create one</Link>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===== MEMBERS TAB ===== */}
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Members</h3>
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
                        {lookingUp && <p className="text-xs text-muted-foreground">Looking up user...</p>}
                        {memberLookup && !memberLookup.already_member && !memberLookup.deleted && (
                          <p className="text-xs text-blue-600">Existing user found — will be added to this company</p>
                        )}
                        {memberLookup?.deleted && (
                          <p className="text-xs text-amber-600">Deactivated account — will be restored and added</p>
                        )}
                        {memberLookup?.already_member && (
                          <p className="text-xs text-destructive">Already a member of this company</p>
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
                      {memberError && <ErrorAlert message={memberError} />}
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
                <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.members.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/admin/users/${member.id}`)}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.full_name || member.email}</span>
                          <Badge variant="outline" className="text-xs">{ROLE_LABELS[member.role]}</Badge>
                          {member.company_title && (
                            <span className="text-xs text-muted-foreground">{member.company_title}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{member.email}</span>
                          {member.phone_number && <span>{member.phone_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {member.invitation_sent_at ? (
                          <Badge variant="secondary" className="text-xs">
                            Invited {new Date(member.invitation_sent_at).toLocaleDateString()}
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
                            Invite
                          </Button>
                        )}
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
                              <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSignIcon className="size-4" />
                      Total Revenue
                    </div>
                    <p className="text-2xl font-semibold">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow-xs">
                    <div className="text-sm text-muted-foreground mb-1">Confirmed Orders</div>
                    <p className="text-2xl font-semibold">{confirmedOrders}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow-xs">
                    <div className="text-sm text-muted-foreground mb-1">Pending</div>
                    <p className="text-2xl font-semibold">{pendingOrders}</p>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                </div>
              ) : (
                <div className="rounded-xl border shadow-xs overflow-hidden">
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

              {/* Cart section */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <ShoppingCartIcon className="size-4 text-muted-foreground" />
                  <h3 className="font-medium">Cart</h3>
                  {cart && cart.items.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {cart.item_count} item{cart.item_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {!cart || cart.items.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                    <p className="text-sm text-muted-foreground">Cart is empty.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border shadow-xs overflow-hidden">
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
                          <td colSpan={4} className="px-4 py-3 text-right font-medium">Total</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            ${parseFloat(String(cart.subtotal)).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Cart Discounts */}
                <div className="rounded-xl border bg-card p-4 space-y-3 shadow-xs">
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
                            .filter((d) => !cart?.discounts?.some((cd) => cd.id === d.id))
                            .map((discount) => (
                              <DropdownMenuItem key={discount.id} onClick={() => handleAddCartDiscount(discount.id)}>
                                {discount.name}
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {discount.discount_type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          {allDiscounts.filter((d) => !cart?.discounts?.some((cd) => cd.id === d.id)).length === 0 && (
                            <DropdownMenuItem disabled>No available discounts</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {cart?.discounts && cart.discounts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {cart.discounts.map((discount) => (
                        <Badge key={discount.id} variant="secondary" className="gap-1.5 pr-1.5">
                          {discount.name}
                          <span className="text-xs text-muted-foreground">
                            {discount.discount_type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
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
                    <p className="text-xs text-muted-foreground">No discounts assigned to this cart.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== TRANSFER INFO TAB ===== */}
          {activeTab === "transfer" && (
            <TransferInfoTab company={company} orders={orders} />
          )}

          {/* ===== EMAILS TAB ===== */}
          {activeTab === "emails" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Follow-up Emails</h3>
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

                  {company?.bulk_buyer && (
                    <Dialog open={bulkListOpen} onOpenChange={(open) => { setBulkListOpen(open); if (!open) setBulkListMessage(""); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <PackageIcon className="mr-1.5 size-3.5" />
                          Send Bulk List
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Send Bulk Flower List</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Email the current bulk flower availability with a PDF attachment to all members of <span className="font-medium text-foreground">{company?.name}</span>.
                          </p>
                          <Textarea
                            placeholder="Add a custom message (optional)..."
                            value={bulkListMessage}
                            onChange={(e) => setBulkListMessage(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSendBulkList} disabled={sendingBulkList} className="w-full">
                            <SendIcon className="mr-2 size-4" />
                            {sendingBulkList ? "Sending..." : "Send Bulk List"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                <p className="text-sm text-muted-foreground">
                  {cart && cart.items.length > 0
                    ? `${cart.item_count} item${cart.item_count !== 1 ? "s" : ""} in cart — use "Cart Reminder" to nudge this company.`
                    : "Cart is empty. Use \"Send Follow-up\" for general emails."}
                </p>
              </div>
            </div>
          )}

        </div>{/* end left column */}

        {/* Right column: notes */}
        <div className="w-80 shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <CompanyNotes slug={company.slug} />
          </div>
        </div>
      </div>}{/* end two-column layout */}

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

            <Textarea
              placeholder="Add a custom sentence (optional)..."
              value={inviteCustomMessage}
              onChange={(e) => setInviteCustomMessage(e.target.value)}
              rows={2}
            />

            <div className="rounded-lg border bg-white p-5 text-sm space-y-3 max-h-64 overflow-y-auto">
              <p className="text-lg font-bold">Hi {inviteModalMember?.full_name || "there"}</p>
              {inviteCustomMessage && <p>{inviteCustomMessage}</p>}
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

function LocationFormDialog({
  open,
  onOpenChange,
  editingLocationId,
  locationForm,
  setLocationForm,
  onSave,
  locationSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocationId: number | null;
  locationForm: { name: string; address: string; city: string; state: string; zip_code: string; region: string; phone_number: string; license_number: string };
  setLocationForm: React.Dispatch<React.SetStateAction<typeof locationForm>>;
  onSave: (e: React.FormEvent) => void;
  locationSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingLocationId ? "Edit Location" : "Add Location"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loc-name">Location Name</Label>
            <Input id="loc-name" placeholder="e.g. Main Store, Warehouse" value={locationForm.name} onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-license">OCM License Number</Label>
            <Input id="loc-license" placeholder="OCM-XXXXX" value={locationForm.license_number} onChange={(e) => setLocationForm((f) => ({ ...f, license_number: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-address">Street Address</Label>
            <Input id="loc-address" value={locationForm.address} onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loc-city">City</Label>
              <Input id="loc-city" value={locationForm.city} onChange={(e) => setLocationForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-state">State</Label>
              <Input id="loc-state" value={locationForm.state} onChange={(e) => setLocationForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-zip">ZIP Code</Label>
              <Input id="loc-zip" value={locationForm.zip_code} onChange={(e) => setLocationForm((f) => ({ ...f, zip_code: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loc-region">Region</Label>
              <select id="loc-region" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={locationForm.region} onChange={(e) => setLocationForm((f) => ({ ...f, region: e.target.value }))}>
                <option value="">Select region</option>
                {(Object.entries(REGION_LABELS) as [Region, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-phone">Phone Number</Label>
              <Input id="loc-phone" value={locationForm.phone_number} onChange={(e) => setLocationForm((f) => ({ ...f, phone_number: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={locationSubmitting}>
              {locationSubmitting ? "Saving..." : editingLocationId ? "Update Location" : "Add Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ORIGIN_ADDRESS = "54400 NY-30, Roxbury, NY 12474";

function TransferInfoTab({ company, orders }: { company: Company; orders: Order[] }) {
  const unfulfilledOrders = orders.filter((o) =>
    o.status !== "cancelled" && o.status !== "delivered" && o.status !== "fulfilled" && o.status !== "payment_received"
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card shadow-xs">
        <div className="px-5 py-3.5 border-b">
          <h3 className="font-semibold text-sm">Transfer Manifest Quick Reference</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Copy info below to fill Metrc transfer forms</p>
        </div>
        <div className="divide-y">
          <CopyRow label="Company License" value={company.license_number || "Not set"} />

          {company.locations.map((loc, i) => {
            const dest = [loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(", ");
            return (
              <div key={loc.id} className="divide-y">
                {company.locations.length > 1 && (
                  <div className="px-5 pt-3 pb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {loc.name || `Location ${i + 1}`} — {loc.city || ""}
                    </span>
                  </div>
                )}
                <CopyRow
                  label="Destination License"
                  value={loc.license_number || "Not set"}
                  sublabel={dest || undefined}
                />
                <DirectionsRow origin={ORIGIN_ADDRESS} destination={dest} />
              </div>
            );
          })}
          {company.locations.length === 0 && (
            <div className="px-5 py-4 text-sm text-muted-foreground">No locations on file.</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="px-5 py-3.5 border-b">
          <h3 className="font-semibold text-sm">Open Orders</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Use order number as Invoice Number on the transfer</p>
        </div>
        {unfulfilledOrders.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">No open orders.</div>
        ) : (
          <div className="divide-y">
            {unfulfilledOrders.map((o) => (
              <CopyRow
                key={o.id}
                label={o.order_number}
                value={o.order_number}
                sublabel={`${o.status} · ${o.items.length} items · $${parseFloat(o.total || "0").toFixed(2)}`}
                linkTo={`/admin/orders/${o.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DirectionsRow({ origin, destination }: { origin: string; destination: string }) {
  const [directions, setDirections] = useState<{ summary: string; duration: string; distance: string; steps: string[]; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setLoading(true);
    apiClient.getDirections(origin, destination)
      .then((data) => { if (!cancelled) setDirections(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [origin, destination]);

  const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!destination) {
    return (
      <div className="px-5 py-3">
        <span className="text-xs text-muted-foreground font-medium">Planned Route</span>
        <p className="text-sm text-muted-foreground mt-0.5">No destination address</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-5 py-3">
        <span className="text-xs text-muted-foreground font-medium">Planned Route</span>
        <p className="text-sm text-muted-foreground mt-1 animate-pulse">Loading directions...</p>
      </div>
    );
  }

  if (error || !directions) {
    return (
      <div className="px-5 py-3 group">
        <span className="text-xs text-muted-foreground font-medium">Planned Route</span>
        <p className="text-sm text-muted-foreground mt-1">
          Could not load directions.{" "}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Open in Google Maps
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 hover:bg-muted/30 group space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Planned Route</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{directions.distance} · {directions.duration}</span>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
            Map
          </a>
        </div>
      </div>
      {/* Route summary — one-liner for the Metrc "Planned Route" field */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-mono select-all flex-1">via {directions.summary}</p>
        <button
          onClick={() => copy(`via ${directions.summary}`)}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {/* Full step-by-step directions */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Step-by-step directions</summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          {directions.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function CopyRow({ label, value, sublabel, linkTo }: { label: string; value: string; sublabel?: string; linkTo?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {sublabel && <span className="text-xs text-muted-foreground">({sublabel})</span>}
        </div>
        <p className="text-sm font-mono mt-0.5 select-all">{value}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {linkTo && (
          <Link href={linkTo} className="text-xs text-blue-600 hover:underline mr-1">View</Link>
        )}
        <button
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
