"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, type StrainImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Separator } from "@/components/ui/separator";
import { RefreshCwIcon, CopyIcon, LockIcon } from "lucide-react";

interface Props {
  strainImage?: StrainImage;
}

export function StrainImageForm({ strainImage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // strain_id can come from a deep link (e.g. /new?strain_id=42) or from an
  // existing record. Otherwise the strain image is unscoped.
  const strainIdFromUrl = searchParams.get("strain_id");
  const [strainId] = useState<string>(
    strainImage?.strain_id ? String(strainImage.strain_id) : (strainIdFromUrl ?? ""),
  );
  const [name, setName] = useState(strainImage?.name ?? "");

  const [seed, setSeed] = useState<string>(strainImage?.generative_seed ?? "");
  const [seedDirty, setSeedDirty] = useState(false);
  const [seedCopied, setSeedCopied] = useState(false);

  const [layer2File, setLayer2File] = useState<File | null>(null);
  const [removeLayer2, setRemoveLayer2] = useState(false);
  const [wordmarkFile, setWordmarkFile] = useState<File | null>(null);
  const [removeWordmark, setRemoveWordmark] = useState(false);

  const locked = strainImage?.locked ?? false;

  const [previewSlug, setPreviewSlug] = useState<string | null>(strainImage?.slug ?? null);
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [seedNonce, setSeedNonce] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");


  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!previewSlug) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const seedOverride = seedDirty && seed.trim() ? seed.trim() : undefined;
        const svg = await apiClient.getStrainImageSvg(previewSlug, seedOverride);
        setPreviewSvg(svg);
      } catch {
        // ignore
      }
    }, 200);
  }, [previewSlug, seedNonce, seed, seedDirty]);

  function buildFormData() {
    const fd = new FormData();
    if (strainId) fd.append("strain_image[strain_id]", strainId);
    fd.append("strain_image[name]", name || "Untitled");
    if (seedDirty && seed.trim()) fd.append("strain_image[generative_seed]", seed.trim());
    if (layer2File) fd.append("strain_image[custom_layer_2]", layer2File);
    if (removeLayer2) fd.append("strain_image[remove_custom_layer_2]", "true");
    if (wordmarkFile) fd.append("strain_image[custom_wordmark]", wordmarkFile);
    if (removeWordmark) fd.append("strain_image[remove_custom_wordmark]", "true");
    return fd;
  }

  async function handleCopySeed() {
    if (!seed) return;
    try {
      await navigator.clipboard.writeText(seed);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const saved = strainImage
        ? await apiClient.updateStrainImage(strainImage.slug, buildFormData())
        : await apiClient.createStrainImage(buildFormData());
      router.push(`/admin/projects/strain-images/${saved.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError("");
    try {
      if (strainImage) {
        const updated = await apiClient.regenerateStrainImageSeed(strainImage.slug);
        setPreviewSlug(updated.slug);
        setSeed(updated.generative_seed);
        setSeedDirty(false);
        setSeedNonce((n) => n + 1);
        return;
      }
      const saved = await apiClient.createStrainImage(buildFormData());
      setPreviewSlug(saved.slug);
      router.replace(`/admin/projects/strain-images/${saved.slug}/edit`);
      setSeedNonce((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {error && (
        <div className="lg:col-span-2">
          <ErrorAlert message={error} />
        </div>
      )}

      {locked && (
        <div className="lg:col-span-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <LockIcon className="size-4" />
          <span>This strain image is locked. Unlock it from the detail page to make changes.</span>
        </div>
      )}

      <fieldset disabled={locked} className="space-y-6 contents">
      <div className="space-y-6">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sour Diesel hero"
          />
        </Field>

        <Separator />

        <Field>
          <FieldLabel htmlFor="seed">Seed</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="seed"
              value={seed}
              placeholder="Auto-generated"
              onChange={(e) => {
                setSeed(e.target.value);
                setSeedDirty(true);
              }}
              className="font-mono text-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleCopySeed} disabled={!seed}>
              <CopyIcon className="mr-2 size-4" />
              {seedCopied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Same seed = same flower. Paste a seed from another image to mirror its design (then save). Click Regenerate for a fresh random seed.
          </p>
        </Field>

        <Separator />

        <div>
          <FieldLabel className="mb-2 block">Custom Layer 2 (overrides generative flower)</FieldLabel>
          {strainImage?.custom_layer_2_url && !layer2File && !removeLayer2 && (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-2 mb-2">
              <img src={strainImage.custom_layer_2_url} alt="L2" className="size-12 rounded object-contain bg-white" />
              <span className="text-xs text-muted-foreground flex-1">Custom L2 attached.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveLayer2(true)}>Remove</Button>
            </div>
          )}
          {removeLayer2 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 mb-2">
              <span className="flex-1">L2 will be removed on save.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveLayer2(false)}>Undo</Button>
            </div>
          )}
          <Input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={(e) => {
              setLayer2File(e.target.files?.[0] ?? null);
              setRemoveLayer2(false);
            }}
          />
          {layer2File && <p className="text-xs text-muted-foreground mt-1">Selected: {layer2File.name}</p>}
        </div>

        <div>
          <FieldLabel className="mb-2 block">Custom Wordmark (overrides Layer 3)</FieldLabel>
          {strainImage?.custom_wordmark_url && !wordmarkFile && !removeWordmark && (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-2 mb-2">
              <img src={strainImage.custom_wordmark_url} alt="Wordmark" className="h-12 rounded object-contain bg-white" />
              <span className="text-xs text-muted-foreground flex-1">Custom wordmark attached.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveWordmark(true)}>Remove</Button>
            </div>
          )}
          {removeWordmark && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 mb-2">
              <span className="flex-1">Wordmark will be removed on save.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveWordmark(false)}>Undo</Button>
            </div>
          )}
          <Input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={(e) => {
              setWordmarkFile(e.target.files?.[0] ?? null);
              setRemoveWordmark(false);
            }}
          />
          {wordmarkFile && <p className="text-xs text-muted-foreground mt-1">Selected: {wordmarkFile.name}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Falls back to the strain&apos;s title image, then the bundled PNG, then plain text.
          </p>
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting || locked}>
            {isSubmitting ? "Saving..." : strainImage ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={handleRegenerate} disabled={isRegenerating || locked}>
            <RefreshCwIcon className="mr-2 size-4" />
            {isRegenerating ? "Regenerating..." : "Regenerate flower"}
          </Button>
        </div>
      </div>
      </fieldset>

      <div className="space-y-3">
        <FieldLabel className="block">Preview</FieldLabel>
        <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[400px] aspect-square">
          {previewSvg ? (
            <div
              className="w-full [&_svg]:w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Click <strong>Regenerate flower</strong> to generate a preview.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
