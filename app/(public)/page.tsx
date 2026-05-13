import type { Metadata } from "next";
import { HeroCraft } from "@/components/public/hero-craft";
import { Marquee } from "@/components/public/style";
import { DualCallout } from "@/components/public/dual-callout";
import { StrainShowcase } from "@/components/public/strain-showcase";
import { FindUsSection } from "@/components/public/find-us-section";
import { NewsletterBand } from "@/components/public/newsletter-band";

export const metadata: Metadata = {
  // Title intentionally not overridden — falls back to the root layout's
  // default which already reads "SPFarms — Craft Indoor Cannabis from the
  // Catskills". Using a more specific title here would push the brand
  // name out of the visible <title> on most browsers.
  description:
    "SPFarms grows small-batch, living-soil indoor cannabis in the Catskills of New York. Find our flower at dispensaries across the state.",
  alternates: { canonical: "/" },
};

/**
 * Public homepage — composes the new cream/lime design system.
 *
 * Order matches the sketch top-to-bottom:
 *   1. Hero — sky-blue panel, big bud, headline with italic display word
 *   2. Marquee — looping lime ticker of brand values
 *   3. Dual callout — Find dispensaries / Let's be partners
 *   4. Strain showcase — orange flower-shape product cards
 *   5. Find Us — map + zip search + geolocation
 *   6. Newsletter band — full-width lime
 *
 * To swap copy, edit the strings here. To restyle, look in
 * components/public/style — that's where the system lives.
 */
export default function HomePage() {
  return (
    <>
      <HeroCraft />

      <div className="relative z-0 -mt-8 md:-mt-10">
        <Marquee
          variant="lime"
          speed={45}
          items={[
            "Small batch",
            "Living soil",
            "Indoor grow",
            "Born in catskills",
            "Epic flower",
            "Slow cured",
            "Terpene rich",
          ]}
        />
      </div>

      {/* Tagline strip */}
      <div className="mx-auto max-w-[1400px] px-5 py-12 text-center md:px-8 md:py-20">
        <p className="font-mono text-xs text-sf-forest-deep">
          Living soil, caring hands.
        </p>
        <h2 className="mt-4 text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep">
          We grow{" "}
          <span aria-hidden="true">🔥</span> indoor flower
          <br />
          in <span className="italic font-bold">small batches</span>, rooted
          <br />
          in the Catskills of New York.
        </h2>
      </div>

      <DualCallout />

      <StrainShowcase />

      <FindUsSection />

      <NewsletterBand />
    </>
  );
}
