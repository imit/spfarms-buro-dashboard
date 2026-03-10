"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type RootDashboardStats,
  type LeadStatus,
  LEAD_STATUS_LABELS,
  ROLE_LABELS,
  type UserRole,
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  DollarSignIcon,
  ShoppingCartIcon,
  HandshakeIcon,
  BuildingIcon,
  UsersIcon,
  CalendarClockIcon,
  TicketIcon,
  TrendingUpIcon,
  ClipboardListIcon,
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

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-200 text-red-800",
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

export default function RootDashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<RootDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getRootDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6 px-10">
        <h2 className="text-2xl font-semibold">Root Dashboard</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6 px-10">
        <h2 className="text-2xl font-semibold">Root Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load the dashboard. Please try again or contact info@spfarmsny.com for help.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Root Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          High-level overview for administrators
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DollarSignIcon className="size-5" />}
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          href="/admin/orders"
        />
        <StatCard
          icon={<ShoppingCartIcon className="size-5" />}
          label="Total Orders"
          value={String(stats.total_orders)}
          href="/admin/orders"
        />
        <StatCard
          icon={<TrendingUpIcon className="size-5" />}
          label="Revenue Today"
          value={formatCurrency(stats.revenue_today)}
          sub={`${stats.orders_today} order${stats.orders_today !== 1 ? "s" : ""} today`}
        />
        <StatCard
          icon={<ShoppingCartIcon className="size-5" />}
          label="Orders Today"
          value={String(stats.orders_today)}
        />
      </div>

      {/* Payments due this week */}
      {stats.payments_due_this_week.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs dark:border-amber-800 dark:bg-amber-950/20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-amber-600" />
              <h3 className="text-sm font-medium">Payments Due This Week</h3>
              <Badge variant="secondary" className="text-xs">
                {stats.payments_due_this_week.length}
              </Badge>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {stats.payments_due_this_week.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${p.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-primary">
                      #{p.order_number}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {p.company_name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          PAYMENT_STATUS_COLORS[p.payment_status] || ""
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[p.payment_status] || p.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {p.days_until_due !== null
                        ? p.days_until_due < 0
                          ? `${Math.abs(p.days_until_due)}d overdue`
                          : p.days_until_due === 0
                            ? "Today"
                            : `${p.days_until_due}d`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open support tickets */}
      {stats.open_support_tickets.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TicketIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Open Support Tickets</h3>
              <Badge variant="secondary" className="text-xs">
                {stats.open_support_tickets.length}
              </Badge>
            </div>
            <Link
              href="/admin/support-tickets"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Subject</th>
                  <th className="px-4 py-2.5 text-left font-medium">From</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Opened</th>
                </tr>
              </thead>
              <tbody>
                {stats.open_support_tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/admin/support-tickets/${t.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-primary">
                      {t.subject || "No subject"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {t.user_full_name || t.user_email || t.company_name || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.status === "open"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.status === "open" ? "Open" : "In Progress"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {timeAgo(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent wholesale registrations */}
      {stats.recent_registrations.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandshakeIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Recent Wholesale Registrations</h3>
              <Badge variant="secondary" className="text-xs">
                {stats.recent_registrations.length}
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-left font-medium">Contact</th>
                  <th className="px-4 py-2.5 text-left font-medium">License</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_registrations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/admin/companies/${r.slug}`)}
                  >
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="font-medium text-primary hover:underline">
                          {r.name}
                        </p>
                        {r.email && (
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.contact_name ? (
                        <div>
                          <p className="text-sm">{r.contact_name}</p>
                          {r.contact_email && (
                            <p className="text-xs text-muted-foreground">
                              {r.contact_email}
                            </p>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.license_number || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.active
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.active ? "Active" : "Pending Review"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {timeAgo(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Latest orders */}
      {stats.latest_orders.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardListIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Latest Orders</h3>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {stats.latest_orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-primary">
                      #{o.order_number}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {o.company_name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      ${parseFloat(o.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {timeAgo(o.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent lists: companies + users */}
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
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                        LEAD_STATUS_COLORS[c.lead_status] || ""
                      }`}
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

      {/* Today's orders */}
      {stats.recent_orders_today.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Orders Today</h3>
              <Badge variant="secondary" className="text-xs">
                {stats.orders_today}
              </Badge>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders_today.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-primary">
                      #{o.order_number}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {o.company_name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      ${parseFloat(o.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {timeAgo(o.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  sub?: string;
}) {
  const content = (
    <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
