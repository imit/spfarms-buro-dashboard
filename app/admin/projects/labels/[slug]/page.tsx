"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Label } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LabelPrintDialog } from "@/components/label-print-dialog";
import { MetrcLabelSetPanel } from "@/components/metrc-label-set-panel";
import {
  ArrowLeftIcon,
  PencilIcon,
  Trash2Icon,
  DownloadIcon,
  PrinterIcon,
  CopyIcon,
} from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function LabelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [label, setLabel] = useState<Label | null>(null);
  const [regularSvg, setRegularSvg] = useState<string>("");
  const [sampleSvg, setSampleSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
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
  }, [isAuthenticated, fetchLabel]);

  const fetchPreviews = useCallback(async () => {
    if (!label) return;
    try {
      const reg = await apiClient.getLabelSvgPreview(slug);
      setRegularSvg(reg);
    } catch {
      // ignore
    }
    const sampleVariant = label.variants?.find((v) => v.is_sample);
    if (sampleVariant) {
      try {
        const smp = await apiClient.getLabelVariantSvgPreview(slug, sampleVariant.id);
        setSampleSvg(smp);
      } catch {
        // ignore
      }
    }
  }, [slug, label]);

  useEffect(() => {
    fetchPreviews();
  }, [fetchPreviews]);

  async function handleDelete() {
    if (!label) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteLabel(label.slug);
      router.push("/admin/projects/labels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete the label");
      setIsDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!label) return;
    setIsDuplicating(true);
    try {
      const copy = await apiClient.duplicateLabel(label.slug);
      router.push(`/admin/projects/labels/${copy.slug}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't duplicate the label");
      setIsDuplicating(false);
    }
  }

  async function handleDownloadSvg() {
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
  }

  async function handleDownloadPdf() {
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
  }

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10">Loading...</p>;
  if (error) {
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

  const cannabinoidsDisplay = label.cannabinoids
    ?.map((c) => `${c.label} ${c.value}`)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/admin/projects/labels">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-semibold">{label.name}</h2>
              {label.strain_name && (
                <p className="text-sm text-muted-foreground">
                  {label.strain_name}
                  {label.strain_category && ` · ${label.strain_category}`}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/projects/labels/${label.slug}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating}>
            <CopyIcon className="mr-2 size-4" />
            {isDuplicating ? "Duplicating..." : "Duplicate"}
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
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2Icon className="mr-2 size-4" />
                Delete
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Regular</h3>
          <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[200px]">
            {regularSvg ? (
              <div className="w-full [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: regularSvg }} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Sample</h3>
          <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[200px]">
            {sampleSvg ? (
              <div className="w-full [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: sampleSvg }} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Strain" value={label.strain_name} />
            <DetailRow label="Category" value={label.strain_category} />
            <DetailRow label="Slug" value={label.slug} />
            <DetailRow
              label="Top-right"
              value={[label.top_right_line_1, label.top_right_line_2, label.top_right_line_3].filter(Boolean).join(" / ")}
            />
            <DetailRow label="Cannabinoids" value={cannabinoidsDisplay} />
            <DetailRow label="Harvest" value={label.harvest_batch} />
            <DetailRow label="Batch" value={label.batch_number} />
            <DetailRow label="Expiration" value={label.expiration_date} />
            <DetailRow label="METRC payload" value={label.metrc_qr_payload} />
            <DetailRow
              label="Strain image"
              value={
                label.strain_image_id ? (
                  <Link
                    href={`/admin/projects/strain-images/${label.strain_image_id}`}
                    className="underline"
                  >
                    {label.strain_image_name ?? `#${label.strain_image_id}`}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">— none —</span>
                )
              }
            />
            <DetailRow label="Created" value={new Date(label.created_at).toLocaleDateString()} />
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Dimensions</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Width" value={`${label.width_cm} cm`} />
            <DetailRow label="Height" value={`${label.height_cm} cm`} />
          </dl>
        </div>
      </div>

      <Separator />

      <MetrcLabelSetPanel label={label} onUpdated={fetchLabel} />

      <LabelPrintDialog label={label} open={printOpen} onOpenChange={setPrintOpen} />
    </div>
  );
}
