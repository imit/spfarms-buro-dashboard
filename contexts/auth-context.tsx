"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import posthog from "posthog-js";
import { apiClient, type User } from "@/lib/api";
import { ADMIN_LAYOUT_ROLES } from "@/lib/roles";
import type { UserRole } from "@/lib/api";

const PUBLIC_ROUTES = ["/", "/auth/invitation", "/auth/verify", "/wholesale", "/bulk"];
const POSTHOG_EXCLUDED_EMAILS = ["imitkit@gmail.com"];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (user: User) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRedirectPath(user: User): string {
  if (user.role === "account" && user.company_slug) {
    return `/${user.company_slug}`;
  }
  if (user.role === "user") {
    return "/";
  }
  if (ADMIN_LAYOUT_ROLES.includes(user.role as UserRole)) {
    return "/admin";
  }
  return "/";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        posthog.identify(String(parsed.id), { email: parsed.email, name: parsed.full_name, role: parsed.role });
        if (POSTHOG_EXCLUDED_EMAILS.includes(parsed.email)) posthog.opt_out_capturing();
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setHasToken(!!token);
    setIsLoading(false);
  }, []);

  // Redirect unauthenticated users to login, or authenticated users away from login
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
    if (!isPublic && !hasToken) {
      router.push("/");
    } else if (pathname === "/" && hasToken && user) {
      router.push(getRedirectPath(user));
    }
  }, [isLoading, hasToken, user, pathname, router]);

  // Auto-logout on session expiry (401 from API)
  useEffect(() => {
    function handleSessionExpired() {
      posthog.capture("session_expired");
      setUser(null);
      setHasToken(false);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      router.push("/");
    }
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await apiClient.login({ email, password });
      setUser(user);
      setHasToken(true);
      localStorage.setItem("auth_user", JSON.stringify(user));
      posthog.identify(String(user.id), { email: user.email, name: user.full_name, role: user.role });
      document.cookie = `spf_email=${encodeURIComponent(user.email)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      router.push(getRedirectPath(user));
    } catch (error) {
      throw error;
    }
  };

  const loginWithToken = useCallback((authenticatedUser: User) => {
    setUser(authenticatedUser);
    setHasToken(true);
    localStorage.setItem("auth_user", JSON.stringify(authenticatedUser));
    posthog.identify(String(authenticatedUser.id), { email: authenticatedUser.email, name: authenticatedUser.full_name, role: authenticatedUser.role });
    document.cookie = `spf_email=${encodeURIComponent(authenticatedUser.email)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.push(getRedirectPath(authenticatedUser));
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
  }, []);

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if the API call fails, we still want to clear local state
      console.error("Logout error:", error);
    } finally {
      posthog.reset();
      setUser(null);
      setHasToken(false);
      localStorage.removeItem("auth_user");
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithToken,
        updateUser,
        logout,
        isAuthenticated: !!user || hasToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
