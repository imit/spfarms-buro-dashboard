"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Label,
  type LabelStrainVariant,
  type Strain,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ErrorAlert } from "@/components/ui/error-alert";
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
  ArrowLeftIcon,
  SaveIcon,
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  LockIcon,
  UnlockIcon,
} from "lucide-react";

const CM_TO_PX = 37.7953;

const TEXT_OVERRIDE_KEYS = [
  { key: "product_info.left_text", label: "Product Info Text" },
  { key: "weight_info.text", label: "Weight Text" },
  { key: "expiration_date.text", label: "Expiration Date" },
  { key: "batch_id.text", label: "Batch ID" },
  { key: "lot_number.text", label: "Lot Number" },
  { key: "harvest_date.text", label: "Harvest Date" },
  { key: "product_id_text.text", label: "Product ID" },
];

export default function VariantEditorPage({
  params,
}: {
  params: Promise<{ slug: string; variantId: string }>;
}) {
  const { slug, variantId } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [label, setLabel] = useState<Label | null>(null);
  const [variant, setVariant] = useState<LabelStrainVariant | null>(null);
  const [svgPreview, setSvgPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable state
  const [imageX, setImageX] = useState("0");
  const [imageY, setImageY] = useState("0");
  const [imageW, setImageW] = useState("80");
  const [imageH, setImageH] = useState("80");
  const [aspectLocked, setAspectLocked] = useState(true);
  const aspectRatioRef = useRef<number>(1); // w/h
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    {}
  );
  const [strain, setStrain] = useState<Strain | null>(null);

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      const labelData = await apiClient.getLabel(slug);
      setLabel(labelData);
      const v = (labelData.strain_variants ?? []).find(
        (sv) => sv.id === Number(variantId)
      );
      if (!v) {
        setError("Variant not found");
        return;
      }
      setVariant(v);
      setImageX(String(v.image_x));
      setImageY(String(v.image_y));
      setImageW(String(v.image_width));
      setImageH(String(v.image_height));
      setTextOverrides({ ...v.text_overrides });
      if (v.image_width && v.image_height) {
        aspectRatioRef.current = v.image_width / v.image_height;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [slug, variantId]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  // Load strain details for cannabinoid info display
  useEffect(() => {
    if (!variant) return;
    apiClient
      .getStrains()
      .then((strains) => {
        const s = strains.find((st) => st.id === variant.strain_id);
        if (s) setStrain(s);
      })
      .catch(() => {});
  }, [variant]);

  // Load strain image to get natural aspect ratio
  useEffect(() => {
    if (!variant?.strain_image_url) return;
    const img = new Image();
    img.onload = () => {
      aspectRatioRef.current = img.naturalWidth / img.naturalHeight;
    };
    img.src = variant.strain_image_url;
  }, [variant?.strain_image_url]);

  const fetchPreview = useCallback(async () => {
    try {
      const svg = await apiClient.getLabelVariantSvgPreview(
        slug,
        Number(variantId)
      );
      setSvgPreview(svg);
    } catch {
      // Preview may fail
    }
  }, [slug, variantId]);

  useEffect(() => {
    if (isAuthenticated && variant) fetchPreview();
  }, [isAuthenticated, variant, fetchPreview]);

  // Compute scale: the SVG's native width vs its rendered width
  useEffect(() => {
    if (!label || !svgPreview) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const svg = el.querySelector("svg");
      if (svg) {
        const nativeW = parseFloat(label.width_cm) * CM_TO_PX;
        const renderedW = svg.getBoundingClientRect().width;
        setScale(renderedW / nativeW);
      }
    };
    // Wait a frame for layout
    requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [svgPreview, label]);

  function handleWidthChange(val: string) {
    setImageW(val);
    if (aspectLocked && aspectRatioRef.current) {
      const w = parseFloat(val);
      if (!isNaN(w) && w > 0) {
        setImageH(String(Math.round((w / aspectRatioRef.current) * 10) / 10));
      }
    }
  }

  function handleHeightChange(val: string) {
    setImageH(val);
    if (aspectLocked && aspectRatioRef.current) {
      const h = parseFloat(val);
      if (!isNaN(h) && h > 0) {
        setImageW(String(Math.round(h * aspectRatioRef.current * 10) / 10));
      }
    }
  }

  async function handleSave() {
    if (!variant || !label) return;
    setSaving(true);
    setError("");
    const formData = new FormData();
    formData.append("label_strain_variant[image_x]", imageX);
    formData.append("label_strain_variant[image_y]", imageY);
    formData.append("label_strain_variant[image_width]", imageW);
    formData.append("label_strain_variant[image_height]", imageH);
    Object.entries(textOverrides).forEach(([key, value]) => {
      formData.append(`label_strain_variant[text_overrides][${key}]`, value);
    });
    try {
      const updated = await apiClient.updateLabelStrainVariant(
        label.slug,
        variant.id,
        formData
      );
      setLabel(updated);
      const v = (updated.strain_variants ?? []).find(
        (sv) => sv.id === variant.id
      );
      if (v) setVariant(v);
      fetchPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!variant || !label) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteLabelStrainVariant(label.slug, variant.id);
      router.push(`/admin/projects/labels/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
    }
  }

  // Drag handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging({
        startX: e.clientX,
        startY: e.clientY,
        origX: parseFloat(imageX) || 0,
        origY: parseFloat(imageY) || 0,
      });
      setDragOffset({ dx: 0, dy: 0 });
    },
    [imageX, imageY]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      setDragOffset({
        dx: e.clientX - dragging.startX,
        dy: e.clientY - dragging.startY,
      });
    },
    [dragging]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;
      const newX = Math.round((dragging.origX + dx) * 10) / 10;
      const newY = Math.round((dragging.origY + dy) * 10) / 10;
      setImageX(String(newX));
      setImageY(String(newY));
      setDragging(null);
      setDragOffset({ dx: 0, dy: 0 });
    },
    [dragging, scale]
  );

  function updateTextOverride(key: string, value: string) {
    setTextOverrides((prev) => ({ ...prev, [key]: value }));
  }

  function removeTextOverride(key: string) {
    setTextOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function renameTextOverride(oldKey: string, newKey: string) {
    setTextOverrides((prev) => {
      const next = { ...prev };
      const value = next[oldKey];
      delete next[oldKey];
      next[newKey] = value;
      return next;
    });
  }

  if (authLoading || !isAuthenticated) return null;
  if (isLoading)
    return <p className="text-muted-foreground px-10">Loading...</p>;
  if (error && !label)
    return (
      <div className="space-y-4 px-10">
        <ErrorAlert message={error} />
        <Button variant="outline" asChild>
          <Link href={`/admin/projects/labels/${slug}`}>
            <ArrowLeftIcon className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </div>
    );
  if (!label || !variant) return null;

  const widthPx = parseFloat(label.width_cm) * CM_TO_PX;
  const heightPx = parseFloat(label.height_cm) * CM_TO_PX;
  const imgX = parseFloat(imageX) || 0;
  const imgY = parseFloat(imageY) || 0;
  const imgW = parseFloat(imageW) || 80;
  const imgH = parseFloat(imageH) || 80;

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/admin/projects/labels/${slug}`}>
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">
              {variant.strain_name || "Variant"}{" "}
              <span className="text-muted-foreground font-normal text-lg">
                variant
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">{label.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPreview}>
            <RefreshCwIcon className="mr-1.5 size-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <SaveIcon className="mr-1.5 size-3.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2Icon className="mr-1.5 size-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the {variant?.strain_name} variant. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* Preview with drag-and-drop */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Preview — drag the strain image to reposition
          </h3>
          {/*
            Wrapper uses inline-block so it shrinks to fit the SVG exactly.
            The SVG sets the wrapper's dimensions; the absolute-positioned
            drag handle then scales correctly relative to it.
            Checkerboard background = transparent preview.
          */}
          <div
            className="rounded-lg border overflow-hidden inline-block"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), " +
                "linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), " +
                "linear-gradient(45deg, transparent 75%, #e5e5e5 75%), " +
                "linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          >
            <div
              ref={containerRef}
              className="relative select-none"
              style={{ width: "100%", maxWidth: "100%" }}
            >
              {/* SVG sets the size of this container */}
              {svgPreview ? (
                <div
                  className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgPreview }}
                />
              ) : (
                <div
                  className="flex items-center justify-center text-muted-foreground text-sm"
                  style={{ aspectRatio: `${widthPx} / ${heightPx}`, width: 500 }}
                >
                  Loading preview...
                </div>
              )}

              {/* Draggable strain image handle — shows live image so position updates are instant */}
              {variant.strain_image_url && (
                <div
                  className="absolute group"
                  style={{
                    left: imgX * scale + (dragging ? dragOffset.dx : 0),
                    top: imgY * scale + (dragging ? dragOffset.dy : 0),
                    width: imgW * scale,
                    height: imgH * scale,
                    cursor: dragging ? "grabbing" : "grab",
                    zIndex: 30,
                    touchAction: "none",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  <div
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    style={{
                      border: "1.5px dashed #ec4899",
                      backgroundColor: "#ec489910",
                    }}
                  />
                  <span
                    className="absolute -top-5 left-0 text-[10px] font-semibold px-1 rounded-sm text-white whitespace-nowrap pointer-events-none"
                    style={{ backgroundColor: "#ec4899" }}
                  >
                    Strain Image
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls sidebar */}
        <div className="space-y-5">
          {/* Strain image preview */}
          {variant.strain_image_url && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h4 className="text-sm font-medium">Strain Image</h4>
              <img
                src={variant.strain_image_url}
                alt={variant.strain_name || "Strain"}
                className="w-full max-h-32 rounded border object-contain bg-white"
              />
            </div>
          )}

          {/* Cannabinoid info from strain */}
          {strain && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h4 className="text-sm font-medium">
                Cannabinoid Info{" "}
                <span className="text-muted-foreground font-normal">
                  (from {strain.name})
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {strain.category && (
                  <>
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{strain.category}</span>
                  </>
                )}
                {strain.total_thc && (
                  <>
                    <span className="text-muted-foreground">THC</span>
                    <span className="font-medium">{strain.total_thc}%</span>
                  </>
                )}
                {strain.cbd && (
                  <>
                    <span className="text-muted-foreground">CBD</span>
                    <span className="font-medium">{strain.cbd}%</span>
                  </>
                )}
                {strain.cbg && (
                  <>
                    <span className="text-muted-foreground">CBG</span>
                    <span className="font-medium">{strain.cbg}%</span>
                  </>
                )}
                {strain.total_cannabinoids && (
                  <>
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">
                      {strain.total_cannabinoids}%
                    </span>
                  </>
                )}
                {strain.total_terpenes && (
                  <>
                    <span className="text-muted-foreground">Terpenes</span>
                    <span className="font-medium">
                      {strain.total_terpenes}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Position controls */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="text-sm font-medium">Image Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel>X</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  value={imageX}
                  onChange={(e) => setImageX(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Y</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  value={imageY}
                  onChange={(e) => setImageY(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex items-end gap-2">
              <Field className="flex-1">
                <FieldLabel>Width</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  value={imageW}
                  onChange={(e) => handleWidthChange(e.target.value)}
                />
              </Field>
              <Button
                variant="ghost"
                size="icon-sm"
                className="mb-1"
                onClick={() => setAspectLocked(!aspectLocked)}
                title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
              >
                {aspectLocked ? (
                  <LockIcon className="size-3.5" />
                ) : (
                  <UnlockIcon className="size-3.5" />
                )}
              </Button>
              <Field className="flex-1">
                <FieldLabel>Height</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  value={imageH}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Text overrides */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Text Overrides</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setTextOverrides((prev) => ({ ...prev, "": "" }))
                }
              >
                <PlusIcon className="mr-1 size-3" />
                Add
              </Button>
            </div>

            {/* Quick-add buttons */}
            <div className="flex flex-wrap gap-1">
              {TEXT_OVERRIDE_KEYS.filter(
                (t) => !(t.key in textOverrides)
              ).map((t) => (
                <button
                  key={t.key}
                  className="text-[10px] px-1.5 py-0.5 rounded border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  onClick={() =>
                    setTextOverrides((prev) => ({ ...prev, [t.key]: "" }))
                  }
                >
                  + {t.label}
                </button>
              ))}
            </div>

            {Object.entries(textOverrides).map(([key, value], idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex gap-2 items-end">
                  <Field className="flex-1">
                    <FieldLabel>Key</FieldLabel>
                    <Input
                      value={key}
                      placeholder="e.g. product_info.left_text"
                      onChange={(e) => renameTextOverride(key, e.target.value)}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeTextOverride(key)}
                  >
                    <Trash2Icon className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <Input
                  value={value}
                  placeholder="Override value..."
                  onChange={(e) => updateTextOverride(key, e.target.value)}
                />
              </div>
            ))}

            {Object.keys(textOverrides).length === 0 && (
              <p className="text-xs text-muted-foreground">
                No text overrides. Use the buttons above to add common fields.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
