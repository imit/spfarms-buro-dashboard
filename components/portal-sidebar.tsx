"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  Settings2Icon,
  BellIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/contexts/auth-context";

export function PortalSidebar({
  slug,
  ...props
}: { slug: string } & React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      title: "Home",
      url: `/${slug}`,
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Storefront",
      url: `/${slug}/storefront`,
      icon: <ShoppingBagIcon />,
    },
    {
      title: "Notifications",
      url: `/${slug}/notifications`,
      icon: <BellIcon />,
    },
  ];

  const navSecondary = [
    {
      title: "Settings",
      url: `/${slug}/settings`,
      icon: <Settings2Icon />,
    },
  ];

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
        <NavMain items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
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
  );
}
