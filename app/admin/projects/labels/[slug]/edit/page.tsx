"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Label } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LabelForm } from "@/components/label-form";
import { MetrcLabelSetPanel } from "@/components/metrc-label-set-panel";
import { ArrowLeftIcon } from "lucide-react";
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
      setError(err instanceof Error ? err.message : "We couldn't load the label");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLabel();
  }, [isAuthenticated, fetchLabel]);

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10">Loading...</p>;
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

      <LabelForm key={label.updated_at} label={label} />

      <Separator />

      <MetrcLabelSetPanel label={label} onUpdated={fetchLabel} />
    </div>
  );
}
