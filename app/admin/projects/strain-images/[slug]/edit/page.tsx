"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type StrainImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { StrainImageForm } from "@/components/strain-image-form";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function EditStrainImagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<StrainImage | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .getStrainImage(slug)
      .then(setItem)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, slug]);

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10">Loading...</p>;
  if (error) return <div className="mx-10"><ErrorAlert message={error} /></div>;
  if (!item) return null;

  return (
    <div className="px-10 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/admin/projects/strain-images/${item.slug}`}>
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Edit Strain Image</h2>
          <p className="text-sm text-muted-foreground">{item.name}</p>
        </div>
      </div>

      <StrainImageForm key={item.updated_at} strainImage={item} />
    </div>
  );
}
