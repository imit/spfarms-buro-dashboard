"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Order,
  type PaymentStatus,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-slate-100 text-slate-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

function formatPrice(amount: string | number | null) {
  if (!amount) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

export default function AdminOrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage dispensary orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/orders/new-bulk">
              <PlusIcon className="mr-1.5 size-4" />
              Bulk Order
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/orders/new">
              <PlusIcon className="mr-1.5 size-4" />
              Create Order
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Terms</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.button === 1) {
                      window.open(`/admin/orders/${order.id}`, "_blank");
                    } else {
                      router.push(`/admin/orders/${order.id}`);
                    }
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      window.open(`/admin/orders/${order.id}`, "_blank");
                    }
                  }}
                >
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/orders/${order.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                    {order.order_number}
                    {order.order_type === "preorder" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {ORDER_TYPE_LABELS.preorder}
                      </span>
                    )}
                    {order.items.length > 0 && order.items.every((i) => i.product_type === "bulk_flower") && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Bulk
                      </span>
                    )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.company?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.items.length} / {order.items.reduce((sum, i) => sum + i.quantity, 0)} units
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.payment_term_name
                      ? `${order.payment_term_name}${order.payment_term_days ? ` (Net ${order.payment_term_days})` : ""}`
                      : "COD"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status] || PAYMENT_STATUS_COLORS.unpaid}`}>
                      {PAYMENT_STATUS_LABELS[order.payment_status] || "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
