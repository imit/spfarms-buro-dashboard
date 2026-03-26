"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiClient, type Menu, type MenuItem } from "@/lib/api"
import { Logo } from "@/components/shared/logo"
import { StorefrontFooter } from "@/components/storefront/storefront-footer"

function formatPrice(price: number | null): string {
  if (price === null) return "TBD"
  return `$${price.toFixed(2)}`
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {item.thumbnail_url ? (
        <div className="aspect-square bg-gray-100">
          <img
            src={item.thumbnail_url}
            alt={item.product_name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      )}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {item.product_name}
        </h3>
        {item.strain_name && (
          <p className="text-xs text-muted-foreground">{item.strain_name}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-semibold text-sm">
            {item.price_tbd ? "Price TBD" : formatPrice(item.effective_price)}
          </span>
          {item.unit_weight && (
            <span className="text-xs text-muted-foreground">/ {item.unit_weight}</span>
          )}
        </div>
        {!item.in_stock && (
          <span className="inline-block text-xs text-red-600 font-medium">Out of stock</span>
        )}
        {item.coming_soon && (
          <span className="inline-block text-xs text-amber-600 font-medium">Coming soon</span>
        )}
        {item.best_seller && (
          <span className="inline-block text-xs text-green-600 font-medium">Best seller</span>
        )}
      </div>
    </div>
  )
}

export default function PublicMenuPage() {
  const params = useParams()
  const menuSlug = params.menuSlug as string

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!menuSlug) return
    setLoading(true)
    setError(null)
    apiClient
      .getPublicMenu(menuSlug)
      .then((data) => setMenu(data))
      .catch((err) => {
        setError(err?.message || "Unable to load this menu.")
      })
      .finally(() => setLoading(false))
  }, [menuSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFBF9" }}>
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFBF9" }}>
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-xl font-semibold">Menu Unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link href="/" className="inline-block text-sm font-medium text-blue-600 hover:underline">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  if (!menu) return null

  const visibleItems = (menu.items || []).filter((item) => item.visible)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFBF9", color: "#431F13" }}>
      {/* Header — matches ShopHeader style */}
      <header className="border-b" style={{ backgroundColor: "#FFFBF9" }}>
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <div className="w-36">
              <Logo />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {menu.company_name && (
              <span className="text-sm text-muted-foreground">{menu.company_name}</span>
            )}
            <Link
              href="/wholesale/register"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#431F13" }}
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5"
              style={{ borderColor: "#431F13", color: "#431F13" }}
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Menu content */}
      <main className="flex-1 mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-12 w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-1">{menu.name}</h1>
          {menu.description && (
            <p className="text-lg text-muted-foreground max-w-2xl">{menu.description}</p>
          )}
        </div>

        {visibleItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">This menu has no items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Order CTA */}
        <div className="mt-16 rounded-2xl border p-8 sm:p-10 text-center space-y-3" style={{ backgroundColor: "#FFF8F0" }}>
          <h2 className="text-xl font-bold">Want to place an order?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Register as a wholesale partner to start ordering from this menu.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/wholesale/register"
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#431F13" }}
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
              style={{ borderColor: "#431F13", color: "#431F13" }}
            >
              Log in
            </Link>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  )
}
