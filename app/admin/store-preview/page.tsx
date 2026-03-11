"use client";

import { useEffect, useState } from "react";
import { apiClient, type Product, type Strain } from "@/lib/api";
import { ProductCard } from "@/components/storefront/product-card";

export default function StorePreviewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [productData, strains] = await Promise.all([
          apiClient.getProducts(),
          apiClient.getStrains(),
        ]);
        setProducts(productData.filter((p) => p.active && p.status === "active" && !p.bulk));

        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);
      } catch (err) {
        console.error("Failed to load store preview:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return <p className="text-muted-foreground py-12">Loading store preview...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Store Preview</h1>
        <p className="text-muted-foreground mt-1">
          This is how your storefront looks to dispensary accounts.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No active products to display.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              slug="preview"
              strain={product.strain_id ? strainMap[product.strain_id] : undefined}
              onAddToCart={async () => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
