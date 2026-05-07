"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Label,
  type LabelCannabinoid,
  type StrainImage,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LabelPrintDialog } from "@/components/label-print-dialog";
import { MetrcLabelSetPanel } from "@/components/metrc-label-set-panel";
import { ErrorAlert } from "@/components/ui/error-alert";
import { InlineText } from "@/components/inline-edit";
import {
  ArrowLeftIcon, CopyIcon, DownloadIcon, PrinterIcon, Trash2Icon,
  Trash2Icon as TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LabelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [label, setLabel] = useState<Label | null>(null);
  const [strainImages, setStrainImages] = useState<StrainImage[]>([]);
  const [regularSvg, setRegularSvg] = useState("");
  const [sampleSvg, setSampleSvg] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  const fetchLabel = useCallback(async () => {
    try {
      const data = await apiClient.getLabel(slug);
      setLabel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't load the label");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLabel();
    apiClient.getStrainImages().then(setStrainImages).catch(() => setStrainImages([]));
  }, [isAuthenticated, fetchLabel]);

  const fetchPreviews = useCallback(async () => {
    if (!label) return;
    try {
      const reg = await apiClient.getLabelSvgPreview(slug, undefined, { debug: debugMode });
      setRegularSvg(reg);
    } catch { /* ignore */ }
    const sampleVariant = label.variants?.find((v) => v.is_sample);
    if (sampleVariant) {
      try {
        const smp = await apiClient.getLabelVariantSvgPreview(slug, sampleVariant.id);
        setSampleSvg(smp);
      } catch { /* ignore */ }
    }
  }, [slug, label, debugMode]);

  useEffect(() => {
    fetchPreviews();
  }, [fetchPreviews]);

  const updateField = useCallback(async (patch: Record<string, unknown>, optimistic?: Partial<Label>) => {
    if (!label) return;
    if (optimistic) setLabel({ ...label, ...optimistic });
    try {
      const updated = await apiClient.updateLabel(label.slug, patch);
      setLabel(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      try { setLabel(await apiClient.getLabel(slug)); } catch { /* ignore */ }
      throw err;
    }
  }, [label, slug]);

  const updateText = useCallback(async (key: keyof Label, value: string) => {
    await updateField({ [key]: value || null }, { [key]: value || null } as Partial<Label>);
  }, [updateField]);

  const updateNumber = useCallback(async (key: keyof Label, value: string) => {
    const trimmed = value.trim();
    if (trimmed && isNaN(Number(trimmed))) {
      toast.error("Must be a number");
      throw new Error("nan");
    }
    await updateField({ [key]: trimmed || null }, { [key]: trimmed || null } as Partial<Label>);
  }, [updateField]);

  const updateCannabinoid = useCallback(async (idx: number, patch: Partial<LabelCannabinoid>) => {
    if (!label) return;
    const current = label.cannabinoids ?? [];
    // Pad to 3 rows so we can index reliably.
    const padded: LabelCannabinoid[] = [0, 1, 2].map((i) => current[i] ?? { label: "", value: "" });
    padded[idx] = { ...padded[idx], ...patch };
    const next = padded.filter((c) => c.label || c.value);
    await updateField({ cannabinoids: next }, { cannabinoids: next });
  }, [label, updateField]);

  const handleDelete = async () => {
    if (!label) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteLabel(label.slug);
      router.push("/admin/projects/labels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete the label");
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!label) return;
    setIsDuplicating(true);
    try {
      const copy = await apiClient.duplicateLabel(label.slug);
      router.push(`/admin/projects/labels/${copy.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't duplicate the label");
      setIsDuplicating(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!regularSvg || !label) return;
    const blob = new Blob([regularSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!label) return;
    try {
      const blob = await apiClient.getLabelPdf(slug);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't download the PDF");
    }
  };

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10">Loading…</p>;
  if (error && !label) {
    return (
      <div className="space-y-4 px-10">
        <ErrorAlert message={error} />
        <Button variant="outline" asChild>
          <Link href="/admin/projects/labels">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Labels
          </Link>
        </Button>
      </div>
    );
  }
  if (!label) return null;

  const cannabinoids: LabelCannabinoid[] = [0, 1, 2].map((i) => label.cannabinoids?.[i] ?? { label: "", value: "" });

  return (
    <div className="space-y-6 px-10 pb-10">
      {error && <ErrorAlert message={error} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin/projects/labels"><ArrowLeftIcon className="size-4" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <InlineText
              value={label.name}
              placeholder="Untitled label"
              onSave={(v) => updateText("name", v)}
              displayClassName="text-2xl font-semibold"
              inputClassName="text-2xl font-semibold h-10"
            />
            {label.strain_name && (
              <p className="text-xs text-muted-foreground ml-2 mt-0.5">
                Strain · {label.strain_name}
                {label.strain_category && ` · ${label.strain_category}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating}>
            <CopyIcon className="mr-2 size-4" />
            {isDuplicating ? "Duplicating…" : "Duplicate"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSvg} disabled={!regularSvg}>
            <DownloadIcon className="mr-2 size-4" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <DownloadIcon className="mr-2 size-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
            <PrinterIcon className="mr-2 size-4" />
            Print Sheet
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" disabled={isDeleting}>
                <TrashIcon className="size-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete label?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {label.name}. This action cannot be undone.
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

      {/* Previews */}
      <div className="grid gap-4 md:grid-cols-2">
        <PreviewCard title="Regular" svg={regularSvg} debugMode={debugMode} onToggleDebug={setDebugMode} />
        <PreviewCard title="Sample" svg={sampleSvg} />
      </div>

      {/* Editable fields */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Identity">
          <Row label="Name">
            <InlineText value={label.name} placeholder="Auto from strain" onSave={(v) => updateText("name", v)} displayClassName="text-sm" />
          </Row>
          <Row label="Strain">
            <span className="text-sm px-2">
              {label.strain_id ? (
                <Link href={`/admin/strains/${label.strain_id}`} className="underline">
                  {label.strain_name}
                </Link>
              ) : <span className="text-muted-foreground italic">No strain</span>}
            </span>
          </Row>
          <Row label="Category">
            {label.strain_category ? (
              <Badge variant="outline" className="ml-2">{label.strain_category}</Badge>
            ) : <span className="text-sm text-muted-foreground italic px-2">—</span>}
          </Row>
          <Row label="Strain image">
            <Select
              value={label.strain_image_id ? String(label.strain_image_id) : "none"}
              onValueChange={(v) => updateField(
                { strain_image_id: v === "none" ? null : Number(v) },
                { strain_image_id: v === "none" ? null : Number(v) }
              )}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Pick strain image…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {strainImages.map((si) => (
                  <SelectItem key={si.id} value={String(si.id)}>
                    {si.strain_name ? `${si.strain_name} — ${si.name}` : si.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Slug">
            <span className="text-xs text-muted-foreground font-mono px-2">{label.slug}</span>
          </Row>
          <Row label="Created">
            <span className="text-xs text-muted-foreground px-2">{new Date(label.created_at).toLocaleDateString()}</span>
          </Row>
        </Card>

        <Card title="Dimensions">
          <Row label="Width">
            <InlineText value={String(label.width_cm)} placeholder="0" onSave={(v) => updateNumber("width_cm", v)} type="number" suffix=" cm" displayClassName="font-mono text-sm" />
          </Row>
          <Row label="Height">
            <InlineText value={String(label.height_cm)} placeholder="0" onSave={(v) => updateNumber("height_cm", v)} type="number" suffix=" cm" displayClassName="font-mono text-sm" />
          </Row>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Top-right text (3 lines)">
          <Row label="Line 1">
            <InlineText value={label.top_right_line_1 ?? ""} placeholder="flower" onSave={(v) => updateText("top_right_line_1", v)} displayClassName="text-sm" />
          </Row>
          <Row label="Line 2 (bold)">
            <InlineText value={label.top_right_line_2 ?? ""} placeholder="3.5gr" onSave={(v) => updateText("top_right_line_2", v)} displayClassName="text-sm font-semibold" />
          </Row>
          <Row label="Line 3">
            <InlineText value={label.top_right_line_3 ?? ""} placeholder="eights" onSave={(v) => updateText("top_right_line_3", v)} displayClassName="text-sm" />
          </Row>
        </Card>

        <Card title="Cannabinoids (up to 3 rows)">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_1fr] items-center gap-2 px-3 py-2 border-b last:border-0">
              <span className="text-xs text-muted-foreground">Row {i + 1}</span>
              <InlineText
                value={cannabinoids[i].label}
                placeholder="Thc"
                onSave={(v) => updateCannabinoid(i, { label: v })}
                displayClassName="text-sm font-medium"
              />
              <InlineText
                value={cannabinoids[i].value}
                placeholder="22%"
                onSave={(v) => updateCannabinoid(i, { value: v })}
                displayClassName="text-sm font-mono"
              />
            </div>
          ))}
        </Card>
      </div>

      <Card title="Batch info">
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
          <div className="divide-y">
            <Row label="Harvest">
              <InlineText value={label.harvest_batch ?? ""} placeholder="02/11/26" onSave={(v) => updateText("harvest_batch", v)} displayClassName="font-mono text-sm" />
            </Row>
            <Row label="Batch #">
              <InlineText value={label.batch_number ?? ""} placeholder="122025.RM1L1/MB" onSave={(v) => updateText("batch_number", v)} displayClassName="font-mono text-sm" />
            </Row>
          </div>
          <div className="divide-y">
            <Row label="Expiration">
              <ExpirationField
                value={label.expiration_date}
                onSave={(v) => updateField({ expiration_date: v || null }, { expiration_date: v || null })}
              />
            </Row>
            <Row label="METRC payload">
              <InlineText value={label.metrc_qr_payload ?? ""} placeholder="1A40F0…" onSave={(v) => updateText("metrc_qr_payload", v)} displayClassName="font-mono text-xs" />
            </Row>
          </div>
        </div>
      </Card>

      {/* METRC sets */}
      <MetrcLabelSetPanel label={label} onUpdated={fetchLabel} />

      <LabelPrintDialog label={label} open={printOpen} onOpenChange={setPrintOpen} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/30">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-2 px-3 py-2">
      <dt className="text-xs text-muted-foreground pt-1.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function PreviewCard({ title, svg, debugMode, onToggleDebug }: {
  title: string;
  svg: string;
  debugMode?: boolean;
  onToggleDebug?: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {onToggleDebug && (
          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={!!debugMode}
              onChange={(e) => onToggleDebug(e.target.checked)}
              className="size-3"
            />
            Debug
          </label>
        )}
      </div>
      <div className={cn(
        "rounded-lg border bg-white p-3 flex items-center justify-center min-h-[180px]",
      )}>
        {svg ? (
          <div className="w-full [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <p className="text-xs text-muted-foreground">{title === "Sample" ? "No sample variant yet" : "Loading…"}</p>
        )}
      </div>
    </div>
  );
}

function ExpirationField({ value, onSave }: { value: string | null; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setDraft(value ?? ""); }, [value, editing]);

  const commit = async () => {
    if (draft === (value ?? "")) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); }
    catch { setDraft(value ?? ""); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <Input
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        autoFocus
        disabled={saving}
        className="h-8 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      className={cn(
        "text-left rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-muted/60 transition-colors w-full text-sm",
        !value && "italic text-muted-foreground"
      )}
    >
      {value ? new Date(value).toLocaleDateString() : "—"}
    </button>
  );
}
