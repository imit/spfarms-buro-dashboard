"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient, type User } from "@/lib/api";

const PUBLIC_ROUTES = ["/", "/auth/invitation", "/auth/verify"];

export type UserRole = "admin" | "editor" | "account";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRedirectPath(user: User): string {
  if (user.role === "account" && user.company_slug) {
    return `/${user.company_slug}`;
  }
  return "/admin";
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
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setHasToken(!!token);
    setIsLoading(false);
  }, []);

  // Redirect unauthenticated users to login for any non-public route
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    if (!isPublic && !hasToken) {
      router.push("/");
    }
  }, [isLoading, hasToken, pathname, router]);

  // Auto-logout on session expiry (401 from API)
  useEffect(() => {
    function handleSessionExpired() {
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
      router.push(getRedirectPath(user));
    } catch (error) {
      throw error;
    }
  };

  const loginWithToken = useCallback((authenticatedUser: User) => {
    setUser(authenticatedUser);
    setHasToken(true);
    localStorage.setItem("auth_user", JSON.stringify(authenticatedUser));
    router.push(getRedirectPath(authenticatedUser));
  }, [router]);

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if the API call fails, we still want to clear local state
      console.error("Logout error:", error);
    } finally {
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
