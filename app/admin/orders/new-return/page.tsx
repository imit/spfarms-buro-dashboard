"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type Order,
  type ReturnDisposition,
  RETURN_DISPOSITION_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

interface ReturnLine {
  order_item_id: number;
  product_id: number;
  product_name: string;
  thumbnail_url: string | null;
  original_quantity: number;
  unit_price: string;
  // Quantity actually being returned. 0 = exclude this line.
  return_quantity: number;
  metrc_tag?: string;
}

function NewReturnPageInner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get("parent_id");
  const parentId = parentIdParam ? Number(parentIdParam) : null;

  const [parentOrder, setParentOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");
  const [lines, setLines] = useState<ReturnLine[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnDisposition, setReturnDisposition] = useState<ReturnDisposition | "">("");
  const [internalNotes, setInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !parentId) return;
    let cancelled = false;
    apiClient
      .getOrder(parentId)
      .then((order) => {
        if (cancelled) return;
        if (order.order_type === "return") {
          setLoadError("Cannot create a return against another return order.");
          return;
        }
        setParentOrder(order);
        setLines(
          order.items.map((item) => ({
            order_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            thumbnail_url: item.thumbnail_url,
            original_quantity: item.quantity,
            unit_price: item.unit_price,
            return_quantity: 0,
          })),
        );
      })
      .catch(() => setLoadError("Could not load the original order."));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, parentId]);

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => sum + parseFloat(l.unit_price) * l.return_quantity, 0),
    [lines],
  );

  const itemsCount = useMemo(
    () => lines.filter((l) => l.return_quantity > 0).length,
    [lines],
  );

  function setReturnQuantity(idx: number, qty: number) {
    setLines((current) =>
      current.map((l, i) => {
        if (i !== idx) return l;
        const clamped = Math.max(0, Math.min(qty, l.original_quantity));
        return { ...l, return_quantity: clamped };
      }),
    );
  }

  function setMetrcTag(idx: number, tag: string) {
    setLines((current) =>
      current.map((l, i) => (i === idx ? { ...l, metrc_tag: tag } : l)),
    );
  }

  async function handleSubmit() {
    if (!parentOrder) return;

    const itemsPayload = lines
      .filter((l) => l.return_quantity > 0)
      .map((l) => ({
        order_item_id: l.order_item_id,
        product_id: l.product_id,
        quantity: l.return_quantity,
        unit_price: l.unit_price,
        metrc_tag: l.metrc_tag?.trim() || undefined,
      }));

    if (itemsPayload.length === 0) {
      setError("Set a return quantity on at least one item.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const created = await apiClient.createReturnOrder({
        parent_order_id: parentOrder.id,
        return_reason: returnReason.trim() || undefined,
        return_disposition: returnDisposition || undefined,
        internal_notes: internalNotes.trim() || undefined,
        items: itemsPayload,
      });
      toast.success(`Return ${created.order_number} created`);
      router.push(`/admin/orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create return");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (!parentId) {
    return (
      <div className="px-4 py-6 sm:px-10">
        <ErrorAlert message="Missing parent order. Use 'Create Return' from an order's detail page." />
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/orders")}>
          Back to orders
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 py-6 sm:px-10">
        <ErrorAlert message={loadError} />
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/orders")}>
          Back to orders
        </Button>
      </div>
    );
  }

  if (!parentOrder) {
    return (
      <div className="px-4 py-6 sm:px-10">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-10 sm:px-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="mr-1.5 size-4" />
          Back
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 mb-2">
          <RotateCcwIcon className="size-5" />
          <h1 className="text-xl font-bold tracking-tight">Create return</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Recording a return against{" "}
          <Link
            href={`/admin/orders/${parentOrder.id}`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {parentOrder.order_number}
          </Link>{" "}
          ({parentOrder.company?.name ?? "—"}). For audit only — does not adjust inventory or
          payment status, and does not sync to Metrc.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="rounded-2xl border bg-card">
        <div className="border-b px-4 sm:px-6 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Returned items
          </h2>
        </div>
        <div className="divide-y">
          {lines.map((line, idx) => (
            <div key={line.order_item_id} className="flex items-center gap-4 px-4 sm:px-6 py-3">
              {line.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.thumbnail_url}
                  alt={line.product_name}
                  className="size-12 shrink-0 rounded object-cover bg-muted"
                />
              ) : (
                <div className="size-12 shrink-0 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{line.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  Originally ordered: {line.original_quantity} @ ${parseFloat(line.unit_price).toFixed(2)}
                </p>
                <Input
                  value={line.metrc_tag ?? ""}
                  onChange={(e) => setMetrcTag(idx, e.target.value)}
                  placeholder="Metrc tag (optional)"
                  className="mt-2 max-w-xs h-8 text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <FieldLabel className="text-xs text-muted-foreground">Returning</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={line.original_quantity}
                  value={line.return_quantity}
                  onChange={(e) => setReturnQuantity(idx, Number(e.target.value))}
                  className="w-20 h-9"
                />
                <span className="text-xs text-muted-foreground">/ {line.original_quantity}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t px-4 sm:px-6 py-3 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {itemsCount} item{itemsCount !== 1 ? "s" : ""} being returned
          </p>
          <p className="text-base font-semibold text-rose-700 dark:text-rose-400">
            Credit: ${total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="reason">Reason</FieldLabel>
          <Input
            id="reason"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="e.g. damaged, stale, refused"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="disposition">Disposition</FieldLabel>
          <Select
            value={returnDisposition}
            onValueChange={(v) => setReturnDisposition(v as ReturnDisposition)}
          >
            <SelectTrigger id="disposition">
              <SelectValue placeholder="What happened to the goods?" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RETURN_DISPOSITION_LABELS) as ReturnDisposition[]).map((d) => (
                <SelectItem key={d} value={d}>
                  {RETURN_DISPOSITION_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="notes">Internal notes</FieldLabel>
          <Textarea
            id="notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Any context that won't show on the dispensary's statement"
            rows={3}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || itemsCount === 0}>
          {submitting ? "Creating..." : "Create return"}
        </Button>
      </div>
    </div>
  );
}

export default function NewReturnPage() {
  return (
    <Suspense fallback={<p className="px-4 py-6 sm:px-10 text-muted-foreground">Loading...</p>}>
      <NewReturnPageInner />
    </Suspense>
  );
}
