import Link from "next/link";
import { HeroParallax } from "@/components/public/hero-parallax";
import { StrainShowcase } from "@/components/public/strain-showcase";
import { AsteriskIcon, SparklesIcon, CloverIcon, WavesIcon, ArrowRightIcon } from "lucide-react";

const values = [
  {
    icon: AsteriskIcon,
    color: "text-violet-400",
    title: "Indoor grown",
    description: "Climate-controlled environment for consistent, premium flower year-round.",
  },
  {
    icon: SparklesIcon,
    color: "text-amber-500",
    title: "Living soil",
    description: "Rich, microbial-active soil that feeds the plant naturally from seed to harvest.",
  },
  {
    icon: CloverIcon,
    color: "text-emerald-500",
    title: "Organic",
    description: "No synthetic pesticides or fertilizers. Clean inputs, clean flower.",
  },
  {
    icon: WavesIcon,
    color: "text-sky-400",
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
      <section className="px-6 lg:px-10 py-20 lg:py-28 max-w-8xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Craft
            <br />
            Cannabis,
            <br />
            Done Right.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-14">
            {values.map((item) => (
              <div key={item.title}>
                <item.icon className={`size-8 mb-5 ${item.color}`} strokeWidth={2} />
                <h3 className="text-lg font-bold mb-2">
                  {item.title}
                </h3>
                <p className="text-base text-foreground/60 leading-relaxed max-w-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strains */}
      <StrainShowcase />

      {/* Work With Us */}
      <section className="px-6 lg:px-10 py-20 lg:py-28 max-w-8xl mx-auto">
        <div className="rounded-3xl bg-[#431F13] text-white p-10 md:p-16 lg:p-20">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Carry our flower
              <br />
              in your shop.
            </h2>
            <p className="text-lg leading-relaxed opacity-70 mb-10 max-w-lg">
              We partner with licensed dispensaries across New York. Register as a wholesale
              partner to access pricing, place orders, and get craft cannabis delivered
              directly to your store.
            </p>
            <Link
              href="/wholesale/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#431F13] px-8 py-4 text-base font-semibold hover:bg-white/90 transition-colors"
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
