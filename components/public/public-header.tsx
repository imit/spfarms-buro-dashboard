"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { label: "Strains", href: "/strains" },
  { label: "About", href: "/about" },
  { label: "Find Us", href: "/find-us" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-6xl rounded-2xl border border-black/5 backdrop-blur-xl bg-white/70 shadow-sm">
        <div className="flex h-14 items-center justify-between px-6">
          <Link href="/" className="w-28">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Partner Login
          </Link>
        </div>
      </div>
    </header>
  );
}
