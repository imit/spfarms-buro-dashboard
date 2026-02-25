"use client";

import { useEffect, useState } from "react";
import { MailIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import {
  apiClient,
  type Notification,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/api";

export function EmailTimeline({ orderId }: { orderId: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const data = await apiClient.getOrderEmailTimeline(orderId);
      setNotifications(data);
    } catch {
      console.error("Failed to load email timeline");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  if (isLoading) return null;
  if (notifications.length === 0) return null;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold text-sm mb-3">Email History</h3>
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="flex gap-3 text-sm">
            <div className="mt-0.5">
              <MailIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{notif.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(notif.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  {NOTIFICATION_TYPE_LABELS[notif.notification_type] || notif.notification_type}
                </span>
              </div>
              {notif.recipients.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {notif.recipients.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      {r.email}
                      {r.read_at ? (
                        <CheckCircleIcon className="size-3 text-green-500" />
                      ) : (
                        <ClockIcon className="size-3 text-amber-500" />
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { EmailTimeline as default };
