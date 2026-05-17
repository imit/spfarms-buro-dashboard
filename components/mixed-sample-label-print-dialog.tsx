"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, type Label, type SheetLayout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PrinterIcon, PlusIcon, Trash2Icon } from "lucide-react";

interface MixedSampleLabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Row = {
  key: string;
  labelId: string;
  count: string;
};

function newRow(): Row {
  return {
    key: crypto.randomUUID(),
    labelId: "",
    count: "1",
  };
}

export function MixedSampleLabelPrintDialog({
  open,
  onOpenChange,
}: MixedSampleLabelPrintDialogProps) {
  const [layouts, setLayouts] = useState<SheetLayout[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLayoutSlug, setSelectedLayoutSlug] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    Promise.all([apiClient.getSheetLayouts(), apiClient.getLabels()])
      .then(([layoutData, labelData]) => {
        setLayouts(layoutData);
        const defaultLayout = layoutData.find((l) => l.default);
        if (defaultLayout) {
          setSelectedLayoutSlug(defaultLayout.slug);
        } else if (layoutData.length > 0) {
          setSelectedLayoutSlug(layoutData[0].slug);
        }
        setLabels(labelData);
      })
      .catch(() => setError("We couldn't load layouts or labels"));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setRows([newRow()]);
      setError("");
    }
  }, [open]);

  const selectedLayout = layouts.find((l) => l.slug === selectedLayoutSlug);
  const labelsPerSheet = selectedLayout?.labels_per_sheet ?? 0;

  const totalLabels = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const n = parseInt(r.count, 10);
        return sum + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0),
    [rows]
  );

  const totalSheets =
    labelsPerSheet > 0 ? Math.ceil(totalLabels / labelsPerSheet) : 0;

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev.length === 1 ? [newRow()] : prev.filter((r) => r.key !== key)
    );
  }

  async function handlePrint() {
    setError("");

    const selections = rows
      .map((r) => ({
        label_id: parseInt(r.labelId, 10),
        count: parseInt(r.count, 10),
      }))
      .filter(
        (s) =>
          Number.isFinite(s.label_id) &&
          s.label_id > 0 &&
          Number.isFinite(s.count) &&
          s.count > 0
      );

    if (selections.length === 0) {
      setError("Add at least one label row");
      return;
    }
    if (!selectedLayoutSlug) {
      setError("Pick a sheet layout");
      return;
    }

    setIsPrinting(true);
    try {
      const blob = await apiClient.printMixedSampleLabelSheet(
        selectedLayoutSlug,
        selections
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sample-labels-mixed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't generate the labels PDF"
      );
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print Mixed Sample Label Sheet</DialogTitle>
          <DialogDescription>
            Pick labels and counts. Each label is printed in sample mode.
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

          <div className="space-y-2">
            <FieldLabel>Labels</FieldLabel>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.key} className="flex items-center gap-2">
                  <Select
                    value={row.labelId}
                    onValueChange={(v) => updateRow(row.key, { labelId: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Label" />
                    </SelectTrigger>
                    <SelectContent>
                      {labels.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={row.count}
                    onChange={(e) =>
                      updateRow(row.key, { count: e.target.value })
                    }
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove row"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              <PlusIcon className="mr-2 size-4" />
              Add label
            </Button>
          </div>

          {selectedLayout && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Total labels:</span>{" "}
                {totalLabels}
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
            disabled={isPrinting || totalLabels === 0 || !selectedLayoutSlug}
          >
            <PrinterIcon className="mr-2 size-4" />
            {isPrinting ? "Generating..." : "Print Sheet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
