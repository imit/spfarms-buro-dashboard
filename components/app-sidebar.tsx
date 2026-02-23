"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, Settings2Icon, CircleHelpIcon, SearchIcon, BoxIcon, UserPlusIcon, ClipboardListIcon, BellIcon, FlaskConicalIcon, SproutIcon, ShoppingCartIcon, PackageCheckIcon, MessageSquareIcon } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { canAccess, type Resource } from "@/lib/roles"
import type { UserRole } from "@/lib/api"
import Link from "next/link"

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
  resource?: Resource
}

const navOps: NavItem[] = [
  {
    title: "Strains",
    url: "/admin/strains",
    icon: <ChartBarIcon />,
    resource: "strains",
  },
  {
    title: "Grow",
    url: "/admin/grow",
    icon: <SproutIcon />,
    resource: "grow",
  },
  {
    title: "Samples",
    url: "/admin/samples",
    icon: <FlaskConicalIcon />,
    resource: "samples",
  },
  {
    title: "Projects",
    url: "/admin/projects",
    icon: <FolderIcon />,
    resource: "projects",
  },
]

const navSales: NavItem[] = [
  {
    title: "Companies",
    url: "/admin/companies",
    icon: <ListIcon />,
    resource: "companies",
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <UsersIcon />,
    resource: "users",
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: <ClipboardListIcon />,
    resource: "orders_list",
  },
  {
    title: "Fulfilment",
    url: "/admin/fulfilment",
    icon: <PackageCheckIcon />,
    resource: "fulfilment",
  },
  {
    title: "Carts",
    url: "/admin/carts",
    icon: <ShoppingCartIcon />,
    resource: "carts",
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <BoxIcon />,
    resource: "products",
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: <BellIcon />,
    resource: "notifications",
  },
]

const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/admin/settings",
    icon: <Settings2Icon />,
    resource: "settings",
  },
  {
    title: "Get Help",
    url: "#",
    icon: <CircleHelpIcon />,
  },
  {
    title: "Search",
    url: "#",
    icon: <SearchIcon />,
  },
]

function filterByAccess(items: NavItem[], role: UserRole | undefined) {
  return items.filter((item) => !item.resource || canAccess(item.resource, role))
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const role = user?.role as UserRole | undefined

  const filteredOps = filterByAccess(navOps, role)
  const filteredSales = filterByAccess(navSales, role)
  const filteredSecondary = filterByAccess(navSecondary, role)
  const showQuickOnboard = canAccess("quick_onboard", role)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-30 ml-1 mb-4">
              <Logo />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Dashboard" items={[{ title: "Dashboard", url: "/admin", icon: <LayoutDashboardIcon /> }, ...(canAccess("posts", role) ? [{ title: "Tasks", url: "/admin/posts", icon: <MessageSquareIcon /> }] : [])]} />
        {filteredOps.length > 0 && <NavMain label="Ops" items={filteredOps} />}
        {filteredSales.length > 0 && <NavMain label="Sales" items={filteredSales} />}
        {showQuickOnboard && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 pt-1">
                <Button className="w-full" size="sm" asChild>
                  <Link href="/admin/onboard">
                    <UserPlusIcon className="mr-2 h-4 w-4" />
                    Quick Onboard
                  </Link>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <NavSecondary items={filteredSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.full_name || user?.email || "User",
            email: user?.email || "",
            avatar: "",
          }}
          onLogout={logout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
