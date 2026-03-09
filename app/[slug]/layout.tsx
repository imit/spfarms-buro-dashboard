"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { HelpDrawer } from "@/components/storefront/help-drawer";
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFBF8" }}>
      <ShopHeader slug={slug} />
      <main className="flex-1 mx-auto max-w-8xl px-6 py-6 sm:px-10 lg:px-12 lg:py-8 w-full" style={{maxWidth:'1800px'}}>
        {children}
      </main>
      <StorefrontFooter />
      <HelpDrawer />
    </div>
  );
}
