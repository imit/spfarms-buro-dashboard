"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PlusIcon,
  StoreIcon,
  ZapIcon,
  HandIcon,
  ExternalLinkIcon,
  XIcon,
  SearchIcon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, type Stockist, type Company } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Admin → Stockists
 *
 * The list of dispensaries that show on the public Find Us map. Two sources:
 *   - "Customer" (auto): companies that have placed an order; their shipping
 *      location is auto-promoted via the Order#promote_shipping_location_to_stockist
 *      callback in the Rails app.
 *   - "Manual": admins added them here for shops we don't yet have an account
 *      with (target dispensaries, sample-only relationships, pop-ups).
 *
 * Visibility on the public site is controlled by the per-row toggle. Hiding a
 * row doesn't delete anything — we keep the underlying Location for order
 * history reasons. The "Add stockist" dialog creates a Company + Location pair
 * in one go.
 */

type VisibilityFilter = "all" | "visible" | "hidden";
type SourceFilter = "all" | "manual" | "auto_from_order";

export default function AdminStockistsPage() {
  const [stockists, setStockists] = useState<Stockist[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminStockists({
        visibility,
        source,
        q: debouncedQ || undefined,
      });
      setStockists(data);
    } catch (err) {
      toast.error("Failed to load stockists", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [visibility, source, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic toggle of public_listing
  async function toggleVisibility(stockist: Stockist) {
    const next = !stockist.public_listing;
    setBusyId(stockist.id);
    setStockists((prev) =>
      prev.map((s) => (s.id === stockist.id ? { ...s, public_listing: next } : s)),
    );
    try {
      await apiClient.updateStockist(stockist.id, { public_listing: next });
    } catch (err) {
      // Revert on failure
      setStockists((prev) =>
        prev.map((s) =>
          s.id === stockist.id ? { ...s, public_listing: !next } : s,
        ),
      );
      toast.error("Couldn't update visibility", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    return {
      total: stockists.length,
      visible: stockists.filter((s) => s.public_listing).length,
      auto: stockists.filter((s) => s.public_listing_source === "auto_from_order").length,
      manual: stockists.filter((s) => s.public_listing_source === "manual").length,
    };
  }, [stockists]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-10 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <StoreIcon className="size-6" /> Stockists
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Dispensaries that show on the public Find Us map. New customers are added
            automatically when they place their first order.
          </p>
        </div>
        <AddStockistDialog onCreated={load} />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatChip label="Total" value={counts.total} />
        <StatChip label="Visible on site" value={counts.visible} accent="emerald" />
        <StatChip label="Auto from orders" value={counts.auto} icon={<ZapIcon className="size-3.5" />} />
        <StatChip label="Manual" value={counts.manual} icon={<HandIcon className="size-3.5" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterPills<VisibilityFilter>
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "all", label: "All" },
            { value: "visible", label: "Visible" },
            { value: "hidden", label: "Hidden" },
          ]}
        />
        <span className="h-6 w-px bg-border mx-1" aria-hidden />
        <FilterPills<SourceFilter>
          value={source}
          onChange={setSource}
          options={[
            { value: "all", label: "All sources" },
            { value: "auto_from_order", label: "From orders" },
            { value: "manual", label: "Manual" },
          ]}
        />
        <div className="ml-auto relative w-full sm:w-72">
          <Input
            type="text"
            placeholder="Search by company, city, zip…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-8"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Visible</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && stockists.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && stockists.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <p className="font-medium text-foreground mb-1">No stockists yet.</p>
                  <p className="text-sm">
                    Companies that order from you will appear here automatically.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {stockists.map((s) => (
              <TableRow key={s.id} className={!s.public_listing ? "opacity-60" : undefined}>
                <TableCell className="font-medium">{s.company_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[s.address, s.city, s.state, s.zip_code].filter(Boolean).join(", ") ||
                    "—"}
                </TableCell>
                <TableCell>
                  {s.public_listing_source === "auto_from_order" ? (
                    <Badge variant="secondary" className="font-normal">
                      <ZapIcon className="size-3 mr-1" /> Customer
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      <HandIcon className="size-3 mr-1" /> Manual
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {s.orders_count ?? 0}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={!!s.public_listing}
                    onCheckedChange={() => toggleVisibility(s)}
                    disabled={busyId === s.id}
                    aria-label={`Toggle visibility for ${s.company_name}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/companies/${s.company_slug}`}
                    className="text-muted-foreground hover:text-foreground inline-flex"
                    aria-label="Open company"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Filter pills                                                              */
/* -------------------------------------------------------------------------- */

function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border bg-muted/30 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${
            value === opt.value
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat chip                                                                 */
/* -------------------------------------------------------------------------- */

function StatChip({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "emerald";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={`mt-0.5 text-2xl font-semibold tabular-nums ${
          accent === "emerald" ? "text-emerald-600" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Add stockist dialog — picks an existing Company.                          */
/*  No freeform form; if the company doesn't exist yet, admin adds it on the  */
/*  Companies page first, then comes back here.                               */
/* -------------------------------------------------------------------------- */

function AddStockistDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(id);
  }, [q]);

  // Load companies when the dialog is open. We pull a healthy slice and the
  // q filter narrows it down server-side.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .getCompanies({ q: debouncedQ || undefined, per_page: 50 })
      .then((res) => {
        if (cancelled) return;
        setCompanies(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error("Couldn't load companies", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQ]);

  async function feature(company: Company) {
    if (!company.locations || company.locations.length === 0) {
      toast.error(`${company.name} has no addresses`, {
        description: "Add one on the company page first.",
      });
      return;
    }
    setSubmittingId(company.id);
    try {
      await apiClient.createStockist({ company_id: company.id });
      toast.success(`${company.name} added to stockists`);
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error("Couldn't add stockist", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" /> Add stockist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add stockist</DialogTitle>
          <DialogDescription>
            Pick a company to feature on the public Find Us map. All of its
            locations get added.{" "}
            <Link href="/admin/companies" className="underline">
              Need to create one?
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            type="text"
            placeholder="Search companies…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <ul className="max-h-[420px] overflow-y-auto rounded-md border divide-y">
          {loading && companies.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">Loading…</li>
          )}
          {!loading && companies.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No companies match &ldquo;{debouncedQ}&rdquo;.
            </li>
          )}
          {companies.map((c) => {
            const primaryLoc = c.locations?.[0];
            const noLocations = !c.locations || c.locations.length === 0;
            const allListed =
              !noLocations &&
              c.locations.every(
                // The Company endpoint may not include public_listing on locations;
                // if absent we don't claim "all listed" — let the admin re-add.
                (l) =>
                  (l as { public_listing?: boolean }).public_listing === true,
              );
            const submitting = submittingId === c.id;

            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => feature(c)}
                  disabled={submitting || noLocations}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    {primaryLoc ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {[primaryLoc.city, primaryLoc.state, primaryLoc.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                        {c.locations.length > 1 && (
                          <span> · +{c.locations.length - 1} more</span>
                        )}
                      </p>
                    ) : (
                      <p className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircleIcon className="size-3" />
                        No address yet
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 self-center text-xs text-muted-foreground">
                    {submitting ? (
                      "Adding…"
                    ) : allListed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckIcon className="size-3" /> Listed
                      </span>
                    ) : noLocations ? (
                      <Link
                        href={`/admin/companies/${c.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="underline pointer-events-auto"
                      >
                        Add address →
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <PlusIcon className="size-3" /> Feature
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
