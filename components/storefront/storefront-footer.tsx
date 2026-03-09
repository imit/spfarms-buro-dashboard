"use client";

import { InstagramIcon, FacebookIcon, LinkedinIcon } from "lucide-react";
import { openHelpDrawer } from "@/components/storefront/help-drawer";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.86.12V9.01a6.27 6.27 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.55a8.19 8.19 0 0 0 4.77 1.52V6.69h-1.01z" />
    </svg>
  );
}

function SpfarmsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 80" fill="currentColor" className={className}>
      <g transform="translate(0, 5)">
        {/* Bear icon */}
        <g transform="scale(0.75) translate(0, 5)">
          <path d="M129.013 5.01918C125.836 2.18225 121.657 0.623501 117.202 0.623501C112.747 0.623501 108.43 2.21343 105.218 5.14388L100.245 9.69544C90.057 3.33573 78.5911 0 67.0216 0C55.4521 0 43.9862 3.36691 33.7981 9.69544L28.8249 5.14388C25.6131 2.2446 21.3306 0.623501 16.8064 0.623501C12.2822 0.623501 8.17247 2.21343 4.99517 5.01918C-1.60118 10.9113 -1.67025 20.5755 4.82249 26.5612L11.557 32.7026C7.65443 39.717 5.58228 47.012 5.58228 53.8393C5.58228 76.753 29.1012 91 66.987 91C104.873 91 128.392 76.753 128.392 53.8393C128.392 47.012 126.32 39.7482 122.417 32.7026L129.152 26.53C135.679 20.5444 135.61 10.8801 128.979 4.98801L129.013 5.01918Z" fill="currentColor"/>
          <text x="67" y="62" textAnchor="middle" fontSize="32" fontWeight="bold" fontFamily="sans-serif" fill="#FAF0E3">SP</text>
          <text x="67" y="80" textAnchor="middle" fontSize="14" fontFamily="sans-serif" fill="#FAF0E3">✿</text>
        </g>
        {/* FARMS text */}
        <text x="115" y="58" fontSize="56" fontWeight="900" fontFamily="sans-serif" letterSpacing="-1">FARMS</text>
      </g>
    </svg>
  );
}

const RESOURCE_LINKS = [
  { label: "Brand assets", href: "https://spfarmsny.com" },
  { label: "OCM License", href: "https://spfarmsny.com" },
  { label: "Product images", href: "https://spfarmsny.com" },
  { label: "Product COA's", href: "https://spfarmsny.com" },
];

const SOCIAL_LINKS = [
  { icon: InstagramIcon, href: "https://instagram.com/spfarmsny", label: "Instagram" },
  { icon: FacebookIcon, href: "https://facebook.com/spfarmsny", label: "Facebook" },
  { icon: TikTokIcon, href: "https://tiktok.com/@spfarmsny", label: "TikTok" },
  { icon: LinkedinIcon, href: "https://linkedin.com/company/spfarmsny", label: "LinkedIn" },
];

export function StorefrontFooter() {
  return (
    <footer className="mt-16">
      {/* CTA Section */}
      <div className="rounded-t-3xl py-24 px-8" style={{ backgroundColor: "#F9EB65" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img src="/panda-symbol.svg" alt="SPFarms" className="size-16 shrink-0" />
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
              Any questions or feedback?
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={openHelpDrawer}
              className="rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3 text-base font-medium transition-colors"
            >
              Ask here
            </button>
            <span className="text-sm font-medium text-foreground">
              or email info@spfarmsny.com
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="rounded-t-3xl -mt-4 py-12 px-8" style={{ backgroundColor: "#00602E" }}>
        <div className="max-w-5xl mx-auto">
          {/* Resource columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-4">Resources</h3>
              <ul className="space-y-3">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/90 hover:text-white text-base transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-4">Resources</h3>
              <ul className="space-y-3">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/90 hover:text-white text-base transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Logo */}
          <div className="mb-8">
            <img src="/panda-symbol.svg" alt="SPFarms" className="h-20 brightness-0 invert" />
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-white/60">
              <span>&copy;{new Date().getFullYear()} Spfarms (dba Catskill Mountain Cannabis)</span>
              <span>OCM-MICR-24-000028</span>
              <a href="mailto:info@spfarmsny.com" className="hover:text-white transition-colors">
                info@spfarmsny.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
