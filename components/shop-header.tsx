"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Avatar from "boring-avatars";
import { ShoppingCartIcon, BellIcon, LogOutIcon, PackageIcon, FlaskConicalIcon, SettingsIcon } from "lucide-react";
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
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const count = await apiClient.getUnreadNotificationCount();
        setUnreadCount(count);
      } catch {
        // ignore
      }
    }
    fetchUnreadCount();

    const handler = () => fetchUnreadCount();
    window.addEventListener("notifications:updated", handler);
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      window.removeEventListener("notifications:updated", handler);
      clearInterval(interval);
    };
  }, [slug]);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#F3F1EF", borderColor: "#050403/10" }}>
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link href={`/${slug}/storefront`} className="w-28">
          <Logo />
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href={`/${slug}/storefront`}
            className={`text-sm font-medium transition-opacity ${
              pathname === `/${slug}/storefront` ? "opacity-100" : "opacity-50 hover:opacity-70"
            }`}
          >
            products
          </Link>
          <Link
            href={`/${slug}/storefront/bulk`}
            className={`text-sm font-medium transition-opacity ${
              pathname === `/${slug}/storefront/bulk` ? "opacity-100" : "opacity-50 hover:opacity-70"
            }`}
          >
            bulk
          </Link>
        </nav>

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

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href={`/${slug}/notifications`}>
              <BellIcon className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar
                  name={user?.full_name || user?.email || "User"}
                  variant="beam"
                  size={28}
                  colors={["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]}
                />
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
              <DropdownMenuItem onClick={() => router.push(`/${slug}/settings`)}>
                <SettingsIcon className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${slug}/orders`)}>
                <PackageIcon className="mr-2 size-4" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${slug}/samples`)}>
                <FlaskConicalIcon className="mr-2 size-4" />
                My Samples
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
