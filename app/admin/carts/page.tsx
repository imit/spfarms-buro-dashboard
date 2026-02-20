"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Cart } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

function formatPrice(amount: number | string | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminCartsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getCarts();
        setCarts(data);
      } catch (err) {
        console.error("Failed to load carts:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Active Carts</h2>
        <p className="text-sm text-muted-foreground">
          Companies with items in their cart
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : carts.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No active carts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map((cart) => (
            <div key={cart.id} className="rounded-lg border">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/admin/companies/${cart.company_slug}`)}
              >
                <div>
                  <h3 className="font-semibold">{cart.company_name || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cart.item_count} {cart.item_count === 1 ? "item" : "items"} &middot; {formatPrice(cart.subtotal)} &middot; Updated {timeAgo(cart.updated_at)}
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b bg-muted/50">
                    <th className="px-5 py-2 text-left font-medium">Product</th>
                    <th className="px-5 py-2 text-left font-medium">Strain</th>
                    <th className="px-5 py-2 text-center font-medium">Qty</th>
                    <th className="px-5 py-2 text-right font-medium">Unit Price</th>
                    <th className="px-5 py-2 text-right font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-5 py-2.5">{item.product_name}</td>
                      <td className="px-5 py-2.5 text-muted-foreground">{item.strain_name || "—"}</td>
                      <td className="px-5 py-2.5 text-center">{item.quantity}</td>
                      <td className="px-5 py-2.5 text-right">{formatPrice(item.unit_price)}</td>
                      <td className="px-5 py-2.5 text-right font-medium">
                        {formatPrice(parseFloat(String(item.unit_price || 0)) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={4} className="px-5 py-2.5 text-right font-medium">Subtotal</td>
                    <td className="px-5 py-2.5 text-right font-semibold">{formatPrice(cart.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
