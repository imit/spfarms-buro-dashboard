/**
 * Browser-side cookie helpers.
 *
 * Cookies set with `setSiteCookie` are scoped to the apex domain
 * (`.spfarmsny.com`) on production so they survive moving between
 * subdomains (e.g. friends.spfarmsny.com → spfarmsny.com) and the
 * https://www host. On localhost the `Domain` attribute is omitted
 * so the cookie stays host-only.
 *
 * Note: anything sensitive (JWTs, session ids) should NOT be stored
 * here — this app keeps the auth token in localStorage, which is
 * per-origin by design.
 */

const APEX_DOMAIN = "spfarmsny.com";

function cookieDomainAttr(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  // Only attach Domain= on real spfarmsny.com hosts. Localhost / preview
  // domains (e.g. *.vercel.app) stay host-scoped.
  if (host === APEX_DOMAIN || host.endsWith("." + APEX_DOMAIN)) {
    return `; domain=.${APEX_DOMAIN}`;
  }
  return "";
}

export interface SiteCookieOptions {
  /** Max age in seconds. */
  maxAge: number;
  /** Defaults to "/". */
  path?: string;
  /** Defaults to "lax". */
  sameSite?: "lax" | "strict" | "none";
}

export function setSiteCookie(name: string, value: string, opts: SiteCookieOptions): void {
  if (typeof document === "undefined") return;
  const path = opts.path ?? "/";
  const sameSite = opts.sameSite ?? "lax";
  document.cookie =
    `${name}=${encodeURIComponent(value)}` +
    `; path=${path}` +
    `; max-age=${opts.maxAge}` +
    `; samesite=${sameSite}` +
    cookieDomainAttr();
}
