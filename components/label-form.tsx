"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Label,
  type LabelPreset,
  type Strain,
  type Product,
  type CannabinoidField,
  type CannabinoidColumn,
  CANNABINOID_FIELD_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AVAILABLE_FONTS = [
  { label: "Circular Std", value: "Circular Std, sans-serif" },
  { label: "Sardin", value: "Sardin, sans-serif" },
];

interface LabelFormProps {
  label?: Label;
  mode?: "create" | "edit";
  onSaved?: (updatedLabel: Label) => void;
}

export function LabelForm({ label, mode = "create", onSaved }: LabelFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [strains, setStrains] = useState<Strain[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [copyTargets, setCopyTargets] = useState<Set<number>>(new Set());
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyResult, setCopyResult] = useState("");

  // Basic info
  const [form, setForm] = useState({
    name: label?.name ?? "",
    strain_id: label?.strain_id?.toString() ?? "",
    product_id: label?.product_id?.toString() ?? "",
    width_cm: label?.width_cm ?? "7.6",
    height_cm: label?.height_cm ?? "5.0",
    corner_radius_mm: label?.corner_radius_mm ?? "3.0",
  });

  // Design
  const [design, setDesign] = useState({
    background_color: label?.design?.background_color ?? "#f5f5f5",
    font_primary: label?.design?.font_primary ?? "Circular Std, sans-serif",
  });

  // QR Code
  const [qr, setQr] = useState({
    enabled: label?.design?.qr?.enabled ?? false,
    data_source: (label?.design?.qr?.data_source ?? "product_url") as
      | "product_url"
      | "custom",
    custom_url: label?.design?.qr?.custom_url ?? "",
    x: label?.design?.qr?.x?.toString() ?? "160",
    y: label?.design?.qr?.y?.toString() ?? "12",
    size: label?.design?.qr?.size?.toString() ?? "50",
    fg_color: label?.design?.qr?.fg_color ?? "#000000",
    bg_color: label?.design?.qr?.bg_color ?? "#ffffff",
  });

  // Logo
  const [logo, setLogo] = useState({
    visible: label?.design?.logo?.visible ?? false,
    x: label?.design?.logo?.x?.toString() ?? "8",
    y: label?.design?.logo?.y?.toString() ?? "8",
    width: label?.design?.logo?.width?.toString() ?? "36",
    height: label?.design?.logo?.height?.toString() ?? "36",
  });

  // Cannabinoid Info
  const defaultColumns: CannabinoidColumn[] = label?.design?.cannabinoid_info?.columns ?? [
    { field: "category", label: "" },
    { field: "total_thc", label: "THC" },
    { field: "cbg", label: "CBG" },
  ];
  const [cannabinoidInfo, setCannabinoidInfo] = useState({
    enabled: label?.design?.cannabinoid_info?.enabled ?? false,
    x: label?.design?.cannabinoid_info?.x?.toString() ?? "0",
    y: label?.design?.cannabinoid_info?.y?.toString() ?? "140",
    width: label?.design?.cannabinoid_info?.width?.toString() ?? "160",
    height: label?.design?.cannabinoid_info?.height?.toString() ?? "40",
    font_size: label?.design?.cannabinoid_info?.font_size?.toString() ?? "",
    text_color: label?.design?.cannabinoid_info?.text_color ?? "#1a1a1a",
    label_color: label?.design?.cannabinoid_info?.label_color ?? "#1a1a1a",
    label_font_weight: label?.design?.cannabinoid_info?.label_font_weight ?? "500",
    value_font_weight: label?.design?.cannabinoid_info?.value_font_weight ?? "700",
    columns: defaultColumns,
  });

  function updateColumn(index: number, updates: Partial<CannabinoidColumn>) {
    setCannabinoidInfo((prev) => {
      const cols = [...prev.columns];
      cols[index] = { ...cols[index], ...updates };
      return { ...prev, columns: cols };
    });
  }

  function addColumn() {
    setCannabinoidInfo((prev) => ({
      ...prev,
      columns: [...prev.columns, { field: "cbd" as CannabinoidField, label: "CBD" }],
    }));
  }

  function removeColumn(index: number) {
    setCannabinoidInfo((prev) => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index),
    }));
  }

  // Product Info
  const [productInfo, setProductInfo] = useState({
    enabled: label?.design?.product_info?.enabled ?? false,
    x: label?.design?.product_info?.x?.toString() ?? "0",
    y: label?.design?.product_info?.y?.toString() ?? "160",
    width: label?.design?.product_info?.width?.toString() ?? "200",
    height: label?.design?.product_info?.height?.toString() ?? "30",
    font_size: label?.design?.product_info?.font_size?.toString() ?? "",
    text_color: label?.design?.product_info?.text_color ?? "#1a1a1a",
    left_text: label?.design?.product_info?.left_text ?? "indoor, live-soil flower",
    font_weight: label?.design?.product_info?.font_weight ?? "600",
  });

  // Weight Info
  const [weightInfo, setWeightInfo] = useState({
    enabled: label?.design?.weight_info?.enabled ?? false,
    x: label?.design?.weight_info?.x?.toString() ?? "0",
    y: label?.design?.weight_info?.y?.toString() ?? "160",
    width: label?.design?.weight_info?.width?.toString() ?? "100",
    height: label?.design?.weight_info?.height?.toString() ?? "30",
    font_size: label?.design?.weight_info?.font_size?.toString() ?? "",
    text_color: label?.design?.weight_info?.text_color ?? "#1a1a1a",
    text: label?.design?.weight_info?.text ?? "",
    font_weight: label?.design?.weight_info?.font_weight ?? "700",
    text_anchor: label?.design?.weight_info?.text_anchor ?? "end",
  });

  // Expiration Date
  const [expirationDate, setExpirationDate] = useState({
    enabled: label?.design?.expiration_date?.enabled ?? false,
    x: label?.design?.expiration_date?.x?.toString() ?? "0",
    y: label?.design?.expiration_date?.y?.toString() ?? "170",
    width: label?.design?.expiration_date?.width?.toString() ?? "100",
    height: label?.design?.expiration_date?.height?.toString() ?? "20",
    font_size: label?.design?.expiration_date?.font_size?.toString() ?? "",
    text_color: label?.design?.expiration_date?.text_color ?? "#1a1a1a",
    text: label?.design?.expiration_date?.text ?? "",
    font_weight: label?.design?.expiration_date?.font_weight ?? "400",
    text_anchor: label?.design?.expiration_date?.text_anchor ?? "start",
  });

  // Batch ID
  const [batchId, setBatchId] = useState({
    enabled: label?.design?.batch_id?.enabled ?? false,
    x: label?.design?.batch_id?.x?.toString() ?? "0",
    y: label?.design?.batch_id?.y?.toString() ?? "0",
    width: label?.design?.batch_id?.width?.toString() ?? "100",
    height: label?.design?.batch_id?.height?.toString() ?? "20",
    font_size: label?.design?.batch_id?.font_size?.toString() ?? "",
    text_color: label?.design?.batch_id?.text_color ?? "#1a1a1a",
    text: label?.design?.batch_id?.text ?? "",
    font_weight: label?.design?.batch_id?.font_weight ?? "400",
    text_anchor: label?.design?.batch_id?.text_anchor ?? "start",
  });

  // Product ID Text
  const [productIdText, setProductIdText] = useState({
    enabled: label?.design?.product_id_text?.enabled ?? false,
    x: label?.design?.product_id_text?.x?.toString() ?? "0",
    y: label?.design?.product_id_text?.y?.toString() ?? "0",
    width: label?.design?.product_id_text?.width?.toString() ?? "100",
    height: label?.design?.product_id_text?.height?.toString() ?? "20",
    font_size: label?.design?.product_id_text?.font_size?.toString() ?? "",
    text_color: label?.design?.product_id_text?.text_color ?? "#1a1a1a",
    text: label?.design?.product_id_text?.text ?? "",
    font_weight: label?.design?.product_id_text?.font_weight ?? "400",
    text_anchor: label?.design?.product_id_text?.text_anchor ?? "start",
  });

  // Lot Number
  const [lotNumber, setLotNumber] = useState({
    enabled: label?.design?.lot_number?.enabled ?? false,
    x: label?.design?.lot_number?.x?.toString() ?? "0",
    y: label?.design?.lot_number?.y?.toString() ?? "0",
    width: label?.design?.lot_number?.width?.toString() ?? "100",
    height: label?.design?.lot_number?.height?.toString() ?? "20",
    font_size: label?.design?.lot_number?.font_size?.toString() ?? "",
    text_color: label?.design?.lot_number?.text_color ?? "#1a1a1a",
    text: label?.design?.lot_number?.text ?? "",
    font_weight: label?.design?.lot_number?.font_weight ?? "400",
    text_anchor: label?.design?.lot_number?.text_anchor ?? "start",
  });

  // Harvest Date
  const [harvestDate, setHarvestDate] = useState({
    enabled: label?.design?.harvest_date?.enabled ?? false,
    x: label?.design?.harvest_date?.x?.toString() ?? "0",
    y: label?.design?.harvest_date?.y?.toString() ?? "0",
    width: label?.design?.harvest_date?.width?.toString() ?? "100",
    height: label?.design?.harvest_date?.height?.toString() ?? "20",
    font_size: label?.design?.harvest_date?.font_size?.toString() ?? "",
    text_color: label?.design?.harvest_date?.text_color ?? "#1a1a1a",
    text: label?.design?.harvest_date?.text ?? "",
    font_weight: label?.design?.harvest_date?.font_weight ?? "400",
    text_anchor: label?.design?.harvest_date?.text_anchor ?? "start",
  });

  // METRC Zone
  const [metrcZone, setMetrcZone] = useState({
    enabled: label?.design?.metrc_zone?.enabled ?? false,
    render_as: (label?.design?.metrc_zone?.render_as ?? "original_image") as
      | "original_image"
      | "qr_code"
      | "barcode"
      | "text",
    x: label?.design?.metrc_zone?.x?.toString() ?? "10",
    y: label?.design?.metrc_zone?.y?.toString() ?? "150",
    width: label?.design?.metrc_zone?.width?.toString() ?? "80",
    height: label?.design?.metrc_zone?.height?.toString() ?? "30",
  });

  useEffect(() => {
    apiClient.getStrains().then(setStrains).catch(() => {});
    apiClient.getProducts().then(setProducts).catch(() => {});
    apiClient.getLabelPresets().then(setPresets).catch(() => {});
    apiClient.getLabels().then(setAllLabels).catch(() => {});
  }, []);

  // Presets
  const [presets, setPresets] = useState<LabelPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  async function saveAsPreset() {
    if (!label || !presetName.trim()) return;
    setSavingPreset(true);
    try {
      const created = await apiClient.createLabelPreset(label.slug, presetName.trim());
      setPresets((prev) => [created, ...prev]);
      setPresetName("");
    } catch {
      // silently fail
    } finally {
      setSavingPreset(false);
    }
  }

  async function loadPreset(preset: LabelPreset) {
    if (!label) return;
    try {
      const updated = await apiClient.applyLabelPreset(label.slug, preset.id);
      if (onSaved) onSaved(updated);
    } catch {
      setError("Failed to apply preset");
    }
  }

  async function deletePreset(id: number) {
    try {
      await apiClient.deleteLabelPreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  }

  function updateFormField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateQr(field: string, value: string | boolean) {
    setQr((prev) => ({ ...prev, [field]: value }));
  }

  function updateLogo(field: string, value: string | boolean) {
    setLogo((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const designPayload: Record<string, unknown> = {
        background_color: design.background_color || undefined,
        font_primary: design.font_primary || undefined,
      };

      if (qr.enabled) {
        designPayload.qr = {
          enabled: true,
          data_source: qr.data_source,
          custom_url: qr.data_source === "custom" ? qr.custom_url : null,
          x: parseFloat(qr.x) || 0,
          y: parseFloat(qr.y) || 0,
          size: parseFloat(qr.size) || 50,
          fg_color: qr.fg_color,
          bg_color: qr.bg_color,
        };
      } else {
        designPayload.qr = { enabled: false };
      }

      if (logo.visible) {
        designPayload.logo = {
          visible: true,
          x: parseFloat(logo.x) || 0,
          y: parseFloat(logo.y) || 0,
          width: parseFloat(logo.width) || 40,
          height: parseFloat(logo.height) || 40,
        };
      } else {
        designPayload.logo = { visible: false };
      }

      if (cannabinoidInfo.enabled) {
        designPayload.cannabinoid_info = {
          enabled: true,
          x: parseFloat(cannabinoidInfo.x) || 0,
          y: parseFloat(cannabinoidInfo.y) || 0,
          width: parseFloat(cannabinoidInfo.width) || 160,
          height: parseFloat(cannabinoidInfo.height) || 40,
          font_size: parseFloat(cannabinoidInfo.font_size) || undefined,
          text_color: cannabinoidInfo.text_color,
          label_color: cannabinoidInfo.label_color,
          label_font_weight: cannabinoidInfo.label_font_weight,
          value_font_weight: cannabinoidInfo.value_font_weight,
          columns: cannabinoidInfo.columns,
        };
      } else {
        designPayload.cannabinoid_info = { enabled: false };
      }

      if (productInfo.enabled) {
        designPayload.product_info = {
          enabled: true,
          x: parseFloat(productInfo.x) || 0,
          y: parseFloat(productInfo.y) || 0,
          width: parseFloat(productInfo.width) || 200,
          height: parseFloat(productInfo.height) || 30,
          font_size: parseFloat(productInfo.font_size) || undefined,
          text_color: productInfo.text_color,
          left_text: productInfo.left_text,
          font_weight: productInfo.font_weight,
        };
      } else {
        designPayload.product_info = { enabled: false };
      }

      if (weightInfo.enabled) {
        designPayload.weight_info = {
          enabled: true,
          x: parseFloat(weightInfo.x) || 0,
          y: parseFloat(weightInfo.y) || 0,
          width: parseFloat(weightInfo.width) || 100,
          height: parseFloat(weightInfo.height) || 30,
          font_size: parseFloat(weightInfo.font_size) || undefined,
          text_color: weightInfo.text_color,
          text: weightInfo.text,
          font_weight: weightInfo.font_weight,
          text_anchor: weightInfo.text_anchor,
        };
      } else {
        designPayload.weight_info = { enabled: false };
      }

      if (expirationDate.enabled) {
        designPayload.expiration_date = {
          enabled: true,
          x: parseFloat(expirationDate.x) || 0,
          y: parseFloat(expirationDate.y) || 0,
          width: parseFloat(expirationDate.width) || 100,
          height: parseFloat(expirationDate.height) || 20,
          font_size: parseFloat(expirationDate.font_size) || undefined,
          text_color: expirationDate.text_color,
          text: expirationDate.text,
          font_weight: expirationDate.font_weight,
          text_anchor: expirationDate.text_anchor,
        };
      } else {
        designPayload.expiration_date = { enabled: false };
      }

      for (const [key, state] of [
        ["batch_id", batchId],
        ["product_id_text", productIdText],
        ["lot_number", lotNumber],
        ["harvest_date", harvestDate],
      ] as const) {
        if (state.enabled) {
          designPayload[key] = {
            enabled: true,
            x: parseFloat(state.x) || 0,
            y: parseFloat(state.y) || 0,
            width: parseFloat(state.width) || 100,
            height: parseFloat(state.height) || 20,
            font_size: parseFloat(state.font_size) || undefined,
            text_color: state.text_color,
            text: state.text,
            font_weight: state.font_weight,
            text_anchor: state.text_anchor,
          };
        } else {
          designPayload[key] = { enabled: false };
        }
      }

      if (metrcZone.enabled) {
        designPayload.metrc_zone = {
          enabled: true,
          render_as: metrcZone.render_as,
          x: parseFloat(metrcZone.x) || 0,
          y: parseFloat(metrcZone.y) || 0,
          width: parseFloat(metrcZone.width) || 80,
          height: parseFloat(metrcZone.height) || 30,
        };
      } else {
        designPayload.metrc_zone = { enabled: false };
      }

      const data: Record<string, unknown> = {
        name: form.name,
        width_cm: form.width_cm,
        height_cm: form.height_cm,
        corner_radius_mm: form.corner_radius_mm,
        design: designPayload,
      };

      if (form.strain_id) {
        data.strain_id = form.strain_id;
      } else {
        data.strain_id = null;
      }

      if (form.product_id) {
        data.product_id = form.product_id;
      } else {
        data.product_id = null;
      }

      if (isEdit && label) {
        const updated = await apiClient.updateLabel(label.slug, data);
        if (onSaved) {
          onSaved(updated);
        } else {
          router.push(`/admin/projects/labels/${updated.slug}`);
        }
      } else {
        const created = await apiClient.createLabel(data);
        router.push(`/admin/projects/labels/${created.slug}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `We couldn't ${isEdit ? "update" : "create"} the label`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyTextLayers() {
    if (!label || copyTargets.size === 0) return;
    setIsCopying(true);
    setCopyResult("");
    try {
      const res = await apiClient.copyTextLayers(label.slug, Array.from(copyTargets));
      setCopyResult(`Copied to ${res.count} label${res.count !== 1 ? "s" : ""}`);
      setCopyTargets(new Set());
      setTimeout(() => {
        setCopyDialogOpen(false);
        setCopyResult("");
      }, 1500);
    } catch (err) {
      setCopyResult(err instanceof Error ? err.message : "Failed to copy");
    } finally {
      setIsCopying(false);
    }
  }

  function renderTextLayerSection(
    title: string,
    prefix: string,
    state: typeof batchId,
    setState: React.Dispatch<React.SetStateAction<typeof batchId>>,
    placeholder: string,
  ) {
    return (
      <section className="space-y-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${prefix}_enabled`}
              checked={state.enabled}
              onCheckedChange={(checked) =>
                setState((p) => ({ ...p, enabled: checked === true }))
              }
              disabled={isSubmitting}
            />
            <label htmlFor={`${prefix}_enabled`} className="text-sm font-medium">
              Show {title}
            </label>
          </div>

          {state.enabled && (
            <>
              <Field>
                <FieldLabel htmlFor={`${prefix}_text`}>Text</FieldLabel>
                <Input
                  id={`${prefix}_text`}
                  value={state.text}
                  onChange={(e) =>
                    setState((p) => ({ ...p, text: e.target.value }))
                  }
                  placeholder={placeholder}
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${prefix}_x`}>Position X</FieldLabel>
                  <Input
                    id={`${prefix}_x`}
                    type="number"
                    value={state.x}
                    onChange={(e) =>
                      setState((p) => ({ ...p, x: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${prefix}_y`}>Position Y</FieldLabel>
                  <Input
                    id={`${prefix}_y`}
                    type="number"
                    value={state.y}
                    onChange={(e) =>
                      setState((p) => ({ ...p, y: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${prefix}_width`}>Width</FieldLabel>
                  <Input
                    id={`${prefix}_width`}
                    type="number"
                    min="1"
                    value={state.width}
                    onChange={(e) =>
                      setState((p) => ({ ...p, width: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${prefix}_height`}>Height</FieldLabel>
                  <Input
                    id={`${prefix}_height`}
                    type="number"
                    min="1"
                    value={state.height}
                    onChange={(e) =>
                      setState((p) => ({ ...p, height: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${prefix}_font_size`}>Font Size (auto if empty)</FieldLabel>
                  <Input
                    id={`${prefix}_font_size`}
                    type="number"
                    step="0.5"
                    min="1"
                    value={state.font_size}
                    onChange={(e) =>
                      setState((p) => ({ ...p, font_size: e.target.value }))
                    }
                    placeholder="Auto"
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${prefix}_text_anchor`}>Text Align</FieldLabel>
                  <Select
                    value={state.text_anchor}
                    onValueChange={(v) =>
                      setState((p) => ({ ...p, text_anchor: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={`${prefix}_text_anchor`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Left</SelectItem>
                      <SelectItem value="middle">Center</SelectItem>
                      <SelectItem value="end">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${prefix}_font_weight`}>Font Weight</FieldLabel>
                  <Select
                    value={state.font_weight}
                    onValueChange={(v) =>
                      setState((p) => ({ ...p, font_weight: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={`${prefix}_font_weight`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${prefix}_text_color`}>Text Color</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={state.text_color}
                      onChange={(e) =>
                        setState((p) => ({ ...p, text_color: e.target.value }))
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id={`${prefix}_text_color`}
                      value={state.text_color}
                      onChange={(e) =>
                        setState((p) => ({ ...p, text_color: e.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <ErrorAlert message={error} />}

      {/* Layout Presets */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Layout Presets</h3>
        <FieldGroup>
          {presets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Load a saved layout to apply positions, sizes, and design settings.
              </p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(p)}
                    >
                      {p.name}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deletePreset(p.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEdit && label && (
            <div className="flex gap-2 items-end">
              <Field className="flex-1">
                <FieldLabel htmlFor="preset_name">Save Current Layout as Preset</FieldLabel>
                <Input
                  id="preset_name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                  disabled={savingPreset}
                />
              </Field>
              <Button
                type="button"
                variant="secondary"
                onClick={saveAsPreset}
                disabled={savingPreset || !presetName.trim()}
              >
                {savingPreset ? "Saving..." : "Save Preset"}
              </Button>
            </div>
          )}

          {!isEdit && presets.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No presets saved yet. Edit a label and save its layout as a preset to reuse it here.
            </p>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name *</FieldLabel>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              placeholder="Label name"
              required
              disabled={isSubmitting}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="strain_id">Strain</FieldLabel>
              <Select
                value={form.strain_id}
                onValueChange={(v) => updateFormField("strain_id", v)}
              >
                <SelectTrigger id="strain_id" className="w-full">
                  <SelectValue placeholder="Select strain" />
                </SelectTrigger>
                <SelectContent>
                  {strains.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="product_id">Product</FieldLabel>
              <Select
                value={form.product_id}
                onValueChange={(v) => updateFormField("product_id", v)}
              >
                <SelectTrigger id="product_id" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

        </FieldGroup>
      </section>

      {/* Dimensions */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Dimensions</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="width_cm">Width (cm)</FieldLabel>
              <Input
                id="width_cm"
                type="number"
                step="0.1"
                min="0"
                value={form.width_cm}
                onChange={(e) => updateFormField("width_cm", e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="height_cm">Height (cm)</FieldLabel>
              <Input
                id="height_cm"
                type="number"
                step="0.1"
                min="0"
                value={form.height_cm}
                onChange={(e) => updateFormField("height_cm", e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="corner_radius_mm">
              Corner Radius (mm)
            </FieldLabel>
            <Input
              id="corner_radius_mm"
              type="number"
              step="0.1"
              min="0"
              value={form.corner_radius_mm}
              onChange={(e) =>
                updateFormField("corner_radius_mm", e.target.value)
              }
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* Design */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Design</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="background_color">
                Background Color
              </FieldLabel>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={design.background_color}
                  onChange={(e) =>
                    setDesign((p) => ({
                      ...p,
                      background_color: e.target.value,
                    }))
                  }
                  className="h-9 w-12 rounded border cursor-pointer"
                  disabled={isSubmitting}
                />
                <Input
                  id="background_color"
                  value={design.background_color}
                  onChange={(e) =>
                    setDesign((p) => ({
                      ...p,
                      background_color: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="font_primary">Font</FieldLabel>
              <Select
                value={design.font_primary}
                onValueChange={(v) =>
                  setDesign((p) => ({ ...p, font_primary: v }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="font_primary">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
      </section>

      <Separator />

      {/* QR Code */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">QR Code</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="qr_enabled"
              checked={qr.enabled}
              onCheckedChange={(checked) =>
                updateQr("enabled", checked === true)
              }
              disabled={isSubmitting}
            />
            <label htmlFor="qr_enabled" className="text-sm font-medium">
              Enable QR Code
            </label>
          </div>

          {qr.enabled && (
            <>
              <Field>
                <FieldLabel htmlFor="qr_data_source">Data Source</FieldLabel>
                <Select
                  value={qr.data_source}
                  onValueChange={(v) => updateQr("data_source", v)}
                >
                  <SelectTrigger id="qr_data_source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_url">Product URL</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {qr.data_source === "custom" && (
                <Field>
                  <FieldLabel htmlFor="qr_custom_url">Custom URL</FieldLabel>
                  <Input
                    id="qr_custom_url"
                    value={qr.custom_url}
                    onChange={(e) => updateQr("custom_url", e.target.value)}
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                </Field>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="qr_x">Position X</FieldLabel>
                  <Input
                    id="qr_x"
                    type="number"
                    value={qr.x}
                    onChange={(e) => updateQr("x", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="qr_y">Position Y</FieldLabel>
                  <Input
                    id="qr_y"
                    type="number"
                    value={qr.y}
                    onChange={(e) => updateQr("y", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="qr_size">Size</FieldLabel>
                <Input
                  id="qr_size"
                  type="number"
                  min="1"
                  value={qr.size}
                  onChange={(e) => updateQr("size", e.target.value)}
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="qr_fg_color">
                    Foreground Color
                  </FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={qr.fg_color}
                      onChange={(e) => updateQr("fg_color", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="qr_fg_color"
                      value={qr.fg_color}
                      onChange={(e) => updateQr("fg_color", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="qr_bg_color">
                    Background Color
                  </FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={qr.bg_color}
                      onChange={(e) => updateQr("bg_color", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="qr_bg_color"
                      value={qr.bg_color}
                      onChange={(e) => updateQr("bg_color", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Logo */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Logo</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="logo_visible"
              checked={logo.visible}
              onCheckedChange={(checked) =>
                updateLogo("visible", checked === true)
              }
              disabled={isSubmitting}
            />
            <label htmlFor="logo_visible" className="text-sm font-medium">
              Show Logo
            </label>
          </div>

          {logo.visible && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="logo_x">Position X</FieldLabel>
                  <Input
                    id="logo_x"
                    type="number"
                    value={logo.x}
                    onChange={(e) => updateLogo("x", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="logo_y">Position Y</FieldLabel>
                  <Input
                    id="logo_y"
                    type="number"
                    value={logo.y}
                    onChange={(e) => updateLogo("y", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="logo_width">Width</FieldLabel>
                  <Input
                    id="logo_width"
                    type="number"
                    min="1"
                    value={logo.width}
                    onChange={(e) => updateLogo("width", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="logo_height">Height</FieldLabel>
                  <Input
                    id="logo_height"
                    type="number"
                    min="1"
                    value={logo.height}
                    onChange={(e) => updateLogo("height", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Cannabinoid Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Cannabinoid Info</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cannabinoid_enabled"
              checked={cannabinoidInfo.enabled}
              onCheckedChange={(checked) =>
                setCannabinoidInfo((p) => ({ ...p, enabled: checked === true }))
              }
              disabled={isSubmitting}
            />
            <label htmlFor="cannabinoid_enabled" className="text-sm font-medium">
              Show Cannabinoid Info
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Displays strain cannabinoid values (THC, CBG, CBD, etc.) as text columns on the label.
          </p>

          {cannabinoidInfo.enabled && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Columns</span>
                  {cannabinoidInfo.columns.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColumn}
                      disabled={isSubmitting}
                    >
                      Add Column
                    </Button>
                  )}
                </div>
                {cannabinoidInfo.columns.map((col, i) => (
                  <div key={i} className="grid gap-2 grid-cols-[1fr_1fr_auto] items-end">
                    <Field>
                      <FieldLabel>Field</FieldLabel>
                      <Select
                        value={col.field}
                        onValueChange={(v) =>
                          updateColumn(i, {
                            field: v as CannabinoidField,
                            label: CANNABINOID_FIELD_LABELS[v as CannabinoidField],
                          })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CANNABINOID_FIELD_LABELS).map(
                            ([value, fieldLabel]) => (
                              <SelectItem key={value} value={value}>
                                {fieldLabel}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input
                        value={col.label ?? ""}
                        onChange={(e) =>
                          updateColumn(i, { label: e.target.value })
                        }
                        placeholder="Display label"
                        disabled={isSubmitting}
                      />
                    </Field>
                    {cannabinoidInfo.columns.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(i)}
                        disabled={isSubmitting}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="cann_x">Position X</FieldLabel>
                  <Input
                    id="cann_x"
                    type="number"
                    value={cannabinoidInfo.x}
                    onChange={(e) =>
                      setCannabinoidInfo((p) => ({ ...p, x: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cann_y">Position Y</FieldLabel>
                  <Input
                    id="cann_y"
                    type="number"
                    value={cannabinoidInfo.y}
                    onChange={(e) =>
                      setCannabinoidInfo((p) => ({ ...p, y: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="cann_width">Width</FieldLabel>
                  <Input
                    id="cann_width"
                    type="number"
                    min="1"
                    value={cannabinoidInfo.width}
                    onChange={(e) =>
                      setCannabinoidInfo((p) => ({ ...p, width: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cann_height">Height</FieldLabel>
                  <Input
                    id="cann_height"
                    type="number"
                    min="1"
                    value={cannabinoidInfo.height}
                    onChange={(e) =>
                      setCannabinoidInfo((p) => ({ ...p, height: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="cann_font_size">Font Size (auto if empty)</FieldLabel>
                <Input
                  id="cann_font_size"
                  type="number"
                  step="0.5"
                  min="1"
                  value={cannabinoidInfo.font_size}
                  onChange={(e) =>
                    setCannabinoidInfo((p) => ({ ...p, font_size: e.target.value }))
                  }
                  placeholder="Auto"
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="cann_text_color">Value Color</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={cannabinoidInfo.text_color}
                      onChange={(e) =>
                        setCannabinoidInfo((p) => ({
                          ...p,
                          text_color: e.target.value,
                        }))
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="cann_text_color"
                      value={cannabinoidInfo.text_color}
                      onChange={(e) =>
                        setCannabinoidInfo((p) => ({
                          ...p,
                          text_color: e.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cann_label_color">Label Color</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={cannabinoidInfo.label_color}
                      onChange={(e) =>
                        setCannabinoidInfo((p) => ({
                          ...p,
                          label_color: e.target.value,
                        }))
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="cann_label_color"
                      value={cannabinoidInfo.label_color}
                      onChange={(e) =>
                        setCannabinoidInfo((p) => ({
                          ...p,
                          label_color: e.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="cann_label_font_weight">Label Font Weight</FieldLabel>
                  <Select
                    value={cannabinoidInfo.label_font_weight}
                    onValueChange={(v) =>
                      setCannabinoidInfo((p) => ({ ...p, label_font_weight: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="cann_label_font_weight">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cann_value_font_weight">Value Font Weight</FieldLabel>
                  <Select
                    value={cannabinoidInfo.value_font_weight}
                    onValueChange={(v) =>
                      setCannabinoidInfo((p) => ({ ...p, value_font_weight: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="cann_value_font_weight">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Product Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Product Info Bar</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="product_info_enabled"
              checked={productInfo.enabled}
              onCheckedChange={(checked) =>
                setProductInfo((p) => ({ ...p, enabled: checked === true }))
              }
              disabled={isSubmitting}
            />
            <label htmlFor="product_info_enabled" className="text-sm font-medium">
              Show Product Info Bar
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            A text bar for product description (e.g. &quot;indoor, live-soil flower&quot;).
          </p>

          {productInfo.enabled && (
            <>
              <Field>
                <FieldLabel htmlFor="pi_left_text">Text</FieldLabel>
                <Input
                  id="pi_left_text"
                  value={productInfo.left_text}
                  onChange={(e) =>
                    setProductInfo((p) => ({ ...p, left_text: e.target.value }))
                  }
                  placeholder="indoor, live-soil flower"
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="pi_x">Position X</FieldLabel>
                  <Input
                    id="pi_x"
                    type="number"
                    value={productInfo.x}
                    onChange={(e) =>
                      setProductInfo((p) => ({ ...p, x: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pi_y">Position Y</FieldLabel>
                  <Input
                    id="pi_y"
                    type="number"
                    value={productInfo.y}
                    onChange={(e) =>
                      setProductInfo((p) => ({ ...p, y: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="pi_width">Width</FieldLabel>
                  <Input
                    id="pi_width"
                    type="number"
                    min="1"
                    value={productInfo.width}
                    onChange={(e) =>
                      setProductInfo((p) => ({ ...p, width: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pi_height">Height</FieldLabel>
                  <Input
                    id="pi_height"
                    type="number"
                    min="1"
                    value={productInfo.height}
                    onChange={(e) =>
                      setProductInfo((p) => ({ ...p, height: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="pi_font_size">Font Size (auto if empty)</FieldLabel>
                <Input
                  id="pi_font_size"
                  type="number"
                  step="0.5"
                  min="1"
                  value={productInfo.font_size}
                  onChange={(e) =>
                    setProductInfo((p) => ({ ...p, font_size: e.target.value }))
                  }
                  placeholder="Auto"
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="pi_font_weight">Font Weight</FieldLabel>
                <Select
                  value={productInfo.font_weight}
                  onValueChange={(v) =>
                    setProductInfo((p) => ({ ...p, font_weight: v }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="pi_font_weight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi-Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="pi_text_color">Text Color</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={productInfo.text_color}
                      onChange={(e) =>
                        setProductInfo((p) => ({ ...p, text_color: e.target.value }))
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="pi_text_color"
                      value={productInfo.text_color}
                      onChange={(e) =>
                        setProductInfo((p) => ({ ...p, text_color: e.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Weight Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Weight / Details Text</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="weight_info_enabled"
              checked={weightInfo.enabled}
              onCheckedChange={(checked) =>
                setWeightInfo((p) => ({ ...p, enabled: checked === true }))
              }
              disabled={isSubmitting}
            />
            <label htmlFor="weight_info_enabled" className="text-sm font-medium">
              Show Weight / Details
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            A standalone text element for weight or other details (e.g. &quot;3.5 grams&quot;).
          </p>

          {weightInfo.enabled && (
            <>
              <Field>
                <FieldLabel htmlFor="wi_text">Text</FieldLabel>
                <Input
                  id="wi_text"
                  value={weightInfo.text}
                  onChange={(e) =>
                    setWeightInfo((p) => ({ ...p, text: e.target.value }))
                  }
                  placeholder="3.5 grams"
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="wi_x">Position X</FieldLabel>
                  <Input
                    id="wi_x"
                    type="number"
                    value={weightInfo.x}
                    onChange={(e) =>
                      setWeightInfo((p) => ({ ...p, x: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="wi_y">Position Y</FieldLabel>
                  <Input
                    id="wi_y"
                    type="number"
                    value={weightInfo.y}
                    onChange={(e) =>
                      setWeightInfo((p) => ({ ...p, y: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="wi_width">Width</FieldLabel>
                  <Input
                    id="wi_width"
                    type="number"
                    min="1"
                    value={weightInfo.width}
                    onChange={(e) =>
                      setWeightInfo((p) => ({ ...p, width: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="wi_height">Height</FieldLabel>
                  <Input
                    id="wi_height"
                    type="number"
                    min="1"
                    value={weightInfo.height}
                    onChange={(e) =>
                      setWeightInfo((p) => ({ ...p, height: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="wi_font_size">Font Size (auto if empty)</FieldLabel>
                  <Input
                    id="wi_font_size"
                    type="number"
                    step="0.5"
                    min="1"
                    value={weightInfo.font_size}
                    onChange={(e) =>
                      setWeightInfo((p) => ({ ...p, font_size: e.target.value }))
                    }
                    placeholder="Auto"
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="wi_text_anchor">Text Align</FieldLabel>
                  <Select
                    value={weightInfo.text_anchor}
                    onValueChange={(v) =>
                      setWeightInfo((p) => ({ ...p, text_anchor: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="wi_text_anchor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Left</SelectItem>
                      <SelectItem value="middle">Center</SelectItem>
                      <SelectItem value="end">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="wi_font_weight">Font Weight</FieldLabel>
                  <Select
                    value={weightInfo.font_weight}
                    onValueChange={(v) =>
                      setWeightInfo((p) => ({ ...p, font_weight: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="wi_font_weight">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="wi_text_color">Text Color</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={weightInfo.text_color}
                      onChange={(e) =>
                        setWeightInfo((p) => ({ ...p, text_color: e.target.value }))
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="wi_text_color"
                      value={weightInfo.text_color}
                      onChange={(e) =>
                        setWeightInfo((p) => ({ ...p, text_color: e.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Expiration Date */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Expiration Date</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="expiration_date_enabled"
              checked={expirationDate.enabled}
              onCheckedChange={(checked) =>
                setExpirationDate((p) => ({ ...p, enabled: checked === true }))
              }
              disabled={isSubmitting}
            />
            <label htmlFor="expiration_date_enabled" className="text-sm font-medium">
              Show Expiration Date
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            A text element for expiration or best-by date.
          </p>

          {expirationDate.enabled && (
            <>
              <Field>
                <FieldLabel htmlFor="exp_text">Text</FieldLabel>
                <Input
                  id="exp_text"
                  value={expirationDate.text}
                  onChange={(e) =>
                    setExpirationDate((p) => ({ ...p, text: e.target.value }))
                  }
                  placeholder="EXP: 03/07/2027"
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="exp_x">Position X</FieldLabel>
                  <Input
                    id="exp_x"
                    type="number"
                    value={expirationDate.x}
                    onChange={(e) =>
                      setExpirationDate((p) => ({ ...p, x: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="exp_y">Position Y</FieldLabel>
                  <Input
                    id="exp_y"
                    type="number"
                    value={expirationDate.y}
                    onChange={(e) =>
                      setExpirationDate((p) => ({ ...p, y: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="exp_width">Width</FieldLabel>
                  <Input
                    id="exp_width"
                    type="number"
                    min="1"
                    value={expirationDate.width}
                    onChange={(e) =>
                      setExpirationDate((p) => ({ ...p, width: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="exp_height">Height</FieldLabel>
                  <Input
                    id="exp_height"
                    type="number"
                    min="1"
                    value={expirationDate.height}
                    onChange={(e) =>
                      setExpirationDate((p) => ({ ...p, height: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="exp_font_size">Font Size (auto if empty)</FieldLabel>
                  <Input
                    id="exp_font_size"
                    type="number"
                    step="0.5"
                    min="1"
                    value={expirationDate.font_size}
                    onChange={(e) =>
                      setExpirationDate((p) => ({ ...p, font_size: e.target.value }))
                    }
                    placeholder="Auto"
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="exp_text_anchor">Text Align</FieldLabel>
                  <Select
                    value={expirationDate.text_anchor}
                    onValueChange={(v) =>
                      setExpirationDate((p) => ({ ...p, text_anchor: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="exp_text_anchor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Left</SelectItem>
                      <SelectItem value="middle">Center</SelectItem>
                      <SelectItem value="end">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="exp_font_weight">Font Weight</FieldLabel>
                  <Select
                    value={expirationDate.font_weight}
                    onValueChange={(v) =>
                      setExpirationDate((p) => ({ ...p, font_weight: v }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="exp_font_weight">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="exp_text_color">Text Color</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={expirationDate.text_color}
                      onChange={(e) =>
                        setExpirationDate((p) => ({ ...p, text_color: e.target.value }))
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="exp_text_color"
                      value={expirationDate.text_color}
                      onChange={(e) =>
                        setExpirationDate((p) => ({ ...p, text_color: e.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Batch ID */}
      {renderTextLayerSection("Batch ID", "batch_id", batchId, setBatchId, "B-20260312-001")}

      <Separator />

      {/* Product ID */}
      {renderTextLayerSection("Product ID", "product_id_text", productIdText, setProductIdText, "PRD-00142")}

      <Separator />

      {/* Lot Number */}
      {renderTextLayerSection("Lot #", "lot_number", lotNumber, setLotNumber, "LOT-2026-0045")}

      <Separator />

      {/* Harvest Date */}
      {renderTextLayerSection("Harvest Date", "harvest_date", harvestDate, setHarvestDate, "Harvested: 02/28/2026")}

      {/* Copy text layers to other labels */}
      {isEdit && label && (
        <>
          <Separator />
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Copy Text Layers</h3>
            <p className="text-sm text-muted-foreground">
              Copy Batch ID, Product ID, Lot #, and Harvest Date (values + positioning) to other labels.
            </p>
            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  Copy to other labels...
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copy text layers to other labels</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-3">
                  This will copy Batch ID, Product ID, Lot #, and Harvest Date
                  (including position, size, font, and text values) from <strong>{label.name}</strong> to the selected labels.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allLabels
                    .filter((l) => l.id !== label.id)
                    .map((l) => (
                      <label
                        key={l.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={copyTargets.has(l.id)}
                          onCheckedChange={(checked) => {
                            setCopyTargets((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(l.id);
                              else next.delete(l.id);
                              return next;
                            });
                          }}
                        />
                        <span className="text-sm">{l.name}</span>
                        {l.strain_name && (
                          <span className="text-xs text-muted-foreground">({l.strain_name})</span>
                        )}
                      </label>
                    ))}
                  {allLabels.filter((l) => l.id !== label.id).length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No other labels found</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const otherIds = allLabels.filter((l) => l.id !== label.id).map((l) => l.id);
                      setCopyTargets((prev) =>
                        prev.size === otherIds.length ? new Set() : new Set(otherIds)
                      );
                    }}
                  >
                    {copyTargets.size === allLabels.filter((l) => l.id !== label.id).length
                      ? "Deselect all"
                      : "Select all"}
                  </Button>
                  <div className="flex items-center gap-2">
                    {copyResult && (
                      <span className="text-sm text-muted-foreground">{copyResult}</span>
                    )}
                    <Button
                      type="button"
                      disabled={copyTargets.size === 0 || isCopying}
                      onClick={handleCopyTextLayers}
                    >
                      {isCopying ? "Copying..." : `Copy to ${copyTargets.size} label${copyTargets.size !== 1 ? "s" : ""}`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        </>
      )}

      <Separator />

      {/* METRC Zone */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">METRC Zone</h3>
        <FieldGroup>
          <div className="flex items-center gap-2">
            <Checkbox
              id="metrc_zone_enabled"
              checked={metrcZone.enabled}
              onCheckedChange={(checked) =>
                setMetrcZone((p) => ({ ...p, enabled: checked === true }))
              }
              disabled={isSubmitting}
            />
            <label htmlFor="metrc_zone_enabled" className="text-sm font-medium">
              Enable METRC Zone
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Designates where METRC tag identifiers (QR codes, barcodes, or text)
            will be rendered on each label. Upload METRC data from the label
            detail page.
          </p>

          {metrcZone.enabled && (
            <>
              <Field>
                <FieldLabel htmlFor="metrc_render_as">Render As</FieldLabel>
                <Select
                  value={metrcZone.render_as}
                  onValueChange={(v) =>
                    setMetrcZone((p) => ({
                      ...p,
                      render_as: v as typeof metrcZone.render_as,
                    }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="metrc_render_as" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original_image">
                      Original Image (from PDF)
                    </SelectItem>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                    <SelectItem value="barcode">Barcode (Code 128)</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="metrc_x">Position X</FieldLabel>
                  <Input
                    id="metrc_x"
                    type="number"
                    value={metrcZone.x}
                    onChange={(e) =>
                      setMetrcZone((p) => ({ ...p, x: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="metrc_y">Position Y</FieldLabel>
                  <Input
                    id="metrc_y"
                    type="number"
                    value={metrcZone.y}
                    onChange={(e) =>
                      setMetrcZone((p) => ({ ...p, y: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="metrc_width">Width</FieldLabel>
                  <Input
                    id="metrc_width"
                    type="number"
                    min="1"
                    value={metrcZone.width}
                    onChange={(e) =>
                      setMetrcZone((p) => ({ ...p, width: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="metrc_height">Height</FieldLabel>
                  <Input
                    id="metrc_height"
                    type="number"
                    min="1"
                    value={metrcZone.height}
                    onChange={(e) =>
                      setMetrcZone((p) => ({ ...p, height: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </section>

      {/* Spacer for sticky bar */}
      <div className="h-24" />

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-10 py-4 flex justify-center gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Label"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              isEdit && label
                ? `/admin/projects/labels/${label.slug}`
                : "/admin/projects"
            )
          }
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
