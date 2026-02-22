import type { UserRole } from "@/lib/api";

export type AccessLevel = "full" | "full_no_delete" | "read" | "send_only" | "none";

export type Resource =
  | "dashboard"
  | "strains"
  | "grow"
  | "samples"
  | "projects"
  | "companies"
  | "users"
  | "orders_list"
  | "orders_show"
  | "fulfilment"
  | "carts"
  | "products"
  | "notifications"
  | "quick_onboard"
  | "settings";

type RoleAccessMap = Record<Resource, Partial<Record<UserRole, AccessLevel>>>;

export const ROLE_ACCESS: RoleAccessMap = {
  dashboard:     { admin: "full", observer_admin: "read", editor: "full", cultivator: "full", processing: "full", delivery: "full", sales: "full", default: "read" },
  strains:       { admin: "full", observer_admin: "read", editor: "read", cultivator: "read" },
  grow:          { admin: "full", observer_admin: "read", editor: "full", cultivator: "full", processing: "full" },
  samples:       { admin: "full", observer_admin: "read", editor: "full", cultivator: "full", processing: "full" },
  projects:      { admin: "full", observer_admin: "read", editor: "full" },
  companies:     { admin: "full", observer_admin: "read", editor: "full", sales: "full" },
  users:         { admin: "full", observer_admin: "read", editor: "full", sales: "full" },
  orders_list:   { admin: "full", observer_admin: "read", editor: "full", sales: "full" },
  orders_show:   { admin: "full", observer_admin: "read", editor: "full", cultivator: "read", processing: "read", sales: "full" },
  fulfilment:    { admin: "full", observer_admin: "read", editor: "full", cultivator: "full", processing: "full", delivery: "full" },
  carts:         { admin: "full", observer_admin: "read", editor: "full", sales: "full" },
  products:      { admin: "full", observer_admin: "read", editor: "full_no_delete", sales: "read" },
  notifications: { admin: "full", observer_admin: "read", editor: "full", sales: "send_only" },
  quick_onboard: { admin: "full", editor: "full", sales: "full" },
  settings:      { admin: "full", observer_admin: "read" },
};

export const ADMIN_LAYOUT_ROLES: UserRole[] = [
  "admin", "observer_admin", "editor", "cultivator", "processing", "delivery", "sales", "default",
];

function accessLevel(resource: Resource, role: UserRole | undefined): AccessLevel {
  if (!role) return "none";
  return ROLE_ACCESS[resource]?.[role] ?? "none";
}

export function canAccess(resource: Resource, role: UserRole | undefined): boolean {
  return accessLevel(resource, role) !== "none";
}

export function canRead(resource: Resource, role: UserRole | undefined): boolean {
  return ["full", "full_no_delete", "read"].includes(accessLevel(resource, role));
}

export function canWrite(resource: Resource, role: UserRole | undefined): boolean {
  if (role === "observer_admin") return false;
  return ["full", "full_no_delete", "send_only"].includes(accessLevel(resource, role));
}

export function canDelete(resource: Resource, role: UserRole | undefined): boolean {
  if (role === "observer_admin") return false;
  return accessLevel(resource, role) === "full";
}
