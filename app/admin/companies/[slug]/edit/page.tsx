"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Company } from "@/lib/api";
import { CompanyForm } from "@/components/company-form";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function EditCompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchCompany() {
      try {
        const data = await apiClient.getCompany(slug);
        setCompany(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We couldn't load the company"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompany();
  }, [isAuthenticated, slug]);

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="px-10 text-muted-foreground">Loading...</p>;
  }

  if (error || !company) {
    return (
      <div className="px-10">
        <ErrorAlert message={error || "Company not found"} />
      </div>
    );
  }

  return (
    <div className="px-10">
      <CompanyForm company={company} mode="edit" />
    </div>
  );
}
