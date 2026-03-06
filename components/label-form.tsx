"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Label,
  type LabelStatus,
  type Strain,
  type Product,
  LABEL_STATUS_LABELS,
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

const STATUSES = Object.entries(LABEL_STATUS_LABELS) as [LabelStatus, string][];

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

  // Basic info
  const [form, setForm] = useState({
    name: label?.name ?? "",
    strain_id: label?.strain_id?.toString() ?? "",
    product_id: label?.product_id?.toString() ?? "",
    status: (label?.status ?? "draft") as LabelStatus,
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
  }, []);

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
        status: form.status,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <ErrorAlert message={error} />}

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

          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Select
              value={form.status}
              onValueChange={(v) => updateFormField("status", v)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(([value, statusLabel]) => (
                  <SelectItem key={value} value={value}>
                    {statusLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
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
