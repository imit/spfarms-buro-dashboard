import type { OrderStatus } from "@/lib/api";

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; dot: string; border: string }> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
  confirmed: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
  },
  processing: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
    border: "border-violet-200 dark:border-violet-800",
  },
  fulfilled: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-400",
    dot: "bg-teal-500",
    border: "border-teal-200 dark:border-teal-800",
  },
  shipped: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    text: "text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  delivered: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    border: "border-red-200 dark:border-red-800",
  },
  payment_received: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
    border: "border-green-200 dark:border-green-800",
  },
};

export function statusBadgeClasses(status: OrderStatus): string {
  const c = STATUS_COLORS[status];
  return `${c.bg} ${c.text} ${c.border} border`;
}

export const TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Order Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Fulfilling Order" },
  { key: "fulfilled", label: "Ready for Delivery" },
  { key: "shipped", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

export function getStepIndex(status: OrderStatus): number {
  return TIMELINE_STEPS.findIndex((s) => s.key === status);
}
