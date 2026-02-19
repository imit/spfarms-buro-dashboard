"use client";

import { FileTextIcon, WeightIcon, UserPlusIcon } from "lucide-react";
import { type Product, type Strain } from "@/lib/api";
import { Button } from "@/components/ui/button";

function formatPrice(price: string | null) {
  if (!price) return "—";
  return `$${parseFloat(price).toFixed(2)}`;
}

const WEIGHT_NAMES: Record<number, string> = {
  3.5: "Eighth",
  7: "Quarter",
  14: "Half",
  28: "Ounce",
};

function formatWeight(weight: string | null) {
  if (!weight) return null;
  const w = parseFloat(weight);
  if (isNaN(w)) return null;
  const commonName = WEIGHT_NAMES[w];
  return commonName ? `${commonName} (${w}g)` : `${w}g`;
}

export function PublicProductCard({
  product,
  strain,
  onRegister,
}: {
  product: Product;
  strain?: Strain;
  onRegister: () => void;
}) {
  const weightLabel = product.bulk
    ? (product.unit_weight ? `${parseFloat(product.unit_weight)} lbs` : null)
    : formatWeight(product.unit_weight);
  const coaPdfUrl = strain?.current_coa?.pdf_url;

  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain?.total_thc) || nonZero(product.thc_content);
  const cbd = nonZero(strain?.cbd) || nonZero(product.cbd_content);
  const cbg = nonZero(strain?.cbg);
  const hasCannabinoids = thc || cbd || cbg;

  return (
    <div className="group flex items-center gap-3 sm:gap-4 rounded-lg border bg-card p-2 sm:p-3 hover:bg-muted/30 transition-colors">
      <div className="shrink-0">
        <div className="relative size-16 sm:size-20 rounded-md bg-muted overflow-hidden">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="size-full flex items-center justify-center text-muted-foreground text-[10px]">
              No image
            </div>
          )}
          {product.bulk && (
            <span className="absolute top-1 left-1 rounded bg-amber-600 px-1 py-px text-[9px] font-semibold text-white flex items-center gap-0.5">
              <WeightIcon className="size-2.5" />
              Bulk
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-medium text-sm leading-tight line-clamp-1">
          {product.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {weightLabel && <span>{weightLabel}</span>}
          {hasCannabinoids && (
            <>
              {thc && <span>THC {thc}%</span>}
              {cbd && <span>CBD {cbd}%</span>}
              {cbg && <span>CBG {cbg}%</span>}
            </>
          )}
        </div>
        {coaPdfUrl && (
          <a
            href={coaPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <FileTextIcon className="size-3" />
            COA
          </a>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2 sm:gap-3">
        <div className="text-sm sm:text-base font-semibold text-right whitespace-nowrap">
          {formatPrice(product.default_price)}
        </div>
        <Button
          size="default"
          variant="outline"
          onClick={onRegister}
          className="shrink-0 px-4"
        >
          <UserPlusIcon className="mr-1.5 size-4" />
          Register to Order
        </Button>
      </div>
    </div>
  );
}
