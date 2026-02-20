"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon, MinusIcon, PlusIcon, TrashIcon, WeightIcon, ClockIcon,
} from "lucide-react";
import { apiClient, type Cart, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { BoxProgress, useMinimumOrderMet } from "@/components/storefront/box-progress";
import { toast } from "sonner";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

export default function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const companyData = await apiClient.getCompany(slug);
        setCompany(companyData);
        const cartData = await apiClient.getCart(companyData.id);
        setCart(cartData);
      } catch (err) {
        console.error("Failed to load cart:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug]);

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

  const regularSubtotal = regularItems.reduce(
    (sum, i) => sum + parseFloat(i.unit_price || "0") * i.quantity, 0
  );
  const preorderSubtotal = preorderItems.reduce(
    (sum, i) => sum + parseFloat(i.unit_price || "0") * i.quantity, 0
  );

  // Calculate discount lines for a given subtotal
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
  const regularDiscountLines = calcDiscountLines(regularSubtotal);
  const regularTotalDiscount = regularDiscountLines.reduce((s, l) => s + l.amount, 0);
  const preorderDiscountLines = calcDiscountLines(preorderSubtotal);
  const preorderTotalDiscount = preorderDiscountLines.reduce((s, l) => s + l.amount, 0);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading cart...</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => router.push(`/${slug}/storefront`)}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  const cartItemRow = (item: typeof regularItems[number], borderClass?: string) => (
    <div key={item.id} className={`rounded-lg border p-3 ${borderClass || ""}`}>
      <div className="flex items-center gap-3">
        <div className="size-12 sm:size-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
          ) : (
            <div className="size-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.product_name}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatPrice(item.unit_price)}
            {item.bulk && item.unit_weight ? ` / ${parseFloat(item.unit_weight)} lbs` : ""}
          </p>
        </div>

        {/* Desktop: line total + trash inline */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
              <MinusIcon className="size-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
              <PlusIcon className="size-3" />
            </Button>
          </div>
          <div className="w-20 text-right font-medium text-sm">
            {formatPrice(parseFloat(item.unit_price || "0") * item.quantity)}
          </div>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile: quantity + total + trash below */}
      <div className="flex items-center justify-between mt-2 sm:hidden">
        <div className="flex items-center rounded-md border">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
            <MinusIcon className="size-3" />
          </Button>
          <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
            <PlusIcon className="size-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {formatPrice(parseFloat(item.unit_price || "0") * item.quantity)}
          </span>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
            <TrashIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/${slug}/storefront`)}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Continue Shopping
      </Button>

      <h1 className="text-2xl font-bold mb-6">Cart</h1>

      {/* ── Regular order section ── */}
      {regularItems.length > 0 && (
        <>
          {/* Box progress (non-bulk regular items only) */}
          {regularItems.some((i) => !i.bulk) && (
            <div className="rounded-lg border p-4 mb-4">
              <BoxProgress items={regularItems.filter((i) => !i.bulk)} />
            </div>
          )}

          {/* Regular non-bulk items */}
          {regularItems.filter((i) => !i.bulk).length > 0 && (
            <div className="space-y-3">
              {regularItems.filter((i) => !i.bulk).map((item) => cartItemRow(item))}
            </div>
          )}

          {/* Regular bulk items */}
          {regularItems.some((i) => i.bulk) && (
            <>
              <div className="flex items-center gap-2 mt-6 mb-3">
                <WeightIcon className="size-4 text-amber-600" />
                <h2 className="text-lg font-semibold">Bulk Orders</h2>
              </div>
              <div className="space-y-3">
                {regularItems.filter((i) => i.bulk).map((item) =>
                  cartItemRow(item, "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20")
                )}
              </div>
            </>
          )}

          <div className="border-t pt-4 mt-4 space-y-3">
            {regularDiscountLines.length > 0 ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(regularSubtotal)}</span>
                </div>
                {regularDiscountLines.map((l, i) => (
                  <div key={i} className="flex justify-between text-green-600">
                    <span>{l.name} ({l.type === "percentage" ? `${parseFloat(l.value)}%` : `$${parseFloat(l.value)}`})</span>
                    <span>-{formatPrice(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Est. Total</span>
                  <span>{formatPrice(regularSubtotal - regularTotalDiscount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-lg font-semibold">
                Subtotal: {formatPrice(regularSubtotal)}
              </div>
            )}
            <Button
              className="w-full sm:w-auto sm:ml-auto sm:flex"
              size="lg"
              disabled={!meetsMinimum}
              onClick={() => router.push(`/${slug}/checkout`)}
            >
              {meetsMinimum ? "Proceed to Checkout" : "Minimum order not met"}
            </Button>
          </div>
        </>
      )}

      {/* ── Pre-order section ── */}
      {preorderItems.length > 0 && (
        <>
          <div className={`flex items-center gap-2 mb-3 ${regularItems.length > 0 ? "mt-8 pt-6 border-t" : ""}`}>
            <ClockIcon className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Pre-orders</h2>
          </div>
          <div className="space-y-3">
            {preorderItems.map((item) =>
              cartItemRow(item, "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20")
            )}
          </div>
          <div className="border-t pt-4 mt-4 space-y-3">
            {preorderDiscountLines.length > 0 ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pre-order Subtotal</span>
                  <span>{formatPrice(preorderSubtotal)}</span>
                </div>
                {preorderDiscountLines.map((l, i) => (
                  <div key={i} className="flex justify-between text-green-600">
                    <span>{l.name} ({l.type === "percentage" ? `${parseFloat(l.value)}%` : `$${parseFloat(l.value)}`})</span>
                    <span>-{formatPrice(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Est. Total</span>
                  <span>{formatPrice(preorderSubtotal - preorderTotalDiscount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-lg font-semibold">
                Pre-order Subtotal: {formatPrice(preorderSubtotal)}
              </div>
            )}
            <Button
              className="w-full sm:w-auto sm:ml-auto sm:flex"
              size="lg"
              variant="outline"
              onClick={() => router.push(`/${slug}/checkout?type=preorder`)}
            >
              <ClockIcon className="mr-2 size-4" />
              Checkout Pre-orders
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
