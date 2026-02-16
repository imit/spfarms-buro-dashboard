"use client";

import { useEffect, useState } from "react";
import { apiClient, type SheetLayout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface LabelPrintDialogProps {
  labelSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabelPrintDialog({
  labelSlug,
  open,
  onOpenChange,
}: LabelPrintDialogProps) {
  const [layouts, setLayouts] = useState<SheetLayout[]>([]);
  const [selectedLayoutSlug, setSelectedLayoutSlug] = useState<string>("");
  const [copies, setCopies] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function fetchLayouts() {
      try {
        const data = await apiClient.getSheetLayouts();
        setLayouts(data);
        // Select default layout if available
        const defaultLayout = data.find((l) => l.default);
        if (defaultLayout) {
          setSelectedLayoutSlug(defaultLayout.slug);
        } else if (data.length > 0) {
          setSelectedLayoutSlug(data[0].slug);
        }
      } catch {
        setError("Failed to load sheet layouts");
      }
    }

    fetchLayouts();
  }, [open]);

  const selectedLayout = layouts.find((l) => l.slug === selectedLayoutSlug);
  const labelsPerSheet = selectedLayout?.labels_per_sheet ?? 0;
  const totalSheets = labelsPerSheet > 0 ? Math.ceil(copies / labelsPerSheet) : 0;

  async function handlePrint() {
    if (!selectedLayoutSlug) return;
    setError("");
    setIsPrinting(true);

    try {
      const blob = await apiClient.printLabels(
        labelSlug,
        selectedLayoutSlug,
        copies
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${labelSlug}-print-sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate print PDF"
      );
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Label Sheet</DialogTitle>
          <DialogDescription>
            Configure your print sheet layout and number of copies.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

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

          <Field>
            <FieldLabel htmlFor="copies">Number of Copies</FieldLabel>
            <Input
              id="copies"
              type="number"
              min="1"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
              disabled={isPrinting}
            />
          </Field>

          {selectedLayout && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Labels per sheet:</span>{" "}
                {labelsPerSheet}
              </p>
              <p>
                <span className="text-muted-foreground">Total sheets:</span>{" "}
                {totalSheets}
              </p>
              <p>
                <span className="text-muted-foreground">Sheet size:</span>{" "}
                {selectedLayout.sheet_width_cm} x {selectedLayout.sheet_height_cm} cm
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
            {isPrinting ? "Generating..." : "Print"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
