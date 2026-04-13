"use client";

import Link from "next/link";
import { InstagramIcon, FacebookIcon, LinkedinIcon } from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.86.12V9.01a6.27 6.27 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.55a8.19 8.19 0 0 0 4.77 1.52V6.69h-1.01z" />
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    title: "Strains",
    links: [
      { label: "All Strains", href: "/strains" },
      { label: "Find a Dispensary", href: "/find-us" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Partners",
    links: [
      { label: "Partner Login", href: "/login" },
      { label: "Wholesale Inquiry", href: "/wholesale" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: InstagramIcon, href: "https://instagram.com/spfarmsny", label: "Instagram" },
  { icon: FacebookIcon, href: "https://facebook.com/spfarmsny", label: "Facebook" },
  { icon: TikTokIcon, href: "https://tiktok.com/@spfarmsny", label: "TikTok" },
  { icon: LinkedinIcon, href: "https://linkedin.com/company/spfarmsny", label: "LinkedIn" },
];

export function PublicFooter() {
  return (
    <footer className="mt-20">
      <div className="rounded-t-3xl py-12 px-8" style={{ backgroundColor: "#00602E" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-12">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-white/80 mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-white/90 hover:text-white text-base transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <img src="/panda-symbol.svg" alt="SPFarms" className="h-20 brightness-0 invert" />
          </div>

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
