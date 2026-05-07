"use client";

import { useEffect, useState, useRef, useCallback, use, type FormEvent, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Strain,
  type StrainCategory,
  type Coa,
  type GalleryFile,
  CATEGORY_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { GalleryPicker } from "@/components/gallery-picker";
import { InlineText, InlineTags } from "@/components/inline-edit";
import {
  ArrowLeftIcon, ExternalLinkIcon, FileTextIcon, FolderOpenIcon, ImageIcon,
  PlusIcon, Trash2Icon, TypeIcon, UploadIcon, XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [StrainCategory, string][];

export default function StrainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const strainId = Number(id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [strain, setStrain] = useState<Strain | null>(null);
  const [coas, setCoas] = useState<Coa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState<"image" | "title_image" | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([apiClient.getStrain(strainId), apiClient.getStrainCoas(strainId)])
      .then(([s, c]) => { setStrain(s); setCoas(c); })
      .catch((err) => setError(err instanceof Error ? err.message : "We couldn't load this strain"))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, strainId]);

  const updateField = useCallback(async (formData: FormData, optimistic?: Partial<Strain>) => {
    if (!strain) return;
    if (optimistic) setStrain({ ...strain, ...optimistic });
    try {
      const updated = await apiClient.updateStrain(strain.id, formData);
      setStrain(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      // Revert by refetching
      try { setStrain(await apiClient.getStrain(strainId)); } catch { /* ignore */ }
      throw err;
    }
  }, [strain, strainId]);

  const updateText = useCallback(async (key: keyof Strain, value: string) => {
    const fd = new FormData();
    fd.append(`strain[${String(key)}]`, value);
    await updateField(fd, { [key]: value || null } as Partial<Strain>);
  }, [updateField]);

  const updateTags = useCallback(async (key: "smell_tags" | "effect_tags", tags: string[]) => {
    const fd = new FormData();
    if (tags.length === 0) {
      // Backend treats empty array as "no change" with FormData; explicit clear:
      fd.append(`strain[${key}][]`, "");
    } else {
      tags.forEach((t) => fd.append(`strain[${key}][]`, t));
    }
    await updateField(fd, { [key]: tags } as Partial<Strain>);
  }, [updateField]);

  const updateImage = useCallback(async (key: "image" | "title_image", file: File | null, galleryFileId?: number) => {
    const fd = new FormData();
    if (file) {
      fd.append(`strain[${key}]`, file);
    } else if (galleryFileId) {
      fd.append(`${key}_gallery_file_id`, String(galleryFileId));
    } else {
      // Clear: send empty string. Backend should purge.
      fd.append(`strain[${key}]`, "");
    }
    await updateField(fd);
  }, [updateField]);

  const handleDelete = async () => {
    if (!strain) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteStrain(strain.id);
      router.push("/admin/strains");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete this strain");
      setIsDeleting(false);
    }
  };

  const handleGallerySelect = useCallback((file: GalleryFile) => {
    if (galleryPickerOpen === "image") updateImage("image", null, file.id);
    if (galleryPickerOpen === "title_image") updateImage("title_image", null, file.id);
  }, [galleryPickerOpen, updateImage]);

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="px-10 text-muted-foreground">Loading…</p>;
  if (error && !strain) {
    return (
      <div className="space-y-4 px-10">
        <ErrorAlert message={error} />
        <Button variant="outline" asChild>
          <Link href="/admin/strains"><ArrowLeftIcon className="mr-2 size-4" />Back to Strains</Link>
        </Button>
      </div>
    );
  }
  if (!strain) return null;

  return (
    <div className="space-y-6 px-10 pb-10">
      {error && <ErrorAlert message={error} />}

      {/* Header: name, category, active toggle, delete */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin/strains"><ArrowLeftIcon className="size-4" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <InlineText
              value={strain.name}
              placeholder="Untitled strain"
              onSave={(v) => updateText("name", v)}
              displayClassName="text-2xl font-semibold"
              inputClassName="text-2xl font-semibold h-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={strain.category ?? ""}
            onValueChange={(v) => updateText("category", v)}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={async () => {
              const next = !strain.active;
              const fd = new FormData();
              fd.append("strain[active]", String(next));
              await updateField(fd, { active: next });
            }}
          >
            <Badge variant={strain.active ? "default" : "secondary"} className="cursor-pointer">
              {strain.active ? "Active" : "Inactive"}
            </Badge>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" disabled={isDeleting}>
                <Trash2Icon className="size-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete strain?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {strain.name} and all its COAs.
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

      {/* Description */}
      <InlineText
        value={strain.description ?? ""}
        placeholder="Add a description…"
        onSave={(v) => updateText("description", v)}
        multiline
        rows={2}
        displayClassName="text-sm text-muted-foreground"
      />

      {/* Two-column: Identity + Cannabinoids */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Identity">
          <Row label="Code">
            <InlineText value={strain.code ?? ""} placeholder="Add code…" onSave={(v) => updateText("code", v)} displayClassName="font-mono text-sm" />
          </Row>
          <Row label="Notes">
            <InlineText value={strain.notes ?? ""} placeholder="Internal notes…" onSave={(v) => updateText("notes", v)} multiline rows={2} displayClassName="text-sm" />
          </Row>
          <Row label="Created">
            <span className="text-sm text-muted-foreground px-2">{new Date(strain.created_at).toLocaleDateString()}</span>
          </Row>
        </Card>

        <Card title="Cannabinoid profile">
          <Row label="THC range">
            <InlineText value={strain.thc_range ?? ""} placeholder="17-24%" onSave={(v) => updateText("thc_range", v)} displayClassName="text-sm" />
          </Row>
          <Row label="Total THC">
            <InlineText value={strain.total_thc ?? ""} placeholder="0.00" onSave={(v) => updateText("total_thc", v)} type="number" suffix="%" displayClassName="font-mono text-sm" />
          </Row>
          <Row label="CBD">
            <InlineText value={strain.cbd ?? ""} placeholder="0.00" onSave={(v) => updateText("cbd", v)} type="number" suffix="%" displayClassName="font-mono text-sm" />
          </Row>
          <Row label="CBG">
            <InlineText value={strain.cbg ?? ""} placeholder="0.00" onSave={(v) => updateText("cbg", v)} type="number" suffix="%" displayClassName="font-mono text-sm" />
          </Row>
          <Row label="Total terpenes">
            <InlineText value={strain.total_terpenes ?? ""} placeholder="0.00" onSave={(v) => updateText("total_terpenes", v)} type="number" suffix="%" displayClassName="font-mono text-sm" />
          </Row>
          <Row label="Total cannabinoids">
            <InlineText value={strain.total_cannabinoids ?? ""} placeholder="0.00" onSave={(v) => updateText("total_cannabinoids", v)} type="number" suffix="%" displayClassName="font-mono text-sm" />
          </Row>
          <Row label="Dominant terpenes">
            <InlineText value={strain.dominant_terpenes ?? ""} placeholder="Myrcene, Caryophyllene…" onSave={(v) => updateText("dominant_terpenes", v)} displayClassName="text-sm" />
          </Row>
        </Card>
      </div>

      {/* Tag profiles */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Smell profile">
          <div className="px-3 py-2">
            <InlineTags
              tags={strain.smell_tags}
              placeholder="earthy, citrus, pine…"
              onSave={(t) => updateTags("smell_tags", t)}
            />
          </div>
        </Card>
        <Card title="Effect profile">
          <div className="px-3 py-2">
            <InlineTags
              tags={strain.effect_tags}
              placeholder="relaxing, uplifting, euphoric…"
              onSave={(t) => updateTags("effect_tags", t)}
            />
          </div>
        </Card>
      </div>

      {/* Images */}
      <Card title="Images">
        <div className="grid gap-4 sm:grid-cols-2 px-3 py-3">
          <ImageDropZone
            label="Strain photo"
            url={strain.image_url}
            onUpload={(file) => updateImage("image", file)}
            onClear={() => updateImage("image", null)}
            onPickGallery={() => setGalleryPickerOpen("image")}
            icon={<ImageIcon className="size-7 text-muted-foreground" />}
          />
          <ImageDropZone
            label="Title image"
            hint="Stylized strain name for labels & thumbnails"
            url={strain.title_image_url}
            onUpload={(file) => updateImage("title_image", file)}
            onClear={() => updateImage("title_image", null)}
            onPickGallery={() => setGalleryPickerOpen("title_image")}
            icon={<TypeIcon className="size-7 text-muted-foreground" />}
            objectFit="contain"
          />
        </div>
      </Card>

      {/* COAs */}
      <CoasSection strain={strain} coas={coas} setCoas={setCoas} setStrain={setStrain} />

      <GalleryPicker
        open={!!galleryPickerOpen}
        onOpenChange={(open) => { if (!open) setGalleryPickerOpen(null); }}
        onSelect={handleGallerySelect}
        accept="image/*"
      />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/30">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="divide-y">
        {children}
      </div>
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

interface ImageDropZoneProps {
  label: string;
  hint?: string;
  url: string | null;
  onUpload: (file: File) => Promise<void> | void;
  onClear: () => Promise<void> | void;
  onPickGallery: () => void;
  icon: React.ReactNode;
  objectFit?: "cover" | "contain";
}

function ImageDropZone({ label, hint, url, onUpload, onClear, onPickGallery, icon, objectFit = "cover" }: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files");
      return;
    }
    setUploading(true);
    try { await onUpload(file); } finally { setUploading(false); }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {url ? (
        <div className="relative inline-block group">
          <img
            src={url}
            alt={label}
            className={cn(
              "h-32 w-full rounded-lg border bg-muted/30",
              objectFit === "contain" ? "object-contain px-2" : "object-cover"
            )}
          />
          <button
            type="button"
            onClick={() => onClear()}
            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
            aria-label="Remove"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div
            onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex-1 flex h-32 items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            {uploading ? <span className="text-xs text-muted-foreground">Uploading…</span> : icon}
          </div>
          <button
            type="button"
            onClick={onPickGallery}
            className="flex h-32 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40 transition-colors flex-col gap-1"
          >
            <FolderOpenIcon className="size-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Gallery</span>
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

interface CoasSectionProps {
  strain: Strain;
  coas: Coa[];
  setCoas: (fn: (prev: Coa[]) => Coa[]) => void;
  setStrain: (s: Strain) => void;
}

function CoasSection({ strain, coas, setCoas, setStrain }: CoasSectionProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({
    tested_at: "", status: "", thc_percent: "", cbd_percent: "", total_terpenes_percent: "", current: false,
  });

  const reset = () => {
    setForm({ tested_at: "", status: "", thc_percent: "", cbd_percent: "", total_terpenes_percent: "", current: false });
    setPdf(null); setErr("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSelectFile = (file: File) => {
    if (file.type !== "application/pdf") { setErr("Only PDF files are accepted"); return; }
    setPdf(file); setErr("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pdf) { setErr("PDF file is required"); return; }
    setSubmitting(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("coa[pdf]", pdf);
      if (form.tested_at) fd.append("coa[tested_at]", form.tested_at);
      if (form.status) fd.append("coa[status]", form.status);
      if (form.thc_percent) fd.append("coa[thc_percent]", form.thc_percent);
      if (form.cbd_percent) fd.append("coa[cbd_percent]", form.cbd_percent);
      if (form.total_terpenes_percent) fd.append("coa[total_terpenes_percent]", form.total_terpenes_percent);
      fd.append("coa[current]", String(form.current));

      const newCoa = await apiClient.createCoa(strain.id, fd);
      setCoas((prev) => newCoa.current ? [newCoa, ...prev.map((c) => ({ ...c, current: false }))] : [newCoa, ...prev]);
      setStrain(await apiClient.getStrain(strain.id));
      setOpen(false); reset();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "We couldn't upload the COA");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (coaId: number) => {
    try {
      await apiClient.deleteCoa(strain.id, coaId);
      setCoas((prev) => prev.filter((c) => c.id !== coaId));
      setStrain(await apiClient.getStrain(strain.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We couldn't delete the COA");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Certificates of Analysis</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusIcon className="mr-2 size-4" />Upload COA</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload COA</DialogTitle>
              <DialogDescription>Upload a Certificate of Analysis PDF for {strain.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              {err && <ErrorAlert message={err} />}
              {pdf ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                  <FileTextIcon className="size-7 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{pdf.name}</p>
                    <p className="text-xs text-muted-foreground">{(pdf.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={() => { setPdf(null); if (inputRef.current) inputRef.current.value = ""; }} className="rounded-full p-1 hover:bg-muted-foreground/20">
                    <XIcon className="size-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e: DragEvent) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e: DragEvent) => {
                    e.preventDefault(); setDrag(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) onSelectFile(file);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
                    drag ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <UploadIcon className={cn("size-7", drag ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="text-sm font-medium">{drag ? "Drop PDF here" : "Drag & drop PDF here"}</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectFile(f); }} className="hidden" disabled={submitting} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="tested_at">Tested at</FieldLabel>
                  <Input id="tested_at" type="date" value={form.tested_at} onChange={(e) => setForm((p) => ({ ...p, tested_at: e.target.value }))} disabled={submitting} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="coa_status">Status</FieldLabel>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger id="coa_status" className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field><FieldLabel htmlFor="thc_p">THC %</FieldLabel><Input id="thc_p" type="number" step="0.01" value={form.thc_percent} onChange={(e) => setForm((p) => ({ ...p, thc_percent: e.target.value }))} placeholder="21.50" disabled={submitting} /></Field>
                <Field><FieldLabel htmlFor="cbd_p">CBD %</FieldLabel><Input id="cbd_p" type="number" step="0.01" value={form.cbd_percent} onChange={(e) => setForm((p) => ({ ...p, cbd_percent: e.target.value }))} placeholder="0.30" disabled={submitting} /></Field>
                <Field><FieldLabel htmlFor="ter_p">Total Terpenes %</FieldLabel><Input id="ter_p" type="number" step="0.01" value={form.total_terpenes_percent} onChange={(e) => setForm((p) => ({ ...p, total_terpenes_percent: e.target.value }))} placeholder="3.20" disabled={submitting} /></Field>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cur" checked={form.current} onCheckedChange={(c) => setForm((p) => ({ ...p, current: c === true }))} disabled={submitting} />
                <label htmlFor="cur" className="text-sm font-medium leading-none">Set as current COA</label>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting || !pdf}>{submitting ? "Uploading…" : "Upload"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coas.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <FileTextIcon className="mx-auto size-7 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No COAs uploaded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Tested</th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">THC</th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">CBD</th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Terp</th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground"></th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">PDF</th>
                <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {coas.map((coa) => (
                <tr key={coa.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2">{coa.tested_at ? new Date(coa.tested_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2">
                    {coa.status ? (
                      <Badge variant={coa.status === "pass" ? "default" : coa.status === "fail" ? "destructive" : "secondary"}>{coa.status}</Badge>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{coa.thc_percent ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{coa.cbd_percent ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{coa.total_terpenes_percent ?? "—"}</td>
                  <td className="px-3 py-2">{coa.current && <Badge variant="outline">Current</Badge>}</td>
                  <td className="px-3 py-2">
                    {coa.pdf_url && (
                      <a href={coa.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        <ExternalLinkIcon className="size-3" />View
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><Trash2Icon className="size-3.5 text-muted-foreground" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete COA?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this certificate of analysis.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(coa.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
