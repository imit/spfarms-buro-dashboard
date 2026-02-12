"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export type UserRole = "admin" | "editor" | "dispensary";

interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setHasToken(!!token);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await apiClient.login({ email, password });
      setUser(user);
      setHasToken(true);
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const loginWithToken = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setHasToken(true);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if the API call fails, we still want to clear local state
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setHasToken(false);
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
