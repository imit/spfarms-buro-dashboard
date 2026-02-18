"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type SampleHandoff,
  SAMPLE_ITEM_STATUS_LABELS,
  SAMPLE_HANDOFF_STATUS_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CheckCircleIcon, Trash2Icon } from "lucide-react";

export default function HandoffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    isAuthenticated,
    isLoading: authLoading,
    user: currentUser,
  } = useAuth();
  const router = useRouter();
  const [handoff, setHandoff] = useState<SampleHandoff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getSampleHandoff(Number(id))
      .then(setHandoff)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load handoff"
        )
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, id]);

  async function handleConfirmDrop() {
    setIsConfirming(true);
    setError("");
    try {
      const updated = await apiClient.confirmSampleDrop(Number(id));
      setHandoff(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm drop"
      );
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Cancel this handoff? Items will be returned to inventory."))
      return;
    setIsDeleting(true);
    try {
      await apiClient.deleteSampleHandoff(Number(id));
      router.push("/admin/samples");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="px-10 text-muted-foreground">Loading...</p>;
  }

  if (error || !handoff) {
    return (
      <div className="px-10">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error || "Handoff not found"}
        </div>
      </div>
    );
  }

  const canDelete =
    currentUser?.role === "admin" || currentUser?.role === "editor";
  const totalWeight = handoff.items.reduce((s, i) => s + i.weight, 0);

  return (
    <div className="space-y-6 px-10 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/samples">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Sample Handoff</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(handoff.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {handoff.status === "assigned" && (
            <Button
              size="sm"
              onClick={handleConfirmDrop}
              disabled={isConfirming}
            >
              <CheckCircleIcon className="mr-2 size-4" />
              {isConfirming ? "Confirming..." : "Confirm Drop"}
            </Button>
          )}
          {canDelete && handoff.status === "assigned" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="mr-2 size-4" />
              {isDeleting ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Handoff Info */}
      <div className="rounded-lg border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Given By</dt>
            <dd className="font-medium">
              <Link
                href={`/admin/users/${handoff.given_by.id}`}
                className="hover:underline"
              >
                {handoff.given_by.full_name || handoff.given_by.email}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Receiver</dt>
            <dd className="font-medium">
              <Link
                href={`/admin/users/${handoff.receiver.id}`}
                className="hover:underline"
              >
                {handoff.receiver.full_name || handoff.receiver.email}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">
              {handoff.company ? (
                <Link
                  href={`/admin/companies/${handoff.company.slug}`}
                  className="hover:underline"
                >
                  {handoff.company.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">&mdash;</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge
                variant={
                  handoff.status === "dropped" ? "default" : "secondary"
                }
              >
                {SAMPLE_HANDOFF_STATUS_LABELS[handoff.status]}
              </Badge>
            </dd>
          </div>
          {handoff.dropped_at && (
            <div>
              <dt className="text-muted-foreground">Dropped At</dt>
              <dd className="font-medium">
                {new Date(
                  handoff.dropped_at + "T00:00:00"
                ).toLocaleDateString()}
              </dd>
            </div>
          )}
          {handoff.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="font-medium whitespace-pre-wrap">
                {handoff.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Items Table */}
      <div className="rounded-lg border bg-card shadow-xs ring-1 ring-foreground/10">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-medium">
            Items ({handoff.items.length}) &mdash; {totalWeight}g total
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t bg-muted/50">
              <th className="px-5 py-2.5 text-left font-medium">UID</th>
              <th className="px-5 py-2.5 text-left font-medium">Strain</th>
              <th className="px-5 py-2.5 text-right font-medium">Weight</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {handoff.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {item.sample_uid}
                </td>
                <td className="px-5 py-3">{item.strain_name}</td>
                <td className="px-5 py-3 text-right">{item.weight}g</td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      item.status === "dropped" ? "default" : "outline"
                    }
                  >
                    {SAMPLE_ITEM_STATUS_LABELS[item.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
