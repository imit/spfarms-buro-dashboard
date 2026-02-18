"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type SampleBatch,
  SAMPLE_ITEM_STATUS_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SampleLabelPrintDialog } from "@/components/sample-label-print-dialog";
import { ArrowLeftIcon, PrinterIcon, Trash2Icon } from "lucide-react";

export default function BatchDetailPage({
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
  const [batch, setBatch] = useState<SampleBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getSampleBatch(Number(id))
      .then(setBatch)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load batch")
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, id]);

  async function handleDelete() {
    if (!confirm("Delete this batch and all its prepared items?")) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteSampleBatch(Number(id));
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

  if (error || !batch) {
    return (
      <div className="px-10">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error || "Batch not found"}
        </div>
      </div>
    );
  }

  const canDelete =
    currentUser?.role === "admin" || currentUser?.role === "editor";
  const allPrepared = batch.item_counts.assigned === 0 && batch.item_counts.dropped === 0;

  return (
    <div className="space-y-6 px-10 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/samples">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">
            {batch.strain.name} &mdash; {batch.weight}g Batch
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date(batch.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
            <PrinterIcon className="mr-2 size-4" />
            Print Labels
          </Button>
          {canDelete && allPrepared && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="mr-2 size-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>

      {/* Batch Info */}
      <div className="rounded-lg border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Strain</dt>
            <dd className="font-medium">{batch.strain.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Unit Weight</dt>
            <dd className="font-medium">{batch.weight}g</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Units Created</dt>
            <dd className="font-medium">{batch.unit_count}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Prepared By</dt>
            <dd className="font-medium">
              {batch.prepared_by.full_name || batch.prepared_by.email}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">
              {batch.item_counts.prepared} available / {batch.item_counts.assigned}{" "}
              assigned / {batch.item_counts.dropped} dropped
            </dd>
          </div>
          {batch.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="font-medium whitespace-pre-wrap">
                {batch.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Items Table */}
      <div className="rounded-lg border bg-card shadow-xs ring-1 ring-foreground/10">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-medium">
            Sample Items ({batch.items.length})
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
            {batch.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {item.sample_uid}
                </td>
                <td className="px-5 py-3">{item.strain_name}</td>
                <td className="px-5 py-3 text-right">{item.weight}g</td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      item.status === "prepared"
                        ? "secondary"
                        : item.status === "dropped"
                          ? "default"
                          : "outline"
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

      <SampleLabelPrintDialog
        batchId={batch.id}
        unitCount={batch.unit_count}
        open={printOpen}
        onOpenChange={setPrintOpen}
      />
    </div>
  );
}
