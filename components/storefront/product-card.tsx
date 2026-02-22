"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCartIcon, FileTextIcon, WeightIcon, ClockIcon, MinusIcon, PlusIcon } from "lucide-react";
import { type Product, type Strain, type CartDiscount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function ProductCard({
  product,
  slug,
  strain,
  discounts,
  onAddToCart,
}: {
  product: Product;
  slug: string;
  strain?: Strain;
  discounts?: CartDiscount[];
  onAddToCart: (productId: number, quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(product.bulk ? 1 : 6);
  const [adding, setAdding] = useState(false);

  // Calculate discounted price from percentage discounts only
  const percentageDiscount = discounts?.find((d) => d.discount_type === "percentage");
  const originalPrice = product.default_price ? parseFloat(product.default_price) : null;
  const discountedPrice =
    percentageDiscount && originalPrice
      ? originalPrice * (1 - parseFloat(percentageDiscount.value) / 100)
      : null;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAddToCart(product.id, quantity);
      setQuantity(product.bulk ? 1 : 6);
    } finally {
      setAdding(false);
    }
  };

  const weightLabel = product.bulk
    ? (product.unit_weight ? `${parseFloat(product.unit_weight)} lbs` : null)
    : formatWeight(product.unit_weight);
  const coaPdfUrl = strain?.current_coa?.pdf_url;

  // Cannabinoid values — prefer strain data, fall back to product fields; hide zeros
  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain?.total_thc) || nonZero(product.thc_content);
  const cbd = nonZero(strain?.cbd) || nonZero(product.cbd_content);
  const cbg = nonZero(strain?.cbg);
  const hasCannabinoids = thc || cbd || cbg;

  const priceDisplay = discountedPrice !== null ? (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground line-through">
        {formatPrice(product.default_price)}
      </span>
      <span className="text-sm sm:text-base font-semibold text-green-600">
        ${discountedPrice.toFixed(2)}
      </span>
      <span className="rounded bg-green-100 px-1 py-px text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {parseFloat(percentageDiscount!.value)}% off
      </span>
    </div>
  ) : (
    <span className="text-sm sm:text-base font-semibold">
      {formatPrice(product.default_price)}
    </span>
  );

  return (
    <div className="group rounded-lg border bg-card p-2 sm:p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Thumbnail */}
        <Link
          href={`/${slug}/storefront/${product.slug}`}
          className="shrink-0"
        >
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
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <Link
            href={`/${slug}/storefront/${product.slug}`}
            className="font-medium leading-tight hover:underline line-clamp-1"
          >
            {product.name}
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
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
              className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <FileTextIcon className="size-3" />
              COA
            </a>
          )}
        </div>

        {/* Desktop: Price + Quantity + Add in row */}
        <div className="hidden sm:flex shrink-0 items-center gap-3">
          {product.coming_soon && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <ClockIcon className="size-3" />
              Coming Soon
            </Badge>
          )}

          <div className="text-right whitespace-nowrap">
            {priceDisplay}
          </div>

          {!product.bulk && (
            <div className="flex items-center rounded-md border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setQuantity(v);
                }}
                className="h-9 w-10 border-x bg-background text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </div>
          )}

          <Button
            size="default"
            variant={product.coming_soon ? "outline" : "default"}
            onClick={handleAdd}
            disabled={adding}
            className="shrink-0 px-4"
          >
            {product.coming_soon ? (
              <>
                <ClockIcon className="mr-1.5 size-4" />
                {adding ? "..." : product.bulk ? "Pre-order" : `Pre-order (${quantity})`}
              </>
            ) : (
              <>
                <ShoppingCartIcon className="mr-1.5 size-4" />
                {adding ? "..." : product.bulk ? "Add" : `Add (${quantity})`}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile bottom row */}
      <div className="flex items-center justify-between mt-2 gap-2 sm:hidden">
        <div className="whitespace-nowrap">
          {priceDisplay}
        </div>

        <div className="flex items-center gap-2">
          {!product.bulk && (
            <div className="flex items-center rounded-md border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <MinusIcon className="size-4" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setQuantity(v);
                }}
                className="h-10 w-10 border-x bg-background text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
          )}

          <Button
            variant={product.coming_soon ? "outline" : "default"}
            onClick={handleAdd}
            disabled={adding}
            className="h-10 px-5 text-sm font-semibold"
          >
            {product.coming_soon ? (
              <>
                <ClockIcon className="mr-1.5 size-4" />
                {adding ? "..." : product.bulk ? "Pre-order" : `Pre-order (${quantity})`}
              </>
            ) : (
              <>
                <ShoppingCartIcon className="mr-1.5 size-4" />
                {adding ? "..." : product.bulk ? "Add" : `Add (${quantity})`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
