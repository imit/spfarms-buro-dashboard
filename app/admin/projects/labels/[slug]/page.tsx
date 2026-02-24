"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Label,
  LABEL_STATUS_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
    default:
      return "outline" as const;
  }
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
  const [svgPreview, setSvgPreview] = useState<string>("");
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
      setError(
        err instanceof Error ? err.message : "We couldn't load the label"
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLabel();
  }, [isAuthenticated, fetchLabel]);

  const fetchPreview = useCallback(async () => {
    try {
      const svg = await apiClient.getLabelSvgPreview(slug);
      setSvgPreview(svg);
    } catch {
      // Preview may not be available
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPreview();
  }, [isAuthenticated, fetchPreview]);

  async function handleDelete() {
    if (!label) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteLabel(label.slug);
      router.push("/admin/projects/labels");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't delete the label"
      );
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
      setError(
        err instanceof Error ? err.message : "We couldn't duplicate the label"
      );
      setIsDuplicating(false);
    }
  }

  async function handleDownloadSvg() {
    if (!svgPreview || !label) return;
    const blob = new Blob([svgPreview], { type: "image/svg+xml" });
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
      setError(
        err instanceof Error ? err.message : "We couldn't download the PDF"
      );
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground px-10">Loading...</p>;
  }

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

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
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
                </p>
              )}
            </div>
            <Badge variant={statusVariant(label.status)}>
              {LABEL_STATUS_LABELS[label.status]}
            </Badge>
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
          <Button variant="outline" size="sm" onClick={handleDownloadSvg} disabled={!svgPreview}>
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
                  This will permanently delete {label.name}. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* SVG Preview */}
      {svgPreview && (
        <div className="rounded-lg border bg-white p-4 flex items-center justify-center">
          <div dangerouslySetInnerHTML={{ __html: svgPreview }} />
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Name" value={label.name} />
            <DetailRow label="Strain" value={label.strain_name} />
            <DetailRow label="Product" value={label.product_name} />
            <DetailRow label="Slug" value={label.slug} />
            <DetailRow
              label="Created"
              value={new Date(label.created_at).toLocaleDateString()}
            />
          </dl>
        </div>

        {/* Dimensions */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Dimensions</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Width" value={`${label.width_cm} cm`} />
            <DetailRow label="Height" value={`${label.height_cm} cm`} />
            <DetailRow
              label="Corner Radius"
              value={`${label.corner_radius_mm} mm`}
            />
          </dl>
        </div>

        {/* Design */}
        {label.design && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Design</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow
                label="Background"
                value={label.design.background_color}
              />
              <DetailRow label="Font" value={label.design.font_primary} />
              {label.design.qr?.enabled && (
                <DetailRow
                  label="QR Code"
                  value={
                    label.design.qr.data_source === "custom"
                      ? label.design.qr.custom_url
                      : "Product URL"
                  }
                />
              )}
              {label.design.metrc_zone?.enabled && (
                <DetailRow
                  label="METRC Zone"
                  value={
                    label.design.metrc_zone.render_as === "original_image"
                      ? "Original Image"
                      : label.design.metrc_zone.render_as === "qr_code"
                        ? "QR Code"
                        : label.design.metrc_zone.render_as === "barcode"
                          ? "Barcode"
                          : "Text"
                  }
                />
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Overlays */}
      {label.overlays && label.overlays.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Overlays</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {label.overlays.map((overlay) => (
              <div
                key={overlay.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {overlay.name || `Overlay #${overlay.id}`}
                  </span>
                  <Badge variant="outline">{overlay.overlay_type}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Position: ({overlay.position_x}, {overlay.position_y})
                  </p>
                  <p>
                    Size: {overlay.width} x {overlay.height}
                  </p>
                  <p>Z-Index: {overlay.z_index}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* METRC Label Sets */}
      <MetrcLabelSetPanel label={label} onUpdated={fetchLabel} />

      {/* Print Dialog */}
      <LabelPrintDialog
        label={label}
        open={printOpen}
        onOpenChange={setPrintOpen}
      />
    </div>
  );
}
