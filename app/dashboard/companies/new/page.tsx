"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CompanyForm } from "@/components/company-form";

export default function NewCompanyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">New Company</h2>
        <p className="text-sm text-muted-foreground">
          Add a dispensary, distributor, or partner
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
