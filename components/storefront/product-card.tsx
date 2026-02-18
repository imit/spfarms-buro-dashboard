"use client";

import { useState } from "react";
import Link from "next/link";
import { MinusIcon, PlusIcon, ShoppingCartIcon, FileTextIcon, LeafIcon } from "lucide-react";
import { type Product, type Strain, PRODUCT_TYPE_LABELS } from "@/lib/api";
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
  onAddToCart,
}: {
  product: Product;
  slug: string;
  strain?: Strain;
  onAddToCart: (productId: number, quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAddToCart(product.id, quantity);
      setQuantity(1);
    } finally {
      setAdding(false);
    }
  };

  const weightLabel = formatWeight(product.unit_weight);
  const coaPdfUrl = strain?.current_coa?.pdf_url;

  // Cannabinoid values — prefer strain data, fall back to product fields; hide zeros
  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain?.total_thc) || nonZero(product.thc_content);
  const cbd = nonZero(strain?.cbd) || nonZero(product.cbd_content);
  const cbg = nonZero(strain?.cbg);
  const hasCannabinoids = thc || cbd || cbg;

  // Flavor
  const smellTags = strain?.smell_tags ?? [];

  return (
    <div className="group rounded-lg border bg-card overflow-hidden">
      <Link href={`/${slug}/storefront/${product.slug}`}>
        <div className="aspect-square bg-muted overflow-hidden relative">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="size-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          {weightLabel && (
            <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
              {weightLabel}
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/${slug}/storefront/${product.slug}`}
            className="font-medium text-sm leading-tight hover:underline line-clamp-2"
          >
            {product.name}
          </Link>
        </div>

       

        {/* Cannabinoid profile */}
        {hasCannabinoids && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {thc && <span>THC {thc}%</span>}
            {cbd && <span>CBD {cbd}%</span>}
            {cbg && <span>CBG {cbg}%</span>}
          </div>
        )}

        

        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {formatPrice(product.default_price)}
          </div>
          {coaPdfUrl && (
            <a
              href={coaPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <FileTextIcon className="size-3.5" />
              COA
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          
          <Button
            size="lg"
            variant="default"
            className="flex-1"
            onClick={handleAdd}
            disabled={adding}
          >
            <ShoppingCartIcon className="mr-1.5 size-3.5" />
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
