"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MailIcon,
  XIcon,
  SearchIcon,
  UserIcon,
  CopyIcon,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type NewsletterSubscription,
  type NewsletterSubscriptionStatus,
  type NewsletterSubscriptionsMeta,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Admin → Subscribers
 *
 * The list of opt-in newsletter subscribers from the public homepage band
 * (components/public/newsletter-band.tsx → POST /api/v1/public/newsletter_subscriptions).
 *
 * Mailing list semantics, not auth:
 *   - Anonymous public sign-up — no password, no role, no devise.
 *   - One row per email per workspace; re-subscribes flip an unsubscribed row
 *     back to active rather than duplicating.
 *   - "Unsubscribe" is soft (status flip), not destructive — we keep the row so
 *     you can see who bowed out and when.
 *
 * Cross-reference: if a subscriber's email also belongs to a User in the
 * workspace, the API attaches a `user` object so we can flag them as
 * "Customer" in the table.
 */

type StatusFilter = NewsletterSubscriptionStatus | "all";

export default function AdminSubscribersPage() {
  const [subs, setSubs] = useState<NewsletterSubscription[]>([]);
  const [meta, setMeta] = useState<NewsletterSubscriptionsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState<string>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminNewsletterSubscriptions({
        status,
        source,
        q: debouncedQ || undefined,
      });
      setSubs(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error("Failed to load subscribers", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [status, source, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  async function unsubscribe(sub: NewsletterSubscription) {
    if (!confirm(`Unsubscribe ${sub.email}?`)) return;
    setBusyId(sub.id);
    try {
      const updated = await apiClient.unsubscribeNewsletterSubscription(sub.id);
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
      toast.success(`${sub.email} unsubscribed`);
    } catch (err) {
      toast.error("Couldn't unsubscribe", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  const activeEmails = useMemo(
    () => subs.filter((s) => s.status === "active").map((s) => s.email),
    [subs],
  );

  function copyActive() {
    if (activeEmails.length === 0) {
      toast.error("No active subscribers to copy.");
      return;
    }
    navigator.clipboard.writeText(activeEmails.join(", "));
    toast.success(`Copied ${activeEmails.length} email${activeEmails.length === 1 ? "" : "s"}`);
  }

  function exportCsv() {
    if (subs.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    const header = ["email", "status", "source", "subscribed_at", "unsubscribed_at"].join(",");
    const rows = subs.map((s) =>
      [s.email, s.status, s.source ?? "", s.subscribed_at ?? "", s.unsubscribed_at ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-10 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MailIcon className="size-6" /> Subscribers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Opt-in newsletter list from the public site. Submitted via the
            homepage band (and anywhere else that calls{" "}
            <code className="font-mono text-xs">/api/v1/public/newsletter_subscriptions</code>).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyActive} disabled={activeEmails.length === 0}>
            <CopyIcon className="size-4" /> Copy active
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={subs.length === 0}>
            <DownloadIcon className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatChip label="Total ever" value={meta ? meta.active_count + meta.unsubscribed_count : 0} />
        <StatChip label="Active" value={meta?.active_count ?? 0} accent="emerald" />
        <StatChip label="Unsubscribed" value={meta?.unsubscribed_count ?? 0} />
        <StatChip label="Shown" value={subs.length} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterPills<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "unsubscribed", label: "Unsubscribed" },
          ]}
        />
        {meta && meta.sources.length > 0 && (
          <>
            <span className="h-6 w-px bg-border mx-1" aria-hidden />
            <FilterPills
              value={source}
              onChange={setSource}
              options={[
                { value: "all", label: "All sources" },
                ...meta.sources.map((s) => ({ value: s, label: s })),
              ]}
            />
          </>
        )}
        <div className="ml-auto relative w-full sm:w-72">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            type="text"
            placeholder="Search by email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 pr-8"
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
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && subs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && subs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <p className="font-medium text-foreground mb-1">No subscribers yet.</p>
                  <p className="text-sm">
                    Sign-ups from the homepage newsletter band will show up here.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {subs.map((s) => (
              <TableRow key={s.id} className={s.status === "unsubscribed" ? "opacity-60" : undefined}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{s.email}</span>
                    {s.user && (
                      <Badge variant="secondary" className="font-normal" title={`Linked to user #${s.user.id}`}>
                        <UserIcon className="size-3 mr-1" />
                        {s.user.role === "account" ? "Customer" : s.user.role}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {s.status === "active" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-normal">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      Unsubscribed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.source || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(s.subscribed_at || s.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  {s.status === "active" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unsubscribe(s)}
                      disabled={busyId === s.id}
                    >
                      Unsubscribe
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {s.unsubscribed_at ? formatDate(s.unsubscribed_at) : "—"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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
}: {
  label: string;
  value: number;
  accent?: "emerald";
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
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
