import Link from "next/link";
import { HeroParallax } from "@/components/public/hero-parallax";
import { StrainShowcase } from "@/components/public/strain-showcase";
import { ArrowRightIcon } from "lucide-react";

const values = [
  {
    key: "01",
    title: "Indoor grown",
    description: "Climate-controlled environment for consistent, premium flower year-round.",
  },
  {
    key: "02",
    title: "Living soil",
    description: "Rich, microbial-active soil that feeds the plant naturally from seed to harvest.",
  },
  {
    key: "03",
    title: "Organic inputs",
    description: "No synthetic pesticides or fertilizers. Clean inputs, clean flower.",
  },
  {
    key: "04",
    title: "Terpene rich",
    description: "Slow cured to preserve the full terpene profile. Flavor and aroma you can taste.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroParallax />

      {/* Values */}
      <section className="px-6 lg:px-10 py-20 lg:py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">
          <div>
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 block mb-4">
              How we grow
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Craft
              <br />
              Cannabis,
              <br />
              Done Right.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            {values.map((item) => (
              <div key={item.key} className="group">
                <span className="font-mono text-xs text-foreground/25 block mb-3">
                  {item.key}
                </span>
                <h3 className="text-lg font-bold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground/50 leading-relaxed max-w-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <hr className="border-foreground/6" />
      </div>

      {/* Strains */}
      <StrainShowcase />

      {/* Work With Us */}
      <section className="px-6 lg:px-10 py-20 lg:py-28 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#431F13] text-white p-10 md:p-16 lg:p-20 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative max-w-2xl">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-white/30 block mb-5">
              Partnerships
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Carry our flower
              <br />
              in your shop.
            </h2>
            <p className="text-base leading-relaxed text-white/50 mb-10 max-w-lg">
              We partner with licensed dispensaries across New York. Register as a wholesale
              partner to access pricing, place orders, and get craft cannabis delivered
              directly to your store.
            </p>
            <Link
              href="/wholesale/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#431F13] px-8 py-4 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Become a partner
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
