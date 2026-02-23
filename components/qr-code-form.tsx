"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type QrCode,
  type QrDataType,
  type Product,
  QR_DATA_TYPE_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATA_TYPES = Object.entries(QR_DATA_TYPE_LABELS) as [QrDataType, string][];

const ERROR_CORRECTION_LEVELS = [
  { value: "L", label: "L - Low (7%)" },
  { value: "M", label: "M - Medium (15%)" },
  { value: "Q", label: "Q - Quartile (25%)" },
  { value: "H", label: "H - High (30%)" },
];

interface QrCodeFormProps {
  qrCode?: QrCode;
  mode?: "create" | "edit";
}

export function QrCodeForm({ qrCode, mode = "create" }: QrCodeFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    name: qrCode?.name ?? "",
    data_type: (qrCode?.data_type ?? "url") as QrDataType,
    url: qrCode?.url ?? "",
    custom_text: qrCode?.custom_text ?? "",
    product_id: qrCode?.product_id?.toString() ?? "",
    size_px: qrCode?.size_px?.toString() ?? "256",
    error_correction: qrCode?.error_correction ?? "M",
    fg_color: qrCode?.fg_color ?? "#000000",
    bg_color: qrCode?.bg_color ?? "#ffffff",
  });

  useEffect(() => {
    apiClient.getProducts().then(setProducts).catch(() => {});
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data: Record<string, unknown> = {
        name: form.name,
        data_type: form.data_type,
        size_px: parseInt(form.size_px, 10),
        error_correction: form.error_correction,
        fg_color: form.fg_color,
        bg_color: form.bg_color,
      };

      if (form.data_type === "url") {
        data.url = form.url;
      } else {
        data.custom_text = form.custom_text;
      }

      if (form.product_id) {
        data.product_id = parseInt(form.product_id, 10);
      }

      if (isEdit && qrCode) {
        const updated = await apiClient.updateQrCode(qrCode.slug, data);
        router.push(`/admin/projects/qr-codes/${updated.slug}`);
      } else {
        const created = await apiClient.createQrCode(data);
        router.push(`/admin/projects/qr-codes/${created.slug}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `We couldn't ${isEdit ? "update" : "create"} the QR code`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <ErrorAlert message={error} />}

      <section className="space-y-4">
        <h3 className="text-lg font-medium">QR Code Details</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name *</FieldLabel>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="My QR Code"
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="data_type">Data Type *</FieldLabel>
            <Select
              value={form.data_type}
              onValueChange={(v) => updateField("data_type", v)}
            >
              <SelectTrigger id="data_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {form.data_type === "url" && (
            <Field>
              <FieldLabel htmlFor="url">URL *</FieldLabel>
              <Input
                id="url"
                type="url"
                value={form.url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://example.com"
                required
                disabled={isSubmitting}
              />
            </Field>
          )}

          {form.data_type === "custom_text" && (
            <Field>
              <FieldLabel htmlFor="custom_text">Custom Text *</FieldLabel>
              <Textarea
                id="custom_text"
                value={form.custom_text}
                onChange={(e) => updateField("custom_text", e.target.value)}
                placeholder="Enter text to encode..."
                required
                disabled={isSubmitting}
                rows={3}
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="product_id">Product (optional)</FieldLabel>
            <Select
              value={form.product_id || "none"}
              onValueChange={(v) => updateField("product_id", v === "none" ? "" : v)}
            >
              <SelectTrigger id="product_id" className="w-full">
                <SelectValue placeholder="No product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium">Appearance</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="size_px">Size (px)</FieldLabel>
              <Input
                id="size_px"
                type="number"
                min="64"
                max="2048"
                value={form.size_px}
                onChange={(e) => updateField("size_px", e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="error_correction">Error Correction</FieldLabel>
              <Select
                value={form.error_correction}
                onValueChange={(v) => updateField("error_correction", v)}
              >
                <SelectTrigger id="error_correction" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_CORRECTION_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fg_color">Foreground Color</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.fg_color}
                  onChange={(e) => updateField("fg_color", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border"
                  disabled={isSubmitting}
                />
                <Input
                  id="fg_color"
                  value={form.fg_color}
                  onChange={(e) => updateField("fg_color", e.target.value)}
                  placeholder="#000000"
                  disabled={isSubmitting}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="bg_color">Background Color</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={(e) => updateField("bg_color", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border"
                  disabled={isSubmitting}
                />
                <Input
                  id="bg_color"
                  value={form.bg_color}
                  onChange={(e) => updateField("bg_color", e.target.value)}
                  placeholder="#ffffff"
                  disabled={isSubmitting}
                />
              </div>
            </Field>
          </div>
        </FieldGroup>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create QR Code"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              isEdit && qrCode
                ? `/admin/projects/qr-codes/${qrCode.slug}`
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
