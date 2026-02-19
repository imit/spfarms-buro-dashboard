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
  type LeadStatus,
  COMPANY_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  REGION_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PlusIcon, AlertTriangleIcon } from "lucide-react";

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

export default function CompaniesPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [leadFilter, setLeadFilter] = useState<LeadStatus | "all">("all");
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    apiClient
      .getCompanies(showDeleted ? { include_deleted: true } : undefined)
      .then(setCompanies)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load companies")
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, showDeleted]);

  const filtered = companies.filter((c) => {
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
        <Button asChild>
          <Link href="/admin/companies/new">
            <PlusIcon className="mr-2 size-4" />
            Add Company
          </Link>
        </Button>
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
            <span className="ml-1.5 opacity-70">{companies.length}</span>
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

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

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
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">License #</th>
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
                    <td className="px-4 py-3 font-medium">{c.name}</td>
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
                      {locationLabel}
                      {c.locations?.length > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          +{c.locations.length - 1}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.license_number || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
