import type { Metadata } from "next";

/**
 * The /strains page is `"use client"` (interactive filter + grid) so
 * `metadata` lives here instead.
 */
export const metadata: Metadata = {
  title: "Strains — Small-Batch Indoor Cannabis",
  description:
    "Explore the SPFarms strain library — small-batch, indoor, living-soil cannabis grown in the Catskills of New York.",
  alternates: { canonical: "/strains" },
  openGraph: {
    title: "Strains — Small-Batch Indoor Cannabis",
    description:
      "Explore the SPFarms strain library — small-batch, indoor, living-soil cannabis grown in the Catskills of New York.",
    url: "/strains",
    type: "website",
  },
};

export default function StrainsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
