import type { Metadata } from "next";

/**
 * /bulk is `"use client"` for the contact form/product picker, so the
 * page-level metadata lives here instead of inline on the page.
 */
export const metadata: Metadata = {
  title: "Bulk Flower — Wholesale Pounds & Pricing",
  description:
    "Bulk-pound SPFarms flower for licensed New York operators. View current strains, pricing tiers, and contact us to place an order.",
  alternates: { canonical: "/bulk" },
  openGraph: {
    title: "Bulk Flower — SPFarms Wholesale Pounds",
    description:
      "Bulk-pound SPFarms flower for licensed New York operators. View current strains and pricing.",
    url: "/bulk",
    type: "website",
  },
};

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
