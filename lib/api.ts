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
  referred_by: CompanyReferrer | null;
  comments_count: number;
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
  bulk: boolean;
  coming_soon: boolean;
  product_type: ProductType;
  product_uid: string | null;
  strain_id: number | null;
  strain_name: string | null;
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
  metrc_zone?: {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    render_as?: "original_image" | "qr_code" | "barcode" | "text";
  };
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
  metrc_label_sets: MetrcLabelSetSummary[];
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
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type OrderType = "standard" | "preorder";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  standard: "Standard",
  preorder: "Pre-order",
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
  notes_to_vendor: string | null;
  internal_notes: string | null;
  desired_delivery_date: string | null;
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
  created_at: string;
  updated_at: string;
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
}

// ---- Notifications ----

export type NotificationType =
  | "order_status"
  | "payment_reminder"
  | "feedback_request"
  | "info_request"
  | "product_update"
  | "announcement"
  | "cart_reminder";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_status: "Order Status",
  payment_reminder: "Payment Reminder",
  feedback_request: "Feedback Request",
  info_request: "Information Request",
  product_update: "Product Update",
  announcement: "Announcement",
  cart_reminder: "Cart Reminder",
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

export interface CreateOrderParams {
  company_id: number;
  order_type?: OrderType;
  shipping_location_id?: number;
  billing_location_id?: number;
  notes_to_vendor?: string;
  desired_delivery_date?: string;
  contact_users?: { full_name: string; email: string; phone_number?: string }[];
  payment_term_id?: number;
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
  user_name: string;
  created_at: string;
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
  | "batch_created"
  | "note_added"

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
  batch_created: "Batch Created",
  note_added: "Note Added",
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

  async getUsers(opts?: { include_deleted?: boolean }): Promise<User[]> {
    const query = opts?.include_deleted ? "?include_deleted=true" : "";
    const res = await this.request<JsonApiCollectionResponse<User>>(
      `/api/v1/users${query}`
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

  async getCompanies(opts?: { include_deleted?: boolean }): Promise<Company[]> {
    const query = opts?.include_deleted ? "?include_deleted=true" : "";
    const res = await this.request<JsonApiCollectionResponse<Company>>(
      `/api/v1/companies${query}`
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

  async updateProfile(data: { full_name?: string; phone_number?: string }): Promise<User> {
    const res = await this.request<JsonApiResponse<User>>(
      "/api/v1/profile",
      {
        method: "PATCH",
        body: JSON.stringify({ user: data }),
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

  async sendWelcomeEmail(userId: number, customMessage?: string): Promise<User> {
    const res = await this.request<{ data: { attributes: User } }>(
      `/api/v1/users/${userId}/send_welcome_email`,
      {
        method: "POST",
        body: JSON.stringify({ custom_message: customMessage || undefined }),
      }
    );
    return res.data.attributes;
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
    orderType?: OrderType
  ): Promise<CheckoutPreview> {
    const body: Record<string, unknown> = { company_id: companyId };
    if (paymentTermId) body.payment_term_id = paymentTermId;
    if (orderType) body.order_type = orderType;

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

  // Dashboard

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await this.request<{ data: DashboardStats }>(
      "/api/v1/dashboard"
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

  async getOrders(params?: { company_id?: number }): Promise<Order[]> {
    const query = params?.company_id ? `?company_id=${params.company_id}` : "";
    const res = await this.request<JsonApiCollectionResponse<Order>>(
      `/api/v1/orders${query}`
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

  async markProcessingDone(id: number): Promise<Order> {
    const res = await this.request<JsonApiResponse<Order>>(
      `/api/v1/orders/${id}/mark_processing_done`,
      { method: "POST" }
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

  async updateFacility(data: {
    name?: string;
    description?: string;
    license_number?: string;
  }): Promise<Facility> {
    const res = await this.request<JsonApiResponse<Facility>>("/api/v1/facility", {
      method: "PATCH",
      body: JSON.stringify({ facility: data }),
    });
    return { ...res.data.attributes, id: Number(res.data.id) };
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

  // ---- METRC Tags ----

  async getMetrcTags(opts?: { status?: string; tag_type?: string }): Promise<MetrcTag[]> {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.tag_type) params.set("tag_type", opts.tag_type);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<JsonApiCollectionResponse<MetrcTag>>(`/api/v1/metrc_tags${query}`);
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
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

  // ---- Public Wholesale ----

  async getPublicProducts(): Promise<Product[]> {
    const res = await this.request<JsonApiCollectionResponse<Product>>("/api/v1/public/products");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
  }

  async getPublicStrains(): Promise<Strain[]> {
    const res = await this.request<JsonApiCollectionResponse<Strain>>("/api/v1/public/strains");
    return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
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
}

export const apiClient = new ApiClient();
