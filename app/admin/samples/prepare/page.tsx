"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Strain } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SampleLabelPrintDialog } from "@/components/sample-label-print-dialog";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function PrepareSamplesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [strains, setStrains] = useState<Strain[]>([]);
  const [strainId, setStrainId] = useState("");
  const [weight, setWeight] = useState("3.5");
  const [unitCount, setUnitCount] = useState(10);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [printOpen, setPrintOpen] = useState(false);
  const [createdBatchId, setCreatedBatchId] = useState<number | null>(null);
  const [createdUnitCount, setCreatedUnitCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .getStrains()
      .then((all) => all.filter((s) => s.active))
      .then(setStrains)
      .catch(() => {});
  }, [isAuthenticated]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!strainId) {
      setError("Please select a strain.");
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      setError("Please enter a valid weight.");
      return;
    }
    if (unitCount < 1) {
      setError("Please enter at least 1 unit.");
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = await apiClient.createSampleBatch({
        strain_id: Number(strainId),
        weight: parseFloat(weight),
        unit_count: unitCount,
        notes: notes || undefined,
      });

      setCreatedBatchId(batch.id);
      setCreatedUnitCount(batch.unit_count);
      setPrintOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create sample batch"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-2xl space-y-6 px-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/samples">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Prepare Samples</h2>
          <p className="text-sm text-muted-foreground">
            Create sample units and print labels
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <FieldGroup>
          <Field>
            <FieldLabel>Strain *</FieldLabel>
            <Select value={strainId} onValueChange={setStrainId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a strain..." />
              </SelectTrigger>
              <SelectContent>
                {strains.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    {s.category && (
                      <span className="text-muted-foreground ml-1">
                        ({s.category})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="weight">Unit Weight (grams) *</FieldLabel>
              <Input
                id="weight"
                type="number"
                step="0.5"
                min="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="unit_count">Number of Units *</FieldLabel>
              <Input
                id="unit_count"
                type="number"
                min="1"
                value={unitCount}
                onChange={(e) => setUnitCount(parseInt(e.target.value) || 1)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this batch..."
              rows={2}
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>

        <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Will create:</span>{" "}
            <strong>{unitCount}</strong> sample{unitCount !== 1 ? "s" : ""} of{" "}
            <strong>{weight}g</strong> each
          </p>
          <p>
            <span className="text-muted-foreground">Total weight:</span>{" "}
            {(parseFloat(weight || "0") * unitCount).toFixed(1)}g
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create & Print Labels"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/samples")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>

      {createdBatchId && (
        <SampleLabelPrintDialog
          batchId={createdBatchId}
          unitCount={createdUnitCount}
          open={printOpen}
          onOpenChange={(open) => {
            setPrintOpen(open);
            if (!open) {
              router.push(`/admin/samples/batches/${createdBatchId}`);
            }
          }}
        />
      )}
    </div>
  );
}
