"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";

interface LabelPreviewProps {
  slug: string;
  className?: string;
}

export function LabelPreview({ slug, className }: LabelPreviewProps) {
  const [svgPreview, setSvgPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPreview() {
      try {
        const svg = await apiClient.getLabelSvgPreview(slug);
        setSvgPreview(svg);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We couldn't load the preview"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreview();
  }, [slug]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-white p-4 min-h-[200px]",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-white p-4 min-h-[200px]",
          className
        )}
      >
        <ErrorAlert message={error} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border bg-white p-4",
        className
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: svgPreview }} />
    </div>
  );
}
