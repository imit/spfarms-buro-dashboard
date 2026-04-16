"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPlusIcon } from "lucide-react";

export function QuickOnboardFab() {
  const pathname = usePathname();

  // Hide on the onboard page itself
  if (pathname === "/admin/onboard") return null;

  return (
    <Link
      href="/admin/onboard"
      className="fixed bottom-6 left-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform md:hidden"
      aria-label="Quick Onboard"
    >
      <UserPlusIcon className="size-6" />
    </Link>
  );
}
