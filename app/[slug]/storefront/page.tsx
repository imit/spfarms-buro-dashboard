"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MinusIcon, PlusIcon, TrashIcon, PackageIcon, ShoppingCartIcon, WeightIcon, ClockIcon,
  AlertTriangleIcon, PencilIcon, MapPinIcon,
} from "lucide-react";
import { apiClient, type Product, type Strain, type Cart, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ProductCard } from "@/components/storefront/product-card";
import { PandaSymbol } from "@/components/shared/panda-symbol";
import { BoxProgress, useMinimumOrderMet } from "@/components/storefront/box-progress";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [cart, setCart] = useState<Cart | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
        setProducts(productData.filter((p) => p.active && p.status === "active" && !p.bulk));
        setCompany(company);

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
      if (company) fetchCart(company.id);
    }
    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, [company, fetchCart]);

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.addToCart(company.id, productId, quantity);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.updateCartItem(company.id, itemId, newQuantity);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.removeCartItem(company.id, itemId);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const regularItems = cart?.items.filter((i) => !i.coming_soon) ?? [];
  const preorderItems = cart?.items.filter((i) => i.coming_soon) ?? [];
  const meetsMinimum = useMinimumOrderMet(regularItems);
  const boxItems = regularItems.filter((i) => !i.bulk);
  const bulkItems = regularItems.filter((i) => i.bulk);
  const totalPouches = boxItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalItems = (cart?.items.length ?? 0);

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center px-8">
          <p style={{ color: "#050403", opacity: 0.5 }}>Loading products...</p>
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <PandaSymbol />
        </div>
      </div>
    );
  }

  /* ── Shared cart item row ── */
  const cartItemRow = (item: typeof regularItems[number], variant?: "bulk" | "preorder") => (
    <div
      key={item.id}
      className={`flex items-center gap-3 rounded-lg border p-2.5 ${
        variant === "bulk"
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
          : variant === "preorder"
            ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
            : ""
      }`}
    >
      <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
        ) : (
          <div className="size-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.strain_name || item.product_name}
        </p>
        <p className="text-xs text-muted-foreground">
          ${parseFloat(item.unit_price || "0").toFixed(2)}
          {variant === "bulk" && item.unit_weight ? ` / ${parseFloat(item.unit_weight)} lbs` : " each"}
        </p>
      </div>
      <div className="flex items-center rounded-md border">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
          <MinusIcon className="size-3" />
        </Button>
        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
          <PlusIcon className="size-3" />
        </Button>
      </div>
      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
        <TrashIcon className="size-3.5" />
      </Button>
    </div>
  );

  /* ── Shared cart sidebar content ── */
  const cartContent = (
    <div className="space-y-5">
      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-12">
          <PackageIcon className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Add products to start building your box
          </p>
        </div>
      ) : (
        <>
          {/* ── Regular order section ── */}
          {regularItems.length > 0 && (
            <>
              {boxItems.length > 0 && <BoxProgress items={boxItems} />}

              {boxItems.length > 0 && (
                <div className="space-y-2">
                  {boxItems.map((item) => cartItemRow(item))}
                </div>
              )}

              {bulkItems.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <WeightIcon className="size-4 text-amber-600" />
                    <h3 className="text-sm font-semibold">Bulk Orders</h3>
                  </div>
                  <div className="space-y-2">
                    {bulkItems.map((item) => cartItemRow(item, "bulk"))}
                  </div>
                </>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!meetsMinimum}
                onClick={() => {
                  setSheetOpen(false);
                  router.push(`/${slug}/checkout`);
                }}
              >
                <ShoppingCartIcon className="mr-2 size-4" />
                {meetsMinimum ? "Proceed to Checkout" : "Minimum order not met"}
              </Button>
            </>
          )}

          {/* ── Pre-order section ── */}
          {preorderItems.length > 0 && (
            <>
              {regularItems.length > 0 && <div className="border-t pt-4" />}
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Pre-orders</h3>
                <span className="ml-auto text-xs text-muted-foreground">
                  {preorderItems.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <div className="space-y-2">
                {preorderItems.map((item) => cartItemRow(item, "preorder"))}
              </div>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => {
                  setSheetOpen(false);
                  router.push(`/${slug}/checkout?type=preorder`);
                }}
              >
                <ClockIcon className="mr-2 size-4" />
                Checkout Pre-orders
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-full">
        {/* Product grid — full width on mobile, half on desktop */}
        <div className="w-full lg:w-[70%] overflow-y-auto px-4 py-6 sm:px-8 pb-24 lg:pb-6">
          {/* Dispensary header */}
          {company && (
            <div className="mb-6 rounded-lg border bg-card p-4">
              <div className="flex items-start gap-4">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="size-14 shrink-0 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="size-14 shrink-0 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Hello, {user?.full_name || user?.email}
                  </p>
                  <h1 className="text-xl font-bold truncate">
                    {company.name}
                    {company.license_number && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        #{company.license_number}
                      </span>
                    )}
                  </h1>
                  {!company.license_number && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertTriangleIcon className="size-3.5" />
                      No license number on file
                    </p>
                  )}
                  {company.locations.length > 0 && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      {[company.locations[0].address, company.locations[0].city, company.locations[0].state, company.locations[0].zip_code].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => router.push(`/${slug}/settings`)}
                >
                  <PencilIcon className="mr-1.5 size-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          )}

          {products.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No products available.</p>
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

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-[30%] border-l overflow-y-auto">
          <div className="sticky top-0 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <PackageIcon className="size-5" />
              <h2 className="text-lg font-bold">Your Box</h2>
              {(totalPouches > 0 || bulkItems.length > 0) && (
                <span className="ml-auto text-sm text-muted-foreground">
                  {totalPouches > 0 && `${totalPouches} pouch${totalPouches !== 1 ? "es" : ""}`}
                  {totalPouches > 0 && bulkItems.length > 0 && " + "}
                  {bulkItems.length > 0 && `${bulkItems.reduce((s, i) => s + i.quantity, 0)} bulk`}
                </span>
              )}
            </div>
            {cartContent}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar + sheet */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t bg-background">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex w-full items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <PackageIcon className="size-5" />
                <span className="font-semibold">Your Box</span>
              </div>
              <div className="flex items-center gap-3">
                {totalItems > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <PackageIcon className="size-5" />
                Your Box
                {(totalPouches > 0 || bulkItems.length > 0) && (
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {totalPouches > 0 && `${totalPouches} pouch${totalPouches !== 1 ? "es" : ""}`}
                    {totalPouches > 0 && bulkItems.length > 0 && " + "}
                    {bulkItems.length > 0 && `${bulkItems.reduce((s, i) => s + i.quantity, 0)} bulk`}
                  </span>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="pt-4">
              {cartContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
