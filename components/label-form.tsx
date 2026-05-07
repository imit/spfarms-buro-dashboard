"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, type Label, type LabelCannabinoid, type Strain, type StrainImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2Icon } from "lucide-react";

interface LabelFormProps {
  label?: Label;
}

const DEFAULT_TOP_RIGHT: [string, string, string] = ["flower", "3.5gr", "eights"];
const DEFAULT_CANNABINOIDS: LabelCannabinoid[] = [
  { label: "Thc", value: "" },
  { label: "Cbg", value: "" },
  { label: "Cbd", value: "" },
];

export function LabelForm({ label }: LabelFormProps) {
  const router = useRouter();
  const [strains, setStrains] = useState<Strain[]>([]);
  const [strainId, setStrainId] = useState<string>(label?.strain_id ? String(label.strain_id) : "");
  const [strainImageId, setStrainImageId] = useState<string>(
    label?.strain_image_id ? String(label.strain_image_id) : "",
  );
  const [strainImages, setStrainImages] = useState<StrainImage[]>([]);

  const [topRight, setTopRight] = useState<[string, string, string]>([
    label?.top_right_line_1 ?? DEFAULT_TOP_RIGHT[0],
    label?.top_right_line_2 ?? DEFAULT_TOP_RIGHT[1],
    label?.top_right_line_3 ?? DEFAULT_TOP_RIGHT[2],
  ]);
  const [harvestBatch, setHarvestBatch] = useState(label?.harvest_batch ?? "");
  const [batchNumber, setBatchNumber] = useState(label?.batch_number ?? "");
  const [expirationDate, setExpirationDate] = useState(label?.expiration_date ?? "");
  const [metrcQrPayload, setMetrcQrPayload] = useState(label?.metrc_qr_payload ?? "");
  const [cannabinoids, setCannabinoids] = useState<LabelCannabinoid[]>(
    label?.cannabinoids?.length ? label.cannabinoids : DEFAULT_CANNABINOIDS,
  );
  const [name, setName] = useState(label?.name ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [previewLabelSlug, setPreviewLabelSlug] = useState<string | null>(label?.slug ?? null);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    apiClient.getStrains().then(setStrains).catch(() => setStrains([]));
  }, []);

  const activeStrains = useMemo(() => strains.filter((s) => s.active), [strains]);
  const selectedStrain = strains.find((s) => String(s.id) === strainId);

  // Load all strain images. Pairing is fully manual — any strain image can
  // be used with any label/strain.
  useEffect(() => {
    apiClient
      .getStrainImages()
      .then(setStrainImages)
      .catch(() => setStrainImages([]));
  }, []);

  // Cannabinoid + name autopopulate from strain whenever the picked strain
  // changes (create flow only — strain is locked when editing).
  useEffect(() => {
    if (!selectedStrain || label) return;
    const fmt = (v: string | null | undefined) => (v ? `${v}%` : "");
    setCannabinoids([
      { label: "Thc", value: fmt(selectedStrain.total_thc) },
      { label: "Cbg", value: fmt(selectedStrain.cbg) },
      { label: "Cbd", value: fmt(selectedStrain.cbd) },
    ]);
    setName((prev) => prev || selectedStrain.name);
  }, [selectedStrain, label]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!previewLabelSlug) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const svg = await apiClient.getLabelSvgPreview(previewLabelSlug, undefined, { debug: debugMode });
        setPreviewSvg(svg);
      } catch {
        // ignore
      }
    }, 250);
  }, [previewLabelSlug, strainImageId, debugMode]);

  function setCannabinoid(idx: number, patch: Partial<LabelCannabinoid>) {
    setCannabinoids((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function buildPayload() {
    return {
      strain_id: Number(strainId),
      strain_image_id: strainImageId ? Number(strainImageId) : null,
      name: name || (selectedStrain?.name ?? "Label"),
      top_right_line_1: topRight[0],
      top_right_line_2: topRight[1],
      top_right_line_3: topRight[2],
      harvest_batch: harvestBatch,
      batch_number: batchNumber,
      expiration_date: expirationDate || null,
      metrc_qr_payload: metrcQrPayload,
      cannabinoids: cannabinoids.filter((c) => c.label || c.value),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!strainId) {
      setError("Please pick a strain first");
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = label
        ? await apiClient.updateLabel(label.slug, buildPayload())
        : await apiClient.createLabel(buildPayload());
      router.push(`/admin/projects/labels/${saved.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save label");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {error && (
        <div className="lg:col-span-2">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="space-y-6">
        <Field>
          <FieldLabel htmlFor="strain">Strain</FieldLabel>
          <Select value={strainId} onValueChange={setStrainId} disabled={!!label}>
            <SelectTrigger>
              <SelectValue placeholder="Select a strain..." />
            </SelectTrigger>
            <SelectContent>
              {activeStrains.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="strain_image">Strain Image (Layer 2 + 3)</FieldLabel>
          <div className="space-y-2">
            <Select
              value={strainImageId}
              onValueChange={setStrainImageId}
              disabled={strainImages.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={strainImages.length === 0 ? "No strain images yet" : "Pick any image..."} />
              </SelectTrigger>
              <SelectContent>
                {strainImages.map((si) => (
                  <SelectItem key={si.id} value={String(si.id)}>
                    {si.strain_name ? `${si.strain_name} — ${si.name}` : si.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Any strain image works with any label.{" "}
              <Link href="/admin/projects/strain-images" className="underline">
                Manage strain images
              </Link>
              .
            </p>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="name">Label Name</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-generated from strain if blank"
          />
        </Field>

        <Separator />

        <div>
          <FieldLabel className="mb-3 block">Top-right text (3 lines)</FieldLabel>
          <div className="space-y-2">
            {topRight.map((value, i) => (
              <Input
                key={i}
                value={value}
                placeholder={`Line ${i + 1}`}
                onChange={(e) => {
                  const next = [...topRight] as [string, string, string];
                  next[i] = e.target.value;
                  setTopRight(next);
                }}
              />
            ))}
            <p className="text-xs text-muted-foreground">Line 2 renders bold.</p>
          </div>
        </div>

        <Separator />

        <div>
          <FieldLabel className="mb-3 block">Cannabinoid lines (up to 3)</FieldLabel>
          <div className="space-y-2">
            {cannabinoids.slice(0, 3).map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="w-24"
                  value={row.label}
                  placeholder="Label"
                  onChange={(e) => setCannabinoid(i, { label: e.target.value })}
                />
                <Input
                  className="flex-1"
                  value={row.value}
                  placeholder="Value (e.g. 29.75%)"
                  onChange={(e) => setCannabinoid(i, { value: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setCannabinoid(i, { label: "", value: "" })}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="harvest_batch">Harvest</FieldLabel>
            <Input
              id="harvest_batch"
              value={harvestBatch}
              onChange={(e) => setHarvestBatch(e.target.value)}
              placeholder="02/11/26"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="batch_number">Batch</FieldLabel>
            <Input
              id="batch_number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="122025.RM1L1/MB"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="expiration_date">Expiration date</FieldLabel>
            <Input
              id="expiration_date"
              type="date"
              value={expirationDate ?? ""}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="metrc_qr_payload">METRC QR payload</FieldLabel>
            <Input
              id="metrc_qr_payload"
              value={metrcQrPayload}
              onChange={(e) => setMetrcQrPayload(e.target.value)}
              placeholder="1A40F0…"
            />
          </Field>
        </div>

        <Separator />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : label ? "Save" : "Create"}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel className="block">Preview</FieldLabel>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="size-3.5"
            />
            Debug boxes
          </label>
        </div>
        <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[300px]">
          {previewSvg ? (
            <div
              className="w-full max-w-[600px] [&_svg]:w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {label ? "Loading preview..." : "Save the label to see a preview."}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
