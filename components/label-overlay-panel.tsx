"use client";

import { useState, useRef } from "react";
import { apiClient, type Label, type LabelOverlayData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ImagePlusIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface LabelOverlayPanelProps {
  label: Label;
  onUpdated: (label: Label) => void;
}

export function LabelOverlayPanel({ label, onUpdated }: LabelOverlayPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<"image" | "svg_inline">("image");
  const [error, setError] = useState("");
  const [expandedOverlays, setExpandedOverlays] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New overlay form state
  const [newOverlay, setNewOverlay] = useState({
    name: "",
    position_x: "0",
    position_y: "0",
    width: "50",
    height: "50",
    rotation: "0",
    z_index: "0",
    opacity: "1.0",
    svg_content: "",
  });

  function toggleExpand(id: number) {
    setExpandedOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddOverlay() {
    setError("");
    const formData = new FormData();
    formData.append("label_overlay[name]", newOverlay.name);
    formData.append("label_overlay[position_x]", newOverlay.position_x);
    formData.append("label_overlay[position_y]", newOverlay.position_y);
    formData.append("label_overlay[width]", newOverlay.width);
    formData.append("label_overlay[height]", newOverlay.height);
    formData.append("label_overlay[rotation]", newOverlay.rotation);
    formData.append("label_overlay[z_index]", newOverlay.z_index);
    formData.append("label_overlay[opacity]", newOverlay.opacity);
    formData.append("label_overlay[overlay_type]", addType);

    if (addType === "svg_inline") {
      formData.append("label_overlay[svg_content]", newOverlay.svg_content);
    } else {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("Please select an image file.");
        return;
      }
      formData.append("label_overlay[asset]", file);
    }

    try {
      const updated = await apiClient.createLabelOverlay(label.slug, formData);
      onUpdated(updated);
      setIsAdding(false);
      setNewOverlay({
        name: "",
        position_x: "0",
        position_y: "0",
        width: "50",
        height: "50",
        rotation: "0",
        z_index: "0",
        opacity: "1.0",
        svg_content: "",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't add the overlay"
      );
    }
  }

  async function handleUpdateOverlay(overlay: LabelOverlayData, updates: Record<string, string>) {
    setError("");
    const formData = new FormData();
    for (const [key, value] of Object.entries(updates)) {
      formData.append(`label_overlay[${key}]`, value);
    }

    try {
      const updated = await apiClient.updateLabelOverlay(
        label.slug,
        overlay.id,
        formData
      );
      onUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't update the overlay"
      );
    }
  }

  async function handleDeleteOverlay(overlayId: number) {
    setError("");
    try {
      const updated = await apiClient.deleteLabelOverlay(label.slug, overlayId);
      onUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't delete the overlay"
      );
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Overlays</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <ImagePlusIcon className="mr-2 size-4" />
          Add Overlay
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Add new overlay form */}
      {isAdding && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h4 className="text-sm font-medium">New Overlay</h4>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={newOverlay.name}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Optional name"
                />
              </Field>
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select
                  value={addType}
                  onValueChange={(v) => setAddType(v as "image" | "svg_inline")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image (PNG/SVG file)</SelectItem>
                    <SelectItem value="svg_inline">Inline SVG</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {addType === "image" ? (
              <Field>
                <FieldLabel>Image File</FieldLabel>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel>SVG Content</FieldLabel>
                <Textarea
                  value={newOverlay.svg_content}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, svg_content: e.target.value }))
                  }
                  placeholder="<rect ... />"
                  rows={4}
                />
              </Field>
            )}

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Field>
                <FieldLabel>X</FieldLabel>
                <Input
                  type="number"
                  value={newOverlay.position_x}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, position_x: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Y</FieldLabel>
                <Input
                  type="number"
                  value={newOverlay.position_y}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, position_y: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Width</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  value={newOverlay.width}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, width: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Height</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  value={newOverlay.height}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, height: e.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 grid-cols-3">
              <Field>
                <FieldLabel>Rotation</FieldLabel>
                <Input
                  type="number"
                  value={newOverlay.rotation}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, rotation: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Z-Index</FieldLabel>
                <Input
                  type="number"
                  value={newOverlay.z_index}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, z_index: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Opacity</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={newOverlay.opacity}
                  onChange={(e) =>
                    setNewOverlay((p) => ({ ...p, opacity: e.target.value }))
                  }
                />
              </Field>
            </div>
          </FieldGroup>

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAddOverlay}>
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Existing overlays */}
      {label.overlays.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">
          No overlays yet. Add images or SVG elements to layer on top of the label.
        </p>
      )}

      <div className="space-y-2">
        {label.overlays.map((overlay) => (
          <OverlayItem
            key={overlay.id}
            overlay={overlay}
            isExpanded={expandedOverlays.has(overlay.id)}
            onToggle={() => toggleExpand(overlay.id)}
            onUpdate={(updates) => handleUpdateOverlay(overlay, updates)}
            onDelete={() => handleDeleteOverlay(overlay.id)}
          />
        ))}
      </div>
    </section>
  );
}

function OverlayItem({
  overlay,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  overlay: LabelOverlayData;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Record<string, string>) => void;
  onDelete: () => void;
}) {
  const [edits, setEdits] = useState({
    position_x: overlay.position_x,
    position_y: overlay.position_y,
    width: overlay.width,
    height: overlay.height,
    rotation: overlay.rotation,
    z_index: overlay.z_index.toString(),
    opacity: overlay.opacity,
  });

  const displayName = overlay.name || `${overlay.overlay_type} overlay`;
  const isDirty =
    edits.position_x !== overlay.position_x ||
    edits.position_y !== overlay.position_y ||
    edits.width !== overlay.width ||
    edits.height !== overlay.height ||
    edits.rotation !== overlay.rotation ||
    edits.z_index !== overlay.z_index.toString() ||
    edits.opacity !== overlay.opacity;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left text-sm font-medium"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
          {displayName}
        </button>
        <span className="text-xs text-muted-foreground">
          {overlay.overlay_type === "svg_inline" ? "SVG" : "Image"}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm">
              <Trash2Icon className="size-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete overlay?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this overlay from the label.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-3">
          {overlay.asset_url && (
            <div className="rounded border bg-white p-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={overlay.asset_url}
                alt={displayName}
                className="max-h-16 max-w-[120px] object-contain"
              />
            </div>
          )}

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Field>
              <FieldLabel>X</FieldLabel>
              <Input
                type="number"
                value={edits.position_x}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, position_x: e.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Y</FieldLabel>
              <Input
                type="number"
                value={edits.position_y}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, position_y: e.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Width</FieldLabel>
              <Input
                type="number"
                min="1"
                value={edits.width}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, width: e.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Height</FieldLabel>
              <Input
                type="number"
                min="1"
                value={edits.height}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, height: e.target.value }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-3 grid-cols-3">
            <Field>
              <FieldLabel>Rotation</FieldLabel>
              <Input
                type="number"
                value={edits.rotation}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, rotation: e.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Z-Index</FieldLabel>
              <Input
                type="number"
                value={edits.z_index}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, z_index: e.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Opacity</FieldLabel>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={edits.opacity}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, opacity: e.target.value }))
                }
              />
            </Field>
          </div>

          {isDirty && (
            <Button
              type="button"
              size="sm"
              onClick={() => onUpdate(edits)}
            >
              Save Changes
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
