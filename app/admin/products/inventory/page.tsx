"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Product,
  type ProductType,
  PRODUCT_TYPE_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftIcon,
  SearchIcon,
  RotateCcwIcon,
  SaveIcon,
  PackageIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Edit = {
  inventory_count?: number;
  track_inventory?: boolean;
};

type EditMap = Record<number, Edit>;

const QUICK_DELTAS = [-5, -1, +1, +5] as const;

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export default function InventoryPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [edits, setEdits] = useState<EditMap>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [batchNote, setBatchNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  // Admin-only — bounce non-admins back to the products list to match the
  // backend authorization. (Auth context exposes role on `user`.)
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      toast.error("Inventory editor is admin-only");
      router.push("/admin/products");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load products.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Bulk flower is sold by weight (grams), not unit count, so the unit-count
  // editor doesn't apply. Hide it everywhere on this page.
  const productTypes = useMemo(
    () =>
      (Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).filter(
        ([t]) => t !== "bulk_flower",
      ),
    [],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.product_type !== "bulk_flower")
      .filter((p) => (showArchived ? true : p.status !== "archived"))
      .filter((p) => (typeFilter === "all" ? true : p.product_type === typeFilter))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q) : true));
  }, [products, search, typeFilter, showArchived]);

  const pendingCount = useMemo(() => {
    return Object.entries(edits).reduce((acc, [id, edit]) => {
      const p = products.find((x) => x.id === Number(id));
      if (!p) return acc;
      const countChanged =
        edit.inventory_count !== undefined && edit.inventory_count !== p.inventory_count;
      const trackChanged =
        edit.track_inventory !== undefined && edit.track_inventory !== p.track_inventory;
      return countChanged || trackChanged ? acc + 1 : acc;
    }, 0);
  }, [edits, products]);

  function effectiveCount(p: Product) {
    const edit = edits[p.id];
    if (edit?.inventory_count !== undefined) return edit.inventory_count;
    return p.inventory_count;
  }

  function effectiveTrack(p: Product) {
    const edit = edits[p.id];
    if (edit?.track_inventory !== undefined) return edit.track_inventory;
    return p.track_inventory;
  }

  function setCount(p: Product, count: number) {
    const next = clampInt(count);
    setEdits((current) => {
      const updated = { ...current, [p.id]: { ...current[p.id], inventory_count: next } };
      if (updated[p.id].inventory_count === p.inventory_count) {
        delete updated[p.id].inventory_count;
        if (updated[p.id].track_inventory === undefined) delete updated[p.id];
      }
      return updated;
    });
  }

  function setTrack(p: Product, track: boolean) {
    setEdits((current) => {
      const updated = { ...current, [p.id]: { ...current[p.id], track_inventory: track } };
      if (updated[p.id].track_inventory === p.track_inventory) {
        delete updated[p.id].track_inventory;
        if (updated[p.id].inventory_count === undefined) delete updated[p.id];
      }
      return updated;
    });
  }

  function bumpCount(p: Product, delta: number) {
    setCount(p, effectiveCount(p) + delta);
  }

  function resetRow(p: Product) {
    setEdits((current) => {
      const next = { ...current };
      delete next[p.id];
      return next;
    });
  }

  function resetAll() {
    setEdits({});
    setBatchNote("");
    setSaveError("");
  }

  async function handleSave() {
    const payload = Object.entries(edits)
      .map(([id, edit]) => {
        const p = products.find((x) => x.id === Number(id));
        if (!p) return null;
        const updates: { id: number; inventory_count?: number; track_inventory?: boolean } = {
          id: Number(id),
        };
        if (edit.inventory_count !== undefined && edit.inventory_count !== p.inventory_count) {
          updates.inventory_count = edit.inventory_count;
        }
        if (edit.track_inventory !== undefined && edit.track_inventory !== p.track_inventory) {
          updates.track_inventory = edit.track_inventory;
        }
        return updates.inventory_count !== undefined || updates.track_inventory !== undefined
          ? updates
          : null;
      })
      .filter((x): x is { id: number; inventory_count?: number; track_inventory?: boolean } => x !== null);

    if (payload.length === 0) return;

    setSaving(true);
    setSaveError("");
    try {
      const updated = await apiClient.bulkUpdateInventory(payload, batchNote.trim() || undefined);
      // Merge updated products back into state. Returned set is just the
      // changed ones; fall back to existing for the rest.
      setProducts((current) =>
        current.map((p) => updated.find((u) => u.id === p.id) ?? p),
      );
      setEdits({});
      setBatchNote("");
      toast.success(`Updated ${payload.length} product${payload.length !== 1 ? "s" : ""}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg);
      showError("save inventory changes");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-4 pb-24 sm:px-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/products")}>
          <ArrowLeftIcon className="mr-1.5 size-4" />
          Products
        </Button>
        <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground">
          Edit a single product →
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <PackageIcon className="size-5 text-amber-600" />
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk-edit product unit counts. Each saved change is logged as an audit event.
        </p>
      </div>

      {loadError && <ErrorAlert message={loadError} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProductType | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {productTypes.map(([t, label]) => (
              <SelectItem key={t} value={t}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground ml-2 cursor-pointer">
          <Checkbox checked={showArchived} onCheckedChange={(v) => setShowArchived(v === true)} />
          Show archived
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No products match your filters.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-center font-medium">Track</th>
                <th className="px-4 py-3 text-right font-medium">Current</th>
                <th className="px-4 py-3 text-center font-medium">Quick</th>
                <th className="px-4 py-3 text-right font-medium">New count</th>
                <th className="px-4 py-3 text-right font-medium">Δ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const tracking = effectiveTrack(p);
                const newCount = effectiveCount(p);
                const delta = newCount - p.inventory_count;
                const isLow =
                  tracking && p.low_stock_threshold > 0 && newCount <= p.low_stock_threshold;
                const isZero = tracking && newCount === 0;
                const dirty = !!edits[p.id] && (
                  edits[p.id].inventory_count !== undefined ||
                  edits[p.id].track_inventory !== undefined
                );

                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b last:border-0",
                      dirty && "bg-amber-50/60 dark:bg-amber-950/20",
                      !dirty && isZero && "bg-rose-50/40 dark:bg-rose-950/20",
                      !dirty && !isZero && isLow && "bg-orange-50/40 dark:bg-orange-950/20",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {p.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnail_url}
                            alt={p.name}
                            className="size-10 shrink-0 rounded object-cover bg-muted"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.slug}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {p.name}
                          </Link>
                          {p.sku && (
                            <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[p.product_type]}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Checkbox
                        checked={tracking}
                        onCheckedChange={(v) => setTrack(p, v === true)}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                      {p.inventory_count}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {QUICK_DELTAS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            disabled={!tracking}
                            onClick={() => bumpCount(p, d)}
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium border transition-colors",
                              "disabled:opacity-30 disabled:cursor-not-allowed",
                              "hover:bg-muted",
                              d > 0 ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200",
                            )}
                          >
                            {d > 0 ? `+${d}` : d}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        type="number"
                        min={0}
                        disabled={!tracking}
                        value={tracking ? newCount : ""}
                        onChange={(e) => setCount(p, Number(e.target.value))}
                        className="w-24 ml-auto h-8 text-right tabular-nums"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {delta === 0 || !tracking ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            "font-semibold",
                            delta > 0 ? "text-emerald-700" : "text-rose-700",
                          )}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {dirty && (
                          <button
                            type="button"
                            onClick={() => resetRow(p)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                            title="Discard this row's changes"
                          >
                            <RotateCcwIcon className="size-3.5" />
                          </button>
                        )}
                        {isLow && tracking && (
                          <span title={`Low stock (≤ ${p.low_stock_threshold})`}>
                            <AlertTriangleIcon className="size-4 text-orange-500" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sticky save bar */}
      {pendingCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="px-4 sm:px-10 py-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <span className="inline-flex items-center justify-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {pendingCount}
              </span>
              pending change{pendingCount !== 1 ? "s" : ""}
            </span>
            <Input
              value={batchNote}
              onChange={(e) => setBatchNote(e.target.value)}
              placeholder="Note (optional, e.g. 'monthly recount')"
              className="flex-1 min-w-[200px] max-w-md h-9"
            />
            {saveError && <span className="text-xs text-destructive">{saveError}</span>}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetAll} disabled={saving}>
                Discard all
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <SaveIcon className="mr-1.5 size-4" />
                {saving ? "Saving..." : `Save ${pendingCount} change${pendingCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
