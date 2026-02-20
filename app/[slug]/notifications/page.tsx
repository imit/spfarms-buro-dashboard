"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type NotificationRecipient,
  type NotificationType,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  PackageIcon,
  CreditCardIcon,
  MessageSquareIcon,
  InfoIcon,
  MegaphoneIcon,
  BoxIcon,
  CheckCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  order_status: <PackageIcon className="size-4" />,
  payment_reminder: <CreditCardIcon className="size-4" />,
  feedback_request: <MessageSquareIcon className="size-4" />,
  info_request: <InfoIcon className="size-4" />,
  product_update: <BoxIcon className="size-4" />,
  announcement: <MegaphoneIcon className="size-4" />,
  cart_reminder: <PackageIcon className="size-4" />,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  order_status: "bg-blue-100 text-blue-700",
  payment_reminder: "bg-amber-100 text-amber-700",
  feedback_request: "bg-purple-100 text-purple-700",
  info_request: "bg-cyan-100 text-cyan-700",
  product_update: "bg-green-100 text-green-700",
  announcement: "bg-orange-100 text-orange-700",
  cart_reminder: "bg-pink-100 text-pink-700",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getMyNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const markRead = async (nr: NotificationRecipient) => {
    if (!nr.read_at) {
      await apiClient.markNotificationRead(nr.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === nr.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    }

    if (nr.notification_type === "order_status" && nr.order) {
      router.push(`/${slug}/orders/${nr.order.id}`);
    }
  };

  const markAllRead = async () => {
    await apiClient.markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      }))
    );
    window.dispatchEvent(new CustomEvent("notifications:updated"));
    toast.success("All notifications marked as read");
  };

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheckIcon className="mr-1.5 size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No notifications yet.
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((nr) => (
            <button
              key={nr.id}
              onClick={() => markRead(nr)}
              className={`w-full text-left rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                !nr.read_at ? "bg-blue-50/50 border-blue-200" : "bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                {!nr.read_at && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[nr.notification_type]
                      }`}
                    >
                      {TYPE_ICONS[nr.notification_type]}
                      {NOTIFICATION_TYPE_LABELS[nr.notification_type]}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {nr.sent_at ? timeAgo(nr.sent_at) : ""}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{nr.subject}</p>
                  {nr.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {nr.body}
                    </p>
                  )}
                  {nr.order && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Order {nr.order.order_number}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
