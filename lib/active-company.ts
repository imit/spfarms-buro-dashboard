/**
 * Helpers for tracking the user's currently-active company (dispensary) when
 * they belong to more than one. This is a UX convenience only — server-side
 * scoping of orders / cart / etc. is always derived from the URL slug
 * (`/[slug]/...`) plus the user's `company_memberships`. We use this to:
 *
 *   1. Pick the right slug to redirect to on login (instead of always the
 *      oldest membership via `user.company_slug`).
 *   2. Remember which dispensary a multi-membership user was last working in,
 *      so cold loads / external links land them in the right place.
 *
 * Storage: localStorage. Cleared on logout via the auth context.
 */

import type { User, UserCompanyMembership } from "@/lib/api";

const STORAGE_KEY = "sf_active_company";

export function getActiveCompanySlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setActiveCompanySlug(slug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // localStorage might be disabled — fail silently, the URL is still the
    // source of truth.
  }
}

export function clearActiveCompanySlug() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

/**
 * Resolve the slug we should send a multi-company user to when we don't have
 * an explicit one (login redirect, root visit, etc.).
 *
 * Priority:
 *   1. Last-active slug (if it's still a valid membership)
 *   2. `user.company_slug` (the API's notion of primary — first membership)
 *   3. First entry in `user.companies` as a final fallback
 *   4. `null` if the user has no memberships
 */
export function preferredCompanySlug(user: Pick<User, "company_slug" | "companies">): string | null {
  const memberships: UserCompanyMembership[] = user.companies ?? [];
  const validSlugs = new Set(memberships.map((c) => c.slug));

  const last = getActiveCompanySlug();
  if (last && validSlugs.has(last)) return last;

  if (user.company_slug && validSlugs.has(user.company_slug)) return user.company_slug;

  return memberships[0]?.slug ?? user.company_slug ?? null;
}
