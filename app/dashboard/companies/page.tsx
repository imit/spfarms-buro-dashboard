"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Company, COMPANY_TYPE_LABELS, REGION_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";

export default function CompaniesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchCompanies() {
      try {
        const data = await apiClient.getCompanies();
        setCompanies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load companies");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanies();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage dispensaries, distributors, and partners
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/companies/new">
            <PlusIcon className="mr-2 size-4" />
            Add Company
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : companies.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No companies yet.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/companies/new">Add your first company</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">License #</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const firstLoc = c.locations?.[0];
                const locationLabel = firstLoc
                  ? [firstLoc.city, firstLoc.region ? REGION_LABELS[firstLoc.region] : null]
                      .filter(Boolean)
                      .join(", ") || "-"
                  : "-";

                return (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/dashboard/companies/${c.slug}`)}
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {COMPANY_TYPE_LABELS[c.company_type]}
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
                    <td className="px-4 py-3">
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
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
