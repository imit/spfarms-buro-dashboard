"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDownIcon, CheckIcon, BuildingIcon } from "lucide-react";
import posthog from "posthog-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { setActiveCompanySlug } from "@/lib/active-company";
import { cn } from "@/lib/utils";

/**
 * Header dropdown that lets users with multiple `CompanyMembership`s pick the
 * dispensary they're acting on. Behavior:
 *
 *   - Hidden entirely when the user belongs to 0–1 companies (the static
 *     `partner` label keeps the original look in that case).
 *   - On select, navigates to `/{newSlug}/{section}` where `section` is the
 *     first sub-path under the current slug (orders, storefront, settings,
 *     cart, …) — falling back to `storefront`. We deliberately drop deeper
 *     segments (e.g. an order ID) since they don't transfer between tenants.
 *   - Persists the choice via {@link setActiveCompanySlug} so future cold
 *     loads land in the same place. The URL remains the source of truth for
 *     all data fetching (cart, orders, etc.).
 *
 * Cart safety: switching mounts a new `[slug]` segment, so `ShopHeader`'s
 * cart-count effect (keyed on `slug`) re-fetches against the new company's
 * `has_one :cart`. Previously-fetched data is dropped automatically with the
 * route transition. Verified end-to-end: every cart read/write goes through
 * `apiClient.getCompany(slug) → addToCart/getCart(companyId)` — no global
 * cache, no slug-less endpoints, no possibility of cross-tenant leakage.
 */
export function CompanySwitcher({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const memberships = user?.companies ?? [];
  const current = memberships.find((c) => c.slug === slug);

  // Section we'll preserve when switching (e.g. "orders", "storefront").
  // Detail segments after the section are stripped — they reference IDs that
  // don't exist under another tenant.
  const section = useMemo(() => {
    if (!pathname) return "storefront";
    const prefix = `/${slug}`;
    if (!pathname.startsWith(prefix)) return "storefront";
    const tail = pathname.slice(prefix.length).split("/").filter(Boolean);
    return tail[0] || "storefront";
  }, [pathname, slug]);

  // Single-membership case: render the original "partner" label inline so the
  // header layout stays identical for the most common shape.
  if (memberships.length <= 1) {
    return <span className="text-sm text-muted-foreground">partner</span>;
  }

  function handleSelect(nextSlug: string) {
    if (nextSlug === slug) return;
    setActiveCompanySlug(nextSlug);
    posthog.capture("company_switched", {
      from_slug: slug,
      to_slug: nextSlug,
      section,
    });
    router.push(`/${nextSlug}/${section}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm",
          "text-muted-foreground hover:bg-black/5 hover:text-foreground",
          "transition-colors focus:outline-none focus:ring-1 focus:ring-foreground/20",
        )}
        aria-label="Switch dispensary"
      >
        <BuildingIcon className="size-3.5 opacity-70" />
        <span className="max-w-[180px] truncate">
          {current?.name ?? "Choose dispensary"}
        </span>
        <ChevronDownIcon className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[240px]">
        {memberships.map((m) => {
          const isCurrent = m.slug === slug;
          return (
            <DropdownMenuItem
              key={m.slug}
              onSelect={() => handleSelect(m.slug)}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{m.name}</span>
                {m.company_title && (
                  <span className="truncate text-xs text-muted-foreground">
                    {m.company_title}
                  </span>
                )}
              </div>
              {isCurrent && <CheckIcon className="mt-0.5 size-4 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
