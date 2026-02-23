"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type SheetLayout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SheetLayoutGridPreview } from "@/components/sheet-layout-grid-preview";

interface SheetLayoutFormProps {
  layout?: SheetLayout;
  mode?: "create" | "edit";
}

export function SheetLayoutForm({
  layout,
  mode = "create",
}: SheetLayoutFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: layout?.name ?? "",
    sheet_width_cm: layout?.sheet_width_cm ?? "21.59",
    sheet_height_cm: layout?.sheet_height_cm ?? "27.94",
    label_width_cm: layout?.label_width_cm ?? "5.08",
    label_height_cm: layout?.label_height_cm ?? "2.54",
    corner_radius_mm: layout?.corner_radius_mm ?? "2.0",
    margin_top_cm: layout?.margin_top_cm ?? "1.27",
    margin_bottom_cm: layout?.margin_bottom_cm ?? "1.27",
    margin_left_cm: layout?.margin_left_cm ?? "0.48",
    margin_right_cm: layout?.margin_right_cm ?? "0.48",
    gap_x_cm: layout?.gap_x_cm ?? "0.3",
    gap_y_cm: layout?.gap_y_cm ?? "0.0",
    default: layout?.default ?? false,
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Parse form values for the live preview
  const previewProps = {
    sheetWidth: parseFloat(form.sheet_width_cm) || 0,
    sheetHeight: parseFloat(form.sheet_height_cm) || 0,
    labelWidth: parseFloat(form.label_width_cm) || 0,
    labelHeight: parseFloat(form.label_height_cm) || 0,
    marginTop: parseFloat(form.margin_top_cm) || 0,
    marginBottom: parseFloat(form.margin_bottom_cm) || 0,
    marginLeft: parseFloat(form.margin_left_cm) || 0,
    marginRight: parseFloat(form.margin_right_cm) || 0,
    gapX: parseFloat(form.gap_x_cm) || 0,
    gapY: parseFloat(form.gap_y_cm) || 0,
    cornerRadius: parseFloat(form.corner_radius_mm) || 0,
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data: Record<string, unknown> = {
        name: form.name,
        sheet_width_cm: form.sheet_width_cm,
        sheet_height_cm: form.sheet_height_cm,
        label_width_cm: form.label_width_cm,
        label_height_cm: form.label_height_cm,
        corner_radius_mm: form.corner_radius_mm,
        margin_top_cm: form.margin_top_cm,
        margin_bottom_cm: form.margin_bottom_cm,
        margin_left_cm: form.margin_left_cm,
        margin_right_cm: form.margin_right_cm,
        gap_x_cm: form.gap_x_cm,
        gap_y_cm: form.gap_y_cm,
        default: form.default,
      };

      if (isEdit && layout) {
        const updated = await apiClient.updateSheetLayout(layout.slug, data);
        router.push(`/admin/projects/sheet-layouts/${updated.slug}`);
      } else {
        const created = await apiClient.createSheetLayout(data);
        router.push(`/admin/projects/sheet-layouts/${created.slug}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `We couldn't ${isEdit ? "update" : "create"} the sheet layout`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <ErrorAlert message={error} />}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form fields */}
        <div className="space-y-8">
          {/* Sheet */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Sheet</h3>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name *</FieldLabel>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="US Letter 2x5"
                  required
                  disabled={isSubmitting}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sheet_width_cm">
                    Sheet Width (cm)
                  </FieldLabel>
                  <Input
                    id="sheet_width_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sheet_width_cm}
                    onChange={(e) =>
                      updateField("sheet_width_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sheet_height_cm">
                    Sheet Height (cm)
                  </FieldLabel>
                  <Input
                    id="sheet_height_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sheet_height_cm}
                    onChange={(e) =>
                      updateField("sheet_height_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </FieldGroup>
          </section>

          {/* Label */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Label</h3>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="label_width_cm">
                    Label Width (cm)
                  </FieldLabel>
                  <Input
                    id="label_width_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.label_width_cm}
                    onChange={(e) =>
                      updateField("label_width_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="label_height_cm">
                    Label Height (cm)
                  </FieldLabel>
                  <Input
                    id="label_height_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.label_height_cm}
                    onChange={(e) =>
                      updateField("label_height_cm", e.target.value)
                    }
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
                    updateField("corner_radius_mm", e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </Field>
            </FieldGroup>
          </section>

          {/* Margins */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Margins</h3>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="margin_top_cm">Top (cm)</FieldLabel>
                  <Input
                    id="margin_top_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.margin_top_cm}
                    onChange={(e) =>
                      updateField("margin_top_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="margin_bottom_cm">
                    Bottom (cm)
                  </FieldLabel>
                  <Input
                    id="margin_bottom_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.margin_bottom_cm}
                    onChange={(e) =>
                      updateField("margin_bottom_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="margin_left_cm">Left (cm)</FieldLabel>
                  <Input
                    id="margin_left_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.margin_left_cm}
                    onChange={(e) =>
                      updateField("margin_left_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="margin_right_cm">Right (cm)</FieldLabel>
                  <Input
                    id="margin_right_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.margin_right_cm}
                    onChange={(e) =>
                      updateField("margin_right_cm", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </FieldGroup>
          </section>

          {/* Gaps */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Gaps</h3>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="gap_x_cm">Horizontal (cm)</FieldLabel>
                  <Input
                    id="gap_x_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.gap_x_cm}
                    onChange={(e) => updateField("gap_x_cm", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="gap_y_cm">Vertical (cm)</FieldLabel>
                  <Input
                    id="gap_y_cm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.gap_y_cm}
                    onChange={(e) => updateField("gap_y_cm", e.target.value)}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </FieldGroup>
          </section>

          {/* Options */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Options</h3>
            <FieldGroup>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="default"
                  checked={form.default}
                  onCheckedChange={(checked) =>
                    updateField("default", checked === true)
                  }
                  disabled={isSubmitting}
                />
                <label htmlFor="default" className="text-sm font-medium">
                  Set as default layout
                </label>
              </div>
            </FieldGroup>
          </section>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preview</h3>
          <div className="sticky top-6 rounded-lg border bg-card p-5">
            <SheetLayoutGridPreview {...previewProps} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Sheet Layout"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              isEdit && layout
                ? `/admin/projects/sheet-layouts/${layout.slug}`
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
