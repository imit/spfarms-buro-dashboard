/**
 * NY State OCM (Office of Cannabis Management) license number utilities.
 *
 * License number format: `OCM-<TYPE>-<YY>-<NNNNNN>` with an optional `-<SUFFIX>`
 * (typically a site code like `-C1`).
 *
 * Examples of real license types:
 *   RETD  — Adult-Use Retail Dispensary
 *   CAURD — Conditional Adult-Use Retail Dispensary
 *   MICR  — Microbusiness
 *   MEDD  — Medical Dispensary
 *   AUCC  — Adult-Use Conditional Cultivator
 *   PROC  — Processor
 *   DSTR  — Distributor
 *   ONSC  — On-Site Consumption
 *
 * This is *format* validation only — it does not confirm the license actually
 * exists or is active. For real verification, query NY Open Data (data.ny.gov)
 * cannabis licensees datasets via a server-side service.
 */

// Known type segments that *can* purchase wholesale flower from a microbusiness/cultivator.
// Used only for a softer "this type can't legally buy from us" warning, never to block.
const RETAILER_TYPES = new Set([
  "RETD",   // Retail Dispensary
  "CAURD",  // Conditional Adult-Use Retail Dispensary
  "MICR",   // Microbusiness (can resell)
  "MEDD",   // Medical Dispensary
  "ONSC",   // On-Site Consumption
]);

export type LicenseValidationLevel = "empty" | "invalid" | "valid" | "unusual_type";

export interface LicenseValidationResult {
  level: LicenseValidationLevel;
  message: string;
  type?: string;
  year?: string;
  number?: string;
}

/**
 * Validate the *format* of a license number. Trims and uppercases input
 * before checking. Empty input returns the "empty" level (no error styling).
 */
export function validateOcmLicense(input: string | null | undefined): LicenseValidationResult {
  const value = (input || "").trim().toUpperCase();
  if (!value) {
    return { level: "empty", message: "OCM license required to order." };
  }

  const match = value.match(/^OCM-([A-Z]{3,6})-(\d{2})-(\d{6})(?:-([A-Z0-9]+))?$/);
  if (!match) {
    return {
      level: "invalid",
      message: "Invalid format. Try OCM-RETD-24-000123.",
    };
  }

  const [, type, year, number] = match;

  if (!RETAILER_TYPES.has(type)) {
    return {
      level: "unusual_type",
      message: `Format ok, but ${type} licenses can't buy wholesale. Double-check?`,
      type,
      year,
      number,
    };
  }

  return {
    level: "valid",
    message: `Valid — ${prettyTypeName(type)}.`,
    type,
    year,
    number,
  };
}

/** Best-effort, non-authoritative human label for a license type segment. */
export function prettyTypeName(type: string): string {
  switch (type) {
    case "RETD": return "Adult-Use Retail Dispensary";
    case "CAURD": return "Conditional Adult-Use Retail Dispensary";
    case "MICR": return "Microbusiness";
    case "MEDD": return "Medical Dispensary";
    case "ONSC": return "On-Site Consumption";
    case "AUCC": return "Adult-Use Conditional Cultivator";
    case "CULT": return "Cultivator";
    case "PROC": return "Processor";
    case "DSTR": case "DISTR": return "Distributor";
    default: return `${type} licensee`;
  }
}

/** Normalize input for storage: trim + uppercase. */
export function normalizeOcmLicense(input: string | null | undefined): string {
  return (input || "").trim().toUpperCase();
}

/**
 * Public OCM license search URL — opens NY OCM's public-facing license lookup
 * tool in a new tab so the user (or our team) can manually cross-check.
 */
export function ocmPublicSearchUrl(license?: string | null): string {
  const base = "https://cannabis.ny.gov/licensing-search";
  if (license && license.trim()) {
    return `${base}?q=${encodeURIComponent(license.trim())}`;
  }
  return base;
}
