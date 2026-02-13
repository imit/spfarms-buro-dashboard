"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";

export default function StrainsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchStrains() {
      try {
        const data = await apiClient.getStrains();
        setStrains(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load strains");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStrains();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Strains</h2>
          <p className="text-sm text-muted-foreground">
            Manage strain library and lab results
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/strains/new">
            <PlusIcon className="mr-2 size-4" />
            Add Strain
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
      ) : strains.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No strains yet.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/strains/new">Add your first strain</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">THC Range</th>
                <th className="px-4 py-3 text-left font-medium">COAs</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {strains.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/dashboard/strains/${s.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.code || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.category ? CATEGORY_LABELS[s.category] : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.thc_range || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.coas_count}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
