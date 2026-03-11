"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type User, type MagicLoginToken, ROLE_LABELS } from "@/lib/api";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  ArrowLeftIcon,
  BuildingIcon,
  EyeIcon,
  KeyIcon,
  Loader2Icon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

function UserAvatar({ name, email }: { name?: string | null; email: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : email[0].toUpperCase();
  return (
    <div className="size-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground shrink-0">
      {initials}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: authLoading, user: currentUser, impersonate } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingForCompany, setSendingForCompany] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteTargetSlug, setInviteTargetSlug] = useState<string | undefined>(undefined);
  const [tokens, setTokens] = useState<MagicLoginToken[]>([]);
  const [revokingTokenId, setRevokingTokenId] = useState<number | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchUser() {
      try {
        const [data, tokenData] = await Promise.all([
          apiClient.getUser(Number(id)),
          apiClient.getMagicLoginTokens(Number(id)).catch(() => [] as MagicLoginToken[]),
        ]);
        setUser(data);
        setTokens(tokenData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load this user");
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
      setError(err instanceof Error ? err.message : "We couldn't delete this user");
      setIsDeleting(false);
    }
  }

  function openInviteDialog(companySlug?: string) {
    setInviteTargetSlug(companySlug);
    setInviteMessage("");
    setInviteDialogOpen(true);
  }

  async function handleSendEmail(companySlug?: string, message?: string) {
    if (!user) return;
    setSendingForCompany(companySlug ?? "__default__");
    setInviteDialogOpen(false);
    try {
      const updated = await apiClient.sendWelcomeEmail(user.id, { companySlug, customMessage: message || undefined });
      setUser(updated);
      toast.success(`Invitation sent to ${user.email}`);
    } catch (err) {
      showError("send the email", err);
    } finally {
      setSendingForCompany(null);
    }
  }

  async function handleImpersonate() {
    if (!user) return;
    setIsImpersonating(true);
    try {
      await impersonate(user.id);
    } catch (err) {
      showError("impersonate user", err);
      setIsImpersonating(false);
    }
  }

  async function handleRevokeToken(tokenId: number) {
    if (!user) return;
    setRevokingTokenId(tokenId);
    try {
      await apiClient.consumeMagicLoginToken(user.id, tokenId);
      setTokens((prev) =>
        prev.map((t) =>
          t.id === tokenId ? { ...t, status: "consumed" as const, consumed_at: new Date().toISOString() } : t
        )
      );
      toast.success("Token revoked");
    } catch (err) {
      showError("revoke the token", err);
    } finally {
      setRevokingTokenId(null);
    }
  }

  async function handleRevokeAllTokens() {
    if (!user) return;
    setIsRevokingAll(true);
    try {
      await apiClient.consumeAllMagicLoginTokens(user.id);
      setTokens((prev) =>
        prev.map((t) =>
          t.status === "active" ? { ...t, status: "consumed" as const, consumed_at: new Date().toISOString() } : t
        )
      );
      toast.success("All tokens revoked");
    } catch (err) {
      showError("revoke the tokens", err);
    } finally {
      setIsRevokingAll(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10 py-8">Loading...</p>;
  if (error) return <div className="mx-10"><ErrorAlert message={error} /></div>;
  if (!user) return null;

  const statusBadge = user.deleted_at ? (
    <Badge variant="destructive">Deleted</Badge>
  ) : user.sign_in_count > 0 ? (
    <Badge variant="default">Active</Badge>
  ) : user.invitation_sent_at ? (
    <Badge variant="secondary">Invited</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">Added</Badge>
  );

  const activeTokenCount = tokens.filter((t) => t.status === "active").length;

  return (
    <div className="space-y-6 px-10 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/admin/users">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <UserAvatar name={user.full_name} email={user.email} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-semibold">{user.full_name || user.email}</h2>
              <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
              {statusBadge}
            </div>
            {user.full_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            )}
            {user.companies && user.companies.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <BuildingIcon className="size-3.5 text-muted-foreground" />
                {user.companies.map((c, i) => (
                  <span key={c.slug} className="text-sm text-muted-foreground">
                    <Link href={`/admin/companies/${c.slug}`} className="hover:text-foreground hover:underline">
                      {c.name}
                    </Link>
                    {c.company_title && <span> · {c.company_title}</span>}
                    {i < user.companies.length - 1 && <span>,</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {(!user.companies || user.companies.length <= 1) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openInviteDialog(user.companies?.[0]?.slug)}
              disabled={sendingForCompany !== null}
            >
              <SendIcon className="mr-2 size-4" />
              {sendingForCompany ? "Sending..." : user.invitation_sent_at ? "Resend Invitation" : "Send Invitation"}
            </Button>
          )}
          {currentUser?.role === "admin" && user.id !== currentUser.id && (
            <Button variant="outline" size="sm" onClick={handleImpersonate} disabled={isImpersonating}>
              <EyeIcon className="mr-2 size-4" />
              {isImpersonating ? "Switching..." : "Impersonate"}
            </Button>
          )}
          {currentUser?.role === "admin" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${user.id}/edit`}>
                <PencilIcon className="mr-2 size-4" />
                Edit
              </Link>
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
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        {/* Profile details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold mb-3">Profile</h3>
          <InfoRow label="Full name" value={user.full_name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone_number} />
          <InfoRow label="Title" value={(user as User & { title?: string }).title} />
          <InfoRow
            label="Invited by"
            value={
              user.invited_by ? (
                <Link href={`/admin/users/${user.invited_by.id}`} className="text-primary hover:underline">
                  {user.invited_by.full_name || user.invited_by.email}
                </Link>
              ) : null
            }
          />
          <InfoRow
            label="Invitation sent"
            value={user.invitation_sent_at ? new Date(user.invitation_sent_at).toLocaleString() : null}
          />
          <InfoRow label="Created" value={new Date(user.created_at).toLocaleString()} />
        </div>

        {/* Activity */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold mb-3">Activity</h3>
          <InfoRow label="Sign-ins" value={user.sign_in_count > 0 ? String(user.sign_in_count) : "Never signed in"} />
          <InfoRow
            label="Last active"
            value={user.last_active_at ? new Date(user.last_active_at).toLocaleString() : "Never"}
          />
          <InfoRow
            label="Last sign-in"
            value={
              user.last_sign_in_at ? (
                <>
                  {new Date(user.last_sign_in_at).toLocaleString()}
                  {user.last_sign_in_ip && (
                    <span className="text-muted-foreground ml-1.5 text-xs">({user.last_sign_in_ip})</span>
                  )}
                </>
              ) : "Never"
            }
          />
          <InfoRow
            label="Current sign-in"
            value={
              user.current_sign_in_at ? (
                <>
                  {new Date(user.current_sign_in_at).toLocaleString()}
                  {user.current_sign_in_ip && (
                    <span className="text-muted-foreground ml-1.5 text-xs">({user.current_sign_in_ip})</span>
                  )}
                </>
              ) : null
            }
          />
          {activeTokenCount > 0 && (
            <div className="flex flex-col gap-0.5 py-3 border-b last:border-0">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Magic tokens</span>
              <span className="text-sm">{activeTokenCount} active token{activeTokenCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Companies */}
      {user.companies && user.companies.length > 1 && (
        <div className="max-w-4xl rounded-lg border bg-card p-5">
          <h3 className="font-semibold mb-4">Companies</h3>
          <div className="divide-y">
            {user.companies.map((c) => (
              <div key={c.slug} className="flex items-center justify-between py-3">
                <div>
                  <Link href={`/admin/companies/${c.slug}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.company_title || "Member"}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openInviteDialog(c.slug)}
                  disabled={sendingForCompany !== null}
                >
                  <SendIcon className="mr-2 size-3.5" />
                  {sendingForCompany === c.slug ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals */}
      {user.referrals && user.referrals.length > 0 && (
        <div className="max-w-4xl rounded-lg border bg-card p-5">
          <h3 className="font-semibold mb-4">Referrals</h3>
          <div className="grid grid-cols-3 gap-4 mb-5 p-4 rounded-lg bg-muted/40">
            <div className="text-center">
              <p className="text-2xl font-semibold">{user.referrals.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Companies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {user.referrals.reduce((sum, r) => sum + r.completed_orders, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                ${user.referrals.reduce((sum, r) => sum + r.total_revenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Revenue</p>
            </div>
          </div>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-right font-medium">Orders</th>
                  <th className="px-4 py-2.5 text-right font-medium">Completed</th>
                  <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {user.referrals.map((r) => (
                  <tr key={r.company_id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/companies/${r.company_slug}`} className="hover:underline">
                        {r.company_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{r.total_orders}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{r.completed_orders}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      ${r.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send invitation dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.invitation_sent_at ? "Resend Invitation" : "Send Invitation"}</DialogTitle>
            <DialogDescription>
              Send a magic link to <strong>{user.email}</strong>. They'll be able to log in directly by clicking it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Field>
              <FieldLabel htmlFor="detail-invite-message">
                Personal message <span className="text-muted-foreground font-normal">(optional)</span>
              </FieldLabel>
              <Textarea
                id="detail-invite-message"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="e.g. Looking forward to working with you!"
                rows={3}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSendEmail(inviteTargetSlug, inviteMessage)}>
              <SendIcon className="mr-2 size-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Magic login tokens */}
      {tokens.length > 0 && (
        <div className="max-w-4xl rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">Magic Login Tokens</h3>
              {activeTokenCount > 0 && (
                <Badge variant="secondary" className="text-xs">{activeTokenCount} active</Badge>
              )}
            </div>
            {activeTokenCount > 0 && (
              <Button size="sm" variant="destructive" onClick={handleRevokeAllTokens} disabled={isRevokingAll}>
                {isRevokingAll ? (
                  <><Loader2Icon className="mr-2 size-3 animate-spin" />Revoking...</>
                ) : (
                  "Revoke All"
                )}
              </Button>
            )}
          </div>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Source</th>
                  <th className="px-4 py-2.5 text-left font-medium">Created</th>
                  <th className="px-4 py-2.5 text-left font-medium">Last Used</th>
                  <th className="px-4 py-2.5 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <Badge variant={token.status === "active" ? "default" : "secondary"}>
                        {token.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{token.source || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(token.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {token.status === "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive hover:text-destructive"
                          onClick={() => handleRevokeToken(token.id)}
                          disabled={revokingTokenId === token.id}
                        >
                          {revokingTokenId === token.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <XCircleIcon className="size-3.5" />
                          )}
                        </Button>
                      )}
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
