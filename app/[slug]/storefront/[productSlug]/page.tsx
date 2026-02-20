"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, MinusIcon, PlusIcon, ShoppingCartIcon, FileTextIcon, LeafIcon, WeightIcon } from "lucide-react";
import posthog from "posthog-js";
import { apiClient, type Product, type Strain, type Coa, PRODUCT_TYPE_LABELS } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [strain, setStrain] = useState<Strain | null>(null);
  const [coas, setCoas] = useState<Coa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [productData, company] = await Promise.all([
          apiClient.getProduct(productSlug),
          apiClient.getCompany(slug),
        ]);
        setProduct(productData);
        setCompanyId(company.id);
        posthog.capture("product_viewed", {
          product_id: productData.id,
          product_name: productData.name,
          product_type: productData.product_type,
          price: productData.default_price,
          company_slug: slug,
        });

        if (productData.strain_id) {
          const [strainData, strainCoas] = await Promise.all([
            apiClient.getStrain(productData.strain_id),
            apiClient.getStrainCoas(productData.strain_id),
          ]);
          setStrain(strainData);
          setCoas(strainCoas);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug, productSlug]);

  const handleAddToCart = async () => {
    if (!companyId || !product) return;
    setAdding(true);
    try {
      await apiClient.addToCart(companyId, product.id, quantity);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      posthog.capture("product_added_to_cart", {
        product_id: product.id,
        product_name: product.name,
        quantity,
        company_slug: slug,
      });
      toast.success("Added to cart");
      setQuantity(1);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!product) {
    return <p className="text-muted-foreground">Product not found.</p>;
  }

  const unitWeight = product.unit_weight ? parseFloat(product.unit_weight) : null;

  // Cannabinoid values — prefer strain, fall back to product; hide zeros
  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain?.total_thc) || nonZero(product.thc_content);
  const cbd = nonZero(strain?.cbd) || nonZero(product.cbd_content);
  const cbg = nonZero(strain?.cbg);
  // Terpene data
  const dominantTerpenes = strain?.dominant_terpenes;
  const totalTerpenes = strain?.total_terpenes;
  const coaTerpenes = strain?.current_coa?.terpenes;

  // Flavor
  const smellTags = strain?.smell_tags ?? [];

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/${slug}/storefront`)}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Shop
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {product.image_urls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.image_urls.map((url, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md border">
                  <img src={url} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {PRODUCT_TYPE_LABELS[product.product_type]}
              </Badge>
              {product.bulk && (
                <Badge className="bg-amber-600 text-white gap-1">
                  <WeightIcon className="size-3" />
                  Bulk
                </Badge>
              )}
              {product.strain_name && (
                <Badge variant="secondary" className="gap-1">
                  <LeafIcon className="size-3" />
                  {product.strain_name}
                </Badge>
              )}
              {strain?.category && (
                <Badge variant="outline" className="capitalize">
                  {strain.category}
                </Badge>
              )}
            </div>
          </div>

          <div className="text-3xl font-bold">
            {formatPrice(product.default_price)}
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          {/* Product info */}
          <div className="space-y-2 text-sm">
            {product.sku && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span>{product.sku}</span>
              </div>
            )}
            {product.bulk ? (
              unitWeight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span>{product.unit_weight} lbs</span>
                </div>
              )
            ) : (
              <>
                {unitWeight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Weight</span>
                    <span>
                      {product.unit_weight}{product.unit_weight_uom || "g"}
                      {(() => {
                        const name = WEIGHT_NAMES[unitWeight];
                        return name ? ` (${name})` : "";
                      })()}
                    </span>
                  </div>
                )}
                {product.minimum_order_quantity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Order</span>
                    <span>{product.minimum_order_quantity} units</span>
                  </div>
                )}
              </>
            )}
            {product.brand && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand</span>
                <span>{product.brand}</span>
              </div>
            )}
          </div>

          {/* Cannabinoid Profile */}
          {(thc || cbd || cbg) && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Cannabinoid Profile</h3>
              <div className="grid grid-cols-3 gap-3">
                {thc && (
                  <div className="text-center rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{thc}%</p>
                    <p className="text-xs text-muted-foreground">THC</p>
                  </div>
                )}
                {cbd && (
                  <div className="text-center rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{cbd}%</p>
                    <p className="text-xs text-muted-foreground">CBD</p>
                  </div>
                )}
                {cbg && (
                  <div className="text-center rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{cbg}%</p>
                    <p className="text-xs text-muted-foreground">CBG</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terpene Profile */}
          {(dominantTerpenes || (coaTerpenes && Object.keys(coaTerpenes).length > 0)) && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Terpene Profile</h3>
                {totalTerpenes && (
                  <span className="text-xs text-muted-foreground">
                    Total: {totalTerpenes}%
                  </span>
                )}
              </div>
              {dominantTerpenes && (
                <p className="text-sm text-muted-foreground">
                  Dominant: {dominantTerpenes}
                </p>
              )}
              {coaTerpenes && Object.keys(coaTerpenes).length > 0 && (
                <div className="space-y-1.5">
                  {Object.entries(coaTerpenes)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, value]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="text-xs w-28 truncate capitalize">{name.replace(/_/g, " ")}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.min(value * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {value < 1 ? value.toFixed(2) : value.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Flavor / Smell Profile */}
          {smellTags.length > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm">Flavor Profile</h3>
              <div className="flex flex-wrap gap-2">
                {smellTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <MinusIcon className="size-4" />
              </Button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                onClick={() => setQuantity(quantity + 1)}
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
            <Button className="flex-1" onClick={handleAddToCart} disabled={adding}>
              <ShoppingCartIcon className="mr-2 size-4" />
              {adding ? "Adding..." : "Add to Cart"}
            </Button>
          </div>

          {/* COA Documents */}
          {coas.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Certificates of Analysis</h3>
              <div className="space-y-2">
                {coas.map((coa) => (
                  <div key={coa.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <span className="font-medium">
                        {coa.tested_at ? new Date(coa.tested_at).toLocaleDateString() : "COA"}
                      </span>
                      {coa.thc_percent && (
                        <span className="ml-2 text-muted-foreground">
                          THC: {coa.thc_percent}%
                        </span>
                      )}
                      {coa.cbd_percent && (
                        <span className="ml-2 text-muted-foreground">
                          CBD: {coa.cbd_percent}%
                        </span>
                      )}
                    </div>
                    {coa.pdf_url && (
                      <a
                        href={coa.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileTextIcon className="size-4" />
                        View PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
