"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Product,
  type ProductType,
  type ProductStatus,
  type Strain,
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][];
const STATUSES = Object.entries(PRODUCT_STATUS_LABELS) as [ProductStatus, string][];

const SKU_PREFIXES: Record<string, string> = {
  flower: "FL", pre_roll: "PR", concentrate: "CN",
  edible: "ED", vape: "VP", tincture: "TN",
  topical: "TP", capsule: "CP", seed: "SD",
  merchandise: "MR", gear: "GR", apparel: "AP",
};

interface ProductFormProps {
  product?: Product;
  mode?: "create" | "edit";
}

export function ProductForm({ product, mode = "create" }: ProductFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [strains, setStrains] = useState<Strain[]>([]);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    cannabis: product?.cannabis ?? true,
    product_type: (product?.product_type ?? "flower") as ProductType,
    status: (product?.status ?? "draft") as ProductStatus,
    strain_id: product?.strain_id?.toString() ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    unit_weight: product?.unit_weight ?? "",
    unit_count: product?.unit_count?.toString() ?? "",
    default_price: product?.default_price ?? "",
    meta_title: product?.meta_title ?? "",
    meta_description: product?.meta_description ?? "",
    brand: product?.brand ?? "SPFARMS",
    active: product?.active ?? true,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  useEffect(() => {
    apiClient.getStrains().then(setStrains).catch(() => {});
  }, []);

  // Live preview of auto-generated cannabis product name
  const WEIGHT_NAMES: Record<number, string> = {
    3.5: "Eighth",
    7: "Quarter",
    14: "Half",
    28: "Ounce",
  };

  const cannabisNamePreview = (() => {
    if (!form.cannabis) return "";
    const selectedStrain = strains.find((s) => s.id.toString() === form.strain_id);
    const parts = [
      selectedStrain?.name,
      PRODUCT_TYPE_LABELS[form.product_type],
    ];
    if (form.unit_weight) {
      const w = parseFloat(form.unit_weight);
      const grams = w === Math.floor(w) ? w.toFixed(0) : w.toString();
      const commonName = WEIGHT_NAMES[w];
      parts.push(commonName ? `${commonName} (${grams}g)` : `${grams}g`);
    }
    return parts.filter(Boolean).join(" - ");
  })();

  // Live SKU preview for cannabis products
  const skuPreview = (() => {
    if (!form.cannabis) return "";
    const selectedStrain = strains.find((s) => s.id.toString() === form.strain_id);
    if (!selectedStrain) return "";
    const initials = selectedStrain.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase();
    const typePrefix = SKU_PREFIXES[form.product_type] || "XX";
    const parts = [initials, typePrefix];
    if (form.unit_weight) {
      const w = parseFloat(form.unit_weight);
      parts.push(`${w === Math.floor(w) ? w.toFixed(0) : w}G`);
    }
    return parts.join("-");
  })();

  // Live oz conversion
  const ozConversion = (() => {
    if (!form.unit_weight) return "";
    const g = parseFloat(form.unit_weight);
    if (isNaN(g) || g <= 0) return "";
    const oz = g / 28;
    const commonName = WEIGHT_NAMES[g];
    if (commonName) return `${commonName} (${oz % 1 === 0 ? oz.toFixed(0) : oz.toFixed(2)} oz)`;
    return `${oz % 1 === 0 ? oz.toFixed(0) : oz.toFixed(2)} oz`;
  })();

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      // For cannabis products, send the preview name (backend will regenerate it)
      const name = form.cannabis ? (cannabisNamePreview || "Untitled") : form.name;
      formData.append("product[name]", name);
      formData.append("product[description]", form.description);
      formData.append("product[cannabis]", String(form.cannabis));
      formData.append("product[product_type]", form.product_type);
      formData.append("product[status]", form.status);
      formData.append("product[active]", String(form.active));

      if (form.cannabis && form.strain_id) {
        formData.append("product[strain_id]", form.strain_id);
      } else {
        formData.append("product[strain_id]", "");
      }

      if (form.sku) formData.append("product[sku]", form.sku);
      if (form.barcode) formData.append("product[barcode]", form.barcode);
      if (form.unit_weight) {
        formData.append("product[unit_weight]", form.unit_weight);
        formData.append("product[unit_weight_uom]", "g");
      }
      if (form.unit_count) formData.append("product[unit_count]", form.unit_count);
      if (form.default_price) formData.append("product[default_price]", form.default_price);
      if (form.meta_title) formData.append("product[meta_title]", form.meta_title);
      if (form.meta_description) formData.append("product[meta_description]", form.meta_description);
      if (form.brand) formData.append("product[brand]", form.brand);

      if (thumbnailFile) {
        formData.append("product[thumbnail]", thumbnailFile);
      }

      if (imageFiles) {
        Array.from(imageFiles).forEach((file) => {
          formData.append("product[images][]", file);
        });
      }

      if (isEdit && product) {
        await apiClient.updateProduct(product.slug, formData);
        router.push(`/admin/products/${product.slug}`);
      } else {
        await apiClient.createProduct(formData);
        router.push("/admin/products");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEdit ? "update" : "create"} product`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <FieldGroup>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="cannabis"
              checked={form.cannabis}
              onCheckedChange={(checked) =>
                updateField("cannabis", checked === true)
              }
              disabled={isSubmitting}
            />
            <label htmlFor="cannabis" className="text-sm font-medium">
              Cannabis product
            </label>
          </div>

          {form.cannabis ? (
            <>
              <Field>
                <FieldLabel htmlFor="strain_id">Strain *</FieldLabel>
                <Select
                  value={form.strain_id}
                  onValueChange={(v) => updateField("strain_id", v)}
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
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Product name (auto-generated)
                </p>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-medium">
                  {cannabisNamePreview || (
                    <span className="text-muted-foreground italic font-normal">
                      Select a strain above...
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="SPF Branded Tote Bag"
                required
                disabled={isSubmitting}
              />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="product_type">Product Type *</FieldLabel>
              <Select
                value={form.product_type}
                onValueChange={(v) => updateField("product_type", v)}
              >
                <SelectTrigger id="product_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {form.cannabis ? (
            skuPreview && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">SKU (auto-generated)</p>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
                  {skuPreview}
                </div>
              </div>
            )
          ) : (
            <Field>
              <FieldLabel htmlFor="sku">SKU</FieldLabel>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder="MR-0001"
                disabled={isSubmitting}
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="brand">Brand</FieldLabel>
            <Input
              id="brand"
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              placeholder="Brand name"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
            <Input
              id="barcode"
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
              placeholder="UPC / EAN"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Product description..."
              disabled={isSubmitting}
              rows={3}
            />
          </Field>

        </FieldGroup>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Pricing</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="default_price">Price ($)</FieldLabel>
            <Input
              id="default_price"
              type="number"
              step="0.01"
              min="0"
              value={form.default_price}
              onChange={(e) => updateField("default_price", e.target.value)}
              placeholder="29.99"
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* Weight & Packaging */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Weight & Packaging</h3>
        <FieldGroup>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "QP — 32 × 3.5g", weight: "3.5", count: "32" },
                { label: "HP — 16 × 3.5g", weight: "3.5", count: "16" },
                { label: "Eighth", weight: "3.5", count: "1" },
                { label: "Quarter", weight: "7", count: "1" },
                { label: "Half", weight: "14", count: "1" },
                { label: "Ounce", weight: "28", count: "1" },
              ].map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent ${
                    form.unit_weight === tpl.weight && form.unit_count === tpl.count
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground"
                  }`}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      unit_weight: tpl.weight,
                      unit_count: tpl.count,
                    }))
                  }
                  disabled={isSubmitting}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="unit_weight">Weight (grams)</FieldLabel>
              <Input
                id="unit_weight"
                type="number"
                step="0.01"
                min="0"
                value={form.unit_weight}
                onChange={(e) => updateField("unit_weight", e.target.value)}
                placeholder="3.5"
                disabled={isSubmitting}
              />
              {ozConversion && (
                <p className="text-xs text-muted-foreground mt-1">
                  = {ozConversion}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="unit_count">Pack Count</FieldLabel>
              <Input
                id="unit_count"
                type="number"
                min="1"
                value={form.unit_count}
                onChange={(e) => updateField("unit_count", e.target.value)}
                placeholder="1"
                disabled={isSubmitting}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Images</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="thumbnail">Thumbnail</FieldLabel>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              disabled={isSubmitting}
            />
            {isEdit && product?.thumbnail_url && !thumbnailFile && (
              <p className="text-xs text-muted-foreground mt-1">
                Current thumbnail set. Upload to replace.
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="images">Gallery Images</FieldLabel>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* SEO */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">SEO</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="meta_title">Meta Title</FieldLabel>
            <Input
              id="meta_title"
              value={form.meta_title}
              onChange={(e) => updateField("meta_title", e.target.value)}
              placeholder="SEO title override"
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="meta_description">
              Meta Description
            </FieldLabel>
            <Textarea
              id="meta_description"
              value={form.meta_description}
              onChange={(e) => updateField("meta_description", e.target.value)}
              placeholder="SEO description override"
              disabled={isSubmitting}
              rows={2}
            />
          </Field>
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
              : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              isEdit && product
                ? `/admin/products/${product.slug}`
                : "/admin/products"
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
