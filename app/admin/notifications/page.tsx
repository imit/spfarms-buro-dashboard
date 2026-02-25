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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PlusIcon, TrashIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

const TYPE_COLORS: Record<NotificationType, string> = {
  order_status: "bg-blue-100 text-blue-800",
  payment_reminder: "bg-amber-100 text-amber-800",
  feedback_request: "bg-purple-100 text-purple-800",
  info_request: "bg-cyan-100 text-cyan-800",
  product_update: "bg-green-100 text-green-800",
  announcement: "bg-orange-100 text-orange-800",
  cart_reminder: "bg-pink-100 text-pink-800",
  bank_info_send: "bg-emerald-100 text-emerald-800",
  payment_terms_agreement: "bg-violet-100 text-violet-800",
  payment_received: "bg-green-100 text-green-800",
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await apiClient.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch {
      showError("delete the notification");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getNotifications();
        setNotifications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load notifications");
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

      {error && <ErrorAlert message={error} />}

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
                <th className="px-4 py-3 w-10"></th>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="cursor-pointer">
                          <Badge variant="outline" className="hover:bg-muted">
                            {n.recipient_count} recipient{n.recipient_count !== 1 ? "s" : ""}
                          </Badge>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="start">
                        <div className="px-3 py-2 border-b">
                          <p className="text-xs font-medium text-muted-foreground">
                            {n.recipient_count} recipient{n.recipient_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ul className="max-h-48 overflow-y-auto divide-y">
                          {n.recipients.map((r) => (
                            <li key={r.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                              <span className="truncate flex-1">
                                {r.full_name || r.email}
                              </span>
                              {r.read_at && (
                                <CheckIcon className="size-3.5 text-green-600 shrink-0" />
                              )}
                            </li>
                          ))}
                        </ul>
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {n.sent_at ? new Date(n.sent_at).toLocaleString() : "Sending..."}
                  </td>
                  <td className="px-4 py-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === n.id}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete notification?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &ldquo;{n.subject}&rdquo; and remove it from all recipients. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(n.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
