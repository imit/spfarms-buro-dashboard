"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type DashboardStats,
  type LeadStatus,
  LEAD_STATUS_LABELS,
  ROLE_LABELS,
  type UserRole,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
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

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          Failed to load dashboard data.
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
          href="/admin/companies"
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
