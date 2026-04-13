"use client";

import { useState } from "react";
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { type Product, type Strain, type CartDiscount, CATEGORY_LABELS } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  indica: "bg-indigo-400 text-white",
  sativa: "bg-amber-400 text-white",
  hybrid: "bg-rose-400 text-white",
};

function formatPrice(price: string | null) {
  if (!price) return "—";
  const n = parseFloat(price);
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

export function ProductCard({
  product,
  slug,
  strain,
  discounts,
  onAddToCart,
  compact = false,
}: {
  product: Product;
  slug: string;
  strain?: Strain;
  discounts?: CartDiscount[];
  onAddToCart: (productId: number, quantity: number) => Promise<void>;
  compact?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const outOfStock = !product.in_stock;

  const handleAdd = async () => {
    if (outOfStock) return;
    setAdding(true);
    try {
      await onAddToCart(product.id, quantity);
    } finally {
      setAdding(false);
    }
  };

  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain?.total_thc) || nonZero(product.thc_content);
  const cbg = nonZero(strain?.cbg);
  const coaPdfUrl = strain?.current_coa?.pdf_url;

  const weightLabel = product.unit_weight
    ? `${parseFloat(product.unit_weight)}gr`
    : null;

  const packLabel = product.bulk
    ? (product.unit_weight ? `${parseFloat(product.unit_weight)} lbs` : null)
    : weightLabel
      ? `${weightLabel}  pouch`
      : null;

  return (
    <div className={`rounded-xl relative border p-3 ${compact ? "" : "sm:p-4"} flex flex-row ${compact ? "" : "sm:flex-col"} gap-3 ${compact ? "" : "sm:gap-0"} overflow-visible`} style={{ backgroundColor: "#fff" }}>

      {product.best_seller && (
        <div className="absolute top-5 right-5 md:-top-[15px] md:-right-[15px] z-10">
          <div className={`relative ${compact ? "size-10" : "size-12 sm:size-16"}`}>
            <svg viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
              <path d="M71.5107 28.3601C75.6176 30.0584 78.6852 32.4667 80.4599 35.4833C81.4674 37.1506 82 39.0615 82 41.0095C82 42.9576 81.4674 44.8685 80.4599 46.5358C78.6852 49.527 75.6176 51.9353 71.5107 53.6337C73.2092 57.7403 73.6909 61.6189 72.8036 64.9904C72.338 66.8802 71.3643 68.6065 69.988 69.9827C68.6117 71.3589 66.8851 72.3325 64.9953 72.798C63.845 73.0972 62.66 73.2421 61.4715 73.2291C58.7737 73.1637 56.1138 72.5784 53.6378 71.5053C51.9392 75.612 49.5308 78.7046 46.5139 80.4537C44.8464 81.4614 42.9358 81.996 40.9873 82C39.0398 81.9893 37.1309 81.4552 35.4607 80.4537C32.4692 78.7046 30.0607 75.612 28.3621 71.5306C24.2551 73.2037 20.3764 73.6854 17.0046 72.798C15.1128 72.3365 13.3841 71.3643 12.0071 69.9874C10.6302 68.6106 9.65783 66.8821 9.19621 64.9904C8.30897 61.6189 8.79065 57.7403 10.4638 53.6337C6.38222 51.9353 3.28939 49.527 1.54012 46.5358C0.532567 44.8685 0 42.9576 0 41.0095C0 39.0615 0.532567 37.1506 1.54012 35.4833C3.28939 32.4667 6.38222 30.0584 10.4638 28.3601C8.79065 24.2788 8.30897 20.3748 9.19621 17.0034C9.66185 15.1137 10.6355 13.3873 12.0118 12.0111C13.3882 10.6349 15.1147 9.66126 17.0046 9.19566C20.3764 8.30833 24.2551 8.78998 28.3621 10.4885C30.0607 6.4071 32.4692 3.31451 35.4607 1.54C37.1281 0.532526 39.0391 0 40.9873 0C42.9355 0 44.8466 0.532526 46.514 1.54C49.5308 3.31451 51.9393 6.4071 53.6378 10.4885C57.7447 8.78998 61.6236 8.3337 64.9953 9.19566C66.8832 9.6653 68.6076 10.6402 69.9833 12.0158C71.359 13.3914 72.334 15.1156 72.8036 17.0034C73.6909 20.3748 73.2092 24.2788 71.5107 28.3601Z" fill="#FF7274" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center ${compact ? "text-[7px]" : "text-[8px] sm:text-[11px]"} font-bold text-white leading-tight text-center`}>
              best<br />seller
            </span>
          </div>
        </div>
      )}

      {/* Product type + Name — order 1 on desktop, hidden on mobile/compact */}
      {!compact && (
        <span className="hidden sm:block text-xs font-mono text-muted-foreground uppercase tracking-wide order-1">
          {product.product_type.replace(/_/g, " ")}
        </span>
      )}
      {!compact && (
        <Link
          href={`/${slug}/storefront/${product.slug}`}
          className="hidden sm:block text-2xl font-bold leading-tight hover:underline mb-1 order-1"
        >
          {product.name}
        </Link>
      )}

      {/* Cannabinoids + COA — order 2 on desktop, hidden on mobile/compact */}
      {!compact && (
        <div className="hidden sm:flex flex-col gap-2 mb-3 order-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {thc && <span>THC {thc}%</span>}
            {cbg && <span>CBG {cbg}%</span>}
            {coaPdfUrl && (
              <a
                href={coaPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline text-foreground hover:opacity-70"
                onClick={(e) => e.stopPropagation()}
              >
                <DownloadIcon className="size-3.5" />
                COA
              </a>
            )}
          </div>
          {strain?.category && (
            <span className={`inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[strain.category] || "bg-muted text-foreground"}`}>
              {CATEGORY_LABELS[strain.category]}
            </span>
          )}
        </div>
      )}

      {/* Thumbnail + category badge — order 3 on desktop, first on mobile/compact */}
      <div className={`shrink-0 w-28 ${compact ? "" : "sm:w-full sm:mb-4"} order-first ${compact ? "" : "sm:order-3"} relative`}>

        <Link
          href={`/${slug}/storefront/${product.slug}`}
          className="group/img block"
        >
          <div className="relative aspect-square w-full rounded-lg overflow-hidden" style={{ backgroundColor: "#fff" }}>
            {product.thumbnail_url ? (
              <>
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className={`size-full object-contain p-2 transition-opacity duration-300 ${product.image_urls?.length ? "group-hover/img:opacity-0" : ""
                    }`}
                />
                {product.image_urls?.[0] && (
                  <img
                    src={product.image_urls[0].url}
                    alt={`${product.name} gallery`}
                    className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover/img:opacity-100"
                  />
                )}
              </>
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground text-sm">
                No image
              </div>
            )}
          </div>
        </Link>
        {strain?.category && (
          <div className={`${compact ? "" : "sm:hidden"} text-center mt-1.5`}>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[strain.category] || "bg-muted text-foreground"}`}>
              {CATEGORY_LABELS[strain.category]}
            </span>
          </div>
        )}
      </div>

      {/* Price + weight — order 4 on desktop, hidden on mobile/compact */}
      {!compact && (
        <div className="hidden sm:flex items-baseline justify-between mb-3 order-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">
              {product.price_tbd ? "TBD" : formatPrice(product.default_price)}
            </span>
            {!product.price_tbd && (
              <span className="text-base text-muted-foreground">each</span>
            )}
          </div>
          {packLabel && (
            <span className="text-sm text-muted-foreground font-mono">
              {packLabel}
            </span>
          )}
        </div>
      )}

      {/* Qty + Add button — order 5 on desktop, hidden on mobile/compact */}
      {!compact && (
        <div className="hidden sm:flex gap-2 order-5">
          {outOfStock ? (
            <div className="flex-1 rounded-lg border border-red-200 bg-red-50 text-red-600 text-base font-medium py-2.5 text-center">
              Out of Stock
            </div>
          ) : (
            <>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 rounded-lg border text-center text-base font-mono py-2.5 bg-background"
              />
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground text-base font-medium py-2.5 transition-colors disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Mobile/compact info column (right side) */}
      <div className={`flex ${compact ? "" : "sm:hidden"} flex-col flex-1 min-w-0`}>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
          {product.product_type.replace(/_/g, " ")}
        </span>
        <Link
          href={`/${slug}/storefront/${product.slug}`}
          className="text-xl font-bold leading-tight hover:underline mb-1"
        >
          {product.name}
        </Link>

        {packLabel && (
          <span className="text-xs text-muted-foreground font-mono mb-1">
            {packLabel}
          </span>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {thc && <span>THC {thc}%</span>}
          {cbg && <span>CBG {cbg}%</span>}
          {coaPdfUrl && (
            <a
              href={coaPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline text-foreground hover:opacity-70"
              onClick={(e) => e.stopPropagation()}
            >
              <DownloadIcon className="size-3" />
              COA
            </a>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-lg font-bold">
              {product.price_tbd ? "TBD" : formatPrice(product.default_price)}
            </span>
            {!product.price_tbd && (
              <span className="text-sm text-muted-foreground">each</span>
            )}
          </div>

          <div className="flex gap-2">
            {outOfStock ? (
              <div className="flex-1 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium py-2 text-center">
                Out of Stock
              </div>
            ) : (
              <>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 rounded-lg border text-center text-sm font-mono py-2 bg-background"
                />
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-medium py-2 transition-colors disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
