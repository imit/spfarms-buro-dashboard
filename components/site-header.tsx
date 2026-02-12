"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

function usePageTitle() {
  const pathname = usePathname()

  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/companies": "Companies",
    "/dashboard/companies/new": "New Company",
    "/dashboard/users": "Users",
    "/dashboard/users/new": "New User",
  }

  // Exact match first
  if (titles[pathname]) return titles[pathname]

  // Fall back to last segment, capitalized
  const segments = pathname.split("/").filter(Boolean)
  const last = segments[segments.length - 1] || "Dashboard"
  return last.charAt(0).toUpperCase() + last.slice(1)
}

export function SiteHeader() {
  const title = usePageTitle()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
