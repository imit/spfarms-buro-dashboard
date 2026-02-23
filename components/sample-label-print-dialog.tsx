"use client";

import { useEffect, useState } from "react";
import { apiClient, type SheetLayout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrinterIcon } from "lucide-react";

interface SampleLabelPrintDialogProps {
  batchId: number;
  unitCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SampleLabelPrintDialog({
  batchId,
  unitCount,
  open,
  onOpenChange,
}: SampleLabelPrintDialogProps) {
  const [layouts, setLayouts] = useState<SheetLayout[]>([]);
  const [selectedLayoutSlug, setSelectedLayoutSlug] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function fetchLayouts() {
      try {
        const data = await apiClient.getSheetLayouts();
        setLayouts(data);
        const defaultLayout = data.find((l) => l.default);
        if (defaultLayout) {
          setSelectedLayoutSlug(defaultLayout.slug);
        } else if (data.length > 0) {
          setSelectedLayoutSlug(data[0].slug);
        }
      } catch {
        setError("We couldn't load the sheet layouts");
      }
    }

    fetchLayouts();
  }, [open]);

  const selectedLayout = layouts.find((l) => l.slug === selectedLayoutSlug);
  const labelsPerSheet = selectedLayout?.labels_per_sheet ?? 0;
  const totalSheets =
    labelsPerSheet > 0 ? Math.ceil(unitCount / labelsPerSheet) : 0;

  async function handlePrint() {
    if (!selectedLayoutSlug) return;
    setError("");
    setIsPrinting(true);

    try {
      const blob = await apiClient.printSampleBatchLabels(
        batchId,
        selectedLayoutSlug
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sample-labels-batch-${batchId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't generate the labels PDF"
      );
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Sample Labels</DialogTitle>
          <DialogDescription>
            Generate a PDF with {unitCount} sample{" "}
            {unitCount === 1 ? "label" : "labels"} on your selected sheet
            layout.
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorAlert message={error} />}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sheet_layout">Sheet Layout</FieldLabel>
            <Select
              value={selectedLayoutSlug}
              onValueChange={setSelectedLayoutSlug}
            >
              <SelectTrigger id="sheet_layout" className="w-full">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                {layouts.map((layout) => (
                  <SelectItem key={layout.slug} value={layout.slug}>
                    {layout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {selectedLayout && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Total labels:</span>{" "}
                {unitCount}
              </p>
              <p>
                <span className="text-muted-foreground">
                  Labels per sheet:
                </span>{" "}
                {labelsPerSheet}
              </p>
              <p>
                <span className="text-muted-foreground">Total sheets:</span>{" "}
                {totalSheets}
              </p>
              <p>
                <span className="text-muted-foreground">Sheet size:</span>{" "}
                {selectedLayout.sheet_width_cm} x{" "}
                {selectedLayout.sheet_height_cm} cm
              </p>
            </div>
          )}
        </FieldGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPrinting}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isPrinting || !selectedLayoutSlug}
          >
            <PrinterIcon className="mr-2 size-4" />
            {isPrinting ? "Generating..." : "Print Labels"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
