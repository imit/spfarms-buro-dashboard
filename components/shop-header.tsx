"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCartIcon, BellIcon, UserIcon, LogOutIcon, PackageIcon } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShopHeader({ slug }: { slug: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function fetchCartCount() {
      try {
        const company = await apiClient.getCompany(slug);
        const cart = await apiClient.getCart(company.id);
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
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link href={`/${slug}/storefront`} className="w-28">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${slug}/cart`)}
            className="relative"
          >
            <ShoppingCartIcon className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${slug}/notifications`}>
              <BellIcon className="size-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserIcon className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.full_name || user?.email}</p>
                {user?.full_name && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${slug}/orders`)}>
                <PackageIcon className="mr-2 size-4" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOutIcon className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
