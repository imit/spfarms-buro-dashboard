"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Label } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LabelForm } from "@/components/label-form";
import { LabelOverlayPanel } from "@/components/label-overlay-panel";
import { MetrcLabelSetPanel } from "@/components/metrc-label-set-panel";
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function EditLabelPage({
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

  const refreshPreview = useCallback(async () => {
    try {
      const svg = await apiClient.getLabelSvgPreview(slug);
      setSvgPreview(svg);
    } catch {
      // Preview may not be available
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLabel();
    refreshPreview();
  }, [isAuthenticated, fetchLabel, refreshPreview]);

  function handleOverlayUpdated(updatedLabel: Label) {
    setLabel(updatedLabel);
    refreshPreview();
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground px-10">Loading...</p>;
  }

  if (error) {
    return (
      <div className="mx-10">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (!label) return null;

  return (
    <div className="px-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/admin/projects/labels/${label.slug}`}>
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Edit Label</h2>
          <p className="text-sm text-muted-foreground">{label.name}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
        {/* Left: Sticky Preview */}
        <div className="lg:sticky lg:top-4 space-y-3">
          <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-center min-h-[250px]">
            {svgPreview ? (
              <div
                className="max-w-full [&>svg]:max-w-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgPreview }}
              />
            ) : (
              <p className="text-muted-foreground">Loading preview...</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPreview}
          >
            <RefreshCwIcon className="mr-2 size-4" />
            Refresh Preview
          </Button>
        </div>

        {/* Right: Form + Overlays */}
        <div className="space-y-8">
          <LabelForm
            label={label}
            mode="edit"
            onSaved={() => {
              refreshPreview();
              fetchLabel();
            }}
          />

          <Separator />

          <LabelOverlayPanel
            label={label}
            onUpdated={handleOverlayUpdated}
          />

          <Separator />

          <MetrcLabelSetPanel
            label={label}
            onUpdated={fetchLabel}
          />
        </div>
      </div>
    </div>
  );
}
