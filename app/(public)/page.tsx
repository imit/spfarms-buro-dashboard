import Link from "next/link";
import { HeroParallax } from "@/components/public/hero-parallax";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroParallax />

      {/* Values */}
      <section className="px-6 lg:px-10 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-semibold mb-3">Small-Batch Quality</h3>
            <p className="text-foreground/70">
              Every plant gets individual attention. We grow in small batches to ensure
              consistent quality and potency in every harvest.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Lab Tested</h3>
            <p className="text-foreground/70">
              All products are rigorously tested for potency, terpenes, and safety.
              Full COAs available for every batch.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Catskill Grown</h3>
            <p className="text-foreground/70">
              Rooted in the Catskill Mountains of New York. Licensed micro-cultivator
              committed to sustainable growing practices.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
