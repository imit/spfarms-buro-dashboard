const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  status: { code: number; message: string };
  data?: T;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = "admin" | "editor" | "account";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  account: "Account",
};

export interface UserCompanyMembership {
  slug: string;
  name: string;
  company_title: string | null;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string | null;
  phone_number: string | null;
  company_slug: string | null;
  company_name: string | null;
  companies: UserCompanyMembership[];
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

export type LeadStatus =
  | "idle"
  | "contacted"
  | "sampled"
  | "follow_up"
  | "negotiating"
  | "first_order"
  | "repeat"
  | "loyal"
  | "inactive"
  | "lost";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  idle: "Idle",
  contacted: "Contacted",
  sampled: "Sampled",
  follow_up: "Follow Up",
  negotiating: "Negotiating",
  first_order: "First Order",
  repeat: "Repeat",
  loyal: "Loyal",
  inactive: "Inactive",
  lost: "Lost",
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

export interface CompanyMember {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
  company_title: string | null;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  company_type: CompanyType;
  lead_status: LeadStatus;
  website: string | null;
  description: string | null;
  phone_number: string | null;
  email: string | null;
  social_media: Record<string, string>;
  license_number: string | null;
  active: boolean;
  logo_url: string | null;
  locations: Location[];
  members: CompanyMember[];
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

export type StrainCategory = "indica" | "sativa" | "hybrid";

export const CATEGORY_LABELS: Record<StrainCategory, string> = {
  indica: "Indica",
  sativa: "Sativa",
  hybrid: "Hybrid",
};

export interface Coa {
  id: number;
  tested_at: string | null;
  status: string | null;
  thc_percent: string | null;
  cbd_percent: string | null;
  total_terpenes_percent: string | null;
  terpenes: Record<string, number> | null;
  results: Record<string, unknown> | null;
  current: boolean;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Strain {
  id: number;
  name: string;
  code: string | null;
  category: StrainCategory | null;
  description: string | null;
  notes: string | null;
  dominant_terpenes: string | null;
  thc_range: string | null;
  total_terpenes: string | null;
  cbg: string | null;
  cbd: string | null;
  total_thc: string | null;
  total_cannabinoids: string | null;
  smell_tags: string[];
  active: boolean;
  image_url: string | null;
  coas_count: number;
  current_coa: Coa | null;
  created_at: string;
  updated_at: string;
}

export type ProductType =
  | "flower"
  | "pre_roll"
  | "concentrate"
  | "edible"
  | "vape"
  | "tincture"
  | "topical"
  | "capsule"
  | "seed"
  | "merchandise"
  | "gear"
  | "apparel";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  flower: "Flower",
  pre_roll: "Pre-Roll",
  concentrate: "Concentrate",
  edible: "Edible",
  vape: "Vape",
  tincture: "Tincture",
  topical: "Topical",
  capsule: "Capsule",
  seed: "Seed",
  merchandise: "Merchandise",
  gear: "Gear",
  apparel: "Apparel",
};

export type ProductStatus = "draft" | "active" | "archived";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cannabis: boolean;
  product_type: ProductType;
  product_uid: string | null;
  strain_id: number | null;
  strain_name: string | null;
  sku: string | null;
  barcode: string | null;
  unit_weight: string | null;
  unit_weight_uom: string | null;
  unit_count: number | null;
  default_price: string | null;
  status: ProductStatus;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  thc_content: string | null;
  cbd_content: string | null;
  ingredients: string | null;
  brand: string | null;
  requires_shipping: boolean;
  position: number | null;
  active: boolean;
  thumbnail_url: string | null;
  image_urls: string[];
  metrc_item_id: string | null;
  metrc_item_name: string | null;
  metrc_license_number: string | null;
  metrc_tag: string | null;
  webpage_url: string | null;
  metrc_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Sheet Layouts ----

export interface SheetLayout {
  id: number;
  name: string;
  slug: string;
  sheet_width_cm: string;
  sheet_height_cm: string;
  label_width_cm: string;
  label_height_cm: string;
  margin_top_cm: string;
  margin_bottom_cm: string;
  margin_left_cm: string;
  margin_right_cm: string;
  gap_x_cm: string;
  gap_y_cm: string;
  corner_radius_mm: string;
  default: boolean;
  columns: number;
  rows: number;
  labels_per_sheet: number;
  created_at: string;
  updated_at: string;
}

// ---- Labels ----

export type LabelStatus = "draft" | "active" | "archived";

export const LABEL_STATUS_LABELS: Record<LabelStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export interface LabelOverlayData {
  id: number;
  name: string | null;
  position_x: string;
  position_y: string;
  width: string;
  height: string;
  rotation: string;
  z_index: number;
  opacity: string;
  overlay_type: "image" | "svg_inline";
  svg_content: string | null;
  asset_url: string | null;
}

export interface LabelLineConfig {
  visible?: boolean;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  override?: string | null;
  letterSpacing?: number;
}

export interface LabelDesign {
  background_color?: string;
  font_primary?: string;
  info_group?: {
    visible?: boolean;
    x?: number;
    y?: number;
    product_type?: LabelLineConfig;
    strain_name?: LabelLineConfig;
    weight_line?: LabelLineConfig;
    badges?: {
      visible?: boolean;
      items?: string[];
      fontSize?: number;
      color?: string;
      bg?: string;
      radius?: number;
      paddingX?: number;
      paddingY?: number;
      gap?: number;
    };
  };
  qr?: {
    enabled?: boolean;
    data_source?: "product_url" | "custom";
    custom_url?: string | null;
    x?: number;
    y?: number;
    size?: number;
    error_correction?: string;
    fg_color?: string;
    bg_color?: string;
  };
  logo?: {
    visible?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

export interface Label {
  id: number;
  name: string;
  slug: string;
  strain_id: number | null;
  strain_name: string | null;
  product_id: number | null;
  product_name: string | null;
  width_cm: string;
  height_cm: string;
  corner_radius_mm: string;
  design: LabelDesign;
  status: LabelStatus;
  logo_url: string | null;
  overlays: LabelOverlayData[];
  render_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---- QR Codes ----

export type QrDataType = "url" | "custom_text";

export const QR_DATA_TYPE_LABELS: Record<QrDataType, string> = {
  url: "URL",
  custom_text: "Custom Text",
};

export interface QrCode {
  id: number;
  name: string;
  slug: string;
  product_id: number | null;
  product_name: string | null;
  data_type: QrDataType;
  url: string | null;
  custom_text: string | null;
  encoded_data: string;
  size_px: number;
  error_correction: string;
  fg_color: string;
  bg_color: string;
  include_logo: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Cart ----

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  product_slug: string;
  product_type: ProductType;
  unit_price: string | null;
  thumbnail_url: string | null;
  strain_name: string | null;
}

export interface Cart {
  id: number;
  user_id: number;
  company_id: number;
  items: CartItem[];
  item_count: number;
  subtotal: number;
}

// ---- Payment Terms ----

export interface PaymentTerm {
  id: number;
  name: string;
  days: number;
  discount_percentage: string;
  active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// ---- Discounts ----

export type DiscountType = "percentage" | "fixed";

export interface DiscountRecord {
  id: number;
  name: string;
  discount_type: DiscountType;
  value: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- App Settings ----

export interface AppSettings {
  tax_rate: string;
}

// ---- Checkout Preview ----

export interface CheckoutPreviewDiscount {
  name: string;
  type: string;
  value: number;
  amount: number;
}

export interface CheckoutPreviewItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_type: ProductType;
  quantity: number;
  unit_price: string;
  line_total: number;
  thumbnail_url: string | null;
  strain_name: string | null;
}

export interface CheckoutPreview {
  items: CheckoutPreviewItem[];
  subtotal: string;
  payment_term: {
    id: number;
    name: string;
    days: number;
    discount_percentage: string;
  } | null;
  payment_term_discount_amount: string;
  discounts: CheckoutPreviewDiscount[];
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
}

// ---- Orders ----

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_type: ProductType;
  quantity: number;
  unit_price: string;
  line_total: string;
  thumbnail_url: string | null;
  strain_name: string | null;
}

export interface OrderUser {
  id: number;
  role: "orderer" | "contact";
  user_id: number;
  email: string;
  full_name: string | null;
  phone_number: string | null;
}

export interface OrderLocation {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface OrderCompanyDetails {
  id: number;
  name: string;
  slug: string;
  company_type: CompanyType;
  email: string | null;
  phone_number: string | null;
  locations: OrderLocation[];
  members: CompanyMember[];
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: string;
  total: string;
  payment_term_name: string | null;
  payment_term_days: number | null;
  payment_term_discount_percentage: string | null;
  payment_term_discount_amount: string | null;
  discount_amount: string | null;
  discount_details: CheckoutPreviewDiscount[] | null;
  tax_rate: string | null;
  tax_amount: string | null;
  notes_to_vendor: string | null;
  internal_notes: string | null;
  desired_delivery_date: string | null;
  user: {
    id: number;
    email: string;
    full_name: string | null;
    phone_number: string | null;
  };
  company: {
    id: number;
    name: string;
    slug: string;
  };
  items: OrderItem[];
  order_users: OrderUser[];
  shipping_location: OrderLocation | null;
  billing_location: OrderLocation | null;
  company_details: OrderCompanyDetails;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderParams {
  company_id: number;
  shipping_location_id?: number;
  billing_location_id?: number;
  notes_to_vendor?: string;
  desired_delivery_date?: string;
  contact_users?: { full_name: string; email: string; phone_number?: string }[];
  payment_term_id?: number;
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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
      }
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

  private async requestFormData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
      }
      const error = await response.json().catch(() => ({
        message: "An error occurred",
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

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

  async createInvitation(email: string, role: UserRole): Promise<void> {
    await this.request("/api/v1/invitations", {
      method: "POST",
      body: JSON.stringify({ email, role }),
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

  // Users

  async getUsers(): Promise<User[]> {
    const res = await this.request<JsonApiCollectionResponse<User>>(
      "/api/v1/users"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getUser(id: number): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      `/api/v1/users/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createUser(user: { email: string; role: string }): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      "/api/v1/users",
      {
        method: "POST",
        body: JSON.stringify({ user }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/api/v1/users/${id}`, {
      method: "DELETE",
    });
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

  // Strains

  async getStrains(): Promise<Strain[]> {
    const res = await this.request<JsonApiCollectionResponse<Strain>>(
      "/api/v1/strains"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getStrain(id: number): Promise<Strain> {
    const res = await this.request<JsonApiResponse<Strain>>(
      `/api/v1/strains/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createStrain(formData: FormData): Promise<Strain> {
    const res = await this.requestFormData<JsonApiResponse<Strain>>(
      "/api/v1/strains",
      {
        method: "POST",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateStrain(id: number, formData: FormData): Promise<Strain> {
    const res = await this.requestFormData<JsonApiResponse<Strain>>(
      `/api/v1/strains/${id}`,
      {
        method: "PATCH",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteStrain(id: number): Promise<void> {
    await this.request(`/api/v1/strains/${id}`, {
      method: "DELETE",
    });
  }

  // Products

  async getProducts(): Promise<Product[]> {
    const res = await this.request<JsonApiCollectionResponse<Product>>(
      "/api/v1/products"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getProduct(slug: string): Promise<Product> {
    const res = await this.request<JsonApiResponse<Product>>(
      `/api/v1/products/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createProduct(formData: FormData): Promise<Product> {
    const res = await this.requestFormData<JsonApiResponse<Product>>(
      "/api/v1/products",
      {
        method: "POST",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateProduct(slug: string, formData: FormData): Promise<Product> {
    const res = await this.requestFormData<JsonApiResponse<Product>>(
      `/api/v1/products/${slug}`,
      {
        method: "PATCH",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteProduct(slug: string): Promise<void> {
    await this.request(`/api/v1/products/${slug}`, {
      method: "DELETE",
    });
  }

  // COAs

  async getStrainCoas(strainId: number): Promise<Coa[]> {
    const res = await this.request<JsonApiCollectionResponse<Coa>>(
      `/api/v1/strains/${strainId}/coas`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createCoa(strainId: number, formData: FormData): Promise<Coa> {
    const res = await this.requestFormData<JsonApiResponse<Coa>>(
      `/api/v1/strains/${strainId}/coas`,
      {
        method: "POST",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteCoa(strainId: number, coaId: number): Promise<void> {
    await this.request(`/api/v1/strains/${strainId}/coas/${coaId}`, {
      method: "DELETE",
    });
  }

  // Labels

  async getLabels(): Promise<Label[]> {
    const res = await this.request<JsonApiCollectionResponse<Label>>(
      "/api/v1/labels"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getLabel(slug: string): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createLabel(data: Record<string, unknown>): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>("/api/v1/labels", {
      method: "POST",
      body: JSON.stringify({ label: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateLabel(
    slug: string,
    data: Record<string, unknown>
  ): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ label: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateLabelWithFormData(
    slug: string,
    formData: FormData
  ): Promise<Label> {
    const res = await this.requestFormData<JsonApiResponse<Label>>(
      `/api/v1/labels/${slug}`,
      {
        method: "PATCH",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteLabel(slug: string): Promise<void> {
    await this.request(`/api/v1/labels/${slug}`, { method: "DELETE" });
  }

  async getLabelSvgPreview(slug: string): Promise<string> {
    const url = `${this.baseUrl}/api/v1/labels/${slug}/render_svg`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to render label SVG");
    return res.text();
  }

  async getLabelPdf(slug: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/labels/${slug}/render_pdf`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to render label PDF");
    return res.blob();
  }

  async printLabels(
    slug: string,
    sheetLayoutId: string,
    copies: number
  ): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/labels/${slug}/print`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        sheet_layout_id: sheetLayoutId,
        copies,
      }),
    });
    if (!res.ok) throw new Error("Failed to generate print PDF");
    return res.blob();
  }

  // Label Overlays

  async createLabelOverlay(
    labelSlug: string,
    formData: FormData
  ): Promise<Label> {
    const res = await this.requestFormData<JsonApiResponse<Label>>(
      `/api/v1/labels/${labelSlug}/label_overlays`,
      { method: "POST", body: formData }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateLabelOverlay(
    labelSlug: string,
    overlayId: number,
    formData: FormData
  ): Promise<Label> {
    const res = await this.requestFormData<JsonApiResponse<Label>>(
      `/api/v1/labels/${labelSlug}/label_overlays/${overlayId}`,
      { method: "PATCH", body: formData }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteLabelOverlay(
    labelSlug: string,
    overlayId: number
  ): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${labelSlug}/label_overlays/${overlayId}`,
      { method: "DELETE" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // Sheet Layouts

  async getSheetLayouts(): Promise<SheetLayout[]> {
    const res = await this.request<JsonApiCollectionResponse<SheetLayout>>(
      "/api/v1/sheet_layouts"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getSheetLayout(slug: string): Promise<SheetLayout> {
    const res = await this.request<JsonApiResponse<SheetLayout>>(
      `/api/v1/sheet_layouts/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createSheetLayout(
    data: Record<string, unknown>
  ): Promise<SheetLayout> {
    const res = await this.request<JsonApiResponse<SheetLayout>>(
      "/api/v1/sheet_layouts",
      {
        method: "POST",
        body: JSON.stringify({ sheet_layout: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateSheetLayout(
    slug: string,
    data: Record<string, unknown>
  ): Promise<SheetLayout> {
    const res = await this.request<JsonApiResponse<SheetLayout>>(
      `/api/v1/sheet_layouts/${slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ sheet_layout: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteSheetLayout(slug: string): Promise<void> {
    await this.request(`/api/v1/sheet_layouts/${slug}`, { method: "DELETE" });
  }

  // QR Codes

  async getQrCodes(): Promise<QrCode[]> {
    const res = await this.request<JsonApiCollectionResponse<QrCode>>(
      "/api/v1/qr_codes"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getQrCode(slug: string): Promise<QrCode> {
    const res = await this.request<JsonApiResponse<QrCode>>(
      `/api/v1/qr_codes/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createQrCode(data: Record<string, unknown>): Promise<QrCode> {
    const res = await this.request<JsonApiResponse<QrCode>>(
      "/api/v1/qr_codes",
      {
        method: "POST",
        body: JSON.stringify({ qr_code: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateQrCode(
    slug: string,
    data: Record<string, unknown>
  ): Promise<QrCode> {
    const res = await this.request<JsonApiResponse<QrCode>>(
      `/api/v1/qr_codes/${slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ qr_code: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteQrCode(slug: string): Promise<void> {
    await this.request(`/api/v1/qr_codes/${slug}`, { method: "DELETE" });
  }

  async getQrCodeSvg(slug: string): Promise<string> {
    const url = `${this.baseUrl}/api/v1/qr_codes/${slug}/render_svg`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to render QR code SVG");
    return res.text();
  }

  async getQrCodePdf(slug: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/qr_codes/${slug}/render_pdf`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to render QR code PDF");
    return res.blob();
  }

  // Onboard Representative

  async onboardRepresentative(data: {
    company: {
      name: string;
      website?: string;
      phone_number?: string;
      email?: string;
      license_number?: string;
    };
    location?: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      latitude?: number;
      longitude?: number;
      region?: string;
      phone_number?: string;
    };
    representative: {
      full_name: string;
      email: string;
      phone_number?: string;
      company_title?: string;
    };
  }): Promise<{ company: Company; user: User }> {
    const res = await this.request<{ data: { company: Company; user: User } }>(
      "/api/v1/onboard_representative",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return res.data;
  }

  // Cart

  async getCart(companyId: number): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart?company_id=${companyId}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async addToCart(
    companyId: number,
    productId: number,
    quantity: number = 1
  ): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart/items?company_id=${companyId}`,
      {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateCartItem(
    companyId: number,
    itemId: number,
    quantity: number
  ): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart/items/${itemId}?company_id=${companyId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async removeCartItem(companyId: number, itemId: number): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart/items/${itemId}?company_id=${companyId}`,
      { method: "DELETE" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async clearCart(companyId: number): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart?company_id=${companyId}`,
      { method: "DELETE" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // Checkout Preview

  async getCheckoutPreview(
    companyId: number,
    paymentTermId?: number
  ): Promise<CheckoutPreview> {
    const body: Record<string, unknown> = { company_id: companyId };
    if (paymentTermId) body.payment_term_id = paymentTermId;

    const res = await this.request<{ data: CheckoutPreview }>(
      "/api/v1/cart/checkout_preview",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return res.data;
  }

  // Payment Terms

  async getPaymentTerms(): Promise<PaymentTerm[]> {
    const res = await this.request<JsonApiCollectionResponse<PaymentTerm>>(
      "/api/v1/payment_terms"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createPaymentTerm(data: { name: string; days: number; discount_percentage: number; active: boolean; position: number }): Promise<PaymentTerm> {
    const res = await this.request<JsonApiResponse<PaymentTerm>>(
      "/api/v1/payment_terms",
      { method: "POST", body: JSON.stringify({ payment_term: data }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updatePaymentTerm(id: number, data: Partial<{ name: string; days: number; discount_percentage: number; active: boolean; position: number }>): Promise<PaymentTerm> {
    const res = await this.request<JsonApiResponse<PaymentTerm>>(
      `/api/v1/payment_terms/${id}`,
      { method: "PATCH", body: JSON.stringify({ payment_term: data }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deletePaymentTerm(id: number): Promise<void> {
    await this.request(`/api/v1/payment_terms/${id}`, { method: "DELETE" });
  }

  // Discounts

  async getDiscounts(): Promise<DiscountRecord[]> {
    const res = await this.request<JsonApiCollectionResponse<DiscountRecord>>(
      "/api/v1/discounts"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createDiscount(data: { name: string; discount_type: DiscountType; value: number; active: boolean }): Promise<DiscountRecord> {
    const res = await this.request<JsonApiResponse<DiscountRecord>>(
      "/api/v1/discounts",
      { method: "POST", body: JSON.stringify({ discount: data }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateDiscount(id: number, data: Partial<{ name: string; discount_type: DiscountType; value: number; active: boolean }>): Promise<DiscountRecord> {
    const res = await this.request<JsonApiResponse<DiscountRecord>>(
      `/api/v1/discounts/${id}`,
      { method: "PATCH", body: JSON.stringify({ discount: data }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteDiscount(id: number): Promise<void> {
    await this.request(`/api/v1/discounts/${id}`, { method: "DELETE" });
  }

  // Settings

  async getSettings(): Promise<AppSettings> {
    const res = await this.request<{ data: AppSettings }>("/api/v1/settings");
    return res.data;
  }

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const res = await this.request<{ data: AppSettings }>("/api/v1/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // Orders

  async createOrder(params: CreateOrderParams): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      "/api/v1/orders",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getOrders(): Promise<Order[]> {
    const res = await this.request<JsonApiCollectionResponse<Order>>(
      "/api/v1/orders"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getOrder(id: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateOrder(
    id: number,
    data: { status?: string; internal_notes?: string }
  ): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ order: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getOrderInvoice(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/orders/${id}/invoice`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate invoice");
    return res.blob();
  }
}

export const apiClient = new ApiClient();
