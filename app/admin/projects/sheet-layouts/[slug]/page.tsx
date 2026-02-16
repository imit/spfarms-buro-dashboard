"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type SheetLayout } from "@/lib/api";
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
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { SheetLayoutGridPreview } from "@/components/sheet-layout-grid-preview";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function SheetLayoutDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [layout, setLayout] = useState<SheetLayout | null>(null);
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

    async function fetchLayout() {
      try {
        const data = await apiClient.getSheetLayout(slug);
        setLayout(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sheet layout"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchLayout();
  }, [isAuthenticated, slug]);

  async function handleDelete() {
    if (!layout) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteSheetLayout(layout.slug);
      router.push("/admin/projects");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete sheet layout"
      );
      setIsDeleting(false);
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

  if (!layout) return null;

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
              <h2 className="text-2xl font-semibold">{layout.name}</h2>
              <p className="text-sm text-muted-foreground">
                {layout.sheet_width_cm} x {layout.sheet_height_cm} cm sheet
              </p>
            </div>
            {layout.default && <Badge variant="secondary">Default</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/projects/sheet-layouts/${layout.slug}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
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
                <AlertDialogTitle>Delete sheet layout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{layout.name}&quot;. This
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
        {/* Grid Preview */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Grid Preview</h3>
          <Separator className="mb-4" />
          <SheetLayoutGridPreview
            sheetWidth={parseFloat(layout.sheet_width_cm)}
            sheetHeight={parseFloat(layout.sheet_height_cm)}
            labelWidth={parseFloat(layout.label_width_cm)}
            labelHeight={parseFloat(layout.label_height_cm)}
            marginTop={parseFloat(layout.margin_top_cm)}
            marginBottom={parseFloat(layout.margin_bottom_cm)}
            marginLeft={parseFloat(layout.margin_left_cm)}
            marginRight={parseFloat(layout.margin_right_cm)}
            gapX={parseFloat(layout.gap_x_cm)}
            gapY={parseFloat(layout.gap_y_cm)}
            cornerRadius={parseFloat(layout.corner_radius_mm)}
          />
        </div>

        {/* Sheet Details */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Sheet Size</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow
                label="Width"
                value={`${layout.sheet_width_cm} cm`}
              />
              <DetailRow
                label="Height"
                value={`${layout.sheet_height_cm} cm`}
              />
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Label Size</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow
                label="Width"
                value={`${layout.label_width_cm} cm`}
              />
              <DetailRow
                label="Height"
                value={`${layout.label_height_cm} cm`}
              />
              <DetailRow
                label="Corner Radius"
                value={`${layout.corner_radius_mm} mm`}
              />
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Margins</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow
                label="Top"
                value={`${layout.margin_top_cm} cm`}
              />
              <DetailRow
                label="Bottom"
                value={`${layout.margin_bottom_cm} cm`}
              />
              <DetailRow
                label="Left"
                value={`${layout.margin_left_cm} cm`}
              />
              <DetailRow
                label="Right"
                value={`${layout.margin_right_cm} cm`}
              />
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Gaps</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow
                label="Horizontal"
                value={`${layout.gap_x_cm} cm`}
              />
              <DetailRow
                label="Vertical"
                value={`${layout.gap_y_cm} cm`}
              />
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Computed</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow label="Columns" value={layout.columns} />
              <DetailRow label="Rows" value={layout.rows} />
              <DetailRow
                label="Labels per Sheet"
                value={layout.labels_per_sheet}
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
