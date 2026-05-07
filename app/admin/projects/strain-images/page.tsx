"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { apiClient, type StrainImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function StrainImagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<StrainImage[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .getStrainImages()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Strain Images</h2>
          <p className="text-sm text-muted-foreground">
            Reusable L2+L3 composites — used as label backdrops, website thumbnails, etc.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/strain-images/new">
            <PlusIcon className="mr-2 size-4" />
            New Strain Image
          </Link>
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No strain images yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((si) => (
            <Link
              key={si.id}
              href={`/admin/projects/strain-images/${si.slug}`}
              className="group rounded-lg border bg-card p-3 hover:border-foreground/30 transition"
            >
              <StrainImageThumb slug={si.slug} />
              <div className="mt-2 space-y-0.5">
                <p className="text-sm font-medium truncate">{si.name}</p>
                <p className="text-xs text-muted-foreground">{si.strain_name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StrainImageThumb({ slug }: { slug: string }) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    apiClient.getStrainImageSvg(slug).then(setSvg).catch(() => setSvg(""));
  }, [slug]);

  return (
    <div className="aspect-square w-full rounded bg-white flex items-center justify-center overflow-hidden">
      {svg ? (
        <div className="w-full h-full [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <span className="text-xs text-muted-foreground">…</span>
      )}
    </div>
  );
}
