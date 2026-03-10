"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  apiClient,
  type Company,
  type CompanyType,
  type LeadStatus,
  COMPANY_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  REGION_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { PlusIcon, AlertTriangleIcon, MessageSquareIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, ClipboardListIcon } from "lucide-react";
import { type PaginationMeta } from "@/lib/api";

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

const COMPANY_TYPE_COLORS: Record<CompanyType, string> = {
  dispensary: "bg-green-100 text-green-700",
  distributor: "bg-blue-100 text-blue-700",
  partner: "bg-indigo-100 text-indigo-700",
  processor: "bg-orange-100 text-orange-700",
  microgrower: "bg-teal-100 text-teal-700",
  retailer: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
};

const COMPANY_TYPES = Object.entries(COMPANY_TYPE_LABELS) as [CompanyType, string][];
const LEAD_STATUSES = Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][];

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
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

export default function CompaniesPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<CompanyType | "all">("all");
  const [leadFilter, setLeadFilter] = useState<LeadStatus | "all">("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    apiClient
      .getCompanies({ include_deleted: showDeleted || undefined, page, per_page: 25, q: debouncedSearch || undefined })
      .then((res) => {
        setCompanies(res.data);
        setPagination(res.meta);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "We couldn't load companies")
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, showDeleted, page, debouncedSearch]);

  const filtered = companies.filter((c) => {
    if (typeFilter !== "all" && c.company_type !== typeFilter) return false;
    if (leadFilter !== "all" && c.lead_status !== leadFilter) return false;
    return true;
  });

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage dispensaries, distributors, and partners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button asChild>
            <Link href="/admin/companies/new">
              <PlusIcon className="mr-2 size-4" />
              Add Company
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
              typeFilter === "all"
                ? "bg-foreground text-background ring-2 ring-foreground/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
            <span className="ml-1.5 opacity-70">{pagination?.total ?? companies.length}</span>
          </button>
          {COMPANY_TYPES.map(([value, label]) => {
            const count = companies.filter((c) => c.company_type === value).length;
            if (count === 0) return null;
            const isActive = typeFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(isActive ? "all" : value)}
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? `${COMPANY_TYPE_COLORS[value]} ring-2 ring-current/20`
                    : `${COMPANY_TYPE_COLORS[value]} opacity-50 hover:opacity-80`
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLeadFilter("all")}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
                leadFilter === "all"
                  ? "bg-foreground text-background ring-2 ring-foreground/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
              <span className="ml-1.5 opacity-70">{pagination?.total ?? companies.length}</span>
            </button>
            {LEAD_STATUSES.map(([value, label]) => {
              const count = companies.filter((c) => c.lead_status === value).length;
              const isActive = leadFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLeadFilter(isActive ? "all" : value)}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? `${LEAD_STATUS_COLORS[value]} ring-2 ring-current/20`
                      : `${LEAD_STATUS_COLORS[value]} opacity-50 hover:opacity-80`
                  }`}
                >
                  {label}
                  {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
          {currentUser?.role === "admin" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox
                checked={showDeleted}
                onCheckedChange={(checked) => setShowDeleted(checked === true)}
              />
              Show deleted
            </label>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {companies.length === 0 ? "No companies yet." : "No companies match this filter."}
          </p>
          {companies.length === 0 && (
            <Button asChild className="mt-4">
              <Link href="/admin/companies/new">Add your first company</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Lead Status</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-left font-medium">Orders</th>
                <th className="px-4 py-3 text-left font-medium">Last Activity</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const firstLoc = c.locations?.[0];
                const locationLabel = firstLoc
                  ? [firstLoc.city, firstLoc.region ? REGION_LABELS[firstLoc.region] : null]
                      .filter(Boolean)
                      .join(", ") || "-"
                  : "-";

                return (
                  <tr
                    key={c.id}
                    className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer ${c.deleted_at ? "opacity-50" : ""}`}
                    onClick={() => router.push(`/admin/companies/${c.slug}`)}
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2.5">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="" className="size-7 shrink-0 rounded object-contain bg-white border" />
                        ) : (
                          <span className="size-7 shrink-0 rounded border bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {c.name.charAt(0)}
                          </span>
                        )}
                        {c.name}
                        {c.comments_count > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-muted-foreground text-[10px]" title={`${c.comments_count} note${c.comments_count !== 1 ? "s" : ""}`}>
                            <MessageSquareIcon className="size-3" />
                            {c.comments_count}
                          </span>
                        )}
                        {c.bulk_buyer && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                            Bulk
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {COMPANY_TYPE_LABELS[c.company_type]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.deleted_at ? (
                          <Badge variant="destructive">Deleted</Badge>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEAD_STATUS_COLORS[c.lead_status] || ""}`}
                          >
                            {LEAD_STATUS_LABELS[c.lead_status] || c.lead_status}
                          </span>
                        )}
                        {!c.deleted_at && !c.active && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.deleted_at ? (
                        <span className="text-muted-foreground">-</span>
                      ) : c.members?.length > 0 ? (
                        <span className="text-muted-foreground">
                          {c.members.length} {c.members.length === 1 ? "member" : "members"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                          <AlertTriangleIcon className="size-3.5" />
                          No account
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.orders_count > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <ClipboardListIcon className="size-3.5" />
                          {c.orders_count}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" title={c.last_activity_at ? new Date(c.last_activity_at).toLocaleString() : undefined}>
                      {timeAgo(c.last_activity_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {locationLabel}
                      {c.locations?.length > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          +{c.locations.length - 1}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.per_page + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
