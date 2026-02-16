"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon, MinusIcon, PlusIcon, TrashIcon,
} from "lucide-react";
import { apiClient, type Cart, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
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

      <div className="space-y-3">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
              ) : (
                <div className="size-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.product_name}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)}</p>
            </div>

            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <MinusIcon className="size-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <PlusIcon className="size-3" />
              </Button>
            </div>

            <div className="w-20 text-right font-medium text-sm">
              {formatPrice(
                parseFloat(item.unit_price || "0") * item.quantity
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <div className="text-lg font-semibold">
          Subtotal: {formatPrice(cart.subtotal)}
        </div>
        <Button
          size="lg"
          onClick={() => router.push(`/${slug}/checkout`)}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
