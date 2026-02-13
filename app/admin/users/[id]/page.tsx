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
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

function DetailRow({
  label,
  value,
}: {
  label: string;
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
                label={c.name}
                value={c.company_title || "Member"}
              />
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
