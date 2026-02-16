"use client";

import { use, useEffect, useState } from "react";
import { apiClient, type Product, type Strain } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ProductCard } from "@/components/storefront/product-card";
import { toast } from "sonner";

export default function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [productData, company, strains] = await Promise.all([
          apiClient.getProducts(),
          apiClient.getCompany(slug),
          apiClient.getStrains(),
        ]);
        setProducts(productData.filter((p) => p.active && p.status === "active"));
        setCompanyId(company.id);

        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);
      } catch (err) {
        console.error("Failed to load storefront:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug]);

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!companyId) return;
    try {
      await apiClient.addToCart(companyId, productId, quantity);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Shop</h1>
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shop</h1>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              slug={slug}
              strain={product.strain_id ? strainMap[product.strain_id] : undefined}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
