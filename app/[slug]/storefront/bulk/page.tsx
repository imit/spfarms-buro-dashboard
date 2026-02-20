"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Product, type Strain } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ProductCard } from "@/components/storefront/product-card";
import { toast } from "sonner";

export default function BulkStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
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

        if (!company.bulk_buyer) {
          router.replace(`/${slug}/storefront`);
          return;
        }

        setProducts(productData.filter((p) => p.active && p.status === "active" && p.bulk));
        setCompanyId(company.id);

        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);
      } catch (err) {
        console.error("Failed to load bulk storefront:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug]);

  const handleAddToCart = useCallback(async (productId: number, quantity: number) => {
    if (!companyId) return;
    try {
      await apiClient.addToCart(companyId, productId, quantity);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  }, [companyId]);

  if (isLoading) {
    return <p style={{ color: "#050403", opacity: 0.5 }}>Loading bulk products...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bulk Orders</h1>

      {products.length === 0 ? (
        <p style={{ opacity: 0.5 }}>No bulk products available.</p>
      ) : (
        <div className="space-y-2">
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
