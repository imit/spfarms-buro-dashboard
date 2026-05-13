"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPinIcon,
  NavigationIcon,
  SearchIcon,
  ExternalLinkIcon,
  XIcon,
} from "lucide-react";
import { apiClient, type Stockist } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MetaText, SectionLabel } from "./style";
import {
  type Dispensary,
  haversineMiles,
  stockistsToDispensaries,
  ZIP_PREFIX_CENTROIDS,
  NY_STATE_CENTER,
  DispensaryMap,
} from "./find-us-section";

/**
 * Full /find-us page — pairs a sticky large map with a complete, region-
 * grouped list. Reuses the same `<DispensaryMap>` and helper functions as
 * the homepage section so behavior stays in lockstep.
 *
 * Layout:
 *   - Header band: H1 + subtitle + search controls (geolocation + zip)
 *   - Region chips below: filter both the markers and the list at once
 *   - Two-column on desktop:
 *       LEFT  (sticky)  — large map (≈ tall as viewport - header)
 *       RIGHT           — region-grouped list, anchor-jumpable from chips
 *   - On mobile: map sits on top (40vh), list fills below.
 *
 * State that drives the page:
 *   - `dispensaries` — fetched once
 *   - `query`        — name/city free text
 *   - `regionFilter` — chip-driven; `null` = All
 *   - `origin`       — set by "Use my location" or zip search; sorts the list
 *                      and pans the map
 *   - `activeId`     — hover sync between map markers and cards
 */
