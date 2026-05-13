import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://spfarmsny.com";

/**
 * /sitemap.xml
 *
 * Lists the public marketing routes. Per-account storefronts (`/[slug]/*`)
 * are intentionally excluded — they require auth and shouldn't be crawled.
 *
 * If you add a new public landing route, add it here too. For dynamic
 * routes (blog posts, strain detail pages) this should be expanded to
 * fetch slugs from the API at build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/strains", changeFrequency: "weekly", priority: 0.8 },
    { path: "/find-us", changeFrequency: "weekly", priority: 0.8 },
    { path: "/wholesale", changeFrequency: "monthly", priority: 0.9 },
    { path: "/wholesale/register", changeFrequency: "yearly", priority: 0.6 },
    { path: "/bulk", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
