"use client";

import { cn } from "@/lib/utils";
import { MarqueeGlyph } from "./marquee-glyphs";

/**
 * Looping ticker strip (lime by default).
 * Matches the sketch's "Small batch · Living soil · Indoor grow · Born in catskills · Epic flower" band.
 *
 * Items are duplicated so the -50% translate keeps a seamless loop.
 * Honors prefers-reduced-motion (animation disabled in globals.css).
 *
 * Separators rotate through three brand glyphs (star-flower → compass → landscape).
 *
 *   <Marquee items={["Small batch","Living soil","Indoor grow"]} />
 */
export function Marquee({
  items,
  speed = 40,
  variant = "lime",
  className,
}: {
  items: React.ReactNode[];
  /** Seconds per loop. Higher = slower. */
  speed?: number;
  variant?: "lime" | "forest" | "cream";
  className?: string;
}) {
  const variantClasses = {
    lime: "bg-sf-lime text-sf-forest-deep",
    forest: "bg-sf-forest text-sf-cream",
    cream: "bg-sf-cream-soft text-sf-forest-deep",
  }[variant];

  // Duplicate the list — track translates -50% so the second copy seamlessly takes over.
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden pb-6 pt-12 md:pb-7 md:pt-14",
        variantClasses,
        className,
      )}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="sf-marquee-track flex w-max items-center gap-8 whitespace-nowrap"
        style={{ ["--sf-marquee-duration" as string]: `${speed}s` }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-8 pr-8">
            <span className="font-sans text-sm font-medium not-italic md:text-base">
              {item}
            </span>
            <MarqueeGlyph
              variant={(i % 3) as 0 | 1 | 2}
              className="text-sf-forest-deep/80"
              size={20}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