export function FindUsFullPage() {
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("");
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "pending" | "denied" | "unavailable">("idle");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch once
  useEffect(() => {
    let cancelled = false;
    apiClient
      .getPublicStockists()
      .then((data: Stockist[]) => {
        if (cancelled) return;
        setDispensaries(stockistsToDispensaries(data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // All region values that exist in the dataset (for the chip nav)
  const regions = useMemo(() => {
    const set = new Set<string>();
    dispensaries.forEach((d) => {
      if (d.region) set.add(d.region);
    });
    return Array.from(set).sort();
  }, [dispensaries]);

  // Filtered + (optionally) distance-sorted list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = dispensaries;
    if (regionFilter) list = list.filter((d) => d.region === regionFilter);
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.region.toLowerCase().includes(q),
      );
    }
    if (origin) {
      list = [...list].sort((a, b) => haversineMiles(origin, a) - haversineMiles(origin, b));
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [dispensaries, query, regionFilter, origin]);

  const distanceFor = useMemo(() => {
    if (!origin) return null;
    const m = new Map<string, number>();
    dispensaries.forEach((d) => m.set(d.id, haversineMiles(origin, d)));
    return m;
  }, [dispensaries, origin]);

  // Group filtered list by region. Within each region we keep the upstream
  // order (which is either distance-asc or name-asc).
  const grouped = useMemo(() => {
    const map = new Map<string, Dispensary[]>();
    for (const d of filtered) {
      const key = d.region || "Other";
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    // If sorting by distance, list groups by closest member first.
    const entries = Array.from(map.entries());
    if (origin) {
      entries.sort((a, b) => {
        const ma = haversineMiles(origin, a[1][0]);
        const mb = haversineMiles(origin, b[1][0]);
        return ma - mb;
      });
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    return entries;
  }, [filtered, origin]);

  /* -------- Search actions -------- */

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        });
        setGeoStatus("idle");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  function searchByZip(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.replace(/\D/g, "").slice(0, 5);
    if (trimmed.length < 3) return;
    const prefix = trimmed.slice(0, 3);
    const centroid = ZIP_PREFIX_CENTROIDS[prefix] ?? NY_STATE_CENTER;
    setOrigin({ ...centroid, label: `Near ${trimmed}` });
  }

  function clearOrigin() {
    setOrigin(null);
    setZip("");
  }

  return (
    <>
      {/* ── Header band ─────────────────────────────────────────────────── */}
      <section className="px-4 pt-6 pb-8 md:px-8 md:pt-10 md:pb-12">
        <div className="mx-auto max-w-[1400px]">
          <SectionLabel className="font-mono text-xs text-sf-forest-deep">find us around</SectionLabel>
          <h1 className="mt-2 text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep">
           Smoke SPFarms at a
            <br />dispensary near you.
          </h1>
          <p className="mt-4 max-w-xl text-sf-forest-deep/70">
            We&rsquo;re carried at {dispensaries.length || "select"} dispensaries across New York.
            Use your location, search by zip, or browse the list below.
          </p>

          {/* Search controls — radii / mono / sizes matched to <PublicHeader> nav */}
          <div className="mt-8 grid gap-2.5 md:grid-cols-[auto_auto_1fr] md:items-center">
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-sf-ink px-4 text-sf-cream transition-colors hover:bg-sf-forest-deep disabled:opacity-60"
              disabled={geoStatus === "pending"}
            >
              <NavigationIcon className="size-3.5" strokeWidth={2.5} />
              <MetaText size="xs" className="text-sf-cream">
                {geoStatus === "pending" ? "Locating…" : "Use my location"}
              </MetaText>
            </button>

            <form onSubmit={searchByZip} className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sf-forest-deep/40"
                strokeWidth={2.25}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="ZIP CODE"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="h-10 w-full rounded-md border border-sf-cream-deep bg-sf-cream pl-9 pr-21 font-mono text-xs uppercase tracking-[0.18em] text-sf-forest-deep placeholder:text-sf-forest-deep/40 focus:border-sf-forest focus:outline-none md:w-56"
                maxLength={5}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 inline-flex h-8 items-center rounded-md bg-sf-lime px-3 text-sf-forest-deep transition-colors hover:bg-sf-lime-dark"
              >
                <MetaText size="xs" className="text-sf-forest-deep">
                  Search
                </MetaText>
              </button>
            </form>

            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sf-forest-deep/40"
                strokeWidth={2.25}
              />
              <input
                type="text"
                placeholder="FILTER BY NAME, CITY, OR REGION"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-sf-cream-deep bg-sf-cream pl-9 pr-9 font-mono text-xs uppercase tracking-[0.18em] text-sf-forest-deep placeholder:text-sf-forest-deep/40 focus:border-sf-forest focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear filter"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sf-forest-deep/50 hover:text-sf-forest-deep"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {geoStatus === "denied" && (
            <MetaText size="xs" className="mt-3 block text-sf-forest-deep/70">
              Location blocked — try the zip search instead.
            </MetaText>
          )}
          {geoStatus === "unavailable" && (
            <MetaText size="xs" className="mt-3 block text-sf-forest-deep/70">
              Geolocation isn&rsquo;t supported in this browser.
            </MetaText>
          )}

          {origin && (
            <div className="mt-4 inline-flex items-center gap-3 rounded-md bg-sf-lime/50 px-3 py-1.5">
              <MetaText size="xs" className="text-sf-forest-deep">
                Sorting by distance from {origin.label}
              </MetaText>
              <button
                type="button"
                onClick={clearOrigin}
                className="text-sf-forest-deep underline-offset-2 hover:underline"
              >
                <MetaText size="xs" className="text-sf-forest-deep">
                  Clear
                </MetaText>
              </button>
            </div>
          )}

          {/* Region chips */}
          {regions.length > 0 && (
            <nav
              aria-label="Filter by region"
              className="mt-6 flex flex-wrap gap-2"
            >
              <RegionChip
                label="All"
                active={regionFilter === null}
                onClick={() => setRegionFilter(null)}
                count={dispensaries.length}
              />
              {regions.map((r) => (
                <RegionChip
                  key={r}
                  label={r}
                  active={regionFilter === r}
                  onClick={() => setRegionFilter(r === regionFilter ? null : r)}
                  count={dispensaries.filter((d) => d.region === r).length}
                />
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* ── Map + list ──────────────────────────────────────────────────── */}
      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
          {/* Map column — sticky on desktop */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="h-[42vh] min-h-[320px] lg:h-[calc(100vh-2rem)] lg:max-h-[820px]">
              <DispensaryMap
                dispensaries={filtered}
                origin={origin}
                activeId={activeId}
                onPick={setActiveId}
                containerClassName="h-full"
              />
            </div>
          </div>

          {/* List column */}
          <div>
            {filtered.length === 0 ? (
              <div className="rounded-[28px] bg-sf-cream-soft p-8 text-center">
                <p className="text-sm text-sf-forest-deep/60">
                  No matches — try a different region, zip, or filter.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {grouped.map(([region, entries]) => (
                  <section key={region} aria-labelledby={`region-${slugify(region)}`}>
                    <header
                      id={`region-${slugify(region)}`}
                      className="mb-3 flex items-baseline justify-between gap-3"
                    >
                      <h2 className="text-xl font-bold tracking-tight text-sf-forest-deep">
                        {region}
                      </h2>
                      <MetaText size="xs" className="text-sf-forest-deep/50">
                        {entries.length} {entries.length === 1 ? "shop" : "shops"}
                      </MetaText>
                    </header>
                    <ul className="space-y-2">
                      {entries.map((d) => (
                        <li key={d.id}>
                          <StockistCard
                            dispensary={d}
                            distanceMi={distanceFor?.get(d.id)}
                            active={activeId === d.id}
                            onHover={() => setActiveId(d.id)}
                            onLeave={() => setActiveId(null)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Region chip                                                                */
/* -------------------------------------------------------------------------- */

function RegionChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors",
        active
          ? "border-sf-ink bg-sf-ink text-sf-cream"
          : "border-sf-cream-deep bg-sf-cream-soft text-sf-forest-deep hover:bg-sf-cream-deep/40",
      )}
    >
      <MetaText size="xs" className={active ? "text-sf-cream" : "text-sf-forest-deep"}>
        {label}
      </MetaText>
      <span
        className={cn(
          "rounded-sm px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
          active
            ? "bg-sf-cream/15 text-sf-cream"
            : "bg-sf-cream text-sf-forest-deep/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stockist card — bigger version of the homepage row                        */
/* -------------------------------------------------------------------------- */

function StockistCard({
  dispensary,
  distanceMi,
  active,
  onHover,
  onLeave,
}: {
  dispensary: Dispensary;
  distanceMi?: number;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const fullAddress = [dispensary.address, dispensary.city, "NY", dispensary.zip]
    .filter(Boolean)
    .join(", ");
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    fullAddress,
  )}`;

  return (
    <article
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      className={cn(
        "group relative flex gap-4 rounded-2xl border p-4 transition-all md:p-5",
        active
          ? "border-sf-forest-deep bg-sf-lime/30 shadow-sm"
          : "border-sf-cream-deep bg-sf-cream-soft hover:border-sf-forest-deep/30",
      )}
    >
      <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-sf-orange text-sf-cream">
        <MapPinIcon className="size-5" strokeWidth={2.5} />
      </span>

      <div className="min-w-0 flex-1">
        <header className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-base font-bold text-sf-forest-deep md:text-lg">
            {dispensary.name}
          </h3>
          {typeof distanceMi === "number" && (
            <MetaText size="xs" className="shrink-0 text-sf-forest-deep/60">
              {distanceMi.toFixed(1)} mi
            </MetaText>
          )}
        </header>

        <p className="mt-0.5 text-sm text-sf-forest-deep/70">
          {fullAddress || "Address coming soon"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-sf-forest-deep underline-offset-2 hover:underline"
          >
            Directions
            <ExternalLinkIcon className="size-3" strokeWidth={2.5} />
          </a>
          {dispensary.url && (
            <a
              href={dispensary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-sf-forest-deep underline-offset-2 hover:underline"
            >
              Website
              <ExternalLinkIcon className="size-3" strokeWidth={2.5} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
