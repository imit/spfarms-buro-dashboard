const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  status: { code: number; message: string };
  data?: T;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  created_at: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "An error occurred",
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    // Check if response has a body
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return {} as T;
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.baseUrl}/users/sign_in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ user: credentials }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Login failed",
      }));
      throw new Error(error.message || "Login failed");
    }

    const data: ApiResponse<User> = await response.json();
    const token = response.headers.get("Authorization");

    if (!token) {
      throw new Error("No authorization token received");
    }

    // Store token without "Bearer " prefix
    const rawToken = token.replace(/^Bearer\s+/i, "");
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", rawToken);
    }

    return {
      user: data.data!,
      token: rawToken,
    };
  }

  async logout(): Promise<void> {
    await this.request("/users/sign_out", {
      method: "DELETE",
    });

    // Clear token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        return null;
      }

      // You'll need to implement a /users/current endpoint in Rails
      // For now, we'll decode the JWT client-side (not recommended for production)
      // but will work for this setup
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
