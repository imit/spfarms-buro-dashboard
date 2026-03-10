"use client";

import { useAuth } from "@/contexts/auth-context";
import { EyeIcon, XIcon } from "lucide-react";

export function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <EyeIcon className="size-4 shrink-0" />
      <span>
        Impersonating <strong>{user.full_name || user.email}</strong>
        {user.role && <span className="ml-1 opacity-70">({user.role})</span>}
      </span>
      <button
        onClick={stopImpersonating}
        className="ml-2 inline-flex items-center gap-1 rounded-md bg-black/15 px-2.5 py-1 text-xs font-semibold hover:bg-black/25 transition-colors"
      >
        <XIcon className="size-3" />
        Stop
      </button>
    </div>
  );
}
