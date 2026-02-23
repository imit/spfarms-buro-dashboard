"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type User, type UserRole, ROLE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

const ROLES = Object.entries(ROLE_LABELS) as [UserRole, string][];

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = Number(id);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("account");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (currentUser && currentUser.role !== "admin"))) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, currentUser, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchUser() {
      try {
        const data = await apiClient.getUser(userId);
        setUser(data);
        setFullName(data.full_name || "");
        setEmail(data.email);
        setPhoneNumber(data.phone_number || "");
        setRole(data.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load this user");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [isAuthenticated, userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      await apiClient.updateUser(userId, {
        full_name: fullName || undefined,
        email,
        phone_number: phoneNumber || undefined,
        role,
      });
      toast.success("User updated");
      router.push(`/admin/users/${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't update this user");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10">Loading...</p>;
  if (!user) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/admin/users/${userId}`}>
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <h2 className="text-2xl font-semibold">Edit User</h2>
      </div>

      {error && (
        <div className="max-w-md">
          <ErrorAlert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone number"
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
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
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/users/${userId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
