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
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, Settings2Icon, CircleHelpIcon, SearchIcon, BoxIcon, UserPlusIcon, ClipboardListIcon, BellIcon, FlaskConicalIcon, SproutIcon, ShoppingCartIcon, PackageCheckIcon } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
  roles?: string[]
}

const navOps: NavItem[] = [
  {
    title: "Strains",
    url: "/admin/strains",
    icon: <ChartBarIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Grow",
    url: "/admin/grow",
    icon: <SproutIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Samples",
    url: "/admin/samples",
    icon: <FlaskConicalIcon />,
  },
  {
    title: "Projects",
    url: "/admin/projects",
    icon: <FolderIcon />,
    roles: ["admin", "editor"],
  },
]

const navSales: NavItem[] = [
  {
    title: "Companies",
    url: "/admin/companies",
    icon: <ListIcon />,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <UsersIcon />,
    roles: ["admin", "editor", "sales"],
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: <ClipboardListIcon />,
  },
  {
    title: "Fulfilment",
    url: "/admin/fulfilment",
    icon: <PackageCheckIcon />,
  },
  {
    title: "Carts",
    url: "/admin/carts",
    icon: <ShoppingCartIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <BoxIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: <BellIcon />,
    roles: ["admin", "editor"],
  },
]

const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/admin/settings",
    icon: <Settings2Icon />,
    roles: ["admin"],
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

function filterByRole(items: NavItem[], role: string | undefined) {
  return items.filter((item) => !item.roles || (role && item.roles.includes(role)))
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const role = user?.role

  const filteredOps = filterByRole(navOps, role)
  const filteredSales = filterByRole(navSales, role)
  const filteredSecondary = filterByRole(navSecondary, role)

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
        <NavMain label="Dashboard" items={[{ title: "Dashboard", url: "/admin", icon: <LayoutDashboardIcon /> }]} />
        <NavMain label="Ops" items={filteredOps} />
        <NavMain label="Sales" items={filteredSales} />
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
