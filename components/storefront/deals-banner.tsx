"use client";

import { SparklesIcon, TagIcon } from "lucide-react";
import type { CartDiscount } from "@/lib/api";

interface DealsBannerProps {
  discounts: CartDiscount[] | undefined;
  disabled?: boolean;
}

function formatValue(d: CartDiscount): string {
  const n = parseFloat(d.value);
  if (!Number.isFinite(n)) return "";
  return d.discount_type === "percentage" ? `${n}% OFF` : `$${n} OFF`;
}

export function DealsBanner({ discounts, disabled }: DealsBannerProps) {
  if (disabled) return null;
  if (!discounts || discounts.length === 0) return null;

  const label = discounts.length === 1 ? "Active Deal" : "Active Deals";

  return (
    <div className="mb-6">
      {/* Gradient border wrapper */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 p-[2px] shadow-lg shadow-orange-500/30">
        {/* Shimmer sweep — uses the global `shimmer` keyframe in globals.css */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -skew-x-12 motion-reduce:hidden"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
            animation: "shimmer 3.5s ease-in-out infinite",
            width: "40%",
          }}
        />

        <div className="relative rounded-[14px] bg-linear-to-r from-amber-400 via-orange-400 to-rose-400 px-5 py-4 md:px-6 md:py-5">
          <div className="flex items-center gap-4">
            {/* Icon badge */}
            <div className="shrink-0 inline-flex size-12 items-center justify-center rounded-full bg-white/25 ring-2 ring-white/40 backdrop-blur-sm">
              <SparklesIcon
                className="size-6 fill-yellow-100 text-white motion-safe:animate-pulse"
                strokeWidth={2}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white drop-shadow-sm">
                  🎉 {label} just for you
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {discounts.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-white/60"
                    title={d.name}
                  >
                    <TagIcon className="size-3.5 text-rose-600" strokeWidth={2.5} />
                    <span className="max-w-[14rem] truncate">{d.name}</span>
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      {formatValue(d)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
