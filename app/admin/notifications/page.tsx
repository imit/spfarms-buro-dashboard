"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Notification,
  type NotificationType,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";

const TYPE_COLORS: Record<NotificationType, string> = {
  order_status: "bg-blue-100 text-blue-800",
  payment_reminder: "bg-amber-100 text-amber-800",
  feedback_request: "bg-purple-100 text-purple-800",
  info_request: "bg-cyan-100 text-cyan-800",
  product_update: "bg-green-100 text-green-800",
  announcement: "bg-orange-100 text-orange-800",
  cart_reminder: "bg-pink-100 text-pink-800",
};

function targetLabel(n: Notification) {
  if (n.target_company) return n.target_company.name;
  if (n.target_user) return n.target_user.full_name || n.target_user.email;
  if (n.target_type === "broadcast") return "All Accounts";
  return "—";
}

export default function AdminNotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getNotifications();
        setNotifications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
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
          <h2 className="text-2xl font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            View sent notifications and compose new ones
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/notifications/compose">
            <PlusIcon className="mr-2 size-4" />
            Compose
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No notifications sent yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/notifications/compose">Send your first notification</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-left font-medium">Sent by</th>
                <th className="px-4 py-3 text-left font-medium">Recipients</th>
                <th className="px-4 py-3 text-left font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {n.subject}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[n.notification_type]}`}>
                      {NOTIFICATION_TYPE_LABELS[n.notification_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {targetLabel(n)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {n.sender.full_name || n.sender.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{n.recipient_count}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {n.sent_at ? new Date(n.sent_at).toLocaleString() : "Sending..."}
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
