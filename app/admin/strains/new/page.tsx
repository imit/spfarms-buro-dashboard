"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { StrainForm } from "@/components/strain-form";

export default function NewStrainPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-2xl space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New Strain</h2>
        <p className="text-sm text-muted-foreground">
          Add a new strain to your library
        </p>
      </div>
      <StrainForm />
    </div>
  );
}
