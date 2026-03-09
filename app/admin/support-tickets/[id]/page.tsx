"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, SendIcon, Loader2Icon, UserIcon, BuildingIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type SupportTicket } from "@/lib/api";
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

export default function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getSupportTicket(Number(id));
        setTicket(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, id]);

  const updateStatus = async (status: string) => {
    if (!ticket) return;
    try {
      const updated = await apiClient.updateSupportTicket(ticket.id, { status });
      setTicket(updated);
      toast.success(`Status updated to ${STATUS_LABELS[status as SupportTicket["status"]]}`);
    } catch {
      showError("update the status");
    }
  };

  const handleReply = async () => {
    if (!ticket || !replyBody.trim()) return;
    setSending(true);
    try {
      await apiClient.replySupportTicket(ticket.id, replyBody.trim());
      toast.success("Reply sent to " + (ticket.user_email || "user"));
      setReplyBody("");
      // Refresh ticket to get updated status
      const updated = await apiClient.getSupportTicket(ticket.id);
      setTicket(updated);
    } catch {
      showError("send the reply");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="px-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-10">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="px-10 max-w-4xl">
      <button
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        onClick={() => router.push("/admin/support-tickets")}
      >
        <ArrowLeftIcon className="size-4" />
        Back to tickets
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">
            {ticket.subject || "Support Ticket"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          <select
            value={ticket.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Original message */}
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">Message</p>
            <p className="text-base whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
          </div>

          {/* Reply form */}
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Reply via email to {ticket.user_email || "user"}
            </p>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Type your reply..."
              rows={6}
              className="w-full rounded-lg border bg-background p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={sending}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Sends from info@spfarmsny.com
              </p>
              <Button
                onClick={handleReply}
                disabled={!replyBody.trim() || sending}
              >
                {sending ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 size-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar — user & company info */}
        <div className="space-y-4">
          {/* User card */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Submitted by</p>
            <div className="space-y-2.5">
              {ticket.user_full_name && (
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{ticket.user_full_name}</span>
                </div>
              )}
              {ticket.user_email && (
                <div className="flex items-center gap-2 text-sm">
                  <MailIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <a href={`mailto:${ticket.user_email}`} className="text-primary hover:underline truncate">
                    {ticket.user_email}
                  </a>
                </div>
              )}
              {ticket.user_phone_number && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{ticket.user_phone_number}</span>
                </div>
              )}
              {ticket.user_id && (
                <Link
                  href={`/admin/users/${ticket.user_id}`}
                  className="inline-flex items-center text-xs text-primary hover:underline mt-1"
                >
                  View user profile →
                </Link>
              )}
            </div>
          </div>

          {/* Company card */}
          {ticket.company_name && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <BuildingIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{ticket.company_name}</span>
                </div>
                {ticket.company_slug && (
                  <Link
                    href={`/admin/companies/${ticket.company_slug}`}
                    className="inline-flex items-center text-xs text-primary hover:underline mt-1"
                  >
                    View company →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
