"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserForm } from "@/components/user-form";

export default function NewUserPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-lg space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New User</h2>
        <p className="text-sm text-muted-foreground">
          Create a new user account. They can log in via magic link.
        </p>
      </div>
      <UserForm />
    </div>
  );
}
