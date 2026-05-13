import { Suspense } from "react";
import type { Metadata } from "next";
import { PostHogPageTracker } from "@/components/public/posthog-page-tracker";

/**
 * Wholesale layout exists primarily to install the PostHog page tracker
 * on `/wholesale` and `/wholesale/register` — these routes sit outside
 * the `(public)` route group (which has its own layout/tracker) but
 * still need pageview + attribution capture, especially for landing
 * traffic from QR codes, ads, and outbound campaigns.
 *
 * Also the only place we can attach `metadata` for these routes, since
 * the page files themselves are `"use client"` and can't export it.
 * The page-level register override lives in `register/layout.tsx`.
 *
 * Note: PublicHeader / PublicFooter are still rendered inside each
 * wholesale page (not here) because the success-screen branch in
 * `/wholesale/register` renders its own variant. Keeping the layout
 * minimal avoids double-wrapping.
 */

export const metadata: Metadata = {
  title: "Wholesale — Stock SPFarms at Your Dispensary",
  description:
    "Become a wholesale partner with SPFarms. We supply craft, small-batch indoor cannabis to licensed dispensaries across New York.",
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: "Wholesale — Stock SPFarms at Your Dispensary",
    description:
      "Become a wholesale partner with SPFarms. We supply craft, small-batch indoor cannabis to licensed dispensaries across New York.",
    url: "/wholesale",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale — Stock SPFarms at Your Dispensary",
    description:
      "Become a wholesale partner with SPFarms. We supply craft, small-batch indoor cannabis to licensed dispensaries across New York.",
  },
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <PostHogPageTracker section="public" />
      </Suspense>
      {children}
    </>
  );
}
