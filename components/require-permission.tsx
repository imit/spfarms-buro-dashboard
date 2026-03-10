"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { canRead, canWrite, type Resource } from "@/lib/roles";
import type { UserRole } from "@/lib/api";
import { ShieldXIcon } from "lucide-react";

interface RequirePermissionProps {
  resource: Resource;
  level?: "read" | "write";
  children: ReactNode;
}

export function RequirePermission({ resource, level = "read", children }: RequirePermissionProps) {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  const allowed = level === "write" ? canWrite(resource, role) : canRead(resource, role);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <ShieldXIcon className="size-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Access denied</p>
        <p className="text-sm mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
