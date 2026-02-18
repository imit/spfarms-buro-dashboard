"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MinusIcon, PlusIcon, TrashIcon, PackageIcon, ShoppingCartIcon,
} from "lucide-react";
import { apiClient, type Product, type Strain, type Cart } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ProductCard } from "@/components/storefront/product-card";
import { PandaSymbol } from "@/components/shared/panda-symbol";
import { BoxProgress, useMinimumOrderMet } from "@/components/storefront/box-progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StorefrontPage({
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
  const [cart, setCart] = useState<Cart | null>(null);

  const fetchCart = useCallback(async (cId: number) => {
    try {
      const cartData = await apiClient.getCart(cId);
      setCart(cartData);
    } catch {
      // Cart may not exist yet
    }
  }, []);

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

        // Load cart
        await fetchCart(company.id);
      } catch (err) {
        console.error("Failed to load storefront:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug, fetchCart]);

  // Listen for cart updates from product cards
  useEffect(() => {
    function onCartUpdated() {
      if (companyId) fetchCart(companyId);
    }
    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, [companyId, fetchCart]);

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!companyId) return;
    try {
      const updated = await apiClient.addToCart(companyId, productId, quantity);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (!companyId) return;
    try {
      const updated = await apiClient.updateCartItem(companyId, itemId, newQuantity);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    if (!companyId) return;
    try {
      const updated = await apiClient.removeCartItem(companyId, itemId);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const meetsMinimum = useMinimumOrderMet(cart?.items ?? []);
  const totalPouches = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-1/2 flex items-center justify-center px-8">
          <p style={{ color: "#050403", opacity: 0.5 }}>Loading products...</p>
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <PandaSymbol />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left side — product grid */}
      <div className="w-1/2 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">Shop</h1>

        {products.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No products available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {/* Right side — box builder sidebar */}
      <div className="w-1/2 border-l overflow-y-auto">
        <div className="sticky top-0 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <PackageIcon className="size-5" />
            <h2 className="text-lg font-bold">Your Box</h2>
            {totalPouches > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {totalPouches} pouch{totalPouches !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          {!cart || cart.items.length === 0 ? (
            <div className="text-center py-12">
              <PackageIcon className="size-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Add products to start building your box
              </p>
            </div>
          ) : (
            <>
              {/* Box progress */}
              <BoxProgress items={cart.items} />

              {/* Item list */}
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.product_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.strain_name || item.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${parseFloat(item.unit_price || "0").toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <MinusIcon className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <PlusIcon className="size-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Checkout button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!meetsMinimum}
                onClick={() => router.push(`/${slug}/checkout`)}
              >
                <ShoppingCartIcon className="mr-2 size-4" />
                {meetsMinimum
                  ? "Proceed to Checkout"
                  : "Minimum order not met"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
