"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiClient, Menu, MenuItem } from "@/lib/api"

function formatPrice(cents: number | null): string {
  if (cents === null) return "TBD"
  return `$${(cents / 100).toFixed(2)}`
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {item.thumbnail_url ? (
        <div className="aspect-square bg-gray-100">
          <img
            src={item.thumbnail_url}
            alt={item.product_name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
      )}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {item.product_name}
        </h3>
        {item.strain_name && (
          <p className="text-xs text-gray-500">{item.strain_name}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-semibold text-sm">
            {item.price_tbd ? "Price TBD" : formatPrice(item.effective_price)}
          </span>
          {item.unit_weight && (
            <span className="text-xs text-gray-400">/ {item.unit_weight}</span>
          )}
        </div>
        {!item.in_stock && (
          <span className="inline-block text-xs text-red-600 font-medium">
            Out of stock
          </span>
        )}
        {item.coming_soon && (
          <span className="inline-block text-xs text-amber-600 font-medium">
            Coming soon
          </span>
        )}
        {item.best_seller && (
          <span className="inline-block text-xs text-green-600 font-medium">
            Best seller
          </span>
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
        setError(
          err?.message || "Unable to load this menu. It may not exist or has been removed."
        )
      })
      .finally(() => setLoading(false))
  }, [menuSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800 mx-auto" />
          <p className="text-sm text-gray-500">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Menu Unavailable
          </h1>
          <p className="text-sm text-gray-500">{error}</p>
          <Link
            href="/"
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  if (!menu) return null

  if (menu.access_type === "company_member_only") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            This menu requires authentication
          </h1>
          <p className="text-sm text-gray-500">
            Only authorized company members can view this menu. Please log in to
            continue.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    )
  }

  const visibleItems = (menu.items || []).filter((item) => item.visible)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {menu.name}
          </h1>
          {menu.description && (
            <p className="mt-2 text-gray-600 max-w-2xl">{menu.description}</p>
          )}
          {menu.company_name && (
            <p className="mt-1 text-sm text-gray-400">
              by {menu.company_name}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {visibleItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">This menu has no items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 text-center">
            Powered by SPFarms
          </p>
        </div>
      </footer>
    </div>
  )
}
