import posthog from "posthog-js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  status: { code: number; message: string };
  data?: T;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export interface MagicLinkError extends Error {
  expired?: boolean;
}

export type UserRole =
  | "admin"
  | "editor"
  | "account"
  | "sales"
  | "observer_admin"
  | "cultivator"
  | "processing"
  | "delivery"
  | "default"
  | "user";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  observer_admin: "Observer Admin",
  editor: "Editor",
  cultivator: "Cultivator",
  processing: "Processing",
  delivery: "Delivery",
  sales: "Sales",
  account: "Account",
  default: "Default",
  user: "User",
};

export interface UserCompanyMembership {
  slug: string;
  name: string;
  company_title: string | null;
}

export interface UserReferral {
  company_id: number;
  company_name: string;
  company_slug: string;
  total_orders: number;
  completed_orders: number;
  total_revenue: number;
}

export interface UserInviter {
  id: number;
  full_name: string | null;
  email: string;
}

export interface MagicLoginToken {
  id: number;
  status: "active" | "consumed";
  source: string | null;
  sent_at: string | null;
  consumed_at: string | null;
  last_used_at: string | null;
  created_at: string;
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
  referrals: UserReferral[];
  invited_by: UserInviter | null;
  created_at: string;
  invitation_sent_at: string | null;
  sign_in_count: number;
  current_sign_in_at: string | null;
  last_sign_in_at: string | null;
  current_sign_in_ip: string | null;
  last_sign_in_ip: string | null;
  last_active_at: string | null;
  deleted_at: string | null;
}

export type Region =
  | "manhattan"
  | "brooklyn"
  | "bronx"
  | "queens"
  | "staten_island"
  | "long_island"
  | "upstate"
  | "catskills"
  | "other";

export const REGION_LABELS: Record<Region, string> = {
  manhattan: "Manhattan",
  brooklyn: "Brooklyn",
  bronx: "Bronx",
  queens: "Queens",
  staten_island: "Staten Island",
  long_island: "Long Island",
  upstate: "Upstate",
  catskills: "Catskills",
  other: "Other",
};

export type CompanyType = "dispensary" | "distributor" | "partner" | "processor" | "microgrower" | "retailer" | "other";

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  dispensary: "Dispensary",
  distributor: "Distributor",
  partner: "Partner",
  processor: "Processor",
  microgrower: "Microgrower",
  retailer: "Retailer",
  other: "Other",
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
  | "lost"
  | "test"
  | "misc";

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
  test: "Test",
  misc: "Misc",
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
  license_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: number;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  role: UserRole;
  company_title: string | null;
  invitation_sent_at: string | null;
}

export interface CompanyReferrer {
  id: number;
  full_name: string | null;
  email: string;
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
  bulk_buyer: boolean;
  logo_url: string | null;
  locations: Location[];
  members: CompanyMember[];
  members_count: number;
  referred_by: CompanyReferrer | null;
  comments_count: number;
  orders_count: number;
  last_activity_at: string | null;
  default_menu_id: number | null;
  default_menu_slug: string | null;
  deleted_at: string | null;
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

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface JsonApiPaginatedResponse<T> extends JsonApiCollectionResponse<T> {
  meta: PaginationMeta;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Invitation {
  id: number;
  email: string;
  accepted_at: string | null;
  accepted: boolean;
  invited_by_email: string;
  created_at: string;
}

export interface BulkFlowerSend {
  id: number;
  recipient_label: string;
  company_slug: string | null;
  company_name: string | null;
  email: string | null;
  recipient_name: string | null;
  custom_message: string | null;
  product_count: number | null;
  sent_by: { id: number; name: string } | null;
  sent_at: string;
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
  slug: string | null;
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
  effect_tags: string[];
  active: boolean;
  image_url: string | null;
  title_image_url: string | null;
  coas_count: number;
  current_coa: Coa | null;
  parent_strain_id: number | null;
  phenotype_count: number;
  phenotype_names: string[] | null;
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
  | "apparel"
  | "bulk_flower";

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
  bulk_flower: "Bulk Flower",
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
  bulk: boolean;
  coming_soon: boolean;
  price_tbd: boolean;
  best_seller: boolean;
  product_type: ProductType;
  product_uid: string | null;
  strain_id: number | null;
  strain_name: string | null;
  strain_title_image_url: string | null;
  sku: string | null;
  barcode: string | null;
  unit_weight: string | null;
  unit_weight_uom: string | null;
  minimum_order_quantity: number;
  default_price: string | null;
  inventory_count: number;
  track_inventory: boolean;
  low_stock_threshold: number;
  in_stock: boolean;
  low_stock: boolean;
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
  full_image_url: string | null;
  image_urls: { attachment_id: number; url: string }[];
  promotional_image_urls: { attachment_id: number; url: string }[];
  metrc_item_id: string | null;
  metrc_item_name: string | null;
  metrc_license_number: string | null;
  metrc_tag: string | null;
  webpage_url: string | null;
  metrc_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Menus ----

export type MenuAccessType = "company_member_only" | "anyone_with_link";
export type MenuStatus = "draft" | "active" | "archived";

export interface MenuItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_type: ProductType;
  override_price: number | null;
  effective_price: number | null;
  default_price: number | null;
  price_tbd: boolean;
  position: number;
  visible: boolean;
  allocation_qty: number | null;
  thumbnail_url: string | null;
  strain_name: string | null;
  strain_id: number | null;
  in_stock: boolean;
  unit_weight: string | null;
  minimum_order_quantity: number;
  bulk: boolean;
  coming_soon: boolean;
  best_seller: boolean;
  cannabis: boolean;
  thc_content: string | null;
  cbd_content: string | null;
}

export interface Menu {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  access_type: MenuAccessType;
  status: MenuStatus;
  is_default: boolean;
  disable_discounts: boolean;
  show_bulk: boolean;
  cover_image_url: string | null;
  expires_at: string | null;
  company_id: number | null;
  company_name: string | null;
  created_by_name: string | null;
  item_count: number;
  items?: MenuItem[];
  share_url?: string;
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

export interface ExtractedSheetLayout {
  name: string;
  sheet_width_cm: number;
  sheet_height_cm: number;
  label_width_cm: number;
  label_height_cm: number;
  margin_top_cm: number;
  margin_bottom_cm: number;
  margin_left_cm: number;
  margin_right_cm: number;
  gap_x_cm: number;
  gap_y_cm: number;
  corner_radius_mm: number;
  columns: number;
  rows: number;
  labels_per_sheet: number;
}

// ---- Labels ----

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

export interface LabelDesign {
  background_color?: string;
  font_primary?: string;
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
  metrc_zone?: {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    render_as?: "original_image" | "qr_code" | "barcode" | "text";
  };
  cannabinoid_info?: {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    font_size?: number;
    text_color?: string;
    label_color?: string;
    columns?: CannabinoidColumn[];
    label_font_weight?: string;
    value_font_weight?: string;
  };
  product_info?: {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    font_size?: number;
    text_color?: string;
    left_text?: string;
    font_weight?: string;
  };
  weight_info?: {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    font_size?: number;
    text_color?: string;
    text?: string;
    font_weight?: string;
    text_anchor?: string;
  };
  expiration_date?: LabelTextLayer;
  batch_id?: LabelTextLayer;
  product_id_text?: LabelTextLayer;
  lot_number?: LabelTextLayer;
  harvest_date?: LabelTextLayer;
}

export interface LabelTextLayer {
  enabled?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  font_size?: number;
  text_color?: string;
  text?: string;
  font_weight?: string;
  text_anchor?: string;
}

export type CannabinoidField =
  | "category"
  | "total_thc"
  | "cbg"
  | "cbd"
  | "total_cannabinoids"
  | "total_terpenes";

export const CANNABINOID_FIELD_LABELS: Record<CannabinoidField, string> = {
  category: "Category",
  total_thc: "THC",
  cbg: "CBG",
  cbd: "CBD",
  total_cannabinoids: "Total Cannabinoids",
  total_terpenes: "Total Terpenes",
};

export interface CannabinoidColumn {
  field: CannabinoidField;
  label?: string;
}

// ---- Label Presets ----

export interface LabelPreset {
  id: number;
  name: string;
  config: {
    width_cm: number;
    height_cm: number;
    corner_radius_mm: number;
    design: LabelDesign;
    overlays: Array<{
      name: string;
      kind: string;
      position_x: number;
      position_y: number;
      width: number;
      height: number;
      z_index: number;
      rotation: number;
      opacity: number;
      svg_content: string | null;
    }>;
  };
  created_at: string;
  updated_at: string;
}

// ---- METRC Label Sets ----

export interface MetrcLabelItem {
  id: number;
  position: number;
  tag_string: string | null;
  has_image: boolean;
}

export interface MetrcLabelSet {
  id: number;
  name: string;
  source_type: "pdf_upload" | "tag_strings";
  item_count: number;
  items: MetrcLabelItem[];
  created_at: string;
  updated_at: string;
}

export interface MetrcLabelSetSummary {
  id: number;
  name: string;
  source_type: "pdf_upload" | "tag_strings";
  item_count: number;
  created_at: string;
}

export interface Label {
  id: number;
  name: string;
  slug: string;
  strain_id: number | null;
  strain_name: string | null;
  strain_title_image_url: string | null;
  product_id: number | null;
  product_name: string | null;
  width_cm: string;
  height_cm: string;
  corner_radius_mm: string;
  design: LabelDesign;
  logo_url: string | null;
  overlays: LabelOverlayData[];
  render_data: Record<string, unknown>;
  metrc_label_sets: MetrcLabelSetSummary[];
  strain_variants: LabelStrainVariant[];
  created_at: string;
  updated_at: string;
}

export interface LabelStrainVariant {
  id: number;
  strain_id: number;
  strain_name: string | null;
  image_x: number;
  image_y: number;
  image_width: number;
  image_height: number;
  text_overrides: Record<string, string>;
  is_sample: boolean;
  background_color_override: string | null;
  overlay_x: number;
  overlay_y: number;
  overlay_width: number;
  overlay_height: number;
  strain_image_url: string | null;
  overlay_image_url: string | null;
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
  menu_id: number | null;
  thumbnail_url: string | null;
  strain_name: string | null;
  unit_weight: string | null;
  minimum_order_quantity: number;
  bulk: boolean;
  coming_soon: boolean;
}

export interface CartDiscount {
  id: number;
  name: string;
  discount_type: DiscountType;
  value: string;
}

export interface Cart {
  id: number;
  company_id: number;
  company_name?: string;
  company_slug?: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  discounts: CartDiscount[];
  updated_at: string;
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
  bank_info: string;
  bulk_sales_phone: string;
  delivery_fee_waiver_minimum: string;
  metrc_default_env: string;
  metrc_sandbox_vendor_key: string;
  metrc_sandbox_user_key: string;
  metrc_production_vendor_key: string;
  metrc_production_user_key: string;
  facilities: { id: number; name: string; facility_type: string | null; environment: string; license_number: string | null; metrc_license_number: string | null }[];
}

export interface DeliveryFeeRecord {
  id: number;
  region: Region;
  fee: string;
  created_at: string;
  updated_at: string;
}

export interface PublicSettings {
  bulk_sales_phone: string;
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
  unit_weight: string | null;
  minimum_order_quantity: number;
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
  delivery_fee: string;
  delivery_fee_waived: boolean;
  delivery_fee_waiver_minimum: string;
  total: string;
}

// ---- Orders ----

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_received"
  | "draft";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_received: "Payment Received",
};

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overdue";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
};

export type OrderType = "standard" | "preorder";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  standard: "Standard",
  preorder: "Pre-order",
};

export interface OrderItemMetrcSet {
  id: number;
  name: string;
  item_count: number;
  processing_status?: string;
  label_id: number;
  label_slug: string;
  label_name: string;
  source_filename?: string | null;
  default_variant_id?: number | null;
  default_variant_name?: string | null;
  created_at: string;
}

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
  metrc_label_sets?: OrderItemMetrcSet[];
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
  license_number?: string | null;
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
  license_number: string | null;
  locations: OrderLocation[];
  members: CompanyMember[];
}

export interface SupportTicket {
  id: number;
  subject: string | null;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  company_id: number | null;
  company_name: string | null;
  company_slug: string | null;
  user_id: number | null;
  user_email: string | null;
  user_full_name: string | null;
  user_phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: OrderType;
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
  delivery_fee: string | null;
  delivery_fee_waived: boolean;
  disable_payment_term_discount: boolean;
  notes_to_vendor: string | null;
  internal_notes: string | null;
  desired_delivery_date: string | null;
  payment_terms_accepted_at: string | null;
  payment_due_date: string | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  delivered_at: string | null;
  payment_term_agreement: {
    signed: boolean;
    signer_name: string | null;
    signer_email: string | null;
    signer_ip: string | null;
    signature_data: string | null;
    signed_at: string | null;
    sent_at: string | null;
    expires_at: string | null;
    expired: boolean;
    agreement_url: string | null;
  } | null;
  user: {
    id: number;
    email: string;
    full_name: string | null;
    phone_number: string | null;
  } | null;
  company: {
    id: number;
    name: string;
    slug: string;
  } | null;
  items: OrderItem[];
  order_users: OrderUser[];
  shipping_location: OrderLocation | null;
  billing_location: OrderLocation | null;
  company_details: OrderCompanyDetails | null;
  delivery_proofs: OrderAttachment[];
  payment_proofs: OrderAttachment[];
  created_at: string;
  updated_at: string;
}

