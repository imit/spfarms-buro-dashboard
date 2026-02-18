"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, type SampleHandoff } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CheckCircleIcon } from "lucide-react";

export default function DropSamplesPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [handoffs, setHandoffs] = useState<SampleHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    apiClient
      .getSampleHandoffs({
        receiver_id: currentUser.id,
        status: "assigned",
      })
      .then(setHandoffs)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, currentUser]);

  async function handleConfirmDrop(handoffId: number) {
    setError("");
    setConfirmingId(handoffId);

    try {
      await apiClient.confirmSampleDrop(handoffId);
      setHandoffs((prev) => prev.filter((h) => h.id !== handoffId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm drop"
      );
    } finally {
      setConfirmingId(null);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-3xl space-y-6 px-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/samples">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Confirm Drops</h2>
          <p className="text-sm text-muted-foreground">
            Confirm that you delivered the samples you received
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : handoffs.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No pending drops. All your samples have been delivered.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {handoffs.map((h) => {
            const totalWeight = h.items.reduce((s, i) => s + i.weight, 0);
            const strainGroups = h.items.reduce(
              (acc, item) => {
                const key = `${item.strain_name} ${item.weight}g`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );

            return (
              <div
                key={h.id}
                className="rounded-lg border bg-card p-5 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      From {h.given_by.full_name || h.given_by.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {h.company && <> &middot; {h.company.name}</>}
                    </p>
                    <div className="mt-2 text-sm space-y-0.5">
                      {Object.entries(strainGroups).map(([key, count]) => (
                        <p key={key}>
                          {count}x {key}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {h.items.length} items &middot; {totalWeight}g total
                    </p>
                    {h.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {h.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleConfirmDrop(h.id)}
                    disabled={confirmingId === h.id}
                    size="sm"
                  >
                    <CheckCircleIcon className="mr-2 size-4" />
                    {confirmingId === h.id ? "Confirming..." : "Confirm Drop"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
