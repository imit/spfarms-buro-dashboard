"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type QrCode,
  QR_DATA_TYPE_LABELS,
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
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileTextIcon,
  Trash2Icon,
} from "lucide-react";

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

export default function QrCodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [qrCode, setQrCode] = useState<QrCode | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchQrCode() {
      try {
        const [data, svg] = await Promise.all([
          apiClient.getQrCode(slug),
          apiClient.getQrCodeSvg(slug),
        ]);
        setQrCode(data);
        setSvgContent(svg);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load QR code"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchQrCode();
  }, [isAuthenticated, slug]);

  async function handleDelete() {
    if (!qrCode) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteQrCode(qrCode.slug);
      router.push("/admin/projects");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete QR code"
      );
      setIsDeleting(false);
    }
  }

  function handleDownloadSvg() {
    if (!svgContent || !qrCode) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${qrCode.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf() {
    if (!qrCode) return;
    try {
      const blob = await apiClient.getQrCodePdf(qrCode.slug);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${qrCode.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download PDF"
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
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/projects">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  if (!qrCode) return null;

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/admin/projects">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-semibold">{qrCode.name}</h2>
              <p className="text-sm text-muted-foreground">
                {qrCode.encoded_data}
              </p>
            </div>
            <Badge variant="secondary">
              {QR_DATA_TYPE_LABELS[qrCode.data_type]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadSvg}>
            <DownloadIcon className="mr-2 size-4" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <FileTextIcon className="mr-2 size-4" />
            PDF
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
                <AlertDialogTitle>Delete QR code?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{qrCode.name}&quot;. This
                  action cannot be undone.
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* SVG Preview */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Preview</h3>
          <Separator className="mb-4" />
          {svgContent ? (
            <div
              className="mx-auto flex items-center justify-center rounded-lg bg-white p-6"
              style={{ maxWidth: 320 }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No preview available
            </p>
          )}
        </div>

        {/* Details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Name" value={qrCode.name} />
            <DetailRow
              label="Data Type"
              value={QR_DATA_TYPE_LABELS[qrCode.data_type]}
            />
            {qrCode.data_type === "url" && (
              <DetailRow
                label="URL"
                value={
                  qrCode.url ? (
                    <a
                      href={qrCode.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      {qrCode.url}
                    </a>
                  ) : null
                }
              />
            )}
            {qrCode.data_type === "custom_text" && (
              <DetailRow label="Custom Text" value={qrCode.custom_text} />
            )}
            <DetailRow label="Product" value={qrCode.product_name} />
            <DetailRow label="Size" value={`${qrCode.size_px}px`} />
            <DetailRow
              label="Error Correction"
              value={qrCode.error_correction}
            />
            <DetailRow
              label="Foreground"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-4 rounded border"
                    style={{ backgroundColor: qrCode.fg_color }}
                  />
                  {qrCode.fg_color}
                </span>
              }
            />
            <DetailRow
              label="Background"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-4 rounded border"
                    style={{ backgroundColor: qrCode.bg_color }}
                  />
                  {qrCode.bg_color}
                </span>
              }
            />
            <DetailRow
              label="Created"
              value={new Date(qrCode.created_at).toLocaleDateString()}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}
