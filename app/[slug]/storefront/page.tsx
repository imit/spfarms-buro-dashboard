"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MinusIcon, PlusIcon, TrashIcon, PackageIcon, ShoppingCartIcon, WeightIcon, ClockIcon,
  AlertTriangleIcon, PencilIcon, MapPinIcon,
} from "lucide-react";
import posthog from "posthog-js";
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
import { showError } from "@/lib/errors";

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
        setProducts(
          company.bulk_buyer
            ? productData.filter((p) => p.active && p.status === "active" && p.bulk)
            : productData.filter((p) => p.active && p.status === "active" && !p.bulk)
        );
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
      setCartPreservingOrder(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      const product = products.find((p) => p.id === productId);
      posthog.capture("product_added_to_cart", {
        product_id: productId,
        product_name: product?.name,
        quantity,
        company_slug: slug,
        company_name: company.name,
      });
      toast.success("Added to cart");
    } catch {
      showError("add this item to your cart");
    }
  };

  // Preserve existing item order when updating cart state
  const setCartPreservingOrder = useCallback((updated: Cart) => {
    setCart((prev) => {
      if (!prev) return updated;
      const orderMap = new Map(prev.items.map((item, idx) => [item.id, idx]));
      const sorted = [...updated.items].sort((a, b) => {
        const ai = orderMap.get(a.id) ?? Infinity;
        const bi = orderMap.get(b.id) ?? Infinity;
        return ai - bi;
      });
      return { ...updated, items: sorted };
    });
  }, []);

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.updateCartItem(company.id, itemId, newQuantity);
      setCartPreservingOrder(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      showError("update the quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.removeCartItem(company.id, itemId);
      setCartPreservingOrder(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      showError("remove that item");
    }
  };

  const regularItems = cart?.items.filter((i) => !i.coming_soon) ?? [];
  const preorderItems = cart?.items.filter((i) => i.coming_soon) ?? [];
  const meetsMinimum = useMinimumOrderMet(regularItems);
  const boxItems = regularItems.filter((i) => !i.bulk);
  const bulkItems = regularItems.filter((i) => i.bulk);
  const totalPouches = boxItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalItems = (cart?.items.length ?? 0);

  // Calculate discount savings for a given subtotal
  const calcDiscountLines = (subtotal: number) => {
    if (!cart?.discounts?.length || subtotal <= 0) return [];
    return cart.discounts.map((d) => {
      const amount =
        d.discount_type === "percentage"
          ? subtotal * (parseFloat(d.value) / 100)
          : Math.min(parseFloat(d.value), subtotal);
      return { name: d.name, type: d.discount_type, value: d.value, amount };
    });
  };

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
        <input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1) updateQuantity(item.id, v);
          }}
          className="h-7 w-8 border-x bg-background text-center text-xs font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
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

              {/* Discount summary */}
              {(() => {
                const sub = regularItems.reduce(
                  (s, i) => s + parseFloat(i.unit_price || "0") * i.quantity, 0
                );
                const lines = calcDiscountLines(sub);
                const totalDiscount = lines.reduce((s, l) => s + l.amount, 0);
                if (lines.length === 0) return null;
                return (
                  <div className="space-y-1 rounded-lg border border-green-200 bg-green-50/50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${sub.toFixed(2)}</span>
                    </div>
                    {lines.map((l, i) => (
                      <div key={i} className="flex justify-between text-green-600">
                        <span>{l.name} ({l.type === "percentage" ? `${parseFloat(l.value)}%` : `$${parseFloat(l.value)}`})</span>
                        <span>-${l.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t border-green-200 pt-1 dark:border-green-900">
                      <span>Est. Total</span>
                      <span>${(sub - totalDiscount).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <Button
                className="w-full"
                size="lg"
                disabled={!meetsMinimum}
                onClick={() => {
                  posthog.capture("checkout_started", {
                    company_slug: slug,
                    company_name: company?.name,
                    item_count: regularItems.length,
                    total_pouches: totalPouches,
                  });
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
              {/* Pre-order discount summary */}
              {(() => {
                const sub = preorderItems.reduce(
                  (s, i) => s + parseFloat(i.unit_price || "0") * i.quantity, 0
                );
                const lines = calcDiscountLines(sub);
                const totalDiscount = lines.reduce((s, l) => s + l.amount, 0);
                if (lines.length === 0) return null;
                return (
                  <div className="space-y-1 rounded-lg border border-green-200 bg-green-50/50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pre-order Subtotal</span>
                      <span>${sub.toFixed(2)}</span>
                    </div>
                    {lines.map((l, i) => (
                      <div key={i} className="flex justify-between text-green-600">
                        <span>{l.name} ({l.type === "percentage" ? `${parseFloat(l.value)}%` : `$${parseFloat(l.value)}`})</span>
                        <span>-${l.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t border-green-200 pt-1 dark:border-green-900">
                      <span>Est. Total</span>
                      <span>${(sub - totalDiscount).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

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
        <div className="w-full lg:w-[70%] overflow-y-auto py-4 sm:px-4 sm:py-6 pb-24 lg:pb-6">
          {/* Dispensary header */}
          {company && (
            <div className="mb-6 rounded-lg border bg-card p-4">
              {/* Mobile: stacked layout */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-center gap-3">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="size-14 shrink-0 rounded-xl object-contain bg-white p-1 border"
                    />
                  ) : (
                    <div className="size-14 shrink-0 rounded-xl border bg-muted flex items-center justify-center text-muted-foreground text-xl font-bold">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Hello, {user?.full_name || user?.email}
                    </p>
                    <h1 className="text-lg font-bold leading-tight">
                      {company.name}
                    </h1>
                    {company.license_number && (
                      <p className="text-xs text-muted-foreground">#{company.license_number}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => router.push(`/${slug}/settings`)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                </div>
                {!company.license_number && (
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => router.push(`/${slug}/settings`)}
                  >
                    <AlertTriangleIcon className="mr-2 size-4" />
                    No license number — Update Profile
                  </Button>
                )}
                {company.locations.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPinIcon className="size-3.5 shrink-0" />
                    {[company.locations[0].address, company.locations[0].city, company.locations[0].state, company.locations[0].zip_code].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              {/* Desktop: horizontal layout */}
              <div className="hidden sm:flex items-center gap-5">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="size-20 shrink-0 rounded-xl object-contain bg-white p-1.5 border"
                  />
                ) : (
                  <div className="size-20 shrink-0 rounded-xl border bg-muted flex items-center justify-center text-muted-foreground text-2xl font-bold">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Hello, {user?.full_name || user?.email}
                  </p>
                  <h1 className="text-xl font-bold">
                    {company.name}
                    {company.license_number && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        #{company.license_number}
                      </span>
                    )}
                  </h1>
                  {!company.license_number && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => router.push(`/${slug}/settings`)}
                    >
                      <AlertTriangleIcon className="mr-1.5 size-3.5" />
                      No license number — Update Profile
                    </Button>
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
                  discounts={cart?.discounts}
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
