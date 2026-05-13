import { AsteriskIcon, SparklesIcon, CloverIcon, WavesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MetaText, SectionLabel, FlowerShape, Marquee } from "@/components/public/style";

/**
 * Public /about page.
 *
 * Visual system matches the rest of the public site:
 *   - sf-cream / sf-forest-deep base palette
 *   - mono eyebrows via <SectionLabel> / <MetaText>
 *   - italic display word for headline emphasis (like the homepage)
 *   - <FlowerShape> decorative blob next to the intro lockup
 *   - lime <Marquee> separator strip
 *   - lime CTA band at the bottom, mirroring <NewsletterBand>
 *
 * Body copy is unchanged from the previous draft (verbatim) except every
 * em-dash has been removed and replaced with a comma, period, or parens
 * so the prose still reads cleanly.
 */
export default function AboutPage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionLabel className="text-sf-forest-deep/70">about spfarms</SectionLabel>
          <h1 className="mt-3 text-[56px] font-bold leading-[1.02] tracking-tight text-sf-forest-deep md:text-[88px]">
            Small farm,
            <br />
            <span className="italic font-bold">big flower.</span>
          </h1>
        </div>
      </section>

      {/* ---------- Intro lockup: flower + paragraphs ---------- */}
      <section className="px-5 pb-12 md:px-8 md:pb-20">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-10 md:grid-cols-[1fr_1.25fr] md:gap-16">
          {/* Decorative flower with a small caption */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <FlowerShape color="orange" className="aspect-square w-full">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <MetaText size="md" className="text-sf-cream/80">
                  Indoor · Living soil
                </MetaText>
                <p className="text-3xl font-bold italic text-sf-cream md:text-4xl">
                  Catskills,
                  <br />
                  New York.
                </p>
              </div>
            </FlowerShape>
            {/* Soft sky disc behind the flower for depth */}
            <div
              className="absolute -left-6 -top-6 -z-10 size-32 rounded-full bg-sf-sky/40 blur-2xl md:size-44"
              aria-hidden
            />
          </div>

          {/* Three paragraphs */}
          <div className="space-y-6 text-lg leading-relaxed text-sf-forest-deep/85 md:text-xl md:leading-[1.55]">
            <p>
              SPFarms is a licensed micro cannabis cultivator nestled in the Catskill Mountains of
              New York. We grow small-batch, craft cannabis with one goal: produce the cleanest,
              most flavorful flower possible.
            </p>
            <p>
              Every plant is grown indoors in biologically active living soil. No synthetic
              pesticides, no shortcuts. Our controlled environment lets us dial in light,
              temperature, and humidity so each harvest is consistent and terpene-rich.
            </p>
            <p>
              We slow cure every batch to preserve the full spectrum of cannabinoids and terpenes,
              then lab test for potency and safety before anything leaves the farm. The result is
              flower that smells, tastes, and hits the way it should.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Marquee separator ---------- */}
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

      {/* ---------- How we grow ---------- */}
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 md:mb-14">
            <SectionLabel className="text-sf-forest-deep/70">our practice</SectionLabel>
            <h2 className="mt-3 text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep">
              How we <span className="italic font-bold">grow.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GrowCard
              tone="sky"
              icon={<AsteriskIcon className="size-6" strokeWidth={2.25} />}
              eyebrow="01 · Environment"
              title="Indoor grown"
              body="Climate-controlled from seed to harvest. We manage every variable (light cycles, VPD, CO2) so the plant can focus on producing resin, not fighting stress."
            />
            <GrowCard
              tone="orange"
              icon={<SparklesIcon className="size-6" strokeWidth={2.25} />}
              eyebrow="02 · Soil"
              title="Living soil"
              body="Our soil is alive with beneficial microbes, fungi, and nutrients that feed the plant naturally. The result is deeper terpene profiles and more complex flower."
            />
            <GrowCard
              tone="lime"
              icon={<CloverIcon className="size-6" strokeWidth={2.25} />}
              eyebrow="03 · Inputs"
              title="Organic practices"
              body="No synthetic fertilizers, no chemical pesticides. We use companion planting, beneficial insects, and organic amendments to keep the garden healthy."
            />
            <GrowCard
              tone="cream"
              icon={<WavesIcon className="size-6" strokeWidth={2.25} />}
              eyebrow="04 · Cure"
              title="Slow cured"
              body="We hang-dry and slow cure for weeks, never rush-dried. This preserves terpenes and delivers a smooth, flavorful smoke every time."
            />
          </div>
        </div>
      </section>

      {/* ---------- Mission band (lime, mirrors NewsletterBand) ---------- */}
      <section className="bg-sf-lime text-sf-forest-deep">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-16 md:grid-cols-[1fr_1fr] md:px-8 md:py-24">
          <div>
            <SectionLabel className="text-sf-forest-deep/70">our mission</SectionLabel>
            <h2 className="mt-3 text-[42px] font-bold leading-[1.05] tracking-tight">
              Small farms,
              <br />
              <span className="italic font-bold">that care.</span>
            </h2>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-lg leading-relaxed text-sf-forest-deep/85 md:text-xl">
              We believe the best cannabis comes from small farms that care. Our mission is to
              produce exceptional flower while supporting the local economy and building lasting
              relationships with dispensary partners across New York State.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 rounded-md bg-sf-forest-deep px-6 py-3.5 text-sf-lime transition-colors hover:bg-sf-forest"
              >
                <MetaText size="md" className="tracking-[0.18em] text-sf-lime">
                  Get in touch
                </MetaText>
                <Image
                  src="/assets/cursor.png"
                  alt=""
                  width={28}
                  height={28}
                  aria-hidden="true"
                  className="size-3 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 md:size-3.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Grow card — one of the four "How we grow" tiles                            */
/* -------------------------------------------------------------------------- */

function GrowCard({
  tone,
  icon,
  eyebrow,
  title,
  body,
}: {
  tone: "sky" | "orange" | "lime" | "cream";
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}) {
  // Icon chip color per tone — picks the readable foreground/background pair.
  const chip = {
    sky: "bg-sf-sky text-sf-forest-deep",
    orange: "bg-sf-orange text-sf-cream",
    lime: "bg-sf-lime text-sf-forest-deep",
    cream: "bg-sf-cream text-sf-forest-deep",
  }[tone];

  return (
    <div className="group flex flex-col gap-5 rounded-[28px] bg-sf-cream-soft p-6 transition-colors hover:bg-sf-cream-deep/50 md:p-8">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex size-12 items-center justify-center rounded-2xl ${chip}`}
          aria-hidden
        >
          {icon}
        </span>
        <MetaText size="xs" className="text-sf-forest-deep/50">
          {eyebrow}
        </MetaText>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-sf-forest-deep">{title}</h3>
        <p className="mt-2 text-base leading-relaxed text-sf-forest-deep/70">{body}</p>
      </div>
    </div>
  );
}
