"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, type Sample } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { FlaskConicalIcon } from "lucide-react";

export default function SamplesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getSamples()
      .then(setSamples)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Samples</h2>
          <p className="text-sm text-muted-foreground">
            Track sample drops to dispensaries
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/samples/new">
            <FlaskConicalIcon className="mr-2 size-4" />
            Log Sample Drop
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : samples.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No sample drops recorded yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/samples/new">Log your first sample drop</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Recipient</th>
                <th className="px-4 py-3 text-left font-medium">Packages</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Dropped By</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/admin/samples/${s.id}`)}
                >
                  <td className="px-4 py-3 font-medium">
                    {new Date(s.dropped_at + "T00:00:00").toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{s.company.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.recipient.full_name || s.recipient.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.items.length} {s.items.length === 1 ? "pkg" : "pkgs"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.items.reduce((sum, i) => sum + i.weight, 0)}g
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.user.full_name || s.user.email}
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
