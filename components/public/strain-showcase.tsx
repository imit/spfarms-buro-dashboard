"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";
import { FlowerShape, MetaText } from "./style";
import { cn } from "@/lib/utils";

/**
 * Browse-our-strains horizontal-scrollable gallery (cream aesthetic).
 *
 * Each card stacks:
 *   1. Pill chip with category (Hybrid / Sativa / Indica) — top-left
 *   2. Orange 5-petal "flower" silhouette
 *   3. Strain name in deep forest, drawn over the flower
 *   4. Mono THC/CBG line at the bottom
 *
 * Layout uses a CSS-snap horizontal scroller on small screens and a 4-up grid
 * on desktop, matching the sketch where you can peek into the next card.
 */
export function StrainShowcase() {
  const [strains, setStrains] = useState<Strain[]>([]);

  useEffect(() => {
    apiClient
      .getPublicStrains({ featured: true })
      .then((data) => setStrains(data.filter((s) => s.active)))
      .catch(() => {});
  }, []);

  if (strains.length === 0) return null;

  return (
    <section className="py-12 md:py-20">
      {/* Header row */}
      <div className="mx-auto flex max-w-[1400px] items-baseline justify-between px-5 pb-6 md:px-8 md:pb-10">
        <h2 className="text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep">
          browse our strains
        </h2>
        <Link
          href="/strains"
          className="font-bold text-sf-forest hover:text-sf-forest-deep transition-colors"
        >
          See all
        </Link>
      </div>

      {/* Horizontal scroller */}
      <div className="overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex max-w-[1400px] gap-4 px-5 md:px-8">
          {strains.map((strain) => (
            <StrainCard key={strain.id} strain={strain} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StrainCard({ strain }: { strain: Strain }) {
  const thc = strain.total_thc || strain.current_coa?.thc_percent;
  const cbg = strain.cbg;
  const category = strain.category ? CATEGORY_LABELS[strain.category] : null;

  return (
    <Link
      href={`/strains/${strain.slug || strain.id}`}
      className="group relative flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] bg-sf-cream-soft transition-shadow hover:shadow-md md:w-[300px]"
    >
      {/* Top: category chip */}
      <div className="flex items-center justify-between px-4 pt-4">
        {category && (
          <span className="rounded-full bg-sf-cream px-3 py-1 text-xs font-semibold text-sf-forest-deep">
            {category}
          </span>
        )}
      </div>

      {/* Flower-mask + image + name overlay */}
      <div className="relative aspect-square">
        <FlowerShape color="orange" className="absolute inset-4">
          {strain.image_url ? (
            <img
              src={strain.image_url}
              alt={strain.name}
              className="absolute inset-0 m-auto h-[80%] w-[80%] object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
        </FlowerShape>

        {/* Strain name overlaid across the flower */}
        <h3
          className={cn(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display italic",
            "text-3xl md:text-4xl text-sf-forest-deep px-4 leading-[0.9]",
            "drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]",
          )}
        >
          {strain.name}
        </h3>
      </div>

      {/* Bottom: cannabinoid stats */}
      {(thc || cbg) && (
        <div className="flex items-center gap-4 border-t border-sf-cream-deep/60 px-4 py-3">
          {thc && (
            <MetaText size="xs" className="tracking-widest! text-sf-forest-deep/70">
              THC{" "}
              <span className="font-semibold text-sf-forest-deep">
                {parseFloat(thc).toFixed(0)}%
              </span>
            </MetaText>
          )}
          {cbg && (
            <MetaText size="xs" className="tracking-widest! text-sf-forest-deep/70">
              CBG{" "}
              <span className="font-semibold text-sf-forest-deep">
                {parseFloat(cbg).toFixed(0)}%
              </span>
            </MetaText>
          )}
        </div>
      )}
    </Link>
  );
}
