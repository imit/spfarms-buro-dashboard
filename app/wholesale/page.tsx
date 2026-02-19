"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Product, type Strain } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { PublicProductCard } from "@/components/storefront/public-product-card";
import { PandaSymbol } from "@/components/shared/panda-symbol";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "lucide-react";

export default function WholesalePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [isLoading, setIsLoading] = useState(true);

  // If user is already authenticated as account, redirect to their storefront
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "account" && user.companies?.length > 0) {
        router.push(`/${user.companies[0].slug}/storefront`);
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    async function load() {
      try {
        const [productData, strains] = await Promise.all([
          apiClient.getPublicProducts(),
          apiClient.getPublicStrains(),
        ]);
        setProducts(productData);

        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);
      } catch (err) {
        console.error("Failed to load wholesale products:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center px-8">
          <p style={{ color: "#050403", opacity: 0.5 }}>Loading products...</p>
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <PandaSymbol />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-32">
                <Logo />
              </div>
              <span className="text-lg font-semibold text-muted-foreground">Wholesale</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Indoor, live-soil, craft cannabis products for licensed dispensaries
            </p>
          </div>
          <Button onClick={() => router.push("/wholesale/register")}>
            <UserPlusIcon className="mr-2 size-4" />
            Become a Partner
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        {products.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No products available.</p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <PublicProductCard
                key={product.id}
                product={product}
                strain={product.strain_id ? strainMap[product.strain_id] : undefined}
                onRegister={() => router.push("/wholesale/register")}
                showPrice={isAuthenticated}
              />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-12 rounded-lg border bg-card p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Ready to order?</h2>
            <p className="text-muted-foreground mb-4">
              Register as a wholesale partner to access pricing, place orders, and download COAs.
            </p>
            <Button size="lg" onClick={() => router.push("/wholesale/register")}>
              <UserPlusIcon className="mr-2 size-4" />
              Register Your Dispensary
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
