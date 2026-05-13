"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeftIcon, SendIcon, MailCheckIcon, AlertTriangleIcon } from "lucide-react";
import { apiClient, type Broadcast } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

export default function BroadcastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const broadcastId = Number(id);

  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getBroadcast(broadcastId);
        setBroadcast(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load this broadcast");
      } finally {
        setIsLoading(false);
      }
    }
    if (Number.isFinite(broadcastId)) load();
  }, [broadcastId]);

  async function handleSendTest() {
    setSendingTest(true);
    try {
      const res = await apiClient.sendBroadcastTest(broadcastId);
      toast.success(res.message);
    } catch {
      showError("send the test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendBroadcast() {
    setSending(true);
    try {
      const res = await apiClient.sendBroadcast(broadcastId);
      setBroadcast(res.data);
      toast.success(res.message);
    } catch {
      showError("send the broadcast");
    } finally {
      setSending(false);
    }
  }

  if (isLoading) return <p className="px-10 text-muted-foreground">Loading...</p>;
  if (error) return <div className="px-10"><ErrorAlert message={error} /></div>;
  if (!broadcast) return null;

  const sent = broadcast.sent;

  return (
    <div className="space-y-6 px-10 max-w-3xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/broadcasts">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{broadcast.subject}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {sent ? (
                <>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sent</Badge>
                  <span>
                    {broadcast.recipient_count} recipient
                    {broadcast.recipient_count === 1 ? "" : "s"}
                    {broadcast.sent_at && ` • ${new Date(broadcast.sent_at).toLocaleString()}`}
                  </span>
                </>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          Email preview
        </div>
        <div className="p-6">
          <h1 className="m-0 text-xl font-bold">{broadcast.subject}</h1>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
            {broadcast.body}
          </div>
          {broadcast.cta_text && broadcast.cta_url && (
            <div className="mt-6">
              <span className="inline-flex items-center rounded-lg bg-[#48A848] px-9 py-3.5 text-sm font-semibold text-white">
                {broadcast.cta_text}
              </span>
              <p className="mt-2 text-xs text-muted-foreground font-mono break-all">
                → {broadcast.cta_url}
              </p>
            </div>
          )}
          <p className="mt-7 text-xs text-muted-foreground">
            You&apos;re receiving this email because you&apos;re a wholesale partner of SPFarms Cannabis.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
        <p className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
          <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
          <span>
            Shortcodes like <code className="font-mono">{`{{magic_link}}`}</code> are substituted
            per recipient at send time, so the preview above shows raw shortcodes. Send a test to
            yourself to see the resolved values.
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="outline" onClick={handleSendTest} disabled={sendingTest}>
          <MailCheckIcon className="mr-2 size-4" />
          {sendingTest ? "Sending..." : "Send test to me"}
        </Button>

        {!sent && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={sending}>
                <SendIcon className="mr-2 size-4" />
                {sending ? "Sending..." : "Send to all wholesale partners"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send broadcast?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will email every active wholesale partner with a one-click magic-link login.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSendBroadcast}>
                  Send now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
