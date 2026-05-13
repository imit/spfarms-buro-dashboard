"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, FileTextIcon, LeafIcon } from "lucide-react";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";
import { MetaText, SectionLabel } from "@/components/public/style";
import { cn } from "@/lib/utils";

/**
 * /strains — public strain library.
 *
 * Layout: a vertical list of full-width cards, one strain per row. We render
 * every strain that has a primary image (`image_url`); admins toggle visibility
 * by attaching an image in /admin/strains. Each card surfaces:
 *
 *   • product image (or title wordmark fallback)
 *   • category pill (indica / sativa / hybrid)
 *   • short description
 *   • lab metrics — THC% (preferring `total_thc`, else current COA, else `thc_range`),
 *     CBG, CBD, total terpenes
 *   • smell + effect tag chips
 *   • dominant terpenes
 *   • two CTAs:
 *       → "View strain"   — links to /strains/{slug}
 *       → "Lab report"    — links to the current COA's PDF when present
 *
 * The whole card is a wrapping <Link> to the detail page; the COA action is a
 * nested <a> that stops propagation so PDF clicks don't double-navigate.
 */
export default function StrainsPage() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // All public strains — not just the curated "On Website" subset — so
        // visitors can browse the full library. We still gate on `image_url`
        // because cards without artwork look broken.
        const data = await apiClient.getPublicStrains();
        const withImages = data
          .filter((s) => s.image_url)
          .sort((a, b) => a.name.localeCompare(b.name));
        setStrains(withImages);
      } catch {
        // Silent fail — empty-state below handles it.
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-10 max-w-3xl md:mb-14">
          <SectionLabel className="font-mono text-xs text-sf-forest-deep">
            our strains
          </SectionLabel>
          <h1 className="mt-2 text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep md:text-[56px]">
            Small-batch flower,
            <br />
            <span className="italic">grown with care.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-sf-forest-deep/70 md:text-lg">
            Every strain in our library is hand-selected and indoor-grown in living soil
            in the Catskill Mountains. Browse the lineup below — open any card for the
            full profile, or grab the lab report straight from this page.
          </p>
        </div>

        {isLoading ? (
          <StrainListSkeleton />
        ) : strains.length === 0 ? (
          <div className="rounded-[28px] bg-sf-cream-soft p-10 text-center">
            <LeafIcon
              className="mx-auto mb-3 size-6 text-sf-forest-deep/40"
              strokeWidth={2}
            />
            <p className="text-base text-sf-forest-deep/60">
              No strains available right now — check back soon.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {strains.map((strain) => (
              <li key={strain.id}>
                <StrainCard strain={strain} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

const CATEGORY_PILL: Record<string, string> = {
  indica: "bg-indigo-100 text-indigo-900",
  sativa: "bg-amber-100 text-amber-900",
  hybrid: "bg-rose-100 text-rose-900",
};

function StrainCard({ strain }: { strain: Strain }) {
  const detailHref = `/strains/${strain.slug || strain.id}`;
  const categoryKey = strain.category ?? "";
  const categoryLabel = strain.category ? CATEGORY_LABELS[strain.category] : null;

  // THC % — prefer the explicit `total_thc` admin field, then the current COA,
  // then the looser `thc_range` text. All three are user-set so they can be in
  // wildly different formats; we let the raw string through after a parseFloat
  // (giving us e.g. "26.5%" from a "26.5" stored value).
  const thcRaw = strain.total_thc ?? strain.current_coa?.thc_percent ?? null;
  const thcDisplay = formatPercent(thcRaw) ?? strain.thc_range ?? null;

  const cbgDisplay = formatPercent(strain.cbg);
  const cbdDisplay = formatPercent(strain.cbd ?? strain.current_coa?.cbd_percent ?? null);
  const totalTerpenesDisplay = formatPercent(
    strain.total_terpenes ?? strain.current_coa?.total_terpenes_percent ?? null,
  );

  const description = (strain.description ?? strain.notes ?? "").trim();
  const dominantTerpenes = (strain.dominant_terpenes ?? "")
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const effectTags = (strain.effect_tags ?? []).slice(0, 5);
  const smellTags = (strain.smell_tags ?? []).slice(0, 5);

  const coaPdf = strain.current_coa?.pdf_url ?? null;

  return (
    <Link
      href={detailHref}
      className="group block overflow-hidden rounded-[28px] bg-sf-cream-soft transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(38,37,30,0.18)]"
    >
      <article className="grid grid-cols-1 gap-0 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        {/* IMAGE rail */}
        <div className="relative flex items-center justify-center bg-white p-6 md:p-8">
          {/* Pillowed soft glow behind the image */}
          <div
            aria-hidden="true"
            className="absolute inset-6 rounded-full bg-sf-cream-soft opacity-60 blur-2xl md:inset-10"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={strain.image_url!}
            alt={strain.name}
            className="relative z-1 h-[200px] w-auto object-contain drop-shadow-[0_8px_20px_rgba(38,37,30,0.18)] transition-transform duration-500 group-hover:scale-[1.04] md:h-[240px]"
          />
        </div>

        {/* CONTENT rail */}
        <div className="flex flex-col gap-4 p-6 md:p-8">
          {/* Top row: category pill + arrow */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categoryLabel && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    CATEGORY_PILL[categoryKey] ?? "bg-sf-cream-deep text-sf-forest-deep",
                  )}
                >
                  {categoryLabel}
                </span>
              )}
              {strain.code && (
                <MetaText size="xs" className="text-sf-forest-deep/50">
                  {strain.code}
                </MetaText>
              )}
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sf-forest-deep/10 text-sf-forest-deep/50 transition-all group-hover:border-sf-forest-deep group-hover:bg-sf-forest-deep group-hover:text-sf-cream">
              <ArrowUpRightIcon className="size-4" strokeWidth={2.25} />
            </div>
          </div>

          {/* Name / wordmark */}
          {strain.title_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={strain.title_image_url}
              alt={strain.name}
              className="h-12 w-auto object-contain object-left md:h-16"
            />
          ) : (
            <h2 className="text-3xl font-black leading-[1.05] tracking-tight text-sf-forest-deep md:text-[40px]">
              {strain.name}
            </h2>
          )}

          {/* Description */}
          {description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-sf-forest-deep/70 md:text-base">
              {description}
            </p>
          )}

          {/* Stats row */}
          {(thcDisplay || cbgDisplay || cbdDisplay || totalTerpenesDisplay) && (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-sf-cream-deep pt-4">
              {thcDisplay && <Stat label="THC" value={thcDisplay} accent />}
              {cbgDisplay && <Stat label="CBG" value={cbgDisplay} />}
              {cbdDisplay && <Stat label="CBD" value={cbdDisplay} />}
              {totalTerpenesDisplay && (
                <Stat label="Terpenes" value={totalTerpenesDisplay} />
              )}
            </dl>
          )}

          {/* Terpenes / effect / smell tag rows */}
          {(dominantTerpenes.length > 0 ||
            effectTags.length > 0 ||
            smellTags.length > 0) && (
            <div className="flex flex-col gap-2.5">
              {dominantTerpenes.length > 0 && (
                <TagRow label="Dominant terpenes" items={dominantTerpenes} variant="terpene" />
              )}
              {effectTags.length > 0 && (
                <TagRow label="Effects" items={effectTags} variant="effect" />
              )}
              {smellTags.length > 0 && (
                <TagRow label="Smell" items={smellTags} variant="smell" />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-sf-cream-deep pt-4">
            <span className="inline-flex items-center gap-2 rounded-md bg-sf-forest-deep px-4 py-2 text-sf-lime transition-colors group-hover:bg-sf-forest">
              <MetaText size="xs" className="text-sf-lime">
                View strain
              </MetaText>
              <ArrowUpRightIcon className="size-3.5" strokeWidth={2.5} />
            </span>

            {coaPdf ? (
              <a
                href={coaPdf}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 rounded-md border border-sf-forest-deep/15 bg-sf-cream px-4 py-2 transition-colors hover:bg-sf-cream-deep/40"
              >
                <FileTextIcon className="size-3.5 text-sf-forest-deep" strokeWidth={2.25} />
                <MetaText size="xs" className="text-sf-forest-deep">
                  Lab report (PDF)
                </MetaText>
              </a>
            ) : (
              <MetaText size="xs" className="text-sf-forest-deep/40">
                Lab report coming soon
              </MetaText>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small bits                                                                 */
/* -------------------------------------------------------------------------- */

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <MetaText size="xs" className="text-sf-forest-deep/50">
        {label}
      </MetaText>
      <dd
        className={cn(
          "mt-0.5 text-xl font-bold tabular-nums tracking-tight",
          accent ? "text-sf-forest-deep" : "text-sf-forest-deep/85",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function TagRow({
  label,
  items,
  variant,
}: {
  label: string;
  items: string[];
  variant: "terpene" | "effect" | "smell";
}) {
  const tone =
    variant === "terpene"
      ? "bg-sf-lime/40 text-sf-forest-deep"
      : variant === "effect"
        ? "bg-sf-sky/50 text-sf-forest-deep"
        : "bg-sf-orange/15 text-sf-forest-deep";

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <MetaText size="xs" className="shrink-0 text-sf-forest-deep/55">
        {label}
      </MetaText>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              tone,
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function StrainListSkeleton() {
  return (
    <ul className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="grid grid-cols-1 gap-0 overflow-hidden rounded-[28px] bg-sf-cream-soft md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]"
        >
          <div className="h-48 animate-pulse bg-white/80 md:h-auto" />
          <div className="space-y-3 p-6 md:p-8">
            <div className="h-4 w-24 animate-pulse rounded bg-sf-cream-deep" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-sf-cream-deep" />
            <div className="h-4 w-full animate-pulse rounded bg-sf-cream-deep" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-sf-cream-deep" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Best-effort percent formatter. Admin/COA values arrive as free strings
 * ("26.5", "26.5%", "≈26", "TBD") — we only render when parseFloat finds a
 * real number, otherwise return null so the caller can hide the row.
 */
function formatPercent(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return null;
  // Strip trailing zero from values like "26.0" → "26%" but keep "26.5%".
  const formatted = Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(/\.0$/, "");
  return `${formatted}%`;
}
