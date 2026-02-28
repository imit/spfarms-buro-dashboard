"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { useAuth } from "@/contexts/auth-context";

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

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader slug={slug} />
      <main className="flex-1 mx-auto max-w-9xl px-4 py-4 sm:px-8 lg:px-12 lg:py-6 w-full">
        {children}
      </main>
    </div>
  );
}
