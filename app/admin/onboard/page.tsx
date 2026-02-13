"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { OnboardRepresentativeForm } from "@/components/onboard-representative-form";

export default function OnboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Quick Onboard</h2>
        <p className="text-sm text-muted-foreground">
          Onboard a new dispensary representative
        </p>
      </div>
      <OnboardRepresentativeForm />
    </div>
  );
}
