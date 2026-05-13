import { Suspense } from "react";
import { cookies } from "next/headers";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { PostHogPageTracker } from "@/components/public/posthog-page-tracker";
import { AgeGate } from "@/components/public/age-gate";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side cookie read so verified users never see a modal flash.
  // Cookie is set in <AgeGate> on YES with a 7-day TTL — see age-gate.tsx.
  const cookieStore = await cookies();
  const initiallyVerified = cookieStore.get("sf_age_verified")?.value === "1";

  return (
    <div className="min-h-screen flex flex-col bg-sf-cream text-sf-forest-deep">
      <Suspense>
        <PostHogPageTracker section="public" />
      </Suspense>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <AgeGate initiallyVerified={initiallyVerified} />
    </div>
  );
}
