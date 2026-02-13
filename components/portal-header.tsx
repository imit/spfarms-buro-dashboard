"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function usePortalPageTitle() {
  const pathname = usePathname();

  // Extract the last segment after the slug
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "Home";

  const last = segments[segments.length - 1];

  const titles: Record<string, string> = {
    storefront: "Storefront",
    settings: "Settings",
    notifications: "Notifications",
  };

  return titles[last] || last.charAt(0).toUpperCase() + last.slice(1);
}

export function PortalHeader() {
  const title = usePortalPageTitle();

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
  );
}
