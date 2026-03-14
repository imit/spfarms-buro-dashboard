"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Company", segment: "company" },
  { label: "Profile", segment: "profile" },
  { label: "Team", segment: "team" },
];

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-white border shadow-sm p-6 sm:p-8">
        <nav className="flex gap-1 border-b mb-6">
          {tabs.map((tab) => {
            const href = `/${slug}/settings/${tab.segment}`;
            const isActive = pathname === href;
            return (
              <Link
                key={tab.segment}
                href={href}
                className={cn(
                  "px-4 py-2.5 text-base font-medium -mb-px border-b-2 transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>

      <Button
        variant="outline"
        className="mt-6 w-full text-muted-foreground"
        size="lg"
        onClick={logout}
      >
        <LogOutIcon className="mr-2 size-4" />
        Log Out
      </Button>
    </div>
  );
}
