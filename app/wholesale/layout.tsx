import { Suspense } from "react";
import { PostHogPageTracker } from "@/components/public/posthog-page-tracker";

/**
 * Wholesale layout exists primarily to install the PostHog page tracker
 * on `/wholesale` and `/wholesale/register` — these routes sit outside
 * the `(public)` route group (which has its own layout/tracker) but
 * still need pageview + attribution capture, especially for landing
 * traffic from QR codes, ads, and outbound campaigns.
 *
 * Note: PublicHeader / PublicFooter are still rendered inside each
 * wholesale page (not here) because the success-screen branch in
 * `/wholesale/register` renders its own variant. Keeping the layout
 * minimal avoids double-wrapping.
 */
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
