"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Find Us", href: "/find-us" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5" style={{ backgroundColor: "#FFFBF9" }}>
      <div className="flex h-16 items-center justify-between px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <Link href="/" className="w-32">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-foreground/80 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="text-base font-medium text-primary hover:opacity-80 transition-opacity"
        >
          Partner Login
        </Link>
      </div>
    </header>
  );
}
