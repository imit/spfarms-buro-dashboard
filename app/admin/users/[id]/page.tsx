"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type User, ROLE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { ArrowLeftIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

function DetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchUser() {
      try {
        const data = await apiClient.getUser(Number(id));
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [isAuthenticated, id]);

  async function handleDelete() {
    if (!user) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteUser(user.id);
      router.push("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      setIsDeleting(false);
    }
  }

  async function handleSendEmail() {
    if (!user) return;
    setIsSendingEmail(true);
    try {
      const updated = await apiClient.sendWelcomeEmail(user.id);
      setUser(updated);
      toast.success(`Welcome email sent to ${user.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;
  if (isLoading)
    return <p className="text-muted-foreground px-10">Loading...</p>;
  if (error)
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm mx-10">
        {error}
      </div>
    );
  if (!user) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/users">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-semibold">
                {user.full_name || user.email}
              </h2>
              {user.full_name && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!user.invitation_sent_at && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              <SendIcon className="mr-2 size-4" />
              {isSendingEmail ? "Sending..." : "Send Email"}
            </Button>
          )}
          {currentUser?.role === "admin" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the account for {user.email}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          )}
        </div>
      </div>

      <div className="max-w-md rounded-lg border bg-card p-5">
        <h3 className="font-medium mb-3">Details</h3>
        <Separator className="mb-1" />
        <dl>
          <DetailRow label="Full Name" value={user.full_name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Phone" value={user.phone_number} />
          <DetailRow
            label="Role"
            value={<Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>}
          />
          <DetailRow
            label="Invited by"
            value={user.invited_by ? (
              <Link
                href={`/admin/users/${user.invited_by.id}`}
                className="text-primary hover:underline"
              >
                {user.invited_by.full_name || user.invited_by.email}
              </Link>
            ) : null}
          />
          <DetailRow
            label="Status"
            value={
              user.sign_in_count > 0 ? (
                <Badge variant="default">Active</Badge>
              ) : user.invitation_sent_at ? (
                <Badge variant="secondary">Invited</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Added</Badge>
              )
            }
          />
          {user.invitation_sent_at && (
            <DetailRow
              label="Email Sent"
              value={new Date(user.invitation_sent_at).toLocaleString()}
            />
          )}
          <DetailRow
            label="Sign-ins"
            value={String(user.sign_in_count)}
          />
          <DetailRow
            label="Current Sign-in"
            value={user.current_sign_in_at ? (
              <>
                {new Date(user.current_sign_in_at).toLocaleString()}
                {user.current_sign_in_ip && (
                  <span className="text-muted-foreground ml-1">({user.current_sign_in_ip})</span>
                )}
              </>
            ) : <span className="text-muted-foreground">Never</span>}
          />
          <DetailRow
            label="Last Sign-in"
            value={user.last_sign_in_at ? (
              <>
                {new Date(user.last_sign_in_at).toLocaleString()}
                {user.last_sign_in_ip && (
                  <span className="text-muted-foreground ml-1">({user.last_sign_in_ip})</span>
                )}
              </>
            ) : <span className="text-muted-foreground">Never</span>}
          />
          <DetailRow
            label="Last Active"
            value={user.last_active_at
              ? new Date(user.last_active_at).toLocaleString()
              : <span className="text-muted-foreground">Never</span>}
          />
          <DetailRow
            label="Created"
            value={new Date(user.created_at).toLocaleString()}
          />
        </dl>
      </div>

      {user.companies && user.companies.length > 0 && (
        <div className="max-w-md rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Companies</h3>
          <Separator className="mb-1" />
          <dl>
            {user.companies.map((c) => (
              <DetailRow
                key={c.slug}
                label={
                  <Link
                    href={`/admin/companies/${c.slug}`}
                    className="text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                }
                value={c.company_title || "Member"}
              />
            ))}
          </dl>
        </div>
      )}

      {user.referrals && user.referrals.length > 0 && (
        <div className="max-w-lg rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Referrals</h3>
          <Separator className="mb-3" />
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{user.referrals.length}</p>
              <p className="text-xs text-muted-foreground">Companies</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {user.referrals.reduce((sum, r) => sum + r.completed_orders, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Completed Orders</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                ${user.referrals.reduce((sum, r) => sum + r.total_revenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </div>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Company</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Completed</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {user.referrals.map((r) => (
                  <tr key={r.company_id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/companies/${r.company_slug}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.company_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {r.total_orders}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {r.completed_orders}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${r.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
