"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type DashboardStats,
  type DashboardUnsentInvite,
  type LeadStatus,
  LEAD_STATUS_LABELS,
  ROLE_LABELS,
  type UserRole,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCartIcon,
  DollarSignIcon,
  PhoneIcon,
  FlaskConicalIcon,
  BuildingIcon,
  UsersIcon,
  TrophyIcon,
  StarIcon,
  CrownIcon,
  UserPlusIcon,
  SendIcon,
  MailWarningIcon,
  XIcon,
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const INVITE_PRESETS = [
  { label: "Call follow-up", message: "As discussed on our call, here's your direct access to our wholesale menu." },
  { label: "Cold outreach", message: "We're reaching out to introduce SPFarms and provide direct access to our available inventory." },
] as const;

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState<DashboardUnsentInvite | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingId, setSendingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  async function handleSendInvite() {
    if (!inviteTarget || !stats) return;
    setSendingId(inviteTarget.id);
    try {
      await apiClient.sendWelcomeEmail(inviteTarget.id, { customMessage: inviteMessage || undefined });
      setStats({
        ...stats,
        unsent_invitations: stats.unsent_invitations.filter((u) => u.id !== inviteTarget.id),
      });
      setInviteTarget(null);
      setInviteMessage("");
    } catch {
      // silent
    } finally {
      setSendingId(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6 px-10">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6 px-10">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load the dashboard. Please try again or contact info@spfarmsny.com for help.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of your business
        </p>
      </div>

      {/* Sales CTA */}
      {currentUser?.role === "sales" && (
        <Link
          href="/admin/onboard"
          className="flex items-center gap-5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 text-primary shrink-0">
            <UserPlusIcon className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold">Quick Onboard</p>
            <p className="text-sm text-muted-foreground">
              Add a new dispensary and representative account
            </p>
          </div>
        </Link>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingCartIcon className="size-5" />}
          label="Total Orders"
          value={String(stats.total_orders)}
          href="/admin/orders"
        />
        <StatCard
          icon={<DollarSignIcon className="size-5" />}
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          href="/admin/orders"
        />
        <StatCard
          icon={<PhoneIcon className="size-5" />}
          label="Contacted Dispensaries"
          value={String(stats.contacted_dispensaries)}
          href="/admin/companies"
        />
        <StatCard
          icon={<FlaskConicalIcon className="size-5" />}
          label="Samples Dropped"
          value={String(stats.samples_dropped)}
          href="/admin/samples"
        />
      </div>

      {/* Highlights */}
      {(stats.employee_of_the_month || stats.dispensary_of_the_month || stats.best_dispensary_ever) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.employee_of_the_month && (
            <Link
              href={`/admin/users/${stats.employee_of_the_month.id}`}
              className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-amber-100 text-amber-600">
                  <TrophyIcon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Employee of the Month
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {stats.employee_of_the_month.full_name || stats.employee_of_the_month.email}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.employee_of_the_month.referral_count} referral{stats.employee_of_the_month.referral_count !== 1 ? "s" : ""} this month
              </p>
            </Link>
          )}

          {stats.dispensary_of_the_month && (
            <Link
              href={`/admin/companies/${stats.dispensary_of_the_month.slug}`}
              className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-blue-100 text-blue-600">
                  <StarIcon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dispensary of the Month
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {stats.dispensary_of_the_month.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.dispensary_of_the_month.order_count} order{stats.dispensary_of_the_month.order_count !== 1 ? "s" : ""} this month
              </p>
            </Link>
          )}

          {stats.best_dispensary_ever && (
            <Link
              href={`/admin/companies/${stats.best_dispensary_ever.slug}`}
              className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-emerald-100 text-emerald-600">
                  <CrownIcon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Best Dispensary Ever
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {stats.best_dispensary_ever.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.best_dispensary_ever.order_count} total order{stats.best_dispensary_ever.order_count !== 1 ? "s" : ""}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Unsent invitations — admin only */}
      {currentUser?.role === "admin" && stats.unsent_invitations.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs dark:border-amber-800 dark:bg-amber-950/20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MailWarningIcon className="size-4 text-amber-600" />
              <h3 className="text-sm font-medium">Unsent Invitations</h3>
              <Badge variant="secondary" className="text-xs">
                {stats.unsent_invitations.length}
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-left font-medium">Added</th>
                  <th className="px-4 py-2.5 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.unsent_invitations.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="font-medium">{u.full_name || u.email}</p>
                        {u.full_name && (
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {u.companies.length > 0
                        ? u.companies.map((c) => c.name).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {timeAgo(u.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInviteMessage("");
                            setInviteTarget(u);
                          }}
                        >
                          <SendIcon className="mr-1.5 size-3.5" />
                          Send Invite
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Dismiss"
                          onClick={async () => {
                            try {
                              await apiClient.snoozeInvitation(u.id);
                              setStats({
                                ...stats,
                                unsent_invitations: stats.unsent_invitations.filter((i) => i.id !== u.id),
                              });
                            } catch {}
                          }}
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Dialog open={!!inviteTarget} onOpenChange={(open) => { if (!open) { setInviteTarget(null); setInviteMessage(""); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To: <span className="font-medium text-foreground">{inviteTarget?.email}</span>
              {inviteTarget?.companies && inviteTarget.companies.length > 0 && (
                <span className="ml-2 text-xs">({inviteTarget.companies.map((c) => c.name).join(", ")})</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {INVITE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setInviteMessage(preset.message)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    inviteMessage === preset.message
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
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSendInvite}
              disabled={sendingId === inviteTarget?.id}
              className="w-full"
            >
              <SendIcon className="mr-2 size-4" />
              {sendingId === inviteTarget?.id ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recent lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent companies */}
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BuildingIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Recent Companies</h3>
            </div>
            <Link
              href="/admin/companies"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {stats.recent_companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No companies yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recent_companies.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/companies/${c.slug}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(c.created_at)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${LEAD_STATUS_COLORS[c.lead_status] || ""}`}
                    >
                      {LEAD_STATUS_LABELS[c.lead_status] || c.lead_status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recently invited users */}
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Recently Invited Users</h3>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {stats.recent_users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invited users yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.recent_users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.full_name || u.email}
                      </p>
                      {u.full_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(u.invitation_sent_at)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {ROLE_LABELS[u.role as UserRole] || u.role}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </Link>
  );
}
