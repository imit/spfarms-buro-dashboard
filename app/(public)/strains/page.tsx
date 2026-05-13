"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, FileTextIcon, LeafIcon, SparklesIcon } from "lucide-react";
import {
  apiClient,
  CATEGORY_LABELS,
  type Product,
  type Strain,
  type StrainCategory,
} from "@/lib/api";
import { MetaText, SectionLabel } from "@/components/public/style";
import { cn } from "@/lib/utils";

/**
 * /strains — public strain library, sourced from flower **products**.
 *
 * We render products (`product_type === "flower"`) one card per row, since
 * the product photography is more uniform/branded than raw bud shots stored
 * on the strain record. For each product we join its `strain_id` against the
 * full strain list so the card can still surface strain-flavored info:
 * category pill, dominant terpenes, effects/smell chips, and — most usefully —
 * the linked COA PDF on the strain's current_coa.
 *
 * Card link target:
 *   • If the product has a linked strain → /strains/{strainSlug} (rich detail).
 *   • Otherwise the card stays static (we still render it but without
 *     navigation); products without a strain are rare and don't have a public
 *     detail page yet.
 */
export default function StrainsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [strainsById, setStrainsById] = useState<Map<number, Strain>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [prods, strains] = await Promise.all([
          apiClient.getPublicProducts(),
          apiClient.getPublicStrains(),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setStrainsById(new Map(strains.map((s) => [s.id, s])));
      } catch {
        // empty-state below covers the failure
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const flowerProducts = useMemo(() => {
    return products
      .filter((p) => p.product_type === "flower")
      .filter((p) => pickProductImage(p))
      .sort((a, b) => {
        // best-sellers + new drops bubble to the top, otherwise the admin's
        // `position` ordering (already applied server-side) is preserved.
        const aTop = (a.best_seller ? 1 : 0) + (a.new_drop ? 1 : 0);
        const bTop = (b.best_seller ? 1 : 0) + (b.new_drop ? 1 : 0);
        if (aTop !== bTop) return bTop - aTop;
        return a.name.localeCompare(b.name);
      });
  }, [products]);

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
            Every product in our library is hand-selected and indoor-grown in living soil
            in the Catskill Mountains. Browse the lineup below — open any card for the
            full profile, or grab the lab report straight from this page.
          </p>
        </div>

        {isLoading ? (
          <StrainListSkeleton />
        ) : flowerProducts.length === 0 ? (
          <div className="rounded-[28px] bg-sf-cream-soft p-10 text-center">
            <LeafIcon
              className="mx-auto mb-3 size-6 text-sf-forest-deep/40"
              strokeWidth={2}
            />
            <p className="text-base text-sf-forest-deep/60">
              No products available right now — check back soon.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {flowerProducts.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  strain={product.strain_id ? strainsById.get(product.strain_id) ?? null : null}
                />
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

const CATEGORY_PILL: Record<StrainCategory | "default", string> = {
  indica: "bg-indigo-100 text-indigo-900",
  sativa: "bg-amber-100 text-amber-900",
  hybrid: "bg-rose-100 text-rose-900",
  default: "bg-sf-cream-deep text-sf-forest-deep",
};

function ProductCard({ product, strain }: { product: Product; strain: Strain | null }) {
  const detailHref = strain?.slug ? `/strains/${strain.slug}` : null;

  const image = pickProductImage(product);
  const categoryKey: StrainCategory | "default" =
    (strain?.category as StrainCategory | undefined) ?? "default";
  const categoryLabel = strain?.category ? CATEGORY_LABELS[strain.category] : null;

  // Cannabinoids — prefer the product's explicit values, fall back to the
  // strain row, then to the strain's current COA. All three are admin-set
  // free strings ("26.5%", "26.5", "TBD") so formatPercent handles them.
  const thcDisplay =
    formatPercent(product.thc_content) ??
    formatPercent(strain?.total_thc ?? strain?.current_coa?.thc_percent ?? null) ??
    strain?.thc_range ??
    null;
  const cbdDisplay =
    formatPercent(product.cbd_content) ??
    formatPercent(strain?.cbd ?? strain?.current_coa?.cbd_percent ?? null);
  const cbgDisplay = formatPercent(strain?.cbg ?? null);
  const totalTerpenesDisplay = formatPercent(
    strain?.total_terpenes ?? strain?.current_coa?.total_terpenes_percent ?? null,
  );

  const description = (product.description ?? strain?.description ?? strain?.notes ?? "").trim();

  const dominantTerpenes = (strain?.dominant_terpenes ?? "")
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const effectTags = (strain?.effect_tags ?? []).slice(0, 5);
  const smellTags = (strain?.smell_tags ?? []).slice(0, 5);

  const coaPdf = strain?.current_coa?.pdf_url ?? null;

  const titleWordmark = strain?.title_image_url ?? product.strain_title_image_url ?? null;
  const displayName = strain?.name ?? product.strain_name ?? product.name;

  // Typed `Link.href` can't accept `string | undefined`, so we branch on whether
  // we have a strain detail page to link to. The two branches share inner JSX.
  const wrapperClass = cn(
    "group relative block overflow-hidden rounded-[28px] bg-sf-cream-soft transition-shadow",
    detailHref && "hover:shadow-[0_8px_30px_-12px_rgba(38,37,30,0.18)]",
  );

  const inner = (
    <article className="grid grid-cols-1 gap-0 md:grid-cols-[minmax(260px,1fr)_1.4fr] lg:grid-cols-[minmax(320px,1fr)_1.6fr]">
        {/* IMAGE rail — clean white plinth, no glow */}
        <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-white md:aspect-auto md:min-h-[340px]">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-[78%] w-[78%] object-contain transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}

          {/* Top-left status badges over the image */}
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-1.5">
            {product.new_drop && <ImageBadge tone="lime">New drop</ImageBadge>}
            {product.best_seller && <ImageBadge tone="orange">Best seller</ImageBadge>}
            {product.coming_soon && <ImageBadge tone="cream">Coming soon</ImageBadge>}
          </div>
        </div>

        {/* CONTENT rail */}
        <div className="flex flex-col gap-4 p-6 md:p-8">
          {/* Top row: category pill + product code + arrow */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categoryLabel && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    CATEGORY_PILL[categoryKey],
                  )}
                >
                  {categoryLabel}
                </span>
              )}
              {(product.product_uid || strain?.code) && (
                <MetaText size="xs" className="text-sf-forest-deep/50">
                  {product.product_uid ?? strain?.code}
                </MetaText>
              )}
            </div>
            {detailHref && (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sf-forest-deep/10 text-sf-forest-deep/50 transition-all group-hover:border-sf-forest-deep group-hover:bg-sf-forest-deep group-hover:text-sf-cream">
                <ArrowUpRightIcon className="size-4" strokeWidth={2.25} />
              </div>
            )}
          </div>

          {/* Title block */}
          <div className="flex flex-col gap-1.5">
            {titleWordmark ? (
              // Wordmark images often ship on a transparent background. The
              // cream-soft card sits behind them — if a particular asset has a
              // baked-in white plate it'll be visible, but we leave that to the
              // admin to fix at the source rather than blend-mode hacking here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={titleWordmark}
                alt={displayName}
                className="h-12 w-auto object-contain object-left md:h-14"
              />
            ) : (
              <h2 className="text-3xl font-black leading-[1.05] tracking-tight text-sf-forest-deep md:text-[40px]">
                {displayName}
              </h2>
            )}
            <MetaText size="xs" className="text-sf-forest-deep/55">
              {product.name}
              {product.unit_weight ? ` · ${product.unit_weight}${product.unit_weight_uom ?? ""}` : ""}
            </MetaText>
          </div>

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
            {detailHref ? (
              <span className="inline-flex items-center gap-2 rounded-md bg-sf-forest-deep px-4 py-2 text-sf-lime transition-colors group-hover:bg-sf-forest">
                <MetaText size="xs" className="text-sf-lime">
                  View strain
                </MetaText>
                <ArrowUpRightIcon className="size-3.5" strokeWidth={2.5} />
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md bg-sf-cream-deep/40 px-4 py-2">
                <SparklesIcon className="size-3.5 text-sf-forest-deep/50" strokeWidth={2.25} />
                <MetaText size="xs" className="text-sf-forest-deep/55">
                  Coming soon
                </MetaText>
              </span>
            )}

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
            ) : product.has_current_coa ? (
              <MetaText size="xs" className="text-sf-forest-deep/55">
                Lab report on the strain page
              </MetaText>
            ) : (
              <MetaText size="xs" className="text-sf-forest-deep/40">
                Lab report coming soon
              </MetaText>
            )}
          </div>
        </div>
      </article>
  );

  return detailHref ? (
    <Link href={detailHref} className={wrapperClass}>
      {inner}
    </Link>
  ) : (
    <div className={wrapperClass}>{inner}</div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small bits                                                                 */
/* -------------------------------------------------------------------------- */

function ImageBadge({
  tone,
  children,
}: {
  tone: "lime" | "orange" | "cream";
  children: React.ReactNode;
}) {
  const palette =
    tone === "lime"
      ? "bg-sf-lime text-sf-forest-deep"
      : tone === "orange"
        ? "bg-sf-orange text-sf-cream"
        : "bg-sf-cream text-sf-forest-deep border border-sf-cream-deep";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        palette,
      )}
    >
      {children}
    </span>
  );
}

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
          className="grid grid-cols-1 gap-0 overflow-hidden rounded-[28px] bg-sf-cream-soft md:grid-cols-[minmax(260px,1fr)_1.4fr] lg:grid-cols-[minmax(320px,1fr)_1.6fr]"
        >
          <div className="aspect-4/3 animate-pulse bg-white/80 md:aspect-auto md:min-h-[340px]" />
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
 * Pick the most-flattering image URL on a product. Preference order:
 *   1. First promotional image — admin-curated hero shot
 *   2. full_image_url — the primary attachment
 *   3. First entry in `image_urls`
 *   4. thumbnail_url — smaller fallback
 */
function pickProductImage(product: Product): string | null {
  const promo = product.promotional_image_urls?.[0]?.url;
  if (promo) return promo;
  if (product.full_image_url) return product.full_image_url;
  const first = product.image_urls?.[0]?.url;
  if (first) return first;
  return product.thumbnail_url ?? null;
}

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
