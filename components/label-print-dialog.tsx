"use client";

import { useEffect, useState } from "react";
import {
  apiClient,
  type Label,
  type SheetLayout,
  type MetrcLabelSetSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
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
  label: Label;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabelPrintDialog({
  label,
  open,
  onOpenChange,
}: LabelPrintDialogProps) {
  const [layouts, setLayouts] = useState<SheetLayout[]>([]);
  const [selectedLayoutSlug, setSelectedLayoutSlug] = useState<string>("");
  const [copies, setCopies] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState("");

  // METRC
  const metrcEnabled = label.design?.metrc_zone?.enabled ?? false;
  const metrcSets: MetrcLabelSetSummary[] = label.metrc_label_sets ?? [];
  const hasMetrcSets = metrcEnabled && metrcSets.length > 0;
  const [selectedMetrcSetId, setSelectedMetrcSetId] = useState<string>("");

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

    // Auto-select first METRC set if available
    if (hasMetrcSets && metrcSets.length > 0 && !selectedMetrcSetId) {
      setSelectedMetrcSetId(metrcSets[0].id.toString());
    }
  }, [open, hasMetrcSets, metrcSets, selectedMetrcSetId]);

  const selectedLayout = layouts.find((l) => l.slug === selectedLayoutSlug);
  const selectedMetrcSet = metrcSets.find(
    (s) => s.id.toString() === selectedMetrcSetId
  );

  // When METRC set is selected, label count comes from the set
  const labelCount =
    hasMetrcSets && selectedMetrcSet ? selectedMetrcSet.item_count : copies;
  const labelsPerSheet = selectedLayout?.labels_per_sheet ?? 0;
  const totalSheets =
    labelsPerSheet > 0 ? Math.ceil(labelCount / labelsPerSheet) : 0;

  async function handlePrint() {
    if (!selectedLayoutSlug) return;
    setError("");
    setIsPrinting(true);

    try {
      const metrcSetId =
        hasMetrcSets && selectedMetrcSetId
          ? parseInt(selectedMetrcSetId)
          : undefined;

      const blob = await apiClient.printLabels(
        label.slug,
        selectedLayoutSlug,
        copies,
        metrcSetId
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.slug}-print-sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't generate the print PDF"
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
            Configure your print sheet layout
            {hasMetrcSets
              ? " and select a METRC label set."
              : " and number of copies."}
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

          {hasMetrcSets ? (
            <Field>
              <FieldLabel htmlFor="metrc_set">METRC Label Set</FieldLabel>
              <Select
                value={selectedMetrcSetId}
                onValueChange={setSelectedMetrcSetId}
              >
                <SelectTrigger id="metrc_set" className="w-full">
                  <SelectValue placeholder="Select METRC set" />
                </SelectTrigger>
                <SelectContent>
                  {metrcSets.map((set) => (
                    <SelectItem key={set.id} value={set.id.toString()}>
                      {set.name} ({set.item_count} labels)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Each label will get a unique METRC identifier from this set.
              </p>
            </Field>
          ) : (
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
          )}

          {metrcEnabled && metrcSets.length === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              METRC zone is enabled but no label sets have been imported.
              Import METRC tags from the label detail page to print with
              unique identifiers.
            </div>
          )}

          {selectedLayout && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Total labels:</span>{" "}
                {labelCount}
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
            disabled={
              isPrinting ||
              !selectedLayoutSlug ||
              (hasMetrcSets && !selectedMetrcSetId)
            }
          >
            <PrinterIcon className="mr-2 size-4" />
            {isPrinting ? "Generating..." : "Print"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
