"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, SendIcon } from "lucide-react";
import {
  apiClient,
  type Company,
  type User,
  type NotificationType,
  type NotificationTargetType,
  type CreateNotificationParams,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const MANUAL_TYPES = Object.entries(NOTIFICATION_TYPE_LABELS).filter(
  ([key]) => key !== "order_status"
) as [NotificationType, string][];

export default function ComposeNotificationPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [notificationType, setNotificationType] = useState<NotificationType>("announcement");
  const [targetType, setTargetType] = useState<NotificationTargetType>("company");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bankInfo, setBankInfo] = useState("");
  const [targetCompanyId, setTargetCompanyId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient.getCompanies().then(setCompanies).catch(() => {});
    apiClient.getUsers().then(setUsers).catch(() => {});
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const params: CreateNotificationParams = {
      notification_type: notificationType,
      subject,
      body: body || undefined,
      target_type: targetType,
    };

    if (targetType === "company" && targetCompanyId) {
      params.target_company_id = Number(targetCompanyId);
    }
    if (targetType === "user" && targetUserId) {
      params.target_user_id = Number(targetUserId);
    }
    if (notificationType === "payment_reminder" && bankInfo) {
      params.metadata = { bank_info: bankInfo };
    }

    try {
      await apiClient.createNotification(params);
      toast.success("Notification sent!");
      router.push("/admin/notifications");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/notifications")}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Notifications
      </Button>

      <div>
        <h2 className="text-2xl font-semibold">Compose Notification</h2>
        <p className="text-sm text-muted-foreground">
          Send an email and in-app notification to your recipients
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div className="space-y-2">
          <Label>Notification Type</Label>
          <Select value={notificationType} onValueChange={(v) => setNotificationType(v as NotificationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Send to</Label>
          <div className="flex gap-2">
            {(["company", "user", "broadcast"] as NotificationTargetType[]).map((t) => (
              <Button
                key={t}
                type="button"
                variant={targetType === t ? "secondary" : "outline"}
                size="sm"
                onClick={() => setTargetType(t)}
              >
                {t === "company" ? "Company" : t === "user" ? "User" : "All Accounts"}
              </Button>
            ))}
          </div>
        </div>

        {targetType === "company" && (
          <div className="space-y-2">
            <Label>Company</Label>
            <Select value={targetCompanyId} onValueChange={setTargetCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {targetType === "user" && (
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Notification subject"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            rows={6}
          />
        </div>

        {notificationType === "payment_reminder" && (
          <div className="space-y-2">
            <Label htmlFor="bankInfo">Bank Information</Label>
            <Textarea
              id="bankInfo"
              value={bankInfo}
              onChange={(e) => setBankInfo(e.target.value)}
              placeholder="Bank name, routing number, account number..."
              rows={4}
            />
          </div>
        )}

        <Button type="submit" disabled={sending}>
          <SendIcon className="mr-2 size-4" />
          {sending ? "Sending..." : "Send Notification"}
        </Button>
      </form>
    </div>
  );
}
