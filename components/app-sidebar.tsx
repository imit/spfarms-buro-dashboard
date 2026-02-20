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
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, Settings2Icon, CircleHelpIcon, SearchIcon, BoxIcon, UserPlusIcon, ClipboardListIcon, BellIcon, FlaskConicalIcon, SproutIcon, ShoppingCartIcon } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/contexts/auth-context"

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
  roles?: string[]
}

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Companies",
    url: "/admin/companies",
    icon: <ListIcon />,
  },
  {
    title: "Strains",
    url: "/admin/strains",
    icon: <ChartBarIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <BoxIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Grow",
    url: "/admin/grow",
    icon: <SproutIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: <ClipboardListIcon />,
  },
  {
    title: "Carts",
    url: "/admin/carts",
    icon: <ShoppingCartIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Samples",
    url: "/admin/samples",
    icon: <FlaskConicalIcon />,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: <BellIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Projects",
    url: "/admin/projects",
    icon: <FolderIcon />,
    roles: ["admin", "editor"],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <UsersIcon />,
    roles: ["admin", "editor", "sales"],
  },
  {
    title: "Quick Onboard",
    url: "/admin/onboard",
    icon: <UserPlusIcon />,
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

  const filteredMain = filterByRole(navMain, role)
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
        <NavMain items={filteredMain} />
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
