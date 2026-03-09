"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { openHelpDrawer } from "@/components/storefront/help-drawer";

export function ShopHeader({ slug }: { slug: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function fetchCartCount() {
      try {
        const companyData = await apiClient.getCompany(slug);
        const cart = await apiClient.getCart(companyData.id);
        setCartCount(cart.item_count);
      } catch {
        // Cart may not exist yet
      }
    }
    fetchCartCount();

    const handler = () => fetchCartCount();
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, [slug]);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#F3F1EF" }}>
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href={`/${slug}/storefront`} className="w-32">
            <Logo />
          </Link>
          <span className="text-sm text-muted-foreground">partner</span>
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
            className="text-base text-foreground hover:opacity-70 transition-opacity"
          >
            orders
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
