"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { captureAttribution } from "@/lib/posthog-attribution";

export function PostHogPageTracker({ section }: { section: "public" | "storefront" | "admin" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Refresh attribution super-properties before firing the pageview so
    // every $pageview (and every later event) carries the UTM/referrer/
    // landing context — first-touch is locked on the initial call, last-
    // touch updates on each navigation.
    captureAttribution();

    const url = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
    posthog.capture("$pageview", {
      $current_url: url,
      section,
      page_path: pathname,
    });
  }, [pathname, searchParams, section]);

  return null;
}
