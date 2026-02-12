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
  role: "admin" | "editor" | "dispensary";
  created_at: string;
}

export type Region =
  | "manhattan"
  | "brooklyn"
  | "bronx"
  | "queens"
  | "staten_island"
  | "long_island"
  | "upstate"
  | "other";

export const REGION_LABELS: Record<Region, string> = {
  manhattan: "Manhattan",
  brooklyn: "Brooklyn",
  bronx: "Bronx",
  queens: "Queens",
  staten_island: "Staten Island",
  long_island: "Long Island",
  upstate: "Upstate",
  other: "Other",
};

export type CompanyType = "dispensary" | "distributor" | "partner" | "processor";

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  dispensary: "Dispensary",
  distributor: "Distributor",
  partner: "Partner",
  processor: "Processor",
};

export interface Location {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  region: Region | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  company_type: CompanyType;
  website: string | null;
  description: string | null;
  phone_number: string | null;
  email: string | null;
  social_media: Record<string, string>;
  license_number: string | null;
  active: boolean;
  logo_url: string | null;
  locations: Location[];
  created_at: string;
  updated_at: string;
}

interface JsonApiRecord<T> {
  id: string;
  type: string;
  attributes: T;
}

interface JsonApiResponse<T> {
  data: JsonApiRecord<T>;
}

interface JsonApiCollectionResponse<T> {
  data: JsonApiRecord<T>[];
}

export interface Invitation {
  id: number;
  email: string;
  accepted_at: string | null;
  accepted: boolean;
  invited_by_email: string;
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
      return null;
    } catch {
      return null;
    }
  }

  // Magic link login

  async requestMagicLink(email: string): Promise<{ message: string }> {
    const res = await this.request<ApiResponse<never>>("/api/v1/magic_links", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { message: res.status.message };
  }

  async verifyMagicLink(
    token: string
  ): Promise<{ user: User; token: string }> {
    const res = await this.request<ApiResponse<User> & { token: string }>(
      "/api/v1/magic_links/verify",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );

    const jwt = res.token;
    if (typeof window !== "undefined" && jwt) {
      localStorage.setItem("auth_token", jwt);
    }

    return { user: res.data!, token: jwt };
  }

  // Invitations

  async createInvitation(email: string): Promise<void> {
    await this.request("/api/v1/invitations", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getInvitations(): Promise<Invitation[]> {
    const res = await this.request<JsonApiCollectionResponse<Invitation>>(
      "/api/v1/invitations"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async acceptInvitation(
    token: string
  ): Promise<{ user: User; token: string }> {
    const res = await this.request<ApiResponse<User> & { token: string }>(
      "/api/v1/invitations/accept",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );

    const jwt = res.token;
    if (typeof window !== "undefined" && jwt) {
      localStorage.setItem("auth_token", jwt);
    }

    return { user: res.data!, token: jwt };
  }

  // Companies

  async getCompanies(): Promise<Company[]> {
    const res = await this.request<JsonApiCollectionResponse<Company>>(
      "/api/v1/companies"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getCompany(slug: string): Promise<Company> {
    const res = await this.request<JsonApiResponse<Company>>(
      `/api/v1/companies/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createCompany(
    company: Record<string, unknown>
  ): Promise<Company> {
    const res = await this.request<JsonApiResponse<Company>>(
      "/api/v1/companies",
      {
        method: "POST",
        body: JSON.stringify({ company }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateCompany(
    slug: string,
    company: Record<string, unknown>
  ): Promise<Company> {
    const res = await this.request<JsonApiResponse<Company>>(
      `/api/v1/companies/${slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ company }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteCompany(slug: string): Promise<void> {
    await this.request(`/api/v1/companies/${slug}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