export interface OrderAttachment {
  id: number;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
  created_at: string;
}

// ---- Sample Batches ----

export type SampleItemStatus = "prepared" | "assigned" | "dropped";

export const SAMPLE_ITEM_STATUS_LABELS: Record<SampleItemStatus, string> = {
  prepared: "Prepared",
  assigned: "Assigned",
  dropped: "Dropped",
};

export interface SampleItemData {
  id: number;
  sample_uid: string;
  weight: number;
  status: SampleItemStatus;
  strain_name: string;
}

export interface SampleBatch {
  id: number;
  weight: number;
  unit_count: number;
  notes: string | null;
  strain: {
    id: number;
    name: string;
    category: StrainCategory | null;
  };
  prepared_by: {
    id: number;
    full_name: string | null;
    email: string;
  };
  items: SampleItemData[];
  item_counts: {
    total: number;
    prepared: number;
    assigned: number;
    dropped: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateSampleBatchParams {
  strain_id: number;
  weight: number;
  unit_count: number;
  notes?: string;
}

// ---- Sample Handoffs ----

export type SampleHandoffStatus = "assigned" | "dropped";

export const SAMPLE_HANDOFF_STATUS_LABELS: Record<SampleHandoffStatus, string> = {
  assigned: "Assigned",
  dropped: "Dropped",
};

export interface SampleHandoff {
  id: number;
  status: SampleHandoffStatus;
  dropped_at: string | null;
  notes: string | null;
  given_by: {
    id: number;
    full_name: string | null;
    email: string;
  };
  receiver: {
    id: number;
    full_name: string | null;
    email: string;
  };
  company: {
    id: number;
    name: string;
    slug: string;
  } | null;
  items: SampleItemData[];
  created_at: string;
  updated_at: string;
}

export interface HandoffSelection {
  strain_id: number;
  weight: number;
  quantity: number;
}

export interface CreateSampleHandoffParams {
  receiver_id: number;
  company_id?: number;
  mark_as_dropped?: boolean;
  notes?: string;
  selections: HandoffSelection[];
}

// ---- Sample Inventory ----

export interface SampleInventoryRow {
  strain_id: number;
  strain_name: string;
  strain_category: StrainCategory | null;
  weight: number;
  available_count: number;
}

// ---- Dashboard ----

export interface DashboardRecentCompany {
  id: number;
  name: string;
  slug: string;
  lead_status: LeadStatus;
  company_type: CompanyType;
  created_at: string;
}

export interface DashboardRecentUser {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
  invitation_sent_at: string;
}

export interface DashboardEmployeeOfMonth {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
  referral_count: number;
}

export interface DashboardTopDispensary {
  id: number;
  name: string;
  slug: string;
  order_count: number;
}

export interface DashboardUnsentInvite {
  id: number;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  companies: { slug: string; name: string }[];
  created_at: string;
}

export interface AccountsReceivableOrder {
  id: number;
  order_number: string;
  total: number;
  payment_status: PaymentStatus;
  payment_term_name: string | null;
  payment_term_days: number | null;
  payment_due_date: string | null;
  delivered_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  company_name: string | null;
  company_slug: string | null;
  days_since_delivery: number | null;
  days_until_due: number | null;
}

export interface AccountsReceivable {
  outstanding: AccountsReceivableOrder[];
  recently_paid: AccountsReceivableOrder[];
}

export interface DashboardRegistration {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone_number: string | null;
  license_number: string | null;
  active: boolean;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  contacted_dispensaries: number;
  samples_dropped: number;
  employee_of_the_month: DashboardEmployeeOfMonth | null;
  dispensary_of_the_month: DashboardTopDispensary | null;
  best_dispensary_ever: DashboardTopDispensary | null;
  recent_companies: DashboardRecentCompany[];
  recent_users: DashboardRecentUser[];
  unsent_invitations: DashboardUnsentInvite[];
  recent_registrations: DashboardRegistration[];
}

// ---- Root Dashboard ----

export interface RootDashboardOrder {
  id: number;
  order_number: string;
  total: string;
  status: OrderStatus;
  company_name: string | null;
  company_slug: string | null;
  created_at: string;
}

export interface RootDashboardPaymentDue {
  id: number;
  order_number: string;
  total: number;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  company_name: string | null;
  company_slug: string | null;
  days_until_due: number | null;
}

export interface RootDashboardTicket {
  id: number;
  subject: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  company_name: string | null;
  user_full_name: string | null;
  user_email: string | null;
  created_at: string;
}

export interface RootDashboardStats {
  total_revenue: number;
  expected_revenue: number;
  cod_revenue: number;
  total_orders: number;
  orders_today: number;
  revenue_today: number;
  recent_registrations: DashboardRegistration[];
  recent_users: DashboardRecentUser[];
  recent_companies: DashboardRecentCompany[];
  payments_due_this_week: RootDashboardPaymentDue[];
  open_support_tickets: RootDashboardTicket[];
  recent_orders_today: RootDashboardOrder[];
  latest_orders: RootDashboardOrder[];
}

// ---- Notifications ----

export type NotificationType =
  | "order_status"
  | "payment_reminder"
  | "feedback_request"
  | "info_request"
  | "product_update"
  | "announcement"
  | "cart_reminder"
  | "bank_info_send"
  | "payment_terms_agreement"
  | "payment_received"
  | "price_adjustment"
  | "thank_you";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_status: "Order Status",
  payment_reminder: "Payment Reminder",
  feedback_request: "Feedback Request",
  info_request: "Information Request",
  product_update: "Product Update",
  announcement: "Announcement",
  cart_reminder: "Cart Reminder",
  bank_info_send: "Bank Info",
  payment_terms_agreement: "Terms Agreement",
  payment_received: "Payment Received",
  price_adjustment: "Price Adjustment",
  thank_you: "Thank You",
};

export type NotificationChannel = "email_and_in_app" | "email_only" | "in_app_only";
export type NotificationTargetType = "company" | "user" | "broadcast";

export interface Notification {
  id: number;
  notification_type: NotificationType;
  subject: string;
  body: string | null;
  channel: NotificationChannel;
  target_type: NotificationTargetType;
  metadata: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
  sender: { id: number; full_name: string | null; email: string };
  target_company: { id: number; name: string; slug: string } | null;
  target_user: { id: number; full_name: string | null; email: string } | null;
  order: { id: number; order_number: string; status: OrderStatus } | null;
  recipient_count: number;
  recipients: { id: number; full_name: string | null; email: string; read_at: string | null }[];
}

export interface NotificationRecipient {
  id: number;
  notification_type: NotificationType;
  subject: string;
  body: string | null;
  metadata: Record<string, unknown>;
  order: { id: number; order_number: string; status: OrderStatus } | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

// ---- Comments ----

export interface CommentAuthor {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
}

export interface Comment {
  id: number;
  body: string;
  author: CommentAuthor;
  commentable_type: string;
  commentable_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  notification_type: NotificationType;
  subject: string;
  body?: string;
  channel?: NotificationChannel;
  target_type: NotificationTargetType;
  target_company_id?: number;
  target_user_id?: number;
  order_id?: number;
  metadata?: Record<string, unknown>;
}

export interface PartnershipRegistrationParams {
  company: {
    name: string;
    website?: string;
    phone_number?: string;
    email?: string;
    license_number?: string;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  contact: {
    full_name: string;
    email: string;
    phone_number?: string;
    title?: string;
  };
}

// ---- Gallery ----

export interface GalleryFile {
  id: number;
  title: string | null;
  alt_text: string | null;
  folder: string | null;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Shipments ----

export type ShipmentStatus = "draft" | "loading" | "in_transit" | "delivered" | "cancelled" | "processing";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  loading: "Loading",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface ShipmentOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  metrc_tag?: string | null;
  metrc_label_sets?: { id: number; name: string; item_count: number; processing_status?: string; label_id: number; label_slug: string; label_name: string; source_filename?: string | null; default_variant_id?: number | null; default_variant_name?: string | null }[];
}

export interface ShipmentOrderSummary {
  id: number;
  order_number: string;
  status: string;
  total: string;
  company_name: string;
  company_slug: string;
  items: ShipmentOrderItem[];
  payment_status: string;
  desired_delivery_date: string | null;
  position: number;
  transfer_manifest_url?: string | null;
  transfer_id?: string | null;
}

export interface SampleMetrcSet {
  id: number;
  name: string;
  item_count: number;
  label_id: number;
  label_slug: string;
  label_name: string;
  strain_id: number | null;
  strain_name: string | null;
  variant_id: number;
  is_sample: boolean;
  processing_status?: string;
  tag_id?: string | null;
  sample_group_id?: number | null;
  source_filename?: string | null;
}

export interface SampleGroup {
  id: number;
  name: string;
  company_id: number;
  company_name: string;
  transfer_manifest_url?: string | null;
  transfer_id?: string | null;
  metrc_label_set_ids: number[];
}

export interface Shipment {
  id: number;
  shipment_number: string;
  nickname: string | null;
  status: ShipmentStatus;
  scheduled_date: string | null;
  departed_at: string | null;
  completed_at: string | null;
  notes: string | null;
  is_sample: boolean;
  driver: { id: number; full_name: string | null; email: string } | null;
  orders: ShipmentOrderSummary[];
  sample_metrc_sets: SampleMetrcSet[];
  sample_groups: SampleGroup[];
  totals: { order_count: number; total_value: number; total_items: number };
  created_at: string;
  updated_at: string;
}

export interface CreateOrderParams {
  company_id: number;
  order_type?: OrderType;
  shipping_location_id?: number;
  billing_location_id?: number;
  notes_to_vendor?: string;
  desired_delivery_date?: string;
  contact_users?: { full_name: string; email: string; phone_number?: string }[];
  payment_term_id?: number;
  payment_terms_accepted?: boolean;
}

export interface CreateManualOrderParams {
  company_id: number;
  shipping_location_id?: number;
  billing_location_id?: number;
  notes_to_vendor?: string;
  desired_delivery_date?: string;
  internal_notes?: string;
  items: { product_id: number; quantity: number; unit_price?: number }[];
}

export interface CreateBulkOrderParams {
  company_id: number;
  shipping_location_id?: number;
  billing_location_id?: number;
  notes_to_vendor?: string;
  desired_delivery_date?: string;
  internal_notes?: string;
  disable_payment_term_discount?: boolean;
  items: { strain_id: number; grams: number; price_per_pound: number }[];
}

// ---- Grow / Facility ----

export type RoomType = "veg" | "flower" | "clone" | "dry" | "cure" | "storage" | "other";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  veg: "Vegetative",
  flower: "Flower",
  clone: "Clone",
  dry: "Dry",
  cure: "Cure",
  storage: "Storage",
  other: "Other",
};

export interface RoomSummary {
  id: number;
  name: string;
  room_type: RoomType | null;
  floor_count: number;
  position: number;
  rack_count: number;
  tray_count: number;
  total_capacity: number;
  active_plant_count: number;
  occupied_tray_count: number;
  total_tray_count: number;
}

export interface GrowSummary {
  total_plants: number;
  immature: number;
  vegetative: number;
  flowering: number;
  seed_batches: number;
  clone_batches: number;
  mother_batches: number;
  active_harvests: number;
}

export interface Facility {
  id: number;
  name: string;
  description: string | null;
  license_number: string | null;
  rooms: RoomSummary[];
  grow_summary: GrowSummary;
  metrc_facility_id: string | null;
  metrc_license_number: string | null;
  metrc_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FloorSummary {
  floor: number;
  rack_count: number;
  total_capacity: number;
  active_plant_count: number;
}

export interface Room {
  id: number;
  name: string;
  room_type: RoomType | null;
  floor_count: number;
  position: number;
  facility_id: number;
  rack_count: number;
  tray_count: number;
  total_capacity: number;
  floor_numbers: number[];
  plant_counts_by_floor: Record<number, number>;
  floors_summary: FloorSummary[];
  metrc_location_id_prefix: string | null;
  metrc_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rack {
  id: number;
  room_id: number;
  floor: number;
  position: number;
  name: string | null;
  display_name: string;
  total_capacity: number;
  active_plant_count: number;
  trays: TraySummary[];
  created_at: string;
  updated_at: string;
}

export interface TraySummary {
  id: number;
  position: number;
  name: string;
  capacity: number;
  active_plant_count: number;
}

export interface Tray {
  id: number;
  rack_id: number;
  position: number;
  capacity: number;
  name: string | null;
  display_name: string;
  active_plant_count: number;
  available_slots: number;
  created_at: string;
  updated_at: string;
}

export type GrowthPhase = "immature" | "vegetative" | "flowering";
export type PlantStatus = "active" | "harvested" | "destroyed";
export type BatchType = "seed" | "clone" | "mother";

export const GROWTH_PHASE_LABELS: Record<GrowthPhase, string> = {
  immature: "Immature",
  vegetative: "Vegetative",
  flowering: "Flowering",
};

export const PLANT_STATUS_LABELS: Record<PlantStatus, string> = {
  active: "Active",
  harvested: "Harvested",
  destroyed: "Destroyed",
};

export const BATCH_TYPE_LABELS: Record<BatchType, string> = {
  seed: "Seed",
  clone: "Clone",
  mother: "Mother",
};

export type PlantEventType = "placed" | "moved" | "phase_changed" | "tagged" | "noted" | "harvested" | "destroyed";

export interface PlantEventData {
  id: number;
  event_type: PlantEventType;
  metadata: Record<string, unknown>;
  notes: string | null;
  photo_urls: string[];
  user_name: string;
  created_at: string;
}

export interface FeedEvent {
  id: number;
  event_type: PlantEventType;
  notes: string | null;
  photo_urls: string[];
  user_name: string;
  created_at: string;
  plant: {
    id: number;
    plant_uid: string;
    strain_name: string;
    strain_id: number;
    growth_phase: GrowthPhase;
    metrc_label: string | null;
    room_name: string | null;
    room_id: number | null;
  };
}

export type AuditEventType =
  | "harvest_created"
  | "harvest_plants_added"
  | "harvest_wet_weight_recorded"
  | "harvest_drying_started"
  | "harvest_dry_weight_recorded"
  | "harvest_drying_finished"
  | "harvest_status_changed"
  | "harvest_strain_weight_recorded"
  | "harvest_waste_recorded"
  | "harvest_updated"
  | "harvest_trimming_started"
  | "harvest_trimming_finished"
  | "harvest_curing_finished"
  | "harvest_admin_reviewed"
  | "harvest_metrc_sync"
  | "harvest_metrc_preflight"
  | "batch_created"
  | "note_added"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_role_changed"
  | "user_impersonated"
  | "user_invited"
  | "company_created"
  | "company_updated"
  | "company_deleted"
  | "user_welcome_sent"
  | "product_created"
  | "product_updated"
  | "product_deleted"

export interface AuditEventData {
  id: number
  event_type: AuditEventType
  trackable_type: string
  trackable_id: number
  trackable_name: string
  metadata: Record<string, unknown>
  notes: string | null
  user: { id: number; full_name: string | null; email: string }
  created_at: string
}

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  harvest_created: "Harvest Created",
  harvest_plants_added: "Plants Added",
  harvest_wet_weight_recorded: "Wet Weight Recorded",
  harvest_drying_started: "Drying Started",
  harvest_dry_weight_recorded: "Dry Weight Recorded",
  harvest_drying_finished: "Drying Finished",
  harvest_status_changed: "Status Changed",
  harvest_strain_weight_recorded: "Strain Weight Recorded",
  harvest_waste_recorded: "Waste Recorded",
  harvest_updated: "Harvest Updated",
  harvest_trimming_started: "Trimming Started",
  harvest_trimming_finished: "Trimming Finished",
  harvest_curing_finished: "Curing Finished",
  harvest_admin_reviewed: "Admin Reviewed",
  harvest_metrc_sync: "Metrc Sync",
  harvest_metrc_preflight: "Metrc Preflight",
  batch_created: "Batch Created",
  note_added: "Note Added",
  user_created: "User Created",
  user_updated: "User Updated",
  user_deleted: "User Deleted",
  user_role_changed: "Role Changed",
  user_impersonated: "User Impersonated",
  user_invited: "User Invited",
  company_created: "Company Created",
  company_updated: "Company Updated",
  company_deleted: "Company Deleted",
  user_welcome_sent: "Welcome Email Sent",
  product_created: "Product Created",
  product_updated: "Product Updated",
  product_deleted: "Product Deleted",
}

export interface Plant {
  id: number;
  plant_uid: string;
  custom_label: string | null;
  growth_phase: GrowthPhase;
  status: PlantStatus;
  tray: { id: number; name: string; capacity: number } | null;
  rack: { id: number; name: string; floor: number; position: number } | null;
  room: { id: number; name: string } | null;
  strain: { id: number; name: string; category: string | null };
  plant_batch: { id: number; name: string; batch_uid: string } | null;
  placed_by: { id: number; full_name: string | null; email: string } | null;
  metrc_tag_info: { id: number; tag: string; status: string } | null;
  metrc_id: string | null;
  metrc_label: string | null;
  metrc_last_synced_at: string | null;
  harvested_at: string | null;
  destroyed_at: string | null;
  recent_events: PlantEventData[];
  created_at: string;
  updated_at: string;
}

export interface PlantBatch {
  id: number;
  name: string;
  batch_uid: string;
  batch_type: BatchType;
  initial_count: number;
  notes: string | null;
  strain: { id: number; name: string; category: string | null };
  created_by: { id: number; full_name: string | null; email: string } | null;
  active_plant_count: number;
  plant_count: number;
  metrc_id: string | null;
  metrc_tag: string | null;
  metrc_name: string | null;
  metrc_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HarvestType = "whole_plant" | "partial";
export type HarvestStatus = "active" | "drying" | "dried" | "trimming" | "curing" | "packaged" | "closed";

export const HARVEST_TYPE_LABELS: Record<HarvestType, string> = {
  whole_plant: "Whole Plant",
  partial: "Partial",
};

export const HARVEST_STATUS_LABELS: Record<HarvestStatus, string> = {
  active: "Active",
  drying: "Drying",
  dried: "Dried",
  trimming: "Trimming",
  curing: "Curing",
  packaged: "Packaged",
  closed: "Closed",
};

export interface HarvestPlant {
  id: number;
  plant_id: number;
  plant_uid: string;
  strain_id: number;
  strain_name: string;
  metrc_label: string | null;
  wet_weight_grams: number | null;
  harvested_at: string;
}

export interface HarvestWeight {
  id: number;
  strain_id: number;
  strain_name: string;
  wet_weight_grams: number | null;
  dry_weight_grams: number | null;
  waste_weight_grams: number | null;
  flower_weight_grams: number | null;
  shake_weight_grams: number | null;
}

export interface Harvest {
  id: number;
  name: string;
  harvest_uid: string;
  harvest_type: HarvestType;
  status: HarvestStatus;
  harvest_date: string;
  drying_started_at: string | null;
  dried_at: string | null;
  wet_weight_grams: number | null;
  dry_weight_grams: number | null;
  waste_weight_grams: number | null;
  flower_weight_grams: number | null;
  shake_weight_grams: number | null;
  trimming_started_at: string | null;
  trimming_finished_at: string | null;
  curing_started_at: string | null;
  curing_finished_at: string | null;
  unit_of_weight: string;
  plant_count: number;
  notes: string | null;
  strain: { id: number; name: string; category: string | null };
  plant_batch: { id: number; name: string; batch_uid: string } | null;
  created_by: { id: number; full_name: string | null; email: string } | null;
  drying_room: { id: number; name: string } | null;
  dry_weight_loss_pct: number | null;
  drying_days: number | null;
  trimming_days: number | null;
  curing_days: number | null;
  total_days: number | null;
  harvest_plants: HarvestPlant[];
  harvest_weights: HarvestWeight[];
  strains_in_harvest: { id: number; name: string }[];
  metrc_id: string | null;
  metrc_tag: string | null;
  metrc_last_synced_at: string | null;
  admin_reviewed_at: string | null;
  admin_reviewed_by: { id: number; full_name: string | null; email: string } | null;
  created_at: string;
  updated_at: string;
}

export interface MetrcPreflightReport {
  harvest: {
    id: number;
    name: string;
    status: string;
    plant_count: number;
    plants_with_tags: number;
    plants_without_tags: number;
  };
  by_sync_status: {
    not_synced: number;
    synced_vegetative: number;
    synced_flowering: number;
    synced_harvested: number;
  };
  strains: {
    our_name: string;
    metrc_name: string;
    name_mismatch: boolean;
    plant_count: number;
    sync_statuses: Record<string, number>;
  }[];
  actions_needed: string[];
  metrc_preview: {
    harvest: {
      name: string;
      harvest_date: string;
      drying_location: string;
      plant_count: number;
      strains: {
        name: string;
        plant_count: number;
        wet_weight_grams: number;
        item_name: string;
        batch_name: string;
      }[];
    };
  };
}

export interface MetrcTestingSample {
  strain: string;
  grams: number;
  batch_id: string;
  test_type: "rnd" | "potency";
}

export interface MetrcTestingResult {
  success: boolean;
  packages: {
    strain: string;
    test_type: string;
    grams: number;
    batch_id: string;
    bulk_tag: string;
    testing_tag: string;
  }[];
  errors: string[];
}

export interface MetrcSyncResult {
  success: boolean;
  steps: { name: string; action: string; count: number }[];
  errors: string[];
}

export interface MetrcTagSyncResult {
  environment: string;
  license: string;
  plant_tags: { fetched: number; created: number; skipped: number };
  package_tags: { fetched: number; created: number; skipped: number };
}

export interface TrayPlant {
  id: number;
  plant_uid: string;
  custom_label: string | null;
  strain_name: string;
  strain_id: number;
  growth_phase: GrowthPhase;
  metrc_label: string | null;
  plant_batch_id: number | null;
  created_at: string;
}

export interface TrayView {
  id: number;
  position: number;
  name: string;
  capacity: number;
  plants: TrayPlant[];
}

export interface RackView {
  id: number;
  floor: number;
  position: number;
  name: string;
  total_capacity: number;
  trays: TrayView[];
}

export interface FloorView {
  room_id: number;
  room_name: string;
  room_type: string | null;
  floor: number;
  racks: RackView[];
  total_plants: number;
  total_capacity: number;
}

export type MetrcTagType = "plant_tag" | "package_tag";
export type MetrcTagStatus = "available" | "assigned" | "used" | "voided";

export const METRC_TAG_STATUS_LABELS: Record<MetrcTagStatus, string> = {
  available: "Available",
  assigned: "Assigned",
  used: "Used",
  voided: "Voided",
};

export interface MetrcTag {
  id: number;
  tag: string;
  tag_type: MetrcTagType;
  status: MetrcTagStatus;
  assigned_at: string | null;
  plant: { id: number; plant_uid: string; strain_name: string } | null;
  assigned_by: { id: number; full_name: string | null; email: string } | null;
  created_at: string;
  updated_at: string;
}

export interface MetrcTagStats {
  available: number;
  assigned: number;
  used: number;
  voided: number;
  total: number;
}

// --- Posts & Channels ---

export type PostType = "task" | "plan" | "announcement" | "discussion";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  task: "Task",
  plan: "Plan",
  announcement: "Announcement",
  discussion: "Discussion",
};

export type PostStatus = "open" | "in_progress" | "done" | "closed";

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
  closed: "Closed",
};

export type PostPriority = "low" | "normal" | "high" | "urgent";

export const POST_PRIORITY_LABELS: Record<PostPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export interface ChannelCreator {
  id: number;
  full_name: string | null;
  email: string;
}

export interface ChannelMember {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
}

export interface Channel {
  id: number;
  title: string;
  slug: string;
  color: string;
  description: string | null;
  private: boolean;
  position: number;
  created_by: ChannelCreator | null;
  posts_count: number;
  members: ChannelMember[];
  created_at: string;
  updated_at: string;
}

export interface PostAuthor {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
}

export interface PostAssignee {
  id: number;
  full_name: string | null;
  email: string;
  role: UserRole;
}

export interface PostCompanyLocation {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface PostCompanyMember {
  id: number;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  role: UserRole;
  company_title: string | null;
}

export interface PostCompanyDetail {
  id: number;
  name: string;
  slug: string;
  company_type: CompanyType;
  email: string | null;
  phone_number: string | null;
  locations: PostCompanyLocation[];
  members: PostCompanyMember[];
}

export interface PostChannel {
  id: number;
  title: string;
  slug: string;
  color: string;
}

export interface Post {
  id: number;
  title: string;
  body: string | null;
  post_type: PostType;
  status: PostStatus;
  priority: PostPriority;
  scheduled_date: string | null;
  due_date: string | null;
  pinned: boolean;
  channel: PostChannel;
  author: PostAuthor;
  assignees: PostAssignee[];
  companies: PostCompanyDetail[];
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePostParams {
  post: {
    title: string;
    body?: string;
    post_type: PostType;
    status?: PostStatus;
    priority?: PostPriority;
    channel_id: number;
    scheduled_date?: string;
    due_date?: string;
    pinned?: boolean;
  };
  assignee_ids?: number[];
  company_ids?: number[];
  notify?: boolean;
}

export interface UpdatePostParams {
  post: {
    title?: string;
    body?: string;
    post_type?: PostType;
    status?: PostStatus;
    priority?: PostPriority;
    channel_id?: number;
    scheduled_date?: string | null;
    due_date?: string | null;
    pinned?: boolean;
  };
  assignee_ids?: number[];
  company_ids?: number[];
  notify?: boolean;
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
      const message = error.message
        || (Array.isArray(error.errors) ? error.errors.join(", ") : null)
        || `HTTP error! status: ${response.status}`;
      posthog.capture("api_error", {
        endpoint,
        method: options.method || "GET",
        status: response.status,
        error: message,
      });
      throw new Error(message);
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
      const message = error.message
        || (Array.isArray(error.errors) ? error.errors.join(", ") : null)
        || `HTTP error! status: ${response.status}`;
      posthog.capture("api_error", {
        endpoint,
        method: options.method || "GET",
        status: response.status,
        error: message,
      });
      throw new Error(message);
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
    const response = await fetch(`${this.baseUrl}/api/v1/magic_links/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.status?.message || "Verification failed");
      (err as MagicLinkError).expired = !!data.expired;
      throw err;
    }

    const jwt = data.token;
    if (typeof window !== "undefined" && jwt) {
      localStorage.setItem("auth_token", jwt);
    }

    return { user: data.data!, token: jwt };
  }

  async refreshMagicLink(token: string): Promise<{ message: string }> {
    const res = await this.request<ApiResponse<never>>(
      "/api/v1/magic_links/refresh",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );
    return { message: res.status.message };
  }

  // Invitations

  async createInvitation(email: string, role: UserRole, custom_message?: string): Promise<void> {
    await this.request("/api/v1/invitations", {
      method: "POST",
      body: JSON.stringify({ email, role, custom_message }),
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

  async getUsers(opts?: { include_deleted?: boolean; page?: number; per_page?: number; search?: string }): Promise<PaginatedResult<User>> {
    const params = new URLSearchParams();
    if (opts?.include_deleted) params.set("include_deleted", "true");
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.per_page) params.set("per_page", String(opts.per_page));
    if (opts?.search) params.set("search", opts.search);
    const query = params.toString() ? `?${params}` : "";
    const res = await this.request<JsonApiPaginatedResponse<User>>(
      `/api/v1/users${query}`
    );
    return {
      data: res.data.map((d) => ({ ...d.attributes, id: Number(d.id) })),
      meta: res.meta,
    };
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

  async updateUser(
    id: number,
    data: { email?: string; full_name?: string; phone_number?: string; role?: UserRole }
  ): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      `/api/v1/users/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ user: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/api/v1/users/${id}`, {
      method: "DELETE",
    });
  }

  // Magic Login Tokens

  async getMagicLoginTokens(userId: number): Promise<MagicLoginToken[]> {
    const res = await this.request<JsonApiCollectionResponse<MagicLoginToken>>(
      `/api/v1/users/${userId}/magic_login_tokens`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async consumeMagicLoginToken(
    userId: number,
    tokenId: number
  ): Promise<void> {
    await this.request(
      `/api/v1/users/${userId}/magic_login_tokens/${tokenId}`,
      { method: "DELETE" }
    );
  }

  async consumeAllMagicLoginTokens(userId: number): Promise<void> {
    await this.request(
      `/api/v1/users/${userId}/magic_login_tokens/destroy_all`,
      { method: "DELETE" }
    );
  }

  // Companies

  async getCompanies(opts?: { include_deleted?: boolean; page?: number; per_page?: number; q?: string }): Promise<PaginatedResult<Company>> {
    const params = new URLSearchParams();
    if (opts?.include_deleted) params.set("include_deleted", "true");
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.per_page) params.set("per_page", String(opts.per_page));
    if (opts?.q) params.set("q", opts.q);
    const query = params.toString() ? `?${params}` : "";
    const res = await this.request<JsonApiPaginatedResponse<Company>>(
      `/api/v1/companies${query}`
    );
    return {
      data: res.data.map((d) => ({ ...d.attributes, id: Number(d.id) })),
      meta: res.meta,
    };
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

  async updateCompanyWithFormData(
    slug: string,
    formData: FormData
  ): Promise<Company> {
    const res = await this.requestFormData<JsonApiResponse<Company>>(
      `/api/v1/companies/${slug}`,
      {
        method: "PATCH",
        body: formData,
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async fetchCompanyLogo(slug: string, url?: string): Promise<Company> {
    const res = await this.request<JsonApiResponse<Company>>(
      `/api/v1/companies/${slug}/fetch_logo`,
      {
        method: "POST",
        body: JSON.stringify(url ? { url } : {}),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteCompany(slug: string): Promise<void> {
    await this.request(`/api/v1/companies/${slug}`, {
      method: "DELETE",
    });
  }

  async sendCartReminder(slug: string, customMessage?: string): Promise<void> {
    await this.request(`/api/v1/companies/${slug}/send_cart_reminder`, {
      method: "POST",
      body: JSON.stringify({ custom_message: customMessage || undefined }),
    });
  }

  async sendCompanyFollowup(slug: string, params: { notification_type: NotificationType; subject: string; body?: string }): Promise<void> {
    await this.request(`/api/v1/companies/${slug}/send_followup`, {
      method: "POST",
      body: JSON.stringify(params),
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

  async mergeStrains(parentId: number, childStrainIds: number[]): Promise<Strain & { merged_count: number }> {
    const res = await this.request<JsonApiResponse<Strain> & { merged_count: number }>(
      `/api/v1/strains/${parentId}/merge`,
      {
        method: "POST",
        body: JSON.stringify({ strain_ids: childStrainIds }),
      }
    );
    return { ...res.data.attributes, merged_count: res.merged_count };
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

  // ---- Menus ----

  async getMenus(): Promise<Menu[]> {
    const res = await this.request<JsonApiCollectionResponse<Menu>>(
      "/api/v1/menus"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getMenu(slug: string): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createMenu(data: {
    name: string;
    description?: string;
    access_type?: MenuAccessType;
    status?: MenuStatus;
    is_default?: boolean;
    company_id?: number;
    expires_at?: string;
  }): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>("/api/v1/menus", {
      method: "POST",
      body: JSON.stringify({ menu: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateMenu(
    slug: string,
    data: Partial<{
      name: string;
      description: string;
      access_type: MenuAccessType;
      status: MenuStatus;
      is_default: boolean;
      disable_discounts: boolean;
      show_bulk: boolean;
      company_id: number;
      expires_at: string;
    }>
  ): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ menu: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteMenu(slug: string): Promise<void> {
    await this.request(`/api/v1/menus/${slug}`, { method: "DELETE" });
  }

  async duplicateMenu(slug: string): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${slug}/duplicate`,
      { method: "POST" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async addMenuItem(
    menuSlug: string,
    data: { product_id: number; override_price?: number; position?: number }
  ): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${menuSlug}/items`,
      {
        method: "POST",
        body: JSON.stringify({ menu_item: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async batchAddMenuItems(
    menuSlug: string,
    items: { product_id: number; override_price?: number; position?: number }[]
  ): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${menuSlug}/items/batch_add`,
      {
        method: "POST",
        body: JSON.stringify({ items }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateMenuItem(
    menuSlug: string,
    itemId: number,
    data: { override_price?: number | null; position?: number; visible?: boolean; allocation_qty?: number | null }
  ): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${menuSlug}/items/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ menu_item: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async removeMenuItem(menuSlug: string, itemId: number): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${menuSlug}/items/${itemId}`,
      { method: "DELETE" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async reorderMenuItems(
    menuSlug: string,
    itemIds: number[]
  ): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/${menuSlug}/items/reorder`,
      {
        method: "POST",
        body: JSON.stringify({ item_ids: itemIds }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getPublicMenu(slug: string): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/public/menus/${slug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async resolveMenuForCompany(companySlug: string): Promise<Menu> {
    const res = await this.request<JsonApiResponse<Menu>>(
      `/api/v1/menus/resolve?company_slug=${companySlug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async sendBulkFlowerList(
    companySlug: string,
    customMessage?: string
  ): Promise<{ message: string }> {
    const res = await this.request<{ data: { message: string } }>(
      `/api/v1/companies/${companySlug}/send_bulk_list`,
      {
        method: "POST",
        body: JSON.stringify(
          customMessage ? { custom_message: customMessage } : {}
        ),
      }
    );
    return res.data;
  }

  // Bulk Flower Sends

  async getBulkFlowerSends(): Promise<BulkFlowerSend[]> {
    return this.request<BulkFlowerSend[]>("/api/v1/bulk_flower_sends");
  }

  async createBulkFlowerSend(params: {
    company_slug?: string;
    email?: string;
    recipient_name?: string;
    custom_message?: string;
  }): Promise<BulkFlowerSend> {
    return this.request<BulkFlowerSend>("/api/v1/bulk_flower_sends", {
      method: "POST",
      body: JSON.stringify(params),
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

  async duplicateLabel(slug: string): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${slug}/duplicate`,
      { method: "POST" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async copyTextLayers(
    slug: string,
    targetLabelIds: number[]
  ): Promise<{ updated: string[]; count: number }> {
    return this.request(`/api/v1/labels/${slug}/copy_text_layers`, {
      method: "POST",
      body: JSON.stringify({ target_label_ids: targetLabelIds }),
    });
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

  async getLabelVariantSvgPreview(
    slug: string,
    variantId: number
  ): Promise<string> {
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
      body: JSON.stringify({ variant_id: variantId }),
    });
    if (!res.ok) throw new Error("Failed to render variant SVG");
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
    copies: number,
    metrcLabelSetId?: number
  ): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/labels/${slug}/print`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const body: Record<string, unknown> = {
      sheet_layout_id: sheetLayoutId,
      copies,
    };
    if (metrcLabelSetId) {
      body.metrc_label_set_id = metrcLabelSetId;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
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

  // Label Strain Variants

  async createLabelStrainVariant(
    labelSlug: string,
    data: FormData
  ): Promise<Label> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(
      `${this.baseUrl}/api/v1/labels/${labelSlug}/label_strain_variants`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: data,
      }
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(
        json.errors?.join(", ") || json.error || "Failed to create variant"
      );
    }
    const json = await res.json();
    return { ...json.data.attributes, id: Number(json.data.id) };
  }

  async updateLabelStrainVariant(
    labelSlug: string,
    variantId: number,
    data: FormData
  ): Promise<Label> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(
      `${this.baseUrl}/api/v1/labels/${labelSlug}/label_strain_variants/${variantId}`,
      {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: data,
      }
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(
        json.errors?.join(", ") || json.error || "Failed to update variant"
      );
    }
    const json = await res.json();
    return { ...json.data.attributes, id: Number(json.data.id) };
  }

  async deleteLabelStrainVariant(
    labelSlug: string,
    variantId: number
  ): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${labelSlug}/label_strain_variants/${variantId}`,
      { method: "DELETE" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async duplicateLabelStrainVariant(
    labelSlug: string,
    variantId: number,
    strainId?: number
  ): Promise<Label> {
    const body: Record<string, unknown> = {};
    if (strainId) body.strain_id = strainId;
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${labelSlug}/label_strain_variants/${variantId}/duplicate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async printLabelVariant(
    labelSlug: string,
    variantId: number,
    sheetLayoutId: string,
    copies?: number
  ): Promise<Blob> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(
      `${this.baseUrl}/api/v1/labels/${labelSlug}/print_variant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          variant_id: variantId,
          sheet_layout_id: sheetLayoutId,
          ...(copies ? { copies } : {}),
        }),
      }
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Failed to print variant");
    }
    return res.blob();
  }

  // Label Presets

  async getLabelPresets(): Promise<LabelPreset[]> {
    const res = await this.request<JsonApiCollectionResponse<LabelPreset>>(
      "/api/v1/label_presets"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createLabelPreset(labelSlug: string, name: string): Promise<LabelPreset> {
    const res = await this.request<JsonApiResponse<LabelPreset>>(
      "/api/v1/label_presets",
      {
        method: "POST",
        body: JSON.stringify({ label_slug: labelSlug, name }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteLabelPreset(id: number): Promise<void> {
    await this.request("/api/v1/label_presets/" + id, { method: "DELETE" });
  }

  async applyLabelPreset(slug: string, presetId: number): Promise<Label> {
    const res = await this.request<JsonApiResponse<Label>>(
      `/api/v1/labels/${slug}/apply_preset`,
      { method: "POST", body: JSON.stringify({ preset_id: presetId }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // METRC Label Sets

  async getMetrcLabelSets(labelSlug: string): Promise<MetrcLabelSet[]> {
    const res = await this.request<JsonApiCollectionResponse<MetrcLabelSet>>(
      `/api/v1/labels/${labelSlug}/metrc_label_sets`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createMetrcLabelSetFromTags(
    labelSlug: string,
    tags: string[],
    name?: string
  ): Promise<MetrcLabelSet> {
    const res = await this.request<JsonApiResponse<MetrcLabelSet>>(
      `/api/v1/labels/${labelSlug}/metrc_label_sets`,
      {
        method: "POST",
        body: JSON.stringify({ tags, name }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createMetrcLabelSetFromPdf(
    labelSlug: string,
    pdf: File,
    name?: string
  ): Promise<MetrcLabelSet> {
    const formData = new FormData();
    formData.append("pdf", pdf);
    if (name) formData.append("name", name);

    const res = await this.requestFormData<JsonApiResponse<MetrcLabelSet>>(
      `/api/v1/labels/${labelSlug}/metrc_label_sets`,
      { method: "POST", body: formData }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteMetrcLabelSet(
    labelSlug: string,
    setId: number
  ): Promise<void> {
    await this.request(
      `/api/v1/labels/${labelSlug}/metrc_label_sets/${setId}`,
      { method: "DELETE" }
    );
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

  async extractSheetLayoutFromSvg(
    file: File
  ): Promise<ExtractedSheetLayout> {
    const formData = new FormData();
    formData.append("svg", file);

    const res = await this.requestFormData<{ data: ExtractedSheetLayout }>(
      "/api/v1/sheet_layouts/extract_from_svg",
      { method: "POST", body: formData }
    );
    return res.data;
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
    company_id?: number;
    company?: {
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
    send_email?: boolean;
    referred_by_id?: number;
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

  // Profile

  async getProfile(): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      "/api/v1/profile"
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateProfile(data: { full_name?: string; phone_number?: string; company_title?: string }, companySlug?: string): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      "/api/v1/profile",
      {
        method: "PATCH",
        body: JSON.stringify({ user: data, company_slug: companySlug }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // Company Members

  async inviteCompanyMember(
    slug: string,
    data: { email: string; full_name?: string; phone_number?: string; company_title?: string }
  ): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      `/api/v1/companies/${slug}/members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async lookupCompanyMember(
    slug: string,
    email: string
  ): Promise<{
    id: number;
    email: string;
    full_name: string | null;
    phone_number: string | null;
    deleted: boolean;
    already_member: boolean;
  } | null> {
    const res = await this.request<{ data: {
      id: number;
      email: string;
      full_name: string | null;
      phone_number: string | null;
      deleted: boolean;
      already_member: boolean;
    } | null }>(
      `/api/v1/companies/${slug}/members/lookup?email=${encodeURIComponent(email)}`
    );
    return res.data;
  }

  async removeCompanyMember(slug: string, userId: number): Promise<void> {
    await this.request(`/api/v1/companies/${slug}/members/${userId}`, {
      method: "DELETE",
    });
  }

  async sendWelcomeEmail(userId: number, opts?: { customMessage?: string; companySlug?: string }): Promise<User> {
    const res = await this.request<{ data: { attributes: User } }>(
      `/api/v1/users/${userId}/send_welcome_email`,
      {
        method: "POST",
        body: JSON.stringify({
          custom_message: opts?.customMessage || undefined,
          company_slug: opts?.companySlug || undefined,
        }),
      }
    );
    return res.data.attributes;
  }

  async snoozeInvitation(userId: number): Promise<void> {
    await this.request(`/api/v1/users/${userId}/snooze_invitation`, {
      method: "POST",
    });
  }

  async impersonateUser(userId: number): Promise<{ user: User; token: string }> {
    const res = await this.request<{ data: User; token: string }>(
      `/api/v1/users/${userId}/impersonate`,
      { method: "POST" }
    );
    return { user: res.data, token: res.token };
  }

  // Cart

  async getCarts(): Promise<Cart[]> {
    const res = await this.request<JsonApiCollectionResponse<Cart>>("/api/v1/carts");
    return res.data.map((item) => ({ ...item.attributes, id: Number(item.id) }));
  }

  async getCart(companyId: number): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart?company_id=${companyId}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async addToCart(
    companyId: number,
    productId: number,
    quantity: number = 1,
    menuId?: number
  ): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart/items?company_id=${companyId}`,
      {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity, menu_id: menuId }),
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

  async addCartDiscount(companyId: number, discountId: number): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart/discounts?company_id=${companyId}`,
      {
        method: "POST",
        body: JSON.stringify({ discount_id: discountId }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async removeCartDiscount(companyId: number, discountId: number): Promise<Cart> {
    const res = await this.request<JsonApiResponse<Cart>>(
      `/api/v1/cart/discounts/${discountId}?company_id=${companyId}`,
      { method: "DELETE" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // Checkout Preview

  async getCheckoutPreview(
    companyId: number,
    paymentTermId?: number,
    orderType?: OrderType,
    shippingLocationId?: number
  ): Promise<CheckoutPreview> {
    const body: Record<string, unknown> = { company_id: companyId };
    if (paymentTermId) body.payment_term_id = paymentTermId;
    if (orderType) body.order_type = orderType;
    if (shippingLocationId) body.shipping_location_id = shippingLocationId;

    const res = await this.request<{ data: CheckoutPreview }>(
      "/api/v1/cart/checkout_preview",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return res.data;
  }

  // Checkout Payment Term Agreement

  async checkPaymentTermAgreement(
    companyId: number,
    paymentTermId: number
  ): Promise<{ signed: boolean; signer_name?: string; signer_email?: string; signed_at?: string }> {
    const res = await this.request<{ data: { signed: boolean; signer_name?: string; signer_email?: string; signed_at?: string } }>(
      `/api/v1/cart/payment_term_agreement?company_id=${companyId}&payment_term_id=${paymentTermId}`
    );
    return res.data;
  }

  async signPaymentTermAgreement(params: {
    company_id: number;
    payment_term_id: number;
    signer_name: string;
    signer_email: string;
    signature_data: string;
  }): Promise<{ signed: boolean; signer_name: string; signer_email: string; signed_at: string }> {
    const res = await this.request<{ data: { signed: boolean; signer_name: string; signer_email: string; signed_at: string } }>(
      "/api/v1/cart/payment_term_agreement/sign",
      {
        method: "POST",
        body: JSON.stringify(params),
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

  // Delivery Fees

  async getDeliveryFees(): Promise<DeliveryFeeRecord[]> {
    const res = await this.request<{ data: DeliveryFeeRecord[] }>("/api/v1/delivery_fees");
    return res.data;
  }

  async createDeliveryFee(data: { region: string; fee: number }): Promise<DeliveryFeeRecord> {
    const res = await this.request<{ data: DeliveryFeeRecord }>("/api/v1/delivery_fees", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async updateDeliveryFee(id: number, data: { region?: string; fee?: number }): Promise<DeliveryFeeRecord> {
    const res = await this.request<{ data: DeliveryFeeRecord }>(`/api/v1/delivery_fees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async deleteDeliveryFee(id: number): Promise<void> {
    await this.request(`/api/v1/delivery_fees/${id}`, { method: "DELETE" });
  }

  // Dashboard

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await this.request<{ data: DashboardStats }>(
      "/api/v1/dashboard"
    );
    return res.data;
  }

  async getRootDashboardStats(): Promise<RootDashboardStats> {
    const res = await this.request<{ data: RootDashboardStats }>(
      "/api/v1/root_dashboard"
    );
    return res.data;
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

  async createManualOrder(params: CreateManualOrderParams): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      "/api/v1/orders/create_manual",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createBulkOrder(params: CreateBulkOrderParams): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      "/api/v1/orders/create_bulk",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getOrders(params?: { company_id?: number }): Promise<Order[]> {
    const query = params?.company_id ? `?company_id=${params.company_id}` : "";
    const res = await this.request<JsonApiCollectionResponse<Order>>(
      `/api/v1/orders${query}`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getAccountsReceivable(): Promise<AccountsReceivable> {
    const res = await this.request<{ data: AccountsReceivable }>(
      "/api/v1/orders/accounts_receivable"
    );
    return res.data;
  }

  async getOrder(id: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateOrder(
    id: number,
    data: { status?: string; internal_notes?: string; shipping_location_id?: number; billing_location_id?: number; disable_payment_term_discount?: boolean },
    sendNotification?: boolean
  ): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ order: data, ...(sendNotification !== undefined && { send_notification: sendNotification }) }),
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

  async getOrderDeliveryAgreement(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/orders/${id}/delivery_agreement`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate delivery agreement");
    return res.blob();
  }

  async getOrderPaymentTermsPdf(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/orders/${id}/payment_terms_pdf`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate payment terms PDF");
    return res.blob();
  }

  async markProcessingDone(id: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}/mark_processing_done`,
      { method: "POST" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async sendBankInfo(id: number): Promise<{ message: string }> {
    const res = await this.request<{ data: { message: string } }>(
      `/api/v1/orders/${id}/send_bank_info`,
      { method: "POST" }
    );
    return res.data;
  }

  async getOrderEmailTimeline(id: number): Promise<Notification[]> {
    const res = await this.request<JsonApiCollectionResponse<Notification>>(
      `/api/v1/orders/${id}/email_timeline`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async updateOrderContacts(id: number, contacts: { full_name: string; email: string; phone_number?: string }[]): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}/update_contacts`,
      { method: "PATCH", body: JSON.stringify({ contacts }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateOrderOrderer(id: number, userId: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}/update_orderer`,
      { method: "PATCH", body: JSON.stringify({ user_id: userId }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateOrderPrices(id: number, items: { id: number; unit_price: string }[], sendNotification: boolean, customMessage?: string): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}/update_prices`,
      { method: "PATCH", body: JSON.stringify({ items, send_notification: sendNotification, custom_message: customMessage }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async sendPaymentTermsAgreement(id: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}/send_payment_terms_agreement`,
      { method: "POST" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async sendLicenseReminder(id: number): Promise<void> {
    await this.request(`/api/v1/orders/${id}/send_license_reminder`, {
      method: "POST",
    });
  }

  async uploadDeliveryProofs(id: number, files: File[]): Promise<Order> {
    const formData = new FormData();
    files.forEach((f) => formData.append("files[]", f));
    const res = await fetch(`${this.baseUrl}/api/v1/orders/${id}/upload_delivery_proofs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const json = await res.json();
    return { ...json.data.attributes, id: Number(json.data.id) };
  }

  async deleteDeliveryProof(orderId: number, proofId: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${orderId}/delete_delivery_proof`,
      { method: "DELETE", body: JSON.stringify({ proof_id: proofId }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async uploadPaymentProofs(id: number, files: File[]): Promise<Order> {
    const formData = new FormData();
    files.forEach((f) => formData.append("files[]", f));
    const res = await fetch(`${this.baseUrl}/api/v1/orders/${id}/upload_payment_proofs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const json = await res.json();
    return { ...json.data.attributes, id: Number(json.data.id) };
  }

  async deletePaymentProof(orderId: number, proofId: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${orderId}/delete_payment_proof`,
      { method: "DELETE", body: JSON.stringify({ proof_id: proofId }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async recordPayment(id: number, data: { payment_status?: string; paid_at?: string; payment_method?: string; payment_reference?: string }, files?: File[]): Promise<Order> {
    const formData = new FormData();
    if (data.payment_status) formData.append("payment_status", data.payment_status);
    if (data.paid_at) formData.append("paid_at", data.paid_at);
    if (data.payment_method) formData.append("payment_method", data.payment_method);
    if (data.payment_reference) formData.append("payment_reference", data.payment_reference);
    if (files) files.forEach((f) => formData.append("files[]", f));
    const res = await fetch(`${this.baseUrl}/api/v1/orders/${id}/record_payment`, {
      method: "POST",
      headers: { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Record payment failed");
    const json = await res.json();
    return { ...json.data.attributes, id: Number(json.data.id) };
  }

  // Order METRC

  async importOrderMetrc(
    orderId: number,
    orderItemId: number,
    labelId: string,
    pdf: File
  ): Promise<OrderItemMetrcSet> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/import_metrc`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const formData = new FormData();
    formData.append("order_item_id", orderItemId.toString());
    formData.append("label_id", labelId);
    formData.append("pdf", pdf);

    const res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || json.errors?.[0] || "Import failed");
    }
    const json = await res.json();
    return json.data;
  }

  async printOrderMetrcLabels(
    orderId: number,
    metrcLabelSetId: number,
    sheetLayoutId: string
  ): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/print_metrc_labels`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ metrc_label_set_id: metrcLabelSetId, sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Print failed");
    }
    return res.blob();
  }

  async printAllOrderMetrcLabels(
    orderId: number,
    sheetLayoutId: string
  ): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/print_all_metrc_labels`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Print failed");
    }
    return res.blob();
  }

  async deleteOrderMetrcSet(orderId: number, metrcLabelSetId: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${orderId}/delete_metrc_set`,
      { method: "DELETE", body: JSON.stringify({ metrc_label_set_id: metrcLabelSetId }) }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // Sample Batches

  async getSampleBatches(): Promise<SampleBatch[]> {
    const res = await this.request<JsonApiCollectionResponse<SampleBatch>>(
      "/api/v1/sample_batches"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getSampleBatch(id: number): Promise<SampleBatch> {
    const res = await this.request<JsonApiResponse<SampleBatch>>(
      `/api/v1/sample_batches/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createSampleBatch(
    params: CreateSampleBatchParams
  ): Promise<SampleBatch> {
    const res = await this.request<JsonApiResponse<SampleBatch>>(
      "/api/v1/sample_batches",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteSampleBatch(id: number): Promise<void> {
    await this.request(`/api/v1/sample_batches/${id}`, { method: "DELETE" });
  }

  async printSampleBatchLabels(
    batchId: number,
    sheetLayoutId: string
  ): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/sample_batches/${batchId}/print_labels`;
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
      body: JSON.stringify({ sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) throw new Error("Failed to generate sample labels PDF");
    return res.blob();
  }

  // Sample Inventory

  async getSampleInventory(): Promise<SampleInventoryRow[]> {
    const res = await this.request<{ data: SampleInventoryRow[] }>(
      "/api/v1/sample_inventory"
    );
    return res.data;
  }

  // Sample Handoffs

  async getSampleHandoffs(opts?: {
    receiver_id?: number;
    status?: string;
  }): Promise<SampleHandoff[]> {
    const params = new URLSearchParams();
    if (opts?.receiver_id) params.set("receiver_id", String(opts.receiver_id));
    if (opts?.status) params.set("status", opts.status);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<JsonApiCollectionResponse<SampleHandoff>>(
      `/api/v1/sample_handoffs${query}`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getSampleHandoff(id: number): Promise<SampleHandoff> {
    const res = await this.request<JsonApiResponse<SampleHandoff>>(
      `/api/v1/sample_handoffs/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createSampleHandoff(
    params: CreateSampleHandoffParams
  ): Promise<SampleHandoff> {
    const res = await this.request<JsonApiResponse<SampleHandoff>>(
      "/api/v1/sample_handoffs",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async confirmSampleDrop(handoffId: number): Promise<SampleHandoff> {
    const res = await this.request<JsonApiResponse<SampleHandoff>>(
      `/api/v1/sample_handoffs/${handoffId}/confirm_drop`,
      { method: "POST" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteSampleHandoff(id: number): Promise<void> {
    await this.request(`/api/v1/sample_handoffs/${id}`, { method: "DELETE" });
  }

  // Notifications (Admin)

  async getNotifications(): Promise<Notification[]> {
    const res = await this.request<JsonApiCollectionResponse<Notification>>(
      "/api/v1/notifications"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getNotification(id: number): Promise<Notification> {
    const res = await this.request<JsonApiResponse<Notification>>(
      `/api/v1/notifications/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const res = await this.request<JsonApiResponse<Notification>>(
      "/api/v1/notifications",
      {
        method: "POST",
        body: JSON.stringify({ notification: params }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteNotification(id: number): Promise<void> {
    await this.request(`/api/v1/notifications/${id}`, { method: "DELETE" });
  }

  // Notifications (Storefront)

  async getMyNotifications(): Promise<NotificationRecipient[]> {
    const res = await this.request<JsonApiCollectionResponse<NotificationRecipient>>(
      "/api/v1/notifications/mine"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getUnreadNotificationCount(): Promise<number> {
    const res = await this.request<{ data: { unread_count: number } }>(
      "/api/v1/notifications/unread_count"
    );
    return res.data.unread_count;
  }

  async markNotificationRead(id: number): Promise<NotificationRecipient> {
    const res = await this.request<JsonApiResponse<NotificationRecipient>>(
      `/api/v1/notifications/${id}/read`,
      { method: "PATCH" }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request("/api/v1/notifications/read_all", {
      method: "POST",
    });
  }

  // ---- Facility ----

  async getFacility(): Promise<Facility | null> {
    const res = await this.request<JsonApiResponse<Facility> | { data: null }>("/api/v1/facility");
    if (!res.data) return null;
    const d = res.data as JsonApiRecord<Facility>;
    return { ...d.attributes, id: Number(d.id) };
  }

  async updateFacility(idOrData: number | {
    name?: string;
    description?: string;
    license_number?: string;
  }, data?: Record<string, unknown>): Promise<Facility> {
    // Support both updateFacility({...}) and updateFacility(id, {...})
    const url = typeof idOrData === "number"
      ? `/api/v1/facility?facility_id=${idOrData}`
      : "/api/v1/facility";
    const body = typeof idOrData === "number"
      ? { facility: data }
      : { facility: idOrData };
    const res = await this.request<JsonApiResponse<Facility>>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getFacilities(): Promise<Facility[]> {
    const res = await this.request<JsonApiCollectionResponse<Facility>>("/api/v1/facilities");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createFacility(data: { name: string; facility_type: string; metrc_license_number?: string; environment?: string }): Promise<Facility> {
    const res = await this.request<JsonApiResponse<Facility>>("/api/v1/facilities", {
      method: "POST",
      body: JSON.stringify({ facility: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteFacility(id: number): Promise<void> {
    await this.request(`/api/v1/facilities/${id}`, { method: "DELETE" });
  }

  // ---- Rooms ----

  async getRooms(): Promise<Room[]> {
    const res = await this.request<JsonApiCollectionResponse<Room>>("/api/v1/facility/rooms");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getRoom(id: number): Promise<Room> {
    const res = await this.request<JsonApiResponse<Room>>(`/api/v1/facility/rooms/${id}`);
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createRoom(data: {
    name: string;
    floor_count?: number;
    room_type?: string;
    position?: number;
    racks_attributes?: {
      floor: number;
      position: number;
      name?: string;
      trays_attributes?: {
        position: number;
        capacity: number;
        name?: string;
      }[];
    }[];
  }): Promise<Room> {
    const res = await this.request<JsonApiResponse<Room>>("/api/v1/facility/rooms", {
      method: "POST",
      body: JSON.stringify({ room: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateRoom(id: number, data: Record<string, unknown>): Promise<Room> {
    const res = await this.request<JsonApiResponse<Room>>(`/api/v1/facility/rooms/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ room: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteRoom(id: number): Promise<void> {
    await this.request(`/api/v1/facility/rooms/${id}`, { method: "DELETE" });
  }

  // ---- Floor View ----

  async getFloorView(roomId: number, floor: number): Promise<FloorView> {
    const res = await this.request<{ data: FloorView }>(
      `/api/v1/facility/rooms/${roomId}/floor_view?floor=${floor}`
    );
    return res.data;
  }

  // ---- Racks ----

  async getRacks(roomId: number): Promise<Rack[]> {
    const res = await this.request<JsonApiCollectionResponse<Rack>>(`/api/v1/facility/rooms/${roomId}/racks`);
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createRack(roomId: number, data: { floor: number; position: number; name?: string; trays_attributes?: { position: number; capacity: number; name?: string }[] }): Promise<Rack> {
    const res = await this.request<JsonApiResponse<Rack>>(`/api/v1/facility/rooms/${roomId}/racks`, {
      method: "POST",
      body: JSON.stringify({ rack: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateRack(roomId: number, rackId: number, data: Record<string, unknown>): Promise<Rack> {
    const res = await this.request<JsonApiResponse<Rack>>(`/api/v1/facility/rooms/${roomId}/racks/${rackId}`, {
      method: "PATCH",
      body: JSON.stringify({ rack: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteRack(roomId: number, rackId: number): Promise<void> {
    await this.request(`/api/v1/facility/rooms/${roomId}/racks/${rackId}`, { method: "DELETE" });
  }

  // ---- Trays ----

  async getTrays(roomId: number, rackId: number): Promise<Tray[]> {
    const res = await this.request<JsonApiCollectionResponse<Tray>>(`/api/v1/facility/rooms/${roomId}/racks/${rackId}/trays`);
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createTray(roomId: number, rackId: number, data: { position: number; capacity: number; name?: string }): Promise<Tray> {
    const res = await this.request<JsonApiResponse<Tray>>(`/api/v1/facility/rooms/${roomId}/racks/${rackId}/trays`, {
      method: "POST",
      body: JSON.stringify({ tray: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateTray(roomId: number, rackId: number, trayId: number, data: Record<string, unknown>): Promise<Tray> {
    const res = await this.request<JsonApiResponse<Tray>>(`/api/v1/facility/rooms/${roomId}/racks/${rackId}/trays/${trayId}`, {
      method: "PATCH",
      body: JSON.stringify({ tray: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteTray(roomId: number, rackId: number, trayId: number): Promise<void> {
    await this.request(`/api/v1/facility/rooms/${roomId}/racks/${rackId}/trays/${trayId}`, { method: "DELETE" });
  }

  // ---- Plant Batches ----

  async getPlantBatches(): Promise<PlantBatch[]> {
    const res = await this.request<JsonApiCollectionResponse<PlantBatch>>("/api/v1/facility/plant_batches");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPlantBatch(id: number): Promise<PlantBatch> {
    const res = await this.request<JsonApiResponse<PlantBatch>>(`/api/v1/facility/plant_batches/${id}`);
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createPlantBatch(data: {
    name: string;
    strain_id: number;
    batch_type: string;
    initial_count: number;
    notes?: string;
  }): Promise<PlantBatch> {
    const res = await this.request<JsonApiResponse<PlantBatch>>("/api/v1/facility/plant_batches", {
      method: "POST",
      body: JSON.stringify({ plant_batch: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updatePlantBatch(id: number, data: Record<string, unknown>): Promise<PlantBatch> {
    const res = await this.request<JsonApiResponse<PlantBatch>>(`/api/v1/facility/plant_batches/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ plant_batch: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deletePlantBatch(id: number): Promise<void> {
    await this.request(`/api/v1/facility/plant_batches/${id}`, { method: "DELETE" });
  }

  // ---- Harvests ----

  async getHarvests(): Promise<Harvest[]> {
    const res = await this.request<JsonApiCollectionResponse<Harvest>>("/api/v1/facility/harvests");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getHarvest(id: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}`);
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createHarvest(data: {
    harvest: {
      name?: string;
      harvest_type: string;
      harvest_date: string;
      wet_weight_grams?: number;
      drying_room_id?: number;
      plant_batch_id?: number;
      notes?: string;
    };
    plant_ids: number[];
    per_plant_wet_weight?: number;
  }): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>("/api/v1/facility/harvests", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateHarvest(id: number, data: Record<string, unknown>): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ harvest: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async startDrying(id: number, dryingRoomId?: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/start_drying`, {
      method: "POST",
      body: JSON.stringify({ drying_room_id: dryingRoomId }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async finishDrying(id: number, data?: { dry_weight_grams?: number; waste_weight_grams?: number }): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/finish_drying`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async recordWetWeight(id: number, wetWeightGrams: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/record_wet_weight`, {
      method: "POST",
      body: JSON.stringify({ wet_weight_grams: wetWeightGrams }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async recordDryWeight(id: number, dryWeightGrams: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/record_dry_weight`, {
      method: "POST",
      body: JSON.stringify({ dry_weight_grams: dryWeightGrams }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async recordWaste(id: number, wasteWeightGrams: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/record_waste`, {
      method: "POST",
      body: JSON.stringify({ waste_weight_grams: wasteWeightGrams }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async recordStrainWeight(id: number, data: {
    strain_id: number;
    wet_weight_grams?: number;
    dry_weight_grams?: number;
    waste_weight_grams?: number;
    flower_weight_grams?: number;
    shake_weight_grams?: number;
  }): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/record_strain_weight`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async addPlantsToHarvest(id: number, plantIds: number[]): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/add_plants`, {
      method: "POST",
      body: JSON.stringify({ plant_ids: plantIds }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async startTrimming(id: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/start_trimming`, {
      method: "POST",
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async finishTrimming(id: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/finish_trimming`, {
      method: "POST",
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async finishCuring(id: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/finish_curing`, {
      method: "POST",
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async adminReviewHarvest(id: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/admin_review`, {
      method: "POST",
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async closeHarvest(id: number): Promise<Harvest> {
    const res = await this.request<JsonApiResponse<Harvest>>(`/api/v1/facility/harvests/${id}/close`, {
      method: "POST",
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async metrcPreflightHarvest(id: number, opts: { license: string; metrc_env?: string }): Promise<MetrcPreflightReport> {
    const params = new URLSearchParams({ license: opts.license });
    if (opts.metrc_env) params.set("metrc_env", opts.metrc_env);
    const res = await this.request<{ data: MetrcPreflightReport }>(
      `/api/v1/facility/harvests/${id}/metrc_preflight?${params}`
    );
    return res.data;
  }

  async metrcSyncHarvest(id: number, opts: { license: string; metrc_env?: string }): Promise<MetrcSyncResult> {
    const params = new URLSearchParams({ license: opts.license });
    if (opts.metrc_env) params.set("metrc_env", opts.metrc_env);
    const res = await this.request<{ data: MetrcSyncResult }>(
      `/api/v1/facility/harvests/${id}/metrc_sync?${params}`,
      { method: "POST" }
    );
    return res.data;
  }

  async metrcCreateTestingPackages(
    id: number,
    opts: { license: string; metrc_env?: string; samples: MetrcTestingSample[] }
  ): Promise<MetrcTestingResult> {
    const res = await this.request<{ data: MetrcTestingResult }>(
      `/api/v1/facility/harvests/${id}/metrc_testing_packages`,
      {
        method: "POST",
        body: JSON.stringify({
          license: opts.license,
          metrc_env: opts.metrc_env,
          samples: opts.samples,
        }),
      }
    );
    return res.data;
  }

  // ---- Plants ----

  async getPlants(opts?: {
    room_id?: number;
    floor?: number;
    rack_id?: number;
    tray_id?: number;
    strain_id?: number;
    growth_phase?: string;
    plant_batch_id?: number;
  }): Promise<Plant[]> {
    const params = new URLSearchParams();
    if (opts?.room_id) params.set("room_id", String(opts.room_id));
    if (opts?.floor) params.set("floor", String(opts.floor));
    if (opts?.rack_id) params.set("rack_id", String(opts.rack_id));
    if (opts?.tray_id) params.set("tray_id", String(opts.tray_id));
    if (opts?.strain_id) params.set("strain_id", String(opts.strain_id));
    if (opts?.growth_phase) params.set("growth_phase", opts.growth_phase);
    if (opts?.plant_batch_id) params.set("plant_batch_id", String(opts.plant_batch_id));
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<JsonApiCollectionResponse<Plant>>(`/api/v1/plants${query}`);
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPlant(id: number): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(`/api/v1/plants/${id}`);
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createPlant(data: {
    tray_id: number;
    strain_id: number;
    plant_batch_id?: number;
    growth_phase?: string;
    custom_label?: string;
    metrc_label?: string;
  }): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>("/api/v1/plants", {
      method: "POST",
      body: JSON.stringify({ plant: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async bulkCreatePlants(
    plantBatchId: number,
    positions: { tray_id: number }[]
  ): Promise<{
    created_count: number;
    error_count: number;
    errors: { tray_id: number; errors: string[] }[];
  }> {
    const res = await this.request<{
      data: { created_count: number; error_count: number; errors: { tray_id: number; errors: string[] }[] };
    }>("/api/v1/plants/bulk_create", {
      method: "POST",
      body: JSON.stringify({ plant_batch_id: plantBatchId, positions }),
    });
    return res.data;
  }

  async updatePlant(id: number, data: { custom_label?: string }): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(`/api/v1/plants/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ plant: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async movePlant(id: number, data: {
    tray_id: number;
  }): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(`/api/v1/plants/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ plant: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async changePlantPhase(id: number, growthPhase: string): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(`/api/v1/plants/${id}/change_phase`, {
      method: "POST",
      body: JSON.stringify({ growth_phase: growthPhase }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async tagPlant(id: number, tag: string): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(`/api/v1/plants/${id}/tag`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async destroyPlant(id: number, reason?: string): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(`/api/v1/plants/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async addPlantNote(plantId: number, notes: string): Promise<void> {
    await this.request(`/api/v1/plants/${plantId}/events`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async getPlantEvents(plantId: number): Promise<PlantEventData[]> {
    const res = await this.request<{ data: PlantEventData[] }>(`/api/v1/plants/${plantId}/events`);
    return res.data;
  }

  async addPlantObservation(plantId: number, notes: string, photos: File[]): Promise<PlantEventData> {
    const formData = new FormData();
    if (notes) formData.append("notes", notes);
    photos.forEach((photo) => formData.append("photos[]", photo));
    const res = await this.requestFormData<{ data: PlantEventData }>(
      `/api/v1/plants/${plantId}/events`,
      { method: "POST", body: formData }
    );
    return res.data;
  }

  async lookupPlant(query: string): Promise<Plant> {
    const res = await this.request<JsonApiResponse<Plant>>(
      `/api/v1/plants/lookup?q=${encodeURIComponent(query)}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getPlantFeed(opts?: {
    strain_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: FeedEvent[]; meta: { total: number; limit: number; offset: number } }> {
    const params = new URLSearchParams();
    if (opts?.strain_id) params.set("strain_id", String(opts.strain_id));
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/api/v1/plants/feed${query}`);
  }

  // ---- Audit Events ----

  async getAuditEvents(opts?: {
    trackable_type?: string
    trackable_id?: number
    limit?: number
    offset?: number
  }): Promise<{ data: AuditEventData[]; meta: { total: number } }> {
    const params = new URLSearchParams()
    if (opts?.trackable_type) params.set("trackable_type", opts.trackable_type)
    if (opts?.trackable_id) params.set("trackable_id", String(opts.trackable_id))
    if (opts?.limit) params.set("limit", String(opts.limit))
    if (opts?.offset) params.set("offset", String(opts.offset))
    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/api/v1/facility/audit_events${query}`)
  }

  async getHarvestAuditEvents(harvestId: number): Promise<AuditEventData[]> {
    const res = await this.request<{ data: AuditEventData[] }>(
      `/api/v1/facility/harvests/${harvestId}/audit_events`
    )
    return res.data
  }

  async getAdminAuditEvents(opts?: {
    user_id?: number
    category?: "users" | "companies" | "products" | "grow"
    from?: string
    to?: string
    limit?: number
    offset?: number
  }): Promise<{ data: AuditEventData[]; meta: { total: number } }> {
    const params = new URLSearchParams()
    if (opts?.user_id) params.set("user_id", String(opts.user_id))
    if (opts?.category) params.set("category", opts.category)
    if (opts?.from) params.set("from", opts.from)
    if (opts?.to) params.set("to", opts.to)
    if (opts?.limit) params.set("limit", String(opts.limit))
    if (opts?.offset) params.set("offset", String(opts.offset))
    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/api/v1/admin/audit_events${query}`)
  }

  // ---- METRC Tags ----

  async getMetrcTags(opts?: { status?: string; tag_type?: string; page?: number; per_page?: number }): Promise<{ tags: MetrcTag[]; meta: { total: number; page: number; per_page: number; total_pages: number } }> {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.tag_type) params.set("tag_type", opts.tag_type);
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.per_page) params.set("per_page", String(opts.per_page));
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<JsonApiCollectionResponse<MetrcTag> & { meta: { total: number; page: number; per_page: number; total_pages: number } }>(`/api/v1/metrc_tags${query}`);
    return {
      tags: res.data.map((d) => ({ ...d.attributes, id: Number(d.id) })),
      meta: res.meta,
    };
  }

  async importMetrcTags(
    tags: string[],
    tagType?: string
  ): Promise<{ created_count: number; error_count: number; errors: { tag: string; errors: string[] }[] }> {
    const res = await this.request<{
      data: { created_count: number; error_count: number; errors: { tag: string; errors: string[] }[] };
    }>("/api/v1/metrc_tags", {
      method: "POST",
      body: JSON.stringify({ tags, tag_type: tagType || "plant_tag" }),
    });
    return res.data;
  }

  async voidMetrcTag(id: number): Promise<MetrcTag> {
    const res = await this.request<JsonApiResponse<MetrcTag>>(`/api/v1/metrc_tags/${id}/void`, {
      method: "POST",
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async nukeMetrcTag(id: number): Promise<void> {
    await this.request(`/api/v1/metrc_tags/${id}/nuke`, {
      method: "DELETE",
    });
  }

  async syncMetrcTags(opts: { license: string; metrc_env?: string }): Promise<MetrcTagSyncResult> {
    const res = await this.request<{ data: MetrcTagSyncResult }>(
      `/api/v1/metrc_tags/sync_from_metrc`,
      {
        method: "POST",
        body: JSON.stringify({ license: opts.license, metrc_env: opts.metrc_env || "sandbox" }),
      }
    );
    return res.data;
  }

  async getNextAvailableTag(): Promise<MetrcTag | null> {
    const res = await this.request<JsonApiResponse<MetrcTag> | { data: null }>("/api/v1/metrc_tags/next_available");
    if (!res.data) return null;
    const d = res.data as JsonApiRecord<MetrcTag>;
    return { ...d.attributes, id: Number(d.id) };
  }

  async getMetrcTagStats(): Promise<MetrcTagStats> {
    const res = await this.request<{ data: MetrcTagStats }>("/api/v1/metrc_tags/stats");
    return res.data;
  }

  // ---- Metrc Proxy (test) ----

  async getMetrcProxy(endpoint: string, opts?: Record<string, string | number | undefined>): Promise<unknown> {
    const params = new URLSearchParams();
    if (opts) {
      for (const [k, v] of Object.entries(opts)) {
        if (v !== undefined && v !== "") params.set(k, String(v));
      }
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/api/v1/metrc_proxy/${endpoint}${query}`);
  }

  async postMetrcProxy(endpoint: string, body: unknown): Promise<unknown> {
    return this.request(`/api/v1/metrc_proxy/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ---- Public Wholesale ----

  async getPublicProducts(): Promise<Product[]> {
    const res = await this.request<JsonApiCollectionResponse<Product>>("/api/v1/public/products");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPublicBulkProducts(): Promise<Product[]> {
    const res = await this.request<JsonApiCollectionResponse<Product>>("/api/v1/public/products/bulk");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPublicProduct(slug: string): Promise<Product> {
    const res = await this.request<JsonApiResponse<Product>>(`/api/v1/public/products/${slug}`);
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getPublicStrains(): Promise<Strain[]> {
    const res = await this.request<JsonApiCollectionResponse<Strain>>("/api/v1/public/strains");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPublicStrainCoas(strainId: number): Promise<Coa[]> {
    const res = await this.request<JsonApiCollectionResponse<Coa>>(`/api/v1/public/strains/${strainId}/coas`);
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPublicStrain(slug: string): Promise<Strain> {
    const res = await this.request<JsonApiResponse<Strain>>(`/api/v1/public/strains/${slug}`);
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getPublicSettings(): Promise<PublicSettings> {
    const res = await this.request<{ data: PublicSettings }>("/api/v1/public/settings");
    return res.data;
  }

  async registerPartnership(data: PartnershipRegistrationParams): Promise<{ status: { code: number; message: string } }> {
    return this.request("/api/v1/public/partnership_registrations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Comments

  async getCompanyComments(slug: string): Promise<Comment[]> {
    const res = await this.request<JsonApiCollectionResponse<Comment>>(
      `/api/v1/companies/${slug}/comments`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createCompanyComment(slug: string, body: string): Promise<Comment> {
    const res = await this.request<JsonApiResponse<Comment>>(
      `/api/v1/companies/${slug}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ comment: { body } }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteCompanyComment(slug: string, commentId: number): Promise<void> {
    await this.request(`/api/v1/companies/${slug}/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  // --- Channels ---

  async getChannels(): Promise<Channel[]> {
    const res = await this.request<JsonApiCollectionResponse<Channel>>(
      "/api/v1/channels"
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getChannel(idOrSlug: string): Promise<Channel> {
    const res = await this.request<JsonApiResponse<Channel>>(
      `/api/v1/channels/${idOrSlug}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createChannel(channel: { title: string; color?: string; description?: string; private?: boolean; position?: number }): Promise<Channel> {
    const res = await this.request<JsonApiResponse<Channel>>(
      "/api/v1/channels",
      {
        method: "POST",
        body: JSON.stringify({ channel }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateChannel(idOrSlug: string, channel: Partial<{ title: string; color: string; description: string; private: boolean; position: number }>): Promise<Channel> {
    const res = await this.request<JsonApiResponse<Channel>>(
      `/api/v1/channels/${idOrSlug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ channel }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteChannel(idOrSlug: string): Promise<void> {
    await this.request(`/api/v1/channels/${idOrSlug}`, {
      method: "DELETE",
    });
  }

  async addChannelMember(channelSlug: string, userId: number): Promise<ChannelMember> {
    const res = await this.request<{ data: ChannelMember }>(
      `/api/v1/channels/${channelSlug}/members`,
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }
    );
    return res.data;
  }

  async removeChannelMember(channelSlug: string, userId: number): Promise<void> {
    await this.request(`/api/v1/channels/${channelSlug}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // --- Posts ---

  async getPosts(opts?: { channel_slug?: string; post_type?: PostType; status?: PostStatus; priority?: PostPriority; assigned_to_me?: boolean }): Promise<Post[]> {
    const params = new URLSearchParams();
    if (opts?.channel_slug) params.set("channel_slug", opts.channel_slug);
    if (opts?.post_type) params.set("post_type", opts.post_type);
    if (opts?.status) params.set("status", opts.status);
    if (opts?.priority) params.set("priority", opts.priority);
    if (opts?.assigned_to_me) params.set("assigned_to_me", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<JsonApiCollectionResponse<Post>>(
      `/api/v1/posts${query}`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPost(id: number): Promise<Post> {
    const res = await this.request<JsonApiResponse<Post>>(
      `/api/v1/posts/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createPost(data: CreatePostParams): Promise<Post> {
    const res = await this.request<JsonApiResponse<Post>>(
      "/api/v1/posts",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updatePost(id: number, data: UpdatePostParams): Promise<Post> {
    const res = await this.request<JsonApiResponse<Post>>(
      `/api/v1/posts/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deletePost(id: number): Promise<void> {
    await this.request(`/api/v1/posts/${id}`, {
      method: "DELETE",
    });
  }

  // --- Post Comments ---

  async getPostComments(postId: number): Promise<Comment[]> {
    const res = await this.request<JsonApiCollectionResponse<Comment>>(
      `/api/v1/posts/${postId}/comments`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createPostComment(postId: number, body: string): Promise<Comment> {
    const res = await this.request<JsonApiResponse<Comment>>(
      `/api/v1/posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ comment: { body } }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deletePostComment(postId: number, commentId: number): Promise<void> {
    await this.request(`/api/v1/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  // --- Order Comments ---

  async getOrderComments(orderId: number): Promise<Comment[]> {
    const res = await this.request<JsonApiCollectionResponse<Comment>>(
      `/api/v1/orders/${orderId}/comments`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async createOrderComment(orderId: number, body: string): Promise<Comment> {
    const res = await this.request<JsonApiResponse<Comment>>(
      `/api/v1/orders/${orderId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ comment: { body } }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  // Gallery Files

  async getGalleryFiles(params?: {
    page?: number;
    per_page?: number;
    folder?: string;
    search?: string;
    content_type?: string;
  }): Promise<{ files: GalleryFile[]; meta: { page: number; per_page: number; total: number; total_pages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    if (params?.folder) query.set("folder", params.folder);
    if (params?.search) query.set("search", params.search);
    if (params?.content_type) query.set("content_type", params.content_type);
    const qs = query.toString();
    const res = await this.request<{ data: JsonApiRecord<GalleryFile>[]; meta: { page: number; per_page: number; total: number; total_pages: number } }>(
      `/api/v1/gallery_files${qs ? `?${qs}` : ""}`
    );
    return {
      files: res.data.map((r) => ({ ...r.attributes, id: Number(r.id) })),
      meta: res.meta,
    };
  }

  async uploadGalleryFiles(files: File[], folder?: string): Promise<GalleryFile[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files[]", file));
    if (folder) formData.append("folder", folder);
    const res = await this.requestFormData<{ data: JsonApiRecord<GalleryFile>[] }>(
      "/api/v1/gallery_files",
      { method: "POST", body: formData }
    );
    return res.data.map((r) => ({ ...r.attributes, id: Number(r.id) }));
  }

  async updateGalleryFile(id: number, data: { title?: string; alt_text?: string; folder?: string }): Promise<GalleryFile> {
    const res = await this.request<JsonApiResponse<GalleryFile>>(
      `/api/v1/gallery_files/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ gallery_file: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteGalleryFile(id: number): Promise<void> {
    await this.request(`/api/v1/gallery_files/${id}`, { method: "DELETE" });
  }

  // ── Support Tickets ──

  async createSupportTicket(data: { subject?: string; message: string; company_id?: number }): Promise<SupportTicket> {
    const res = await this.request<JsonApiResponse<SupportTicket>>(
      "/api/v1/support_tickets",
      {
        method: "POST",
        body: JSON.stringify({ support_ticket: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async getSupportTickets(opts?: { page?: number; per_page?: number }): Promise<PaginatedResult<SupportTicket>> {
    const params = new URLSearchParams();
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.per_page) params.set("per_page", String(opts.per_page));
    const qs = params.toString();
    const res = await this.request<JsonApiCollectionResponse<SupportTicket> & { meta: PaginationMeta }>(
      `/api/v1/support_tickets${qs ? `?${qs}` : ""}`
    );
    return {
      data: res.data.map((d) => ({ ...d.attributes, id: Number(d.id) })),
      meta: res.meta,
    };
  }

  async getSupportTicket(id: number): Promise<SupportTicket> {
    const res = await this.request<JsonApiResponse<SupportTicket>>(
      `/api/v1/support_tickets/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateSupportTicket(id: number, data: { status: string }): Promise<SupportTicket> {
    const res = await this.request<JsonApiResponse<SupportTicket>>(
      `/api/v1/support_tickets/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ support_ticket: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async replySupportTicket(id: number, body: string): Promise<void> {
    await this.request(`/api/v1/support_tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  // ---- Shipments ----

  async getShipments(status?: string): Promise<Shipment[]> {
    const query = status ? `?status=${status}` : "";
    const res = await this.request<JsonApiCollectionResponse<Shipment>>(
      `/api/v1/shipments${query}`
    );
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getShipment(id: number): Promise<Shipment> {
    const res = await this.request<JsonApiResponse<Shipment>>(
      `/api/v1/shipments/${id}`
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async createShipment(data: { scheduled_date?: string; notes?: string; nickname?: string; order_ids?: number[] }): Promise<Shipment> {
    const res = await this.request<JsonApiResponse<Shipment>>(
      "/api/v1/shipments",
      {
        method: "POST",
        body: JSON.stringify({ shipment: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async updateShipment(
    id: number,
    data: { status?: string; notes?: string; nickname?: string; scheduled_date?: string; user_id?: number | null; is_sample?: boolean }
  ): Promise<Shipment> {
    const res = await this.request<JsonApiResponse<Shipment>>(
      `/api/v1/shipments/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ shipment: data }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async deleteShipment(id: number): Promise<void> {
    await this.request(`/api/v1/shipments/${id}`, { method: "DELETE" });
  }

  async addOrdersToShipment(id: number, orderIds: number[]): Promise<Shipment> {
    const res = await this.request<JsonApiResponse<Shipment>>(
      `/api/v1/shipments/${id}/add_orders`,
      {
        method: "POST",
        body: JSON.stringify({ order_ids: orderIds }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async removeOrderFromShipment(id: number, orderId: number): Promise<Shipment> {
    const res = await this.request<JsonApiResponse<Shipment>>(
      `/api/v1/shipments/${id}/remove_order`,
      {
        method: "DELETE",
        body: JSON.stringify({ order_id: orderId }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async reorderShipmentStops(id: number, orderIds: number[]): Promise<Shipment> {
    const res = await this.request<JsonApiResponse<Shipment>>(
      `/api/v1/shipments/${id}/reorder_stops`,
      {
        method: "PATCH",
        body: JSON.stringify({ order_ids: orderIds }),
      }
    );
    return { ...res.data.attributes, id: Number(res.data.id) };
  }

  async downloadShipmentBatchInvoices(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${id}/batch_invoices`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate batch invoices");
    return res.blob();
  }

  async downloadShipmentBatchDeliveryAgreements(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${id}/batch_delivery_agreements`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate batch delivery agreements");
    return res.blob();
  }

  async downloadShipmentBatchPaymentTerms(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${id}/batch_payment_terms`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate batch payment terms");
    return res.blob();
  }

  async downloadShipmentBatchAllDocuments(id: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${id}/batch_all_documents`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate combined documents");
    return res.blob();
  }

  async downloadShipmentBatchMetrcLabels(id: number, sheetLayoutId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${id}/batch_metrc_labels`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) throw new Error("Failed to generate batch METRC labels");
    return res.blob();
  }

  // Shipment sample METRC

  async importShipmentSampleMetrc(
    shipmentId: number,
    variantId: number,
    pdf: File
  ): Promise<{ id: number; name: string; item_count: number; label_id: number; label_slug: string; label_name: string; strain_id: number; strain_name: string }> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/import_sample_metrc`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const form = new FormData();
    form.append("variant_id", String(variantId));
    form.append("pdf", pdf);
    const res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error("Failed to import sample METRC");
    const json = await res.json();
    return json.data;
  }

  async printShipmentSampleMetrcLabels(shipmentId: number, metrcLabelSetId: number, sheetLayoutId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/print_sample_metrc_labels`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ metrc_label_set_id: metrcLabelSetId, sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) throw new Error("Failed to print sample METRC labels");
    return res.blob();
  }

  async downloadShipmentBatchSampleMetrcLabels(id: number, sheetLayoutId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${id}/batch_sample_metrc_labels`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) throw new Error("Failed to generate batch sample METRC labels");
    return res.blob();
  }

  async deleteShipmentSampleMetrcSet(shipmentId: number, metrcLabelSetId: number): Promise<void> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/delete_sample_metrc_set`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ metrc_label_set_id: metrcLabelSetId }),
    });
    if (!res.ok) throw new Error("Failed to delete sample METRC set");
  }

  // Batch import multiple sample METRC PDFs
  async batchImportShipmentSampleMetrc(
    shipmentId: number,
    files: { variantId: number; pdf: File }[]
  ): Promise<unknown> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/batch_import_sample_metrc`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const form = new FormData();
    files.forEach((entry, i) => {
      form.append(`files[${i}][variant_id]`, String(entry.variantId));
      form.append(`files[${i}][pdf]`, entry.pdf);
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error("Failed to batch import sample METRC labels");
    return res.json();
  }

  // Update tag_id on a sample METRC label set
  async updateSampleMetrcTag(shipmentId: number, metrcLabelSetId: number, tagId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/update_sample_metrc_tag`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ metrc_label_set_id: metrcLabelSetId, tag_id: tagId }),
    });
    if (!res.ok) throw new Error("Failed to update sample METRC tag");
  }

  // Upload transfer manifest for an order
  async uploadTransferManifest(orderId: number, file: File): Promise<void> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/upload_transfer_manifest`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error("Failed to upload transfer manifest");
  }

  // Delete transfer manifest for an order
  async deleteTransferManifest(orderId: number): Promise<void> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/delete_transfer_manifest`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete transfer manifest");
  }

  // Update metrc_tag on an order item
  async updateOrderItemMetrcTag(orderId: number, orderItemId: number, metrcTag: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/update_item_metrc_tag`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ order_item_id: orderItemId, metrc_tag: metrcTag }),
    });
    if (!res.ok) throw new Error("Failed to update order item METRC tag");
  }

  // Sample Groups
  async createSampleGroup(shipmentId: number, data: { company_id: number; name: string }): Promise<SampleGroup> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/create_sample_group`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create sample group");
    const json = await res.json();
    return json.data;
  }

  async deleteSampleGroup(shipmentId: number, sampleGroupId: number): Promise<void> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/delete_sample_group`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sample_group_id: sampleGroupId }),
    });
    if (!res.ok) throw new Error("Failed to delete sample group");
  }

  async uploadSampleGroupManifest(shipmentId: number, sampleGroupId: number, file: File): Promise<SampleGroup> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/upload_sample_group_manifest`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const form = new FormData();
    form.append("sample_group_id", String(sampleGroupId));
    form.append("file", file);
    const res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error("Failed to upload sample group manifest");
    const json = await res.json();
    return json.data;
  }

  async getDirections(origin: string, destination: string): Promise<{ summary: string; duration: string; distance: string; steps: string[]; text: string }> {
    const res = await this.request<{ summary: string; duration: string; distance: string; steps: string[]; text: string }>(
      `/api/v1/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
    return res;
  }

  async resendOrderEmail(orderId: number, email: string): Promise<void> {
    await this.request(
      `/api/v1/orders/${orderId}/resend_order_email`,
      { method: "POST", body: JSON.stringify({ email }) }
    );
  }

  async requestMetrcPrint(orderId: number, metrcLabelSetId: number, sheetLayoutId: string, variantId?: number): Promise<{ id: number; print_status: string }> {
    const res = await this.request<{ data: { id: number; print_status: string } }>(
      `/api/v1/orders/${orderId}/request_metrc_print`,
      { method: "POST", body: JSON.stringify({ metrc_label_set_id: metrcLabelSetId, sheet_layout_id: sheetLayoutId, variant_id: variantId }) }
    );
    return res.data;
  }

  async getMetrcPrintStatus(orderId: number, metrcLabelSetId: number): Promise<{ id: number; print_status: string }> {
    const res = await this.request<{ data: { id: number; print_status: string } }>(
      `/api/v1/orders/${orderId}/metrc_print_status?metrc_label_set_id=${metrcLabelSetId}`
    );
    return res.data;
  }

  async downloadMetrcPrint(orderId: number, metrcLabelSetId: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/download_metrc_print?metrc_label_set_id=${metrcLabelSetId}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Print not ready");
    return res.blob();
  }

  async batchImportOrderMetrc(orderId: number, orderItemId: number, labelId: string, pdfs: File[]): Promise<unknown> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/batch_import_metrc`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const form = new FormData();
    form.append("order_item_id", String(orderItemId));
    form.append("label_id", labelId);
    pdfs.forEach((pdf, i) => {
      form.append(`pdfs[${i}]`, pdf);
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error("Failed to batch import METRC labels");
    return res.json();
  }

  async updateOrderTransferId(orderId: number, transferId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/orders/${orderId}/update_transfer_id`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ transfer_id: transferId }),
    });
    if (!res.ok) throw new Error("Failed to update transfer ID");
  }

  async updateSampleGroupTransferId(shipmentId: number, sampleGroupId: number, transferId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/update_sample_group`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sample_group_id: sampleGroupId, transfer_id: transferId }),
    });
    if (!res.ok) throw new Error("Failed to update transfer ID");
  }

  async printSampleGroupLabels(shipmentId: number, sampleGroupId: number, sheetLayoutId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/print_sample_group_labels`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sample_group_id: sampleGroupId, sheet_layout_id: sheetLayoutId }),
    });
    if (!res.ok) throw new Error("Failed to print sample group labels");
    return res.blob();
  }

  async deleteSampleGroupManifest(shipmentId: number, sampleGroupId: number): Promise<void> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/delete_sample_group_manifest`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sample_group_id: sampleGroupId }),
    });
    if (!res.ok) throw new Error("Failed to delete sample group manifest");
  }

  async assignLabelsToSampleGroup(shipmentId: number, sampleGroupId: number, metrcLabelSetIds: number[]): Promise<Shipment> {
    const url = `${this.baseUrl}/api/v1/shipments/${shipmentId}/assign_labels_to_sample_group`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sample_group_id: sampleGroupId, metrc_label_set_ids: metrcLabelSetIds }),
    });
    if (!res.ok) throw new Error("Failed to assign labels to sample group");
    const json = await res.json();
    return { ...json.data.attributes, id: Number(json.data.id) };
  }
}

export const apiClient = new ApiClient();
