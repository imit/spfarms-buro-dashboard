"use client";

import { Suspense, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { ShopHeader } from "@/components/shop-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { HelpDrawer } from "@/components/storefront/help-drawer";
import { PostHogPageTracker } from "@/components/public/posthog-page-tracker";
import { useAuth } from "@/contexts/auth-context";
import { ADMIN_LAYOUT_ROLES } from "@/lib/roles";
import type { UserRole } from "@/lib/api";

export default function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const isAdmin = ADMIN_LAYOUT_ROLES.includes(user.role as UserRole);
    const isOwnCompany = user.companies?.some((c) => c.slug === slug);

    // Account users can only access their own company storefront
    // Admin-layout roles can access any storefront
    if (!isAdmin && !isOwnCompany) {
      const redirectTo = user.company_slug ? `/${user.company_slug}` : "/login";
      router.push(redirectTo);
      return;
    }

    posthog.group("company", slug);
  }, [isLoading, isAuthenticated, user, slug, router]);

  if (isLoading || !isAuthenticated) return null;

  // Block render until redirect completes for unauthorized users
  if (user) {
    const isAdmin = ADMIN_LAYOUT_ROLES.includes(user.role as UserRole);
    const isOwnCompany = user.companies?.some((c) => c.slug === slug);
    if (!isAdmin && !isOwnCompany) return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFBF9" }}>
      <Suspense>
        <PostHogPageTracker section="storefront" />
      </Suspense>
      <ShopHeader slug={slug} />
      <main className="flex-1 mx-auto max-w-8xl px-6 py-6 sm:px-10 lg:px-12 lg:py-8 w-full" style={{maxWidth:'1800px'}}>
        {children}
      </main>
      <StorefrontFooter />
      <HelpDrawer />
    </div>
  );
}
