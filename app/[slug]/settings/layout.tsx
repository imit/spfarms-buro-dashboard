"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
                  "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
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
    </div>
  );
}
