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
import { showError } from "@/lib/errors";

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
      showError("update the quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.removeCartItem(company.id, itemId);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      showError("remove that item");
    }
  };

  const regularItems = (cart?.items.filter((i) => !i.coming_soon) ?? []).sort((a, b) => a.id - b.id);
  const preorderItems = (cart?.items.filter((i) => i.coming_soon) ?? []).sort((a, b) => a.id - b.id);
  const meetsMinimum = useMinimumOrderMet(regularItems);

  const fillMinimum = async (weight: number, remaining: number) => {
    if (!company) return;
    // Find the first non-bulk item in this weight group and increase its quantity
    const item = regularItems.find(
      (i) => !i.bulk && i.unit_weight && parseFloat(i.unit_weight) === weight
    );
    if (!item) return;
    try {
      const updated = await apiClient.updateCartItem(company.id, item.id, item.quantity + remaining);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      showError("update the quantity");
    }
  };

  const regularSubtotal = regularItems.reduce(
    (sum, i) => sum + parseFloat(i.unit_price || "0") * i.quantity, 0
  );
  const preorderSubtotal = preorderItems.reduce(
    (sum, i) => sum + parseFloat(i.unit_price || "0") * i.quantity, 0
  );

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
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-lg text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm border">
          <p className="text-xl text-muted-foreground mb-6">Your cart is empty.</p>
          <Button size="lg" onClick={() => router.push(`/${slug}/storefront`)}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const cartItemRow = (item: typeof regularItems[number], borderClass?: string) => (
    <div key={item.id} className={`flex items-center gap-4 py-5 ${borderClass || ""}`}>
      {/* Thumbnail */}
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted/50">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
        ) : (
          <div className="size-full" />
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base truncate">{item.product_name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatPrice(item.unit_price)}
          {item.bulk && item.unit_weight ? ` / ${parseFloat(item.unit_weight)} lbs` : " each"}
        </p>
      </div>

      {/* Desktop: quantity + total + trash */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center rounded-lg border bg-muted/30">
          <Button variant="ghost" size="icon" className="size-9 rounded-l-lg rounded-r-none" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
            <MinusIcon className="size-3.5" />
          </Button>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) updateQuantity(item.id, val);
            }}
            className="w-12 text-center text-base font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button variant="ghost" size="icon" className="size-9 rounded-r-lg rounded-l-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
        <div className="w-24 text-right font-semibold text-base">
          {formatPrice(parseFloat(item.unit_price || "0") * item.quantity)}
        </div>
        <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
          <TrashIcon className="size-4" />
        </Button>
      </div>

      {/* Mobile: quantity + total + trash below handled separately */}
      <div className="flex flex-col items-end gap-2 sm:hidden">
        <div className="flex items-center rounded-lg border bg-muted/30">
          <Button variant="ghost" size="icon" className="size-8 rounded-l-lg rounded-r-none" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
            <MinusIcon className="size-3" />
          </Button>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) updateQuantity(item.id, val);
            }}
            className="w-10 text-center text-sm font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button variant="ghost" size="icon" className="size-8 rounded-r-lg rounded-l-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
            <PlusIcon className="size-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">
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
    <div className="max-w-3xl mx-auto">
      <button
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        onClick={() => router.push(`/${slug}/storefront`)}
      >
        <ArrowLeftIcon className="size-4" />
        Continue Shopping
      </button>

      <h1 className="text-3xl font-bold mb-8">Cart</h1>

      {/* ── Regular order section ── */}
      {regularItems.length > 0 && (
        <div className="rounded-2xl bg-white border shadow-sm p-6 sm:p-8 mb-6">
          {/* Box progress */}
          {regularItems.some((i) => !i.bulk) && (
            <div className={`rounded-xl border p-4 mb-6 ${meetsMinimum ? "bg-green-50/50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-sm font-semibold mb-3 ${meetsMinimum ? "text-green-700" : "text-amber-800"}`}>
                {meetsMinimum ? "Order minimums met" : "Order minimums not met"}
              </p>
              <BoxProgress items={regularItems.filter((i) => !i.bulk)} onFillMinimum={fillMinimum} />
            </div>
          )}

          {/* Regular non-bulk items */}
          {regularItems.filter((i) => !i.bulk).length > 0 && (
            <div className="divide-y">
              {regularItems.filter((i) => !i.bulk).map((item) => cartItemRow(item))}
            </div>
          )}

          {/* Regular bulk items */}
          {regularItems.some((i) => i.bulk) && (
            <>
              <div className="flex items-center gap-2 mt-6 mb-2 pt-4 border-t">
                <WeightIcon className="size-4 text-amber-600" />
                <h2 className="text-lg font-semibold">Bulk Orders</h2>
              </div>
              <div className="divide-y divide-amber-100">
                {regularItems.filter((i) => i.bulk).map((item) => cartItemRow(item))}
              </div>
            </>
          )}

          {/* Subtotal + checkout */}
          <div className="border-t pt-6 mt-4">
            {regularDiscountLines.length > 0 ? (
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(regularSubtotal)}</span>
                </div>
                {regularDiscountLines.map((l, i) => (
                  <div key={i} className="flex justify-between text-base text-green-600">
                    <span>{l.name} ({l.type === "percentage" ? `${parseFloat(l.value)}%` : `$${parseFloat(l.value)}`})</span>
                    <span>-{formatPrice(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Est. Total</span>
                  <span>{formatPrice(regularSubtotal - regularTotalDiscount)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-lg text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-bold">{formatPrice(regularSubtotal)}</span>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={!meetsMinimum}
              onClick={() => router.push(`/${slug}/checkout`)}
            >
              {meetsMinimum ? "Proceed to Checkout" : "Minimum order not met"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Pre-order section ── */}
      {preorderItems.length > 0 && (
        <div className="rounded-2xl bg-white border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="size-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Pre-orders</h2>
          </div>
          <div className="divide-y">
            {preorderItems.map((item) => cartItemRow(item))}
          </div>
          <div className="border-t pt-6 mt-4">
            {preorderDiscountLines.length > 0 ? (
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Pre-order Subtotal</span>
                  <span>{formatPrice(preorderSubtotal)}</span>
                </div>
                {preorderDiscountLines.map((l, i) => (
                  <div key={i} className="flex justify-between text-base text-green-600">
                    <span>{l.name} ({l.type === "percentage" ? `${parseFloat(l.value)}%` : `$${parseFloat(l.value)}`})</span>
                    <span>-{formatPrice(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Est. Total</span>
                  <span>{formatPrice(preorderSubtotal - preorderTotalDiscount)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-lg text-muted-foreground">Pre-order Subtotal</span>
                <span className="text-2xl font-bold">{formatPrice(preorderSubtotal)}</span>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => router.push(`/${slug}/checkout?type=preorder`)}
            >
              <ClockIcon className="mr-2 size-4" />
              Checkout Pre-orders
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
