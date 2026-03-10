import { AsteriskIcon, SparklesIcon, CloverIcon, WavesIcon } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-5xl mx-auto">
      {/* Intro */}
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-10">
        Small farm,
        <br />
        big flower.
      </h1>
      <div className="max-w-3xl space-y-6 text-lg leading-relaxed opacity-80 mb-20">
        <p>
          SPFarms is a licensed micro cannabis cultivator nestled in the Catskill Mountains of
          New York. We grow small-batch, craft cannabis with one goal: produce the cleanest,
          most flavorful flower possible.
        </p>
        <p>
          Every plant is grown indoors in biologically active living soil — no synthetic
          pesticides, no shortcuts. Our controlled environment lets us dial in light,
          temperature, and humidity so each harvest is consistent and terpene-rich.
        </p>
        <p>
          We slow cure every batch to preserve the full spectrum of cannabinoids and terpenes,
          then lab test for potency and safety before anything leaves the farm. The result is
          flower that smells, tastes, and hits the way it should.
        </p>
      </div>

      {/* How we grow */}
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">How we grow</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-20">
        <div>
          <AsteriskIcon className="size-7 text-violet-400 mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold mb-2">Indoor grown</h3>
          <p className="text-base opacity-60 leading-relaxed">
            Climate-controlled from seed to harvest. We manage every variable — light cycles,
            VPD, CO2 — so the plant can focus on producing resin, not fighting stress.
          </p>
        </div>
        <div>
          <SparklesIcon className="size-7 text-amber-500 mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold mb-2">Living soil</h3>
          <p className="text-base opacity-60 leading-relaxed">
            Our soil is alive with beneficial microbes, fungi, and nutrients that feed the plant
            naturally. The result is deeper terpene profiles and more complex flower.
          </p>
        </div>
        <div>
          <CloverIcon className="size-7 text-emerald-500 mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold mb-2">Organic practices</h3>
          <p className="text-base opacity-60 leading-relaxed">
            No synthetic fertilizers, no chemical pesticides. We use companion planting,
            beneficial insects, and organic amendments to keep the garden healthy.
          </p>
        </div>
        <div>
          <WavesIcon className="size-7 text-sky-400 mb-4" strokeWidth={2} />
          <h3 className="text-xl font-bold mb-2">Slow cured</h3>
          <p className="text-base opacity-60 leading-relaxed">
            We hang-dry and slow cure for weeks — never rush-dried. This preserves terpenes
            and delivers a smooth, flavorful smoke every time.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="border-t pt-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Our mission</h2>
        <p className="text-lg leading-relaxed opacity-80 max-w-3xl mb-8">
          We believe the best cannabis comes from small farms that care. Our mission is to
          produce exceptional flower while supporting the local economy and building lasting
          relationships with dispensary partners across New York State.
        </p>
        <Link
          href="/contact"
          className="inline-block rounded-xl bg-foreground text-background px-8 py-3.5 text-base font-medium hover:opacity-90 transition-opacity"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
