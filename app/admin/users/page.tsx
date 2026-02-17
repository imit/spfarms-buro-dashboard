"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type User, type UserRole, ROLE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, SendIcon } from "lucide-react";

type RoleFilter = "all" | UserRole;


const ROLES = Object.entries(ROLE_LABELS) as [UserRole, string][];

export default function UsersPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showDeleted, setShowDeleted] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("account");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    apiClient
      .getUsers(showDeleted ? { include_deleted: true } : undefined)
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load users")
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, showDeleted]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviteLoading(true);

    try {
      await apiClient.createInvitation(inviteEmail, inviteRole);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("account");
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setInviteLoading(false);
    }
  }

  function handleInviteOpenChange(open: boolean) {
    setInviteOpen(open);
    if (!open) {
      setInviteEmail("");
      setInviteRole("account");
      setInviteError("");
      setInviteSuccess("");
    }
  }

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and roles
          </p>
        </div>
        {currentUser?.role === "admin" && (
        <div className="flex gap-2">
          <Dialog open={inviteOpen} onOpenChange={handleInviteOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <SendIcon className="mr-2 size-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>Invite User</DialogTitle>
                  <DialogDescription>
                    Send a magic link invitation. The recipient will be able to
                    create their account by clicking the link.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {inviteError && (
                    <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm mb-4">
                      {inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 rounded-md p-3 text-sm mb-4">
                      {inviteSuccess}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      disabled={inviteLoading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as UserRole)}
                      disabled={inviteLoading}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button asChild>
            <Link href="/admin/users/new">
              <PlusIcon className="mr-2 size-4" />
              Add User
            </Link>
          </Button>
        </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={roleFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All
            </Button>
            {ROLES.map(([value, label]) => (
              <Button
                key={value}
                variant={roleFilter === value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRoleFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {currentUser?.role === "admin" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox
                checked={showDeleted}
                onCheckedChange={(checked) => setShowDeleted(checked === true)}
              />
              Show deleted
            </label>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No users yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/users/new">Add your first user</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Invited by</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer ${u.deleted_at ? "opacity-50" : ""}`}
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {u.full_name || <span className="text-muted-foreground italic">No name</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.companies && u.companies.length > 0 ? (
                      <div className="space-y-0.5">
                        {u.companies.map((c) => (
                          <div key={c.slug}>
                            <span>{c.name}</span>
                            {c.company_title && (
                              <span className="text-muted-foreground ml-1">
                                ({c.company_title})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {u.invited_by
                      ? (u.invited_by.full_name || u.invited_by.email)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.deleted_at ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : u.sign_in_count > 0 ? (
                      <Badge variant="default">Active</Badge>
                    ) : u.invitation_sent_at ? (
                      <Badge variant="secondary">Invited</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Added</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
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
