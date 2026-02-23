"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type SheetLayout } from "@/lib/api";
import { SheetLayoutForm } from "@/components/sheet-layout-form";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function EditSheetLayoutPage({
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
          err instanceof Error ? err.message : "We couldn't load the sheet layout"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchLayout();
  }, [isAuthenticated, slug]);

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

  if (!layout) return null;

  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Edit Sheet Layout</h2>
        <p className="text-sm text-muted-foreground">{layout.name}</p>
      </div>
      <SheetLayoutForm layout={layout} mode="edit" />
    </div>
  );
}
