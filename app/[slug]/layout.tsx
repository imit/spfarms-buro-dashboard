"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";

export default function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bankInfo, setBankInfo] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getSettings().then((s) => setBankInfo(s.bank_info || "")).catch(() => {});
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader slug={slug} />
      <main className="flex-1 mx-auto max-w-9xl px-4 py-4 sm:px-8 lg:px-12 lg:py-6 w-full">
        {children}
      </main>
      {bankInfo && (
        <footer className="border-t py-6 px-4 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-9xl">
            <p className="text-xs font-medium text-muted-foreground mb-1">Payment Information</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{bankInfo}</p>
          </div>
        </footer>
      )}
    </div>
  );
}
