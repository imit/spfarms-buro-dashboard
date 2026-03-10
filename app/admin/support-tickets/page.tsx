"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type SupportTicket } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

const STATUS_COLORS: Record<SupportTicket["status"], string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<SupportTicket["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUSES: SupportTicket["status"][] = ["open", "in_progress", "resolved", "closed"];

export default function SupportTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportTicket["status"] | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      setIsLoading(true);
      try {
        const res = await apiClient.getSupportTickets({ page, per_page: 25 });
        setTickets(res.data);
        setTotalPages(res.meta.total_pages);
        setTotal(res.meta.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load support tickets");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, page]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const updated = await apiClient.updateSupportTicket(id, { status });
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success(`Ticket marked as ${STATUS_LABELS[status as SupportTicket["status"]]}`);
    } catch {
      showError("update the ticket status");
    }
  };

  const filtered = statusFilter === "all"
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Support Tickets</h2>
        <p className="text-sm text-muted-foreground">
          Messages submitted from the storefront
        </p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All ({total})
        </Button>
        {STATUSES.map((s) => {
          const count = tickets.filter((t) => t.status === s).length;
          return (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABELS[s]} ({count})
            </Button>
          );
        })}
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No support tickets yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Message</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">From</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium w-40">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`/admin/support-tickets/${ticket.id}`)}>
                  <td className="px-4 py-3 max-w-sm">
                    {ticket.subject && (
                      <p className="font-medium text-xs text-muted-foreground mb-0.5">
                        {ticket.subject}
                      </p>
                    )}
                    <p className="truncate">{ticket.message}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.company_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.user_email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} tickets)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
