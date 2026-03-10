"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

export function PostHogPageTracker({ section }: { section: "public" | "storefront" | "admin" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
    posthog.capture("$pageview", {
      $current_url: url,
      section,
      page_path: pathname,
    });
  }, [pathname, searchParams, section]);

  return null;
}
