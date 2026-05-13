import type { Metadata } from "next";

/**
 * Per-page metadata override for `/wholesale/register`. The register
 * page itself is `"use client"` so it can't export `metadata` directly —
 * this layout is the closest place to attach the right title/OG.
 *
 * This is the URL printed on the wholesale flyer QR code; treat its
 * social share appearance accordingly.
 */
export const metadata: Metadata = {
  title: "Wholesale Application — SPFarms",
  description:
    "Apply to carry SPFarms craft cannabis at your New York dispensary. Tell us about your shop — we review every application within 1–2 business days.",
  alternates: { canonical: "/wholesale/register" },
  openGraph: {
    title: "Apply to Wholesale — SPFarms",
    description:
      "Apply to carry SPFarms craft cannabis at your New York dispensary. Tell us about your shop — we review every application within 1–2 business days.",
    url: "/wholesale/register",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apply to Wholesale — SPFarms",
    description:
      "Apply to carry SPFarms craft cannabis at your New York dispensary. Tell us about your shop — we review every application within 1–2 business days.",
  },
};

export default function WholesaleRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
