"use client";

import { useState } from "react";
import { apiClient, type Strain } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StrainAvatar } from "@/components/grow/strain-avatar";
import { ArrowRightIcon, MergeIcon } from "lucide-react";

interface StrainMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strains: Strain[];
  onMergeComplete: () => void;
}

export function StrainMergeDialog({
  open,
  onOpenChange,
  strains,
  onMergeComplete,
}: StrainMergeDialogProps) {
  const [parentId, setParentId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Only show active, non-child strains as parent options
  const parentOptions = strains.filter((s) => s.active && !s.parent_strain_id);
  const parent = parentOptions.find((s) => s.id === parentId);

  // Child candidates: active strains that aren't the selected parent and aren't already children of another
  const childCandidates = strains.filter(
    (s) => s.id !== parentId && s.active && !s.parent_strain_id
  );

  function toggleChild(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleMerge() {
    if (!parentId || selectedIds.size === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      await apiClient.mergeStrains(parentId, Array.from(selectedIds));
      onOpenChange(false);
      onMergeComplete();
      // Reset state
      setParentId(null);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MergeIcon className="size-5" />
            Merge Phenotypes
          </DialogTitle>
          <DialogDescription>
            Select a parent strain, then pick phenotype variants to merge into
            it. Plants will keep a pheno label for reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Pick parent */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Parent strain
            </label>
            <div className="grid gap-1 max-h-48 overflow-y-auto rounded-md border p-2">
              {parentOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setParentId(s.id);
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.delete(s.id);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors ${
                    parentId === s.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <StrainAvatar name={s.name} size={24} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Pick children */}
          {parentId && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Phenotypes to merge into{" "}
                <span className="text-primary">{parent?.name}</span>
              </label>
              {childCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other strains to merge.
                </p>
              ) : (
                <div className="grid gap-1 max-h-48 overflow-y-auto rounded-md border p-2">
                  {childCandidates.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleChild(s.id)}
                      />
                      <StrainAvatar name={s.name} size={24} />
                      {s.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {parentId && selectedIds.size > 0 && (
            <div className="rounded-md bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Preview
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {Array.from(selectedIds).map((id) => {
                  const s = strains.find((st) => st.id === id);
                  return s ? (
                    <Badge key={id} variant="secondary">
                      {s.name}
                    </Badge>
                  ) : null;
                })}
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <Badge variant="default">{parent?.name}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Plants from merged strains will keep their phenotype label (e.g.
                &quot;b&quot;, &quot;c&quot;, &quot;15&quot;) for identification on the dashboard.
                Merged strains become inactive.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!parentId || selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting
              ? "Merging..."
              : `Merge ${selectedIds.size} strain${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
