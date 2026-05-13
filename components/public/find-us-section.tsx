"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPinIcon, NavigationIcon, SearchIcon } from "lucide-react";
import { MetaText, SectionLabel } from "./style";
import { cn } from "@/lib/utils";
import { apiClient, type Stockist } from "@/lib/api";

/**
 * "Find us around" — locate dispensaries that carry SPFarms flower.
 *
 * Two-up layout:
 *   Left  — real Google Map (vector, AdvancedMarker pins) centered on NY state
 *   Right — search controls (geolocation + zip) and a sorted dispensary list
 *
 * Search modes:
 *   1. Free text  — matches name / city / region
 *   2. Geolocation — browser prompt; sorts by haversine distance + pans the map
 *   3. Zip — uses zip-prefix → region centroid; pans the map to that region
 *
 * Env:
 *   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY   — required (already in use; reused here).
 *                                         Make sure the "Maps JavaScript API"
 *                                         is enabled on this key in GCP.
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY     — optional override.
 *   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID      — optional Cloud-styled Map ID for cream
 *                                         theming. Falls back to Google's
 *                                         "DEMO_MAP_ID" placeholder so Advanced
 *                                         Markers render out of the box.
 *
 * Stockists come from /api/v1/public/stockists; admins manage them at
 * /admin/stockists in the dashboard.
 */

export interface Dispensary {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  zip: string;
  lat: number;
  lng: number;
  url?: string;
}

/**
 * Map a Stockist API response into the local Dispensary shape used by the
 * map + list. We drop entries without lat/lng since they can't be pinned.
 */
export function stockistsToDispensaries(stockists: Stockist[]): Dispensary[] {
  return stockists
    .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
    .map((s) => ({
      id: String(s.id),
      name: s.company_name || s.name,
      address: s.address ?? "",
      city: s.city ?? "",
      region: s.region ?? "",
      zip: s.zip_code ?? "",
      lat: s.latitude as number,
      lng: s.longitude as number,
      url: s.website ?? undefined,
    }));
}

export const NY_STATE_CENTER = { lat: 42.9, lng: -75.5 };
export const NY_DEFAULT_ZOOM = 7;

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough zip-prefix → NY region centroid. Falls back to NY state center. */
export const ZIP_PREFIX_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "100": { lat: 40.78, lng: -73.97 },
  "104": { lat: 40.83, lng: -73.91 },
  "112": { lat: 40.70, lng: -73.95 },
  "113": { lat: 40.74, lng: -73.83 },
  "117": { lat: 40.73, lng: -73.45 },
  "119": { lat: 40.93, lng: -72.30 },
  "120": { lat: 42.65, lng: -73.75 },
  "124": { lat: 42.10, lng: -74.55 },
  "125": { lat: 41.55, lng: -73.95 },
  "129": { lat: 44.30, lng: -73.98 },
  "131": { lat: 43.05, lng: -76.15 },
  "140": { lat: 43.05, lng: -78.50 },
  "146": { lat: 43.16, lng: -77.61 },
};

const MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
  "";

/**
 * Map ID is required for AdvancedMarker. We fall back to Google's published
 * "DEMO_MAP_ID" placeholder so markers render out of the box. To get cream-
 * themed map styling, provision a real Map ID in:
 *   https://console.cloud.google.com/google/maps-apis/studio/maps
 * and set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID.
 */
const MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

/* -------------------------------------------------------------------------- */
/*  Section                                                                    */
/* -------------------------------------------------------------------------- */

