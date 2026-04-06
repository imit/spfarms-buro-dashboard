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
import { LayoutDashboardIcon, ListIcon, UsersIcon, Settings2Icon, BoxIcon, UserPlusIcon, BellIcon, FlaskConicalIcon, SproutIcon, ShoppingCartIcon, MessageSquareIcon, ImageIcon, TicketIcon, DollarSignIcon, ShieldIcon, StoreIcon, LeafIcon, ShieldAlertIcon, TruckIcon, ActivityIcon, FolderIcon, BuildingIcon } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { canAccess, type Resource } from "@/lib/roles"
import { apiClient, type AppSettings, type UserRole } from "@/lib/api"
import Link from "next/link"

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
  resource?: Resource
  children?: { title: string; url: string; resource?: Resource }[]
}

const navPeopleCompanies: NavItem[] = [
  {
    title: "Companies",
    url: "/admin/companies",
    icon: <BuildingIcon className="text-blue-500" />,
    resource: "companies",
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <UsersIcon className="text-indigo-500" />,
    resource: "users",
  },
]

const navCommerce: NavItem[] = [
  {
    title: "Products",
    url: "/admin/products",
    icon: <BoxIcon className="text-amber-600" />,
    resource: "products",
  },
  {
    title: "Menus",
    url: "/admin/menus",
    icon: <StoreIcon className="text-violet-500" />,
    resource: "products",
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: <ListIcon className="text-sky-500" />,
    resource: "orders_list",
  },
  {
    title: "Payments",
    url: "/admin/payments",
    icon: <DollarSignIcon className="text-emerald-500" />,
    resource: "payments",
  },
  {
    title: "Carts",
    url: "/admin/carts",
    icon: <ShoppingCartIcon className="text-orange-500" />,
    resource: "carts",
  },
  {
    title: "Shipments",
    url: "/admin/shipments",
    icon: <TruckIcon className="text-cyan-600" />,
    resource: "shipments",
  },
  {
    title: "Bulk Flower",
    url: "/admin/bulk-flower",
    icon: <LeafIcon className="text-green-600" />,
    resource: "products",
  },
  {
    title: "Store Preview",
    url: "/admin/store-preview",
    icon: <StoreIcon className="text-pink-500" />,
  },
]

const navGrow: NavItem[] = [
  {
    title: "Strains",
    url: "/admin/strains",
    icon: <SproutIcon className="text-lime-600" />,
    resource: "strains",
  },
  {
    title: "Overview",
    url: "/admin/grow",
    icon: <SproutIcon className="text-green-600" />,
    resource: "grow",
  },
  {
    title: "Batches",
    url: "/admin/grow/batches",
    icon: <SproutIcon className="text-emerald-600" />,
    resource: "grow",
  },
  {
    title: "Harvests",
    url: "/admin/grow/harvests",
    icon: <SproutIcon className="text-teal-600" />,
    resource: "grow",
  },
  {
    title: "Activity",
    url: "/admin/grow/activity",
    icon: <SproutIcon className="text-green-500" />,
    resource: "grow",
  },
  {
    title: "Feed",
    url: "/admin/grow/feed",
    icon: <SproutIcon className="text-lime-500" />,
    resource: "grow",
  },
]

const navMetrc: NavItem[] = [
  {
    title: "Samples",
    url: "/admin/samples",
    icon: <FlaskConicalIcon className="text-purple-500" />,
    resource: "samples",
  },
  {
    title: "METRC Tags",
    url: "/admin/grow/tags",
    icon: <ActivityIcon className="text-rose-500" />,
    resource: "grow",
  },
  {
    title: "Explorer",
    url: "/admin/metrc",
    icon: <ActivityIcon className="text-red-500" />,
    resource: "grow",
  },
  {
    title: "Create Packages",
    url: "/admin/metrc/create-packages",
    icon: <ActivityIcon className="text-orange-600" />,
    resource: "grow",
  },
]

const navSettings: NavItem[] = [
  {
    title: "Audit Logs",
    url: "/admin/audit-log",
    icon: <ShieldAlertIcon className="text-amber-500" />,
    resource: "audit_log",
  },
]

