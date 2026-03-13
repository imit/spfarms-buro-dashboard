"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  apiClient,
  type Label,
  type LabelStrainVariant,
  type Strain,
} from "@/lib/api";
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
  PlusIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ImageIcon,
  SaveIcon,
  PencilIcon,
  CopyIcon,
} from "lucide-react";

interface LabelStrainVariantPanelProps {
  label: Label;
  onUpdated: (label: Label) => void;
}

export function LabelStrainVariantPanel({
  label,
  onUpdated,
}: LabelStrainVariantPanelProps) {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(
    new Set()
  );
  const [saving, setSaving] = useState<number | null>(null);
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New variant form
  const [newStrainId, setNewStrainId] = useState<string>("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [useStrainTitleImage, setUseStrainTitleImage] = useState(true);
  const [newImageX, setNewImageX] = useState("0");
  const [newImageY, setNewImageY] = useState("0");
  const [newImageW, setNewImageW] = useState("80");
  const [newImageH, setNewImageH] = useState("80");

  // Selected strain for the "add" form
  const selectedStrain = strains.find((s) => String(s.id) === newStrainId);

  // Edit state per variant
  const [editState, setEditState] = useState<
    Record<
      number,
      {
        image_x: string;
        image_y: string;
        image_width: string;
        image_height: string;
        text_overrides: Record<string, string>;
        newFile?: File;
        useStrainTitleImage?: boolean;
      }
    >
  >({});

  useEffect(() => {
    apiClient.getStrains().then(setStrains).catch(() => {});
  }, []);

  // Initialize edit state when variants load
  useEffect(() => {
    const state: typeof editState = {};
    (label.strain_variants ?? []).forEach((v) => {
      if (!editState[v.id]) {
        state[v.id] = {
          image_x: String(v.image_x),
          image_y: String(v.image_y),
          image_width: String(v.image_width),
          image_height: String(v.image_height),
          text_overrides: { ...v.text_overrides },
        };
      }
    });
    if (Object.keys(state).length > 0) {
      setEditState((prev) => ({ ...state, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label.strain_variants]);

  function toggleExpand(id: number) {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Strains that don't already have a variant
  const availableStrains = strains.filter(
    (s) => !(label.strain_variants ?? []).some((v) => v.strain_id === s.id)
  );

  async function handleAdd() {
    if (!newStrainId) return;
    setError("");
    const formData = new FormData();
    formData.append("label_strain_variant[strain_id]", newStrainId);
    formData.append("label_strain_variant[image_x]", newImageX);
    formData.append("label_strain_variant[image_y]", newImageY);
    formData.append("label_strain_variant[image_width]", newImageW);
    formData.append("label_strain_variant[image_height]", newImageH);
    if (newFile) {
      formData.append("label_strain_variant[strain_image]", newFile);
    } else if (useStrainTitleImage && selectedStrain?.title_image_url) {
      formData.append("label_strain_variant[from_strain_title_image]", "true");
    }
    try {
      const updated = await apiClient.createLabelStrainVariant(
        label.slug,
        formData
      );
      onUpdated(updated);
      setIsAdding(false);
      setNewStrainId("");
      setNewFile(null);
      setNewImageX("0");
      setNewImageY("0");
      setNewImageW("80");
      setNewImageH("80");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add variant");
    }
  }

  async function handleSave(variant: LabelStrainVariant) {
    const state = editState[variant.id];
    if (!state) return;
    setSaving(variant.id);
    setError("");
    const formData = new FormData();
    formData.append("label_strain_variant[image_x]", state.image_x);
    formData.append("label_strain_variant[image_y]", state.image_y);
    formData.append("label_strain_variant[image_width]", state.image_width);
    formData.append("label_strain_variant[image_height]", state.image_height);

    // Send text overrides as nested params
    Object.entries(state.text_overrides).forEach(([key, value]) => {
      formData.append(`label_strain_variant[text_overrides][${key}]`, value);
    });

    if (state.newFile) {
      formData.append("label_strain_variant[strain_image]", state.newFile);
    } else if (state.useStrainTitleImage) {
      formData.append("label_strain_variant[from_strain_title_image]", "true");
    }

    try {
      const updated = await apiClient.updateLabelStrainVariant(
        label.slug,
        variant.id,
        formData
      );
      onUpdated(updated);
      // Clear transient state after save
      setEditState((prev) => ({
        ...prev,
        [variant.id]: { ...prev[variant.id], newFile: undefined, useStrainTitleImage: false },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save variant");
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(variantId: number) {
    setError("");
    try {
      const updated = await apiClient.deleteLabelStrainVariant(
        label.slug,
        variantId
      );
      onUpdated(updated);
      setEditState((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete variant"
      );
    }
  }

  async function handleDuplicate(variantId: number) {
    setError("");
    setDuplicating(variantId);
    try {
      const updated = await apiClient.duplicateLabelStrainVariant(
        label.slug,
        variantId
      );
      onUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to duplicate variant"
      );
    } finally {
      setDuplicating(null);
    }
  }

  function updateEdit(
    id: number,
    field: string,
    value: string
  ) {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function updateTextOverride(id: number, key: string, value: string) {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        text_overrides: { ...prev[id].text_overrides, [key]: value },
      },
    }));
  }

  function addTextOverride(id: number) {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        text_overrides: { ...prev[id].text_overrides, "": "" },
      },
    }));
  }

  function removeTextOverride(id: number, key: string) {
    setEditState((prev) => {
      const overrides = { ...prev[id].text_overrides };
      delete overrides[key];
      return {
        ...prev,
        [id]: { ...prev[id], text_overrides: overrides },
      };
    });
  }

  // Commonly overridden text fields from the label design
  const TEXT_OVERRIDE_KEYS = [
    { key: "product_info.left_text", label: "Product Info Text" },
    { key: "product_info.text_color", label: "Product Info Color" },
    { key: "weight_info.text", label: "Weight Text" },
    { key: "weight_info.text_color", label: "Weight Color" },
    { key: "expiration_date.text", label: "Expiration Date" },
    { key: "expiration_date.text_color", label: "Expiration Color" },
    { key: "batch_id.text", label: "Batch ID" },
    { key: "batch_id.text_color", label: "Batch ID Color" },
    { key: "lot_number.text", label: "Lot Number" },
    { key: "lot_number.text_color", label: "Lot Number Color" },
    { key: "harvest_date.text", label: "Harvest Date" },
    { key: "harvest_date.text_color", label: "Harvest Date Color" },
    { key: "product_id_text.text", label: "Product ID" },
    { key: "product_id_text.text_color", label: "Product ID Color" },
  ];

  const variants = label.strain_variants ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Strain Variants{" "}
          {variants.length > 0 && (
            <span className="text-muted-foreground text-sm font-normal">
              ({variants.length})
            </span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <PlusIcon className="mr-1.5 size-3.5" />
          Add Variant
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Add new variant form */}
      {isAdding && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <FieldGroup>
            <Field>
              <FieldLabel>Strain</FieldLabel>
              <Select value={newStrainId} onValueChange={setNewStrainId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strain..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStrains.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {/* Strain title image preview */}
            {selectedStrain?.title_image_url && (
              <div className="space-y-2">
                <FieldLabel>Strain Title Image</FieldLabel>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStrain.title_image_url}
                    alt={selectedStrain.name}
                    className="h-16 rounded border object-contain bg-white"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useStrainTitleImage && !newFile}
                      onChange={(e) => {
                        setUseStrainTitleImage(e.target.checked);
                        if (e.target.checked) setNewFile(null);
                      }}
                      className="rounded"
                    />
                    Use this image
                  </label>
                </div>
              </div>
            )}
            <Field>
              <FieldLabel>
                {selectedStrain?.title_image_url
                  ? "Or upload custom image"
                  : "Strain Image"}
              </FieldLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setNewFile(file);
                  if (file) setUseStrainTitleImage(false);
                }}
              />
            </Field>
            <div className="grid grid-cols-4 gap-2">
              <Field>
                <FieldLabel>X</FieldLabel>
                <Input
                  type="number"
                  value={newImageX}
                  onChange={(e) => setNewImageX(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Y</FieldLabel>
                <Input
                  type="number"
                  value={newImageY}
                  onChange={(e) => setNewImageY(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Width</FieldLabel>
                <Input
                  type="number"
                  value={newImageW}
                  onChange={(e) => setNewImageW(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Height</FieldLabel>
                <Input
                  type="number"
                  value={newImageH}
                  onChange={(e) => setNewImageH(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newStrainId}>
              Create Variant
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Existing variants */}
      {variants.map((variant) => {
        const expanded = expandedVariants.has(variant.id);
        const state = editState[variant.id];
        return (
          <div
            key={variant.id}
            className={`rounded-lg border ${variant.is_sample ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "bg-card"}`}
          >
            <div className="flex items-center gap-3 p-3">
              <button
                className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
                onClick={() => toggleExpand(variant.id)}
              >
                {expanded ? (
                  <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
                )}
                {variant.strain_image_url && (
                  <img
                    src={variant.strain_image_url}
                    alt=""
                    className="size-8 rounded object-cover"
                  />
                )}
                <span className="font-medium text-sm truncate">
                  {variant.strain_name || `Strain #${variant.strain_id}`}
                </span>
                {variant.is_sample && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                    Sample
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  ({variant.image_width}x{variant.image_height} @{" "}
                  {variant.image_x},{variant.image_y})
                </span>
              </button>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(variant.id)}
                  disabled={duplicating === variant.id}
                >
                  <CopyIcon className="mr-1.5 size-3.5" />
                  {duplicating === variant.id ? "Duplicating..." : "Duplicate"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/projects/labels/${label.slug}/variants/${variant.id}`}
                  >
                    <PencilIcon className="mr-1.5 size-3.5" />
                    Edit
                  </Link>
                </Button>
              </div>
            </div>

            {expanded && state && (
              <div className="px-4 pb-4 space-y-3">
                <Separator />

                {/* Strain image preview */}
                {variant.strain_image_url && (
                  <div className="flex justify-center">
                    <img
                      src={variant.strain_image_url}
                      alt={variant.strain_name || "Strain"}
                      className="max-h-32 rounded border object-contain"
                    />
                  </div>
                )}

                {/* Image position */}
                <FieldGroup>
                  {/* Show strain's title image as an option */}
                  {(() => {
                    const variantStrain = strains.find((s) => s.id === variant.strain_id);
                    if (!variantStrain?.title_image_url) return null;
                    return (
                      <div className="space-y-2">
                        <FieldLabel>Strain Title Image</FieldLabel>
                        <div className="flex items-center gap-3">
                          <img
                            src={variantStrain.title_image_url}
                            alt={variantStrain.name}
                            className="h-12 rounded border object-contain bg-white"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditState((prev) => ({
                                ...prev,
                                [variant.id]: {
                                  ...prev[variant.id],
                                  useStrainTitleImage: true,
                                  newFile: undefined,
                                },
                              }))
                            }
                          >
                            <ImageIcon className="mr-1.5 size-3.5" />
                            Use This Image
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                  <Field>
                    <FieldLabel>Or Upload Custom Image</FieldLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditState((prev) => ({
                          ...prev,
                          [variant.id]: {
                            ...prev[variant.id],
                            newFile: e.target.files?.[0],
                            useStrainTitleImage: false,
                          },
                        }))
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-4 gap-2">
                    <Field>
                      <FieldLabel>X</FieldLabel>
                      <Input
                        type="number"
                        value={state.image_x}
                        onChange={(e) =>
                          updateEdit(variant.id, "image_x", e.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Y</FieldLabel>
                      <Input
                        type="number"
                        value={state.image_y}
                        onChange={(e) =>
                          updateEdit(variant.id, "image_y", e.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Width</FieldLabel>
                      <Input
                        type="number"
                        value={state.image_width}
                        onChange={(e) =>
                          updateEdit(variant.id, "image_width", e.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Height</FieldLabel>
                      <Input
                        type="number"
                        value={state.image_height}
                        onChange={(e) =>
                          updateEdit(variant.id, "image_height", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                </FieldGroup>

                {/* Text overrides */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Text Overrides</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTextOverride(variant.id)}
                    >
                      <PlusIcon className="mr-1 size-3" />
                      Add
                    </Button>
                  </div>
                  {/* Quick-add common keys */}
                  <div className="flex flex-wrap gap-1">
                    {TEXT_OVERRIDE_KEYS.filter(
                      (t) => !(t.key in state.text_overrides)
                    ).map((t) => (
                      <button
                        key={t.key}
                        className="text-[10px] px-1.5 py-0.5 rounded border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        onClick={() =>
                          updateTextOverride(variant.id, t.key, "")
                        }
                      >
                        + {t.label}
                      </button>
                    ))}
                  </div>
                  {Object.entries(state.text_overrides).map(
                    ([key, value], idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <Field className="flex-1">
                          <FieldLabel>Key</FieldLabel>
                          <Input
                            value={key}
                            placeholder="e.g. product_info.left_text"
                            onChange={(e) => {
                              const overrides = { ...state.text_overrides };
                              const oldValue = overrides[key];
                              delete overrides[key];
                              overrides[e.target.value] = oldValue;
                              setEditState((prev) => ({
                                ...prev,
                                [variant.id]: {
                                  ...prev[variant.id],
                                  text_overrides: overrides,
                                },
                              }));
                            }}
                          />
                        </Field>
                        <Field className="flex-1">
                          <FieldLabel>Value</FieldLabel>
                          <Input
                            value={value}
                            placeholder="Override text..."
                            onChange={(e) =>
                              updateTextOverride(
                                variant.id,
                                key,
                                e.target.value
                              )
                            }
                          />
                        </Field>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            removeTextOverride(variant.id, key)
                          }
                        >
                          <Trash2Icon className="size-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2Icon className="mr-1.5 size-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {variant.strain_name} variant?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the strain image and text overrides
                          for this variant.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(variant.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    size="sm"
                    onClick={() => handleSave(variant)}
                    disabled={saving === variant.id}
                  >
                    <SaveIcon className="mr-1.5 size-3.5" />
                    {saving === variant.id ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {variants.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground py-2">
          No strain variants yet. Add one to customize this label per strain.
        </p>
      )}
    </div>
  );
}
