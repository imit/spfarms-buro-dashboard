"use client";

import { type ReactNode } from "react";
import { useAuth, type UserRole } from "@/contexts/auth-context";

interface RoleGateProps {
  allowed: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allowed, children, fallback = null }: RoleGateProps) {
  const { user } = useAuth();

  if (!user || !allowed.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
