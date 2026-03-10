"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Strain,
  type StrainCategory,
  type GalleryFile,
  CATEGORY_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GalleryPicker } from "@/components/gallery-picker";
import { ImageIcon, TypeIcon, XIcon, FolderOpenIcon } from "lucide-react";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [StrainCategory, string][];

interface StrainFormProps {
  strain?: Strain;
  mode?: "create" | "edit";
}

export function StrainForm({ strain, mode = "create" }: StrainFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleImageInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    strain?.image_url || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(
    strain?.title_image_url || null
  );
  const [titleImageFile, setTitleImageFile] = useState<File | null>(null);
  const [imageGalleryFileId, setImageGalleryFileId] = useState<number | null>(null);
  const [titleImageGalleryFileId, setTitleImageGalleryFileId] = useState<number | null>(null);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState<"image" | "title_image" | null>(null);
  const [smellTagInput, setSmellTagInput] = useState("");
  const [effectTagInput, setEffectTagInput] = useState("");

  const [form, setForm] = useState({
    name: strain?.name || "",
    code: strain?.code || "",
    category: (strain?.category || "") as StrainCategory | "",
    description: strain?.description || "",
    notes: strain?.notes || "",
    dominant_terpenes: strain?.dominant_terpenes || "",
    thc_range: strain?.thc_range || "",
    total_terpenes: strain?.total_terpenes || "",
    cbg: strain?.cbg || "",
    cbd: strain?.cbd || "",
    total_thc: strain?.total_thc || "",
    total_cannabinoids: strain?.total_cannabinoids || "",
    smell_tags: strain?.smell_tags || [] as string[],
    effect_tags: strain?.effect_tags || [] as string[],
  });

  const isEdit = mode === "edit";

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageGalleryFileId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleTitleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTitleImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setTitleImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearTitleImage() {
    setTitleImageFile(null);
    setTitleImagePreview(null);
    setTitleImageGalleryFileId(null);
    if (titleImageInputRef.current) titleImageInputRef.current.value = "";
  }

  function handleGallerySelect(file: GalleryFile) {
    if (galleryPickerOpen === "image") {
      setImagePreview(file.url);
      setImageFile(null);
      setImageGalleryFileId(file.id);
    } else if (galleryPickerOpen === "title_image") {
      setTitleImagePreview(file.url);
      setTitleImageFile(null);
      setTitleImageGalleryFileId(file.id);
    }
  }

  function addSmellTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (form.smell_tags.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, smell_tags: [...prev.smell_tags, trimmed] }));
    setSmellTagInput("");
  }

  function removeSmellTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      smell_tags: prev.smell_tags.filter((t) => t !== tag),
    }));
  }

  function handleSmellTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSmellTag(smellTagInput);
    }
  }

  function addEffectTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (form.effect_tags.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, effect_tags: [...prev.effect_tags, trimmed] }));
    setEffectTagInput("");
  }

  function removeEffectTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      effect_tags: prev.effect_tags.filter((t) => t !== tag),
    }));
  }

  function handleEffectTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEffectTag(effectTagInput);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("strain[name]", form.name);
      if (form.code) formData.append("strain[code]", form.code);
      if (form.category) formData.append("strain[category]", form.category);
      if (form.description) formData.append("strain[description]", form.description);
      if (form.notes) formData.append("strain[notes]", form.notes);
      if (form.dominant_terpenes) formData.append("strain[dominant_terpenes]", form.dominant_terpenes);
      if (form.thc_range) formData.append("strain[thc_range]", form.thc_range);
      if (form.total_terpenes) formData.append("strain[total_terpenes]", form.total_terpenes);
      if (form.cbg) formData.append("strain[cbg]", form.cbg);
      if (form.cbd) formData.append("strain[cbd]", form.cbd);
      if (form.total_thc) formData.append("strain[total_thc]", form.total_thc);
      if (form.total_cannabinoids) formData.append("strain[total_cannabinoids]", form.total_cannabinoids);
      if (imageFile) formData.append("strain[image]", imageFile);
      else if (imageGalleryFileId) formData.append("image_gallery_file_id", String(imageGalleryFileId));
      if (titleImageFile) formData.append("strain[title_image]", titleImageFile);
      else if (titleImageGalleryFileId) formData.append("title_image_gallery_file_id", String(titleImageGalleryFileId));

      // Append smell_tags as array
      form.smell_tags.forEach((tag) => {
        formData.append("strain[smell_tags][]", tag);
      });

      // Append effect_tags as array
      form.effect_tags.forEach((tag) => {
        formData.append("strain[effect_tags][]", tag);
      });

      if (isEdit && strain) {
        await apiClient.updateStrain(strain.id, formData);
        router.push(`/admin/strains/${strain.id}`);
      } else {
        await apiClient.createStrain(formData);
        router.push("/admin/strains");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `We couldn't ${isEdit ? "update" : "create"} the strain`
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Blue Dream"
                required
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="code">Code</FieldLabel>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                placeholder="BD-001"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select
              value={form.category}
              onValueChange={(v) => updateField("category", v)}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of the strain..."
              disabled={isSubmitting}
              rows={3}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Internal notes..."
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* Cannabinoid Profile */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Cannabinoid Profile</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="dominant_terpenes">Dominant Terpenes</FieldLabel>
              <Input
                id="dominant_terpenes"
                value={form.dominant_terpenes}
                onChange={(e) => updateField("dominant_terpenes", e.target.value)}
                placeholder="Myrcene, Caryophyllene"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="thc_range">THC Range</FieldLabel>
              <Input
                id="thc_range"
                value={form.thc_range}
                onChange={(e) => updateField("thc_range", e.target.value)}
                placeholder="17-24%"
                disabled={isSubmitting}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="total_thc">Total THC %</FieldLabel>
              <Input
                id="total_thc"
                type="number"
                step="0.01"
                value={form.total_thc}
                onChange={(e) => updateField("total_thc", e.target.value)}
                placeholder="22.10"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cbd">CBD %</FieldLabel>
              <Input
                id="cbd"
                type="number"
                step="0.01"
                value={form.cbd}
                onChange={(e) => updateField("cbd", e.target.value)}
                placeholder="0.30"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cbg">CBG %</FieldLabel>
              <Input
                id="cbg"
                type="number"
                step="0.01"
                value={form.cbg}
                onChange={(e) => updateField("cbg", e.target.value)}
                placeholder="0.50"
                disabled={isSubmitting}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="total_terpenes">Total Terpenes %</FieldLabel>
              <Input
                id="total_terpenes"
                type="number"
                step="0.01"
                value={form.total_terpenes}
                onChange={(e) => updateField("total_terpenes", e.target.value)}
                placeholder="3.20"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="total_cannabinoids">Total Cannabinoids %</FieldLabel>
              <Input
                id="total_cannabinoids"
                type="number"
                step="0.01"
                value={form.total_cannabinoids}
                onChange={(e) => updateField("total_cannabinoids", e.target.value)}
                placeholder="25.80"
                disabled={isSubmitting}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* Smell Tags */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Smell Profile</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="smell_tags">Smell / Aroma Tags</FieldLabel>
            <div className="space-y-2">
              <Input
                id="smell_tags"
                value={smellTagInput}
                onChange={(e) => setSmellTagInput(e.target.value)}
                onKeyDown={handleSmellTagKeyDown}
                onBlur={() => addSmellTag(smellTagInput)}
                placeholder="Type a tag and press Enter (e.g. earthy, citrus, pine)"
                disabled={isSubmitting}
              />
              {form.smell_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.smell_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeSmellTag(tag)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Field>
        </FieldGroup>
      </section>

      {/* Effect Tags */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Effect Profile</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="effect_tags">Effect Tags</FieldLabel>
            <div className="space-y-2">
              <Input
                id="effect_tags"
                value={effectTagInput}
                onChange={(e) => setEffectTagInput(e.target.value)}
                onKeyDown={handleEffectTagKeyDown}
                onBlur={() => addEffectTag(effectTagInput)}
                placeholder="Type a tag and press Enter (e.g. relaxing, uplifting, euphoric)"
                disabled={isSubmitting}
              />
              {form.effect_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.effect_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeEffectTag(tag)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Field>
        </FieldGroup>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Images</h3>
        <FieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="image">Strain Photo</FieldLabel>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-32 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <ImageIcon className="size-8 text-muted-foreground" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setGalleryPickerOpen("image")}
                    className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors flex-col gap-1"
                  >
                    <FolderOpenIcon className="size-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Gallery</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="title_image">Title Image</FieldLabel>
              <p className="text-xs text-muted-foreground -mt-1 mb-2">Stylized strain name for labels &amp; thumbnails</p>
              {titleImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={titleImagePreview}
                    alt="Title preview"
                    className="h-32 rounded-lg object-contain border bg-muted/30 px-2"
                  />
                  <button
                    type="button"
                    onClick={clearTitleImage}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div
                    onClick={() => titleImageInputRef.current?.click()}
                    className="flex h-32 w-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <TypeIcon className="size-8 text-muted-foreground" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setGalleryPickerOpen("title_image")}
                    className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors flex-col gap-1"
                  >
                    <FolderOpenIcon className="size-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Gallery</span>
                  </button>
                </div>
              )}
              <input
                ref={titleImageInputRef}
                id="title_image"
                type="file"
                accept="image/*"
                onChange={handleTitleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </Field>
          </div>
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
            : "Create Strain"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              isEdit && strain
                ? `/admin/strains/${strain.id}`
                : "/admin/strains"
            )
          }
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>

      <GalleryPicker
        open={!!galleryPickerOpen}
        onOpenChange={(open) => { if (!open) setGalleryPickerOpen(null); }}
        onSelect={handleGallerySelect}
        accept="image/*"
      />
    </form>
  );
}
