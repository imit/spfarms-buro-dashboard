"use client";

import posthog from "posthog-js";

/**
 * Attribution capture for the public/landing surface.
 *
 * We capture UTM params, referrer, and the landing URL as PostHog
 * **super properties**, which means they auto-attach to *every*
 * subsequent event in the session — including critical conversions
 * like `wholesale_register_submitted` and the autocaptured CTA clicks.
 *
 * Two flavors are registered:
 *   - `first_*` via `register_once`  → first-touch attribution, persists
 *     across sessions for the same anonymous distinct_id.
 *   - `last_*`  via `register`       → last-touch, overwrites each session.
 *
 * Why both: lets you measure "lead came from the QR flyer originally
 * even though they returned later via Google" (first-touch) AND
 * "the conversion happened on this visit which came from X"
 * (last-touch). Standard marketing attribution practice.
 *
 * Why super properties (not event props): so the data tags the
 * conversion event automatically without having to read storage and
 * pass it through every emitter.
 *
 * QR detection: we don't try to infer "qr_scan = true" in code. Instead
 * we register the raw signals (no referrer + mobile + specific landing
 * path) and let the QR cohort be defined as a PostHog filter. That way
 * it's editable without a deploy if the printed URL changes.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const ATTRIBUTION_FLAG_KEY = "spf_attribution_first_touch_captured";

type Bag = Record<string, string | undefined>;

function readUtms(params: URLSearchParams): Bag {
  const out: Bag = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function safeHost(url: string): string | undefined {
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

/**
 * Idempotent: safe to call on every pageview. First-touch props are
 * only registered on the very first call (gated by localStorage); last-
 * touch and landing-page props refresh on every call.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const utms = readUtms(params);
  const referrer = document.referrer || "";
  const referrerHost = referrer ? safeHost(referrer) : undefined;

  // Last-touch — every visit overwrites
  const lastTouch: Bag = {
    last_landing_path: url.pathname,
    last_landing_url: url.href,
    last_referrer: referrer || undefined,
    last_referrer_host: referrerHost,
    last_seen_at: new Date().toISOString(),
  };
  for (const [k, v] of Object.entries(utms)) lastTouch[`last_${k}`] = v;
  posthog.register(stripUndefined(lastTouch));

  // First-touch — only registered once per anonymous identity
  const firstTouchAlreadySet =
    typeof localStorage !== "undefined" &&
    localStorage.getItem(ATTRIBUTION_FLAG_KEY) === "1";

  if (!firstTouchAlreadySet) {
    const firstTouch: Bag = {
      first_landing_path: url.pathname,
      first_landing_url: url.href,
      first_referrer: referrer || undefined,
      first_referrer_host: referrerHost,
      first_seen_at: new Date().toISOString(),
    };
    for (const [k, v] of Object.entries(utms)) firstTouch[`first_${k}`] = v;

    // `register_once` is PostHog's first-touch primitive; the localStorage
    // flag is a belt-and-suspenders guard so we don't keep paying the
    // serialization cost on every pageview.
    posthog.register_once(stripUndefined(firstTouch));
    try {
      localStorage.setItem(ATTRIBUTION_FLAG_KEY, "1");
    } catch {
      // private mode / storage full — fine, register_once still gates server-side
    }
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== "") out[k] = v;
  }
  return out as Partial<T>;
}
