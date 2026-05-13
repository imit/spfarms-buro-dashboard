import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://spfarmsny.com";

/**
 * /robots.txt
 *
 * Allow crawlers on the public marketing surface (`/`, `/about`, `/blog`,
 * `/wholesale*`, `/find-us`, `/strains`, `/contact`, `/bulk`). Disallow
 * everything else — the admin app, internal tooling, auth flows, signed
 * agreement URLs, dispensary storefronts (per-account, no SEO value),
 * and the JSON API surface.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/agreements/",
          "/m/",
          "/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
