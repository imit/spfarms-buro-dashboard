"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cycles through a list of (transparent) images, swapping every `intervalMs`.
 * No transition, instant swap, loops forever.
 *
 * All slides are rendered stacked and toggled via opacity so the browser
 * keeps them decoded — the swap is flicker-free even on slow networks.
 *
 * Designed to be dropped inside a `relative` parent with `position: absolute`
 * filling its bounds (e.g. on top of a card image).
 */
export function SlideshowOverlay({
  slides,
  intervalMs = 1000,
  className,
  sizes,
}: {
  slides: ReadonlyArray<string>;
  intervalMs?: number;
  className?: string;
  sizes?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      {slides.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes={sizes}
          className={cn(
            "object-cover",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
