"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuIcon, ChevronUpIcon } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { MetaText } from "./style";

/**
 * Public-site top bar + mobile drawer.
 *
 * Desktop: SPFARMS logo on the left, nav links centered, partner + login right.
 *   [SPFARMS]              [HOME · STRAINS · OUR FARM]      [PARTNER SIGN-UP · LOG-IN]
 *
 * Mobile (closed): hamburger + centered SPFARMS wordmark + LOG-IN pill.
 *   [☰]              [SPFARMS]                                          [LOG-IN]
 *
 * Mobile (open): full-screen cream overlay. Top-left collapses to a triangle
 * + "MENU" close affordance; top-right keeps LOG-IN + SIGN-UP. Body holds the
 * primary nav as a big bold display list, then a smaller utility list (the
 * footer's secondary links). Sticky PARTNER SIGN-UP bar at the bottom.
 */

const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/strains", label: "Strains" },
  { href: "/about", label: "Our Farm" },
] as const;

/** Secondary list inside the mobile drawer — mirrors the footer's utility links
 *  so users don't have to scroll to the bottom of the page to find them. */
const SECONDARY_NAV = [
  { href: "/find-us", label: "Find a Dispensary" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
] as const;

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock background scroll while drawer is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className="relative z-40 bg-sf-cream text-sf-ink">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 md:px-12 md:py-6">
          {/* Mobile: hamburger ↔ close trigger */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-sm transition-colors hover:bg-sf-cream-deep/40 md:hidden"
          >
            <MenuIcon className="size-5" strokeWidth={2.25} />
          </button>

          {/* Logo (centered on mobile, left on desktop) */}
          <Link
            href="/"
            aria-label="SPFarms home"
            className="block w-24 md:w-28"
          >
            <Logo />
          </Link>

          {/* Desktop center nav */}
          <nav className="hidden items-center gap-10 md:flex">
            {PRIMARY_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-sf-ink/60"
              >
                <MetaText size="xs">{l.label}</MetaText>
              </Link>
            ))}
          </nav>

          {/* Right: partner signup + login */}
          <nav className="flex items-center gap-4 md:gap-8">
            <Link
              href="/wholesale/register"
              className="hidden transition-colors hover:text-sf-ink/60 md:inline-block"
            >
              <MetaText size="xs">Partner Sign-up</MetaText>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-sm bg-sf-ink px-3 py-1.5 text-sf-cream transition-colors hover:bg-sf-ink/85"
            >
              <MetaText size="xs" className="text-sf-cream">
                Log-in
              </MetaText>
            </Link>
          </nav>
        </div>
      </header>

      {menuOpen && (
        <MobileMenu onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Mobile drawer
   ────────────────────────────────────────────────────────────────────── */

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-50 flex flex-col bg-sf-cream text-sf-ink md:hidden"
    >
      {/* Drawer top bar — mirrors header layout but with close affordance */}
      <div className="flex items-center justify-between gap-6 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex items-center gap-2 rounded-sm px-1 py-1 -ml-1 transition-colors hover:bg-sf-cream-deep/40"
        >
          <ChevronUpIcon
            className="size-4 text-sf-forest"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <MetaText size="xs">Menu</MetaText>
        </button>

        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            onClick={onClose}
            className="transition-colors hover:text-sf-ink/60"
          >
            <MetaText size="xs">Log-in</MetaText>
          </Link>
          <Link
            href="/wholesale/register"
            onClick={onClose}
            className="inline-flex items-center rounded-sm bg-sf-ink px-3 py-1.5 transition-colors hover:bg-sf-ink/85"
          >
            <MetaText size="xs" className="text-sf-cream">
              Sign-up
            </MetaText>
          </Link>
        </nav>
      </div>

      {/* Body — scrollable, padded for the sticky bottom CTA */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32">
        {/* Large nav list */}
        <nav className="flex flex-col">
          {PRIMARY_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="text-[64px] font-bold leading-[1.05] tracking-tight text-sf-ink transition-colors hover:text-sf-ink/70"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Small nav list */}
        <div className="mt-20">
          <MetaText size="xs" className="text-sf-ink/50">
            More
          </MetaText>
          <ul className="mt-3 border-t border-sf-ink/10">
            {SECONDARY_NAV.map((l) => (
              <li key={l.href} className="border-b border-sf-ink/10">
                <Link
                  href={l.href}
                  onClick={onClose}
                  className="block py-4 transition-colors hover:text-sf-ink/60"
                >
                  <MetaText size="sm">{l.label}</MetaText>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-2 bg-linear-to-t from-sf-cream via-sf-cream to-transparent">
        <Link
          href="/wholesale/register"
          onClick={onClose}
          className="flex h-14 items-center justify-center rounded-sm bg-sf-ink transition-colors hover:bg-sf-ink/85"
        >
          <MetaText size="sm" className="text-sf-cream tracking-[0.2em]">
            Partner Sign-up
          </MetaText>
        </Link>
      </div>
    </div>
  );
}