function filterByAccess(items: NavItem[], role: UserRole | undefined) {
  return items.filter((item) => !item.resource || canAccess(item.resource, role))
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout, isAuthenticated } = useAuth()
  const role = user?.role as UserRole | undefined
  const [metrcSettings, setMetrcSettings] = React.useState<AppSettings | null>(null)

  React.useEffect(() => {
    if (!isAuthenticated) return
    apiClient.getSettings().then(setMetrcSettings).catch(() => {})
  }, [isAuthenticated])

  const metrcEnv = metrcSettings?.metrc_default_env || "sandbox"
  const activeLicense = metrcSettings?.facilities?.find((f) => f.metrc_license_number)?.metrc_license_number

  const filteredPeopleCompanies = filterByAccess(navPeopleCompanies, role)
  const filteredCommerce = filterByAccess(navCommerce, role)
  const filteredGrow = filterByAccess(navGrow, role)
  const filteredMetrc = filterByAccess(navMetrc, role)
  const filteredSettings = filterByAccess(navSettings, role)
  const showQuickOnboard = canAccess("quick_onboard", role)

  // Top-level items
  const topItems: NavItem[] = [
    { title: "Dashboard", url: "/admin", icon: <LayoutDashboardIcon className="text-blue-600" /> },
  ]
  if (canAccess("root_dashboard", role)) {
    topItems.push({ title: "Root Dashboard", url: "/admin/root", icon: <ShieldIcon className="text-red-600" /> })
  }

  const workspaceItems: NavItem[] = []
  if (canAccess("projects", role)) {
    workspaceItems.push({ title: "Labels", url: "/admin/projects", icon: <FolderIcon className="text-yellow-600" /> })
  }
  if (canAccess("posts", role)) {
    workspaceItems.push({ title: "Tasks", url: "/admin/posts", icon: <MessageSquareIcon className="text-sky-500" /> })
  }
  if (canAccess("gallery", role)) {
    workspaceItems.push({ title: "Gallery", url: "/admin/gallery", icon: <ImageIcon className="text-pink-500" /> })
  }
  if (canAccess("notifications", role)) {
    workspaceItems.push({ title: "Notifications", url: "/admin/notifications", icon: <BellIcon className="text-amber-500" /> })
  }
  if (canAccess("support_tickets", role)) {
    workspaceItems.push({ title: "Support Tickets", url: "/admin/support-tickets", icon: <TicketIcon className="text-violet-500" /> })
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-30 ml-1 mb-2">
              <Logo />
            </div>
            {activeLicense && (
              <div className="ml-1 mb-3 space-y-1">
                <p className="text-[10px] font-mono text-muted-foreground truncate">{activeLicense}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] cursor-pointer select-none ${
                    metrcEnv === "production"
                      ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                      : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                  }`}
                  onClick={async () => {
                    const newEnv = metrcEnv === "sandbox" ? "production" : "sandbox"
                    const confirmed = newEnv === "production"
                      ? confirm("Switch to PRODUCTION Metrc environment?")
                      : true
                    if (!confirmed) return
                    try {
                      await apiClient.updateSettings({ metrc_default_env: newEnv })
                      setMetrcSettings((prev) => prev ? { ...prev, metrc_default_env: newEnv } : prev)
                    } catch { /* ignore */ }
                  }}
                >
                  METRC: {metrcEnv === "production" ? "PRODUCTION" : "SANDBOX"}
                </Badge>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={topItems} />
        {filteredPeopleCompanies.length > 0 && <NavMain label="People & Companies" items={filteredPeopleCompanies} />}
        {filteredCommerce.length > 0 && <NavMain label="Commerce" items={filteredCommerce} />}
        {filteredGrow.length > 0 && <NavMain label="Grow" items={filteredGrow} />}
        {filteredMetrc.length > 0 && <NavMain label="Metrc" items={filteredMetrc} />}
        {workspaceItems.length > 0 && <NavMain label="Workspace" items={workspaceItems} />}
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
        <NavSecondary items={[
          ...(canAccess("settings", role) ? [{ title: "Settings", url: "/admin/settings", icon: <Settings2Icon className="text-gray-500" /> }] : []),
          ...filteredSettings,
        ]} className="mt-auto" />
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
