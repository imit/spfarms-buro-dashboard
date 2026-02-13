"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Strain } from "@/lib/api";
import { StrainForm } from "@/components/strain-form";

export default function EditStrainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const strainId = Number(id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [strain, setStrain] = useState<Strain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchStrain() {
      try {
        const data = await apiClient.getStrain(strainId);
        setStrain(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load strain"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchStrain();
  }, [isAuthenticated, strainId]);

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="px-10 text-muted-foreground">Loading...</p>;
  }

  if (error || !strain) {
    return (
      <div className="px-10">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error || "Strain not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="px-10">
      <StrainForm strain={strain} mode="edit" />
    </div>
  );
}
