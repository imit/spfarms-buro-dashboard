"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Broadcast } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PlusIcon, SendIcon, MailIcon } from "lucide-react";

export default function AdminBroadcastsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const data = await apiClient.getBroadcasts();
        setBroadcasts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load broadcasts");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Broadcasts</h2>
          <p className="text-sm text-muted-foreground">
            Newsletter-style emails sent to all wholesale partners with one-click magic-link login.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/broadcasts/new">
            <PlusIcon className="mr-2 size-4" />
            New broadcast
          </Link>
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : broadcasts.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <MailIcon className="mx-auto size-10 mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No broadcasts sent yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/broadcasts/new">Compose your first broadcast</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Recipients</th>
                <th className="px-4 py-3 text-left font-medium">Sent by</th>
                <th className="px-4 py-3 text-left font-medium">Sent</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium max-w-md truncate">
                    <Link href={`/admin/broadcasts/${b.id}`} className="hover:underline">
                      {b.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {b.sent ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.recipient_count ? `${b.recipient_count}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.sent_by?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.sent_at ? new Date(b.sent_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/broadcasts/${b.id}`}>
                        <SendIcon className="size-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