export function FindUsSection() {
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "pending" | "denied" | "unavailable">("idle");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch the live stockist list. Silent failure — the section just renders
  // empty (with the standard "no matches" message) if the API can't be reached.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .getPublicStockists()
      .then((data) => {
        if (cancelled) return;
        setDispensaries(stockistsToDispensaries(data));
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = dispensaries;
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.region.toLowerCase().includes(q),
      );
    }
    if (origin) {
      list = [...list]
        .map((d) => ({ d, miles: haversineMiles(origin, d) }))
        .sort((a, b) => a.miles - b.miles)
        .map(({ d }) => d);
    }
    return list;
  }, [dispensaries, query, origin]);

  const distanceFor = useMemo(() => {
    if (!origin) return null;
    const map = new Map<string, number>();
    dispensaries.forEach((d) => map.set(d.id, haversineMiles(origin, d)));
    return map;
  }, [dispensaries, origin]);

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
    <section className="px-4 py-12 md:px-8 md:py-20" id="find-us">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel className="font-mono text-xs text-sf-forest-deep">find us around</SectionLabel>
            <h1 className="mt-2 text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep">
              Smoke SPFarms at a
              <br />dispensary near you.
            </h1>
           
          </div>
          <Link
            href="/find-us"
            className="group inline-flex items-center gap-3 self-start md:self-end"
          >
            <MetaText
              size="md"
              className="normal-case tracking-normal text-sf-forest-deep"
            >
              See full list
            </MetaText>
            <Image
              src="/assets/cursor.png"
              alt=""
              width={28}
              height={28}
              aria-hidden="true"
              className="size-3 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1.5 md:size-3.5"
            />
          </Link>
        </div>

        {/* Two-up: map + controls/list */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <DispensaryMap
            dispensaries={dispensaries}
            origin={origin}
            activeId={activeId}
            onPick={setActiveId}
          />

          <div className="flex flex-col rounded-[28px] bg-sf-cream-soft p-5 md:p-7">
            {/* Controls — radii / mono / sizes matched to <PublicHeader> nav */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={useMyLocation}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-sf-ink px-4 text-sf-cream transition-colors hover:bg-sf-forest-deep disabled:opacity-60"
                disabled={geoStatus === "pending"}
              >
                <NavigationIcon className="size-3.5" strokeWidth={2.5} />
                <MetaText size="xs" className="text-sf-cream">
                  {geoStatus === "pending" ? "Locating…" : "Use my location"}
                </MetaText>
              </button>

              {geoStatus === "denied" && (
                <MetaText size="xs" className="block text-sf-forest-deep/70">
                  Location blocked — try the zip search instead.
                </MetaText>
              )}
              {geoStatus === "unavailable" && (
                <MetaText size="xs" className="block text-sf-forest-deep/70">
                  Geolocation not supported in this browser.
                </MetaText>
              )}

              <div className="flex items-center gap-2 py-1">
                <span className="h-px flex-1 bg-sf-cream-deep" />
                <MetaText size="xs" className="text-sf-forest-deep/50">
                  or
                </MetaText>
                <span className="h-px flex-1 bg-sf-cream-deep" />
              </div>

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
                  className="h-10 w-full rounded-md border border-sf-cream-deep bg-sf-cream pl-9 pr-21 font-mono text-xs uppercase tracking-[0.18em] text-sf-forest-deep placeholder:text-sf-forest-deep/40 focus:border-sf-forest focus:outline-none"
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
                  placeholder="FILTER BY NAME OR CITY"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 w-full rounded-md border border-sf-cream-deep bg-sf-cream pl-9 pr-3 font-mono text-xs uppercase tracking-[0.18em] text-sf-forest-deep placeholder:text-sf-forest-deep/40 focus:border-sf-forest focus:outline-none"
                />
              </div>

              {origin && (
                <div className="flex items-center justify-between rounded-md bg-sf-lime/50 px-3 py-1.5">
                  <MetaText size="xs" className="text-sf-forest-deep">
                    Sorting from {origin.label}
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
            </div>

            {/* Results */}
            <ul className="mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {results.length === 0 && (
                <li className="rounded-2xl bg-sf-cream p-5 text-sm text-sf-forest-deep/60">
                  No matches — try a different zip or clear the filter.
                </li>
              )}
              {results.map((d) => (
                <li key={d.id}>
                  <DispensaryRow
                    dispensary={d}
                    distanceMi={distanceFor?.get(d.id)}
                    active={d.id === activeId}
                    onHover={() => setActiveId(d.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Result row                                                                */
/* -------------------------------------------------------------------------- */

function DispensaryRow({
  dispensary,
  distanceMi,
  active,
  onHover,
}: {
  dispensary: Dispensary;
  distanceMi?: number;
  active: boolean;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
        active ? "bg-sf-lime/40" : "bg-sf-cream hover:bg-sf-cream-deep/40",
      )}
    >
      <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-sf-orange text-sf-cream">
        <MapPinIcon className="size-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-bold text-sf-forest-deep">{dispensary.name}</p>
          {typeof distanceMi === "number" && (
            <MetaText size="xs" className="shrink-0 text-sf-forest-deep/60">
              {distanceMi.toFixed(1)} mi
            </MetaText>
          )}
        </div>
        <p className="truncate text-xs text-sf-forest-deep/60">
          {dispensary.address} · {dispensary.city}, NY {dispensary.zip}
        </p>
        <MetaText size="xs" className="mt-1 block tracking-widest! text-sf-forest-deep/50">
          {dispensary.region}
        </MetaText>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Real Google Map                                                           */
/* -------------------------------------------------------------------------- */

export function DispensaryMap(props: {
  dispensaries: Dispensary[];
  origin: { lat: number; lng: number; label: string } | null;
  activeId: string | null;
  onPick: (id: string | null) => void;
  /** Override the map container sizing — defaults to `aspect-16/10`.
   *  Pass e.g. `"h-full"` for sticky-fill layouts, or `"aspect-square"` for tall. */
  containerClassName?: string;
}) {
  if (!MAPS_API_KEY) {
    return <MapSetupNotice variant="missing-key" containerClassName={props.containerClassName} />;
  }
  return (
    <MapErrorBoundary
      fallback={<MapSetupNotice variant="api-not-activated" containerClassName={props.containerClassName} />}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[28px] bg-sf-cream-soft",
          props.containerClassName ?? "aspect-16/10",
        )}
      >
        <APIProvider apiKey={MAPS_API_KEY} libraries={["marker"]}>
          <GoogleMap
            defaultCenter={NY_STATE_CENTER}
            defaultZoom={NY_DEFAULT_ZOOM}
            mapId={MAPS_MAP_ID}
            gestureHandling="greedy"
            disableDefaultUI={false}
            clickableIcons={false}
            className="h-full w-full"
          >
            <MapAutoFit origin={props.origin} dispensaries={props.dispensaries} />
            {props.dispensaries.map((d) => (
              <DispensaryMarker
                key={d.id}
                dispensary={d}
                active={d.id === props.activeId}
                onActivate={() => props.onPick(d.id)}
                onDeactivate={() => props.onPick(null)}
              />
            ))}
            {props.origin && <OriginMarker origin={props.origin} />}
          </GoogleMap>
        </APIProvider>

        {/* Branded legend overlay (sits above the map) */}
        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-3 rounded-full bg-sf-cream/90 px-3 py-1.5 backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sf-orange" />
            <MetaText size="xs" className="text-sf-forest-deep/70">
              Carries SPFarms
            </MetaText>
          </span>
          {props.origin && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sf-lime ring-2 ring-sf-forest-deep/40" />
              <MetaText size="xs" className="text-sf-forest-deep/70">
                You
              </MetaText>
            </span>
          )}
        </div>
      </div>
    </MapErrorBoundary>
  );
}

/**
 * Catches crashes from the Google Maps SDK when the Maps JavaScript API is not
 * activated on the project, when AdvancedMarker fails to bind, etc. The right-
 * hand search/list keeps working regardless.
 */
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    // Surface the underlying cause once so the developer sees what to fix.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[FindUsSection] Google Maps failed to render:", error.message);
    }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * When `origin` changes, smoothly fit the map to show the origin + nearest
 * 3 dispensaries. With no origin, snap back to NY state overview.
 */
function MapAutoFit({
  origin,
  dispensaries,
}: {
  origin: { lat: number; lng: number } | null;
  dispensaries: Dispensary[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (!origin) {
      map.panTo(NY_STATE_CENTER);
      map.setZoom(NY_DEFAULT_ZOOM);
      return;
    }

    // Find the 3 nearest dispensaries to the origin and fit them in view
    const nearest = [...dispensaries]
      .map((d) => ({ d, miles: haversineMiles(origin, d) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 3)
      .map(({ d }) => d);

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    nearest.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
    map.fitBounds(bounds, 80);
  }, [map, origin, dispensaries]);

  return null;
}

function DispensaryMarker({
  dispensary,
  active,
  onActivate,
  onDeactivate,
}: {
  dispensary: Dispensary;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <>
      <AdvancedMarker
        position={{ lat: dispensary.lat, lng: dispensary.lng }}
        onClick={onActivate}
      >
        <Pin
          background="var(--sf-orange)"
          borderColor="var(--sf-cream)"
          glyphColor="var(--sf-cream)"
          scale={active ? 1.35 : 1}
        />
      </AdvancedMarker>
      {active && (
        <InfoWindow
          position={{ lat: dispensary.lat, lng: dispensary.lng }}
          pixelOffset={[0, -42]}
          onCloseClick={onDeactivate}
          headerDisabled
        >
          <div className="min-w-[180px] px-1 py-0.5">
            <p className="text-sm font-bold text-sf-forest-deep">{dispensary.name}</p>
            <p className="mt-0.5 text-xs text-sf-forest-deep/70">
              {dispensary.address} · {dispensary.city}, NY {dispensary.zip}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function OriginMarker({ origin }: { origin: { lat: number; lng: number } }) {
  return (
    <AdvancedMarker position={origin}>
      <span className="relative flex size-5 items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-sf-lime opacity-60" />
        <span className="relative inline-flex size-3 rounded-full bg-sf-lime ring-2 ring-sf-forest-deep" />
      </span>
    </AdvancedMarker>
  );
}

function MapSetupNotice({
  variant,
  containerClassName,
}: {
  variant: "missing-key" | "api-not-activated";
  containerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[28px] bg-sf-cream-soft p-8 text-center",
        containerClassName ?? "aspect-16/10",
      )}
    >
      <span className="rounded-full bg-sf-orange/20 px-3 py-1">
        <MetaText size="xs" className="text-sf-forest-deep/80">
          Map setup needed
        </MetaText>
      </span>
      {variant === "missing-key" ? (
        <p className="max-w-sm text-sm text-sf-forest-deep/70">
          No Google Maps API key found. Set{" "}
          <code className="font-mono">NEXT_PUBLIC_GOOGLE_PLACES_API_KEY</code> in{" "}
          <code className="font-mono">.env.local</code> and enable the{" "}
          <strong>Maps JavaScript API</strong> on that key. The list on the right works without it.
        </p>
      ) : (
        <div className="max-w-md space-y-2 text-sm text-sf-forest-deep/80">
          <p className="font-semibold">Maps JavaScript API isn&rsquo;t enabled on this key.</p>
          <p>
            Open{" "}
            <a
              className="underline"
              href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Cloud Console → Maps JavaScript API
            </a>
            , click <strong>Enable</strong>, then refresh.
          </p>
          <p className="text-xs text-sf-forest-deep/60">
            Same project that already has Places enabled — no separate key needed.
          </p>
        </div>
      )}
    </div>
  );
}
