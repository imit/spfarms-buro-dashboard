"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { openHelpDrawer } from "@/components/storefront/help-drawer";
import { CompanySwitcher } from "@/components/company-switcher";

export function ShopHeader({ slug }: { slug: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [hasDraftOrder, setHasDraftOrder] = useState(false);

  useEffect(() => {
    // Reset immediately so a stale count from the previous dispensary never
    // flashes during the swap. The fetch below populates the new values.
    setCartCount(0);
    setHasDraftOrder(false);

    // `cancelled` guards against a race when the user switches companies
    // mid-flight: the old slug's response shouldn't overwrite the new slug's
    // state. Without this, the cart badge could briefly show the wrong count.
    let cancelled = false;

    async function fetchCounts() {
      try {
        const companyData = await apiClient.getCompany(slug);
        const [cart, orders] = await Promise.all([
          apiClient.getCart(companyData.id).catch(() => null),
          apiClient.getOrders({ company_id: companyData.id }).catch(() => []),
        ]);
        if (cancelled) return;
        if (cart) setCartCount(cart.item_count);
        setHasDraftOrder(orders.some((o) => o.status === "draft"));
      } catch {
        // ignore — count just stays at 0 for this company
      }
    }
    fetchCounts();

    const handler = () => {
      if (!cancelled) fetchCounts();
    };
    window.addEventListener("cart:updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("cart:updated", handler);
    };
  }, [slug]);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#F3F1EF" }}>
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href={`/${slug}/storefront`} className="w-32">
            <Logo />
          </Link>
          {/* Falls back to a static "partner" label for users with a single
              membership; renders a dropdown when there are multiple. */}
          <CompanySwitcher slug={slug} />
        </div>

        <nav className="flex items-center gap-8">
          
          <button
            onClick={openHelpDrawer}
            className="text-base text-foreground hover:opacity-70 transition-opacity"
          >
            help
          </button>
          <Link
            href={`/${slug}/orders`}
            className="relative text-base text-foreground hover:opacity-70 transition-opacity"
          >
            orders
            {hasDraftOrder && (
              <span className="absolute -top-1 -right-2.5 size-2 rounded-full bg-red-500" />
            )}
          </Link>
          <Link
            href={`/${slug}/settings`}
            className="text-base text-foreground hover:opacity-70 transition-opacity"
          >
            profile
          </Link>
          <Link
            href={`/${slug}/cart`}
            className="text-base font-medium text-green-600 hover:opacity-70 transition-opacity"
          >
            cart{cartCount > 0 && ` (${cartCount})`}
          </Link>
        </nav>
      </div>
    </header>
  );
}
