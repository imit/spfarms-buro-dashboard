"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Order,
  type OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DownloadIcon,
  PrinterIcon,
  CheckCircleIcon,
  PackageIcon,
  TruckIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatPrice(amount: string | null) {
  if (!amount) return "$0.00";
  return `$${parseFloat(amount).toFixed(2)}`;
}

const FULFILMENT_STATUSES: OrderStatus[] = [
  "confirmed",
  "processing",
  "fulfilled",
];

const STATUS_SECTION_LABELS: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
  confirmed: {
    title: "Confirmed",
    icon: <PackageIcon className="size-5" />,
    description: "Orders ready to be packed",
  },
  processing: {
    title: "Processing",
    icon: <PrinterIcon className="size-5" />,
    description: "Currently being packed",
  },
  fulfilled: {
    title: "Ready for Delivery",
    icon: <TruckIcon className="size-5" />,
    description: "In the vault, waiting for pickup",
  },
};

export default function FulfilmentPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
  }, [isAuthenticated]);

  async function loadOrders() {
    try {
      const data = await apiClient.getOrders();
      setOrders(
        data.filter((o) => FULFILMENT_STATUSES.includes(o.status))
      );
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function ensureProcessing(order: Order) {
    if (order.status === "confirmed") {
      try {
        const updated = await apiClient.updateOrder(order.id, { status: "processing" });
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
        return updated;
      } catch {
        // non-blocking — continue with the action even if status update fails
      }
    }
    return order;
  }

  async function handleDownloadInvoice(order: Order) {
    try {
      await ensureProcessing(order);
      const blob = await apiClient.getOrderInvoice(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.order_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    }
  }

  async function handlePrintBoxLabel(order: Order) {
    await ensureProcessing(order);
    const shipping = order.shipping_location;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;

    const address = shipping
      ? [
          shipping.name,
          shipping.address,
          [shipping.city, shipping.state, shipping.zip_code]
            .filter(Boolean)
            .join(", "),
        ]
          .filter(Boolean)
          .join("<br/>")
      : "No shipping address";

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Box Label — ${order.order_number}</title>
  <style>
    @page { size: 4in 6in; margin: 0.25in; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 0.5in; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #666; }
    .order-number { font-size: 28px; font-weight: bold; text-align: center; margin: 16px 0; letter-spacing: 2px; }
    .section { margin-bottom: 14px; }
    .section-label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
    .section-value { font-size: 14px; line-height: 1.4; }
    .items { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 12px; }
    .items table { width: 100%; font-size: 12px; border-collapse: collapse; }
    .items th { text-align: left; font-weight: 600; padding: 4px 0; border-bottom: 1px solid #eee; }
    .items td { padding: 3px 0; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #ccc; padding-top: 10px; }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <h1>SPFarms</h1>
    <p>Cannabis Delivery</p>
  </div>
  <div class="order-number">${order.order_number}</div>
  <div class="section">
    <div class="section-label">Ship To</div>
    <div class="section-value"><strong>${order.company?.name ?? ""}</strong><br/>${address}</div>
  </div>
  <div class="section">
    <div class="section-label">Order Date</div>
    <div class="section-value">${new Date(order.created_at).toLocaleDateString()}</div>
  </div>
  ${
    order.desired_delivery_date
      ? `<div class="section"><div class="section-label">Desired Delivery</div><div class="section-value">${new Date(order.desired_delivery_date).toLocaleDateString()}</div></div>`
      : ""
  }
  <div class="items">
    <table>
      <thead><tr><th>Product</th><th style="text-align:right">Qty</th></tr></thead>
      <tbody>${order.items.map((i) => `<tr><td>${i.product_name}</td><td style="text-align:right">${i.quantity}</td></tr>`).join("")}</tbody>
    </table>
  </div>
  <div class="footer">Packed on ${new Date().toLocaleDateString()} — ${order.items.length} item${order.items.length !== 1 ? "s" : ""}, Total: ${formatPrice(order.total)}</div>
</body>
</html>`);
    win.document.close();
  }

  async function handleMarkProcessingDone(order: Order) {
    try {
      await ensureProcessing(order);
      const updated = await apiClient.markProcessingDone(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      setConfirmOrder(null);
      toast.success(`${order.order_number} marked as fulfilled`);
    } catch {
      toast.error("Failed to mark as processing done");
    }
  }

  if (authLoading || !isAuthenticated) return null;

  const grouped = FULFILMENT_STATUSES.map((status) => ({
    status,
    orders: orders.filter((o) => o.status === status),
  })).filter((g) => g.orders.length > 0);

  return (
    <div className="space-y-8 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Fulfilment</h2>
        <p className="text-sm text-muted-foreground">
          Pack orders, print labels, and mark ready for delivery
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : grouped.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <PackageIcon className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            No orders to fulfil right now.
          </p>
        </div>
      ) : (
        grouped.map(({ status, orders: sectionOrders }) => {
          const cfg = STATUS_SECTION_LABELS[status];
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-muted-foreground">{cfg.icon}</span>
                <div>
                  <h3 className="font-semibold">{cfg.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {cfg.description} ({sectionOrders.length})
                  </p>
                </div>
              </div>

              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Order</th>
                      <th className="px-4 py-3 text-left font-medium">Company</th>
                      <th className="px-4 py-3 text-left font-medium">Items</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Delivery</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {order.order_number}
                          {order.order_type === "preorder" && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {ORDER_TYPE_LABELS.preorder}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{order.company?.name ?? "—"}</p>
                          {order.shipping_location && (
                            <p className="text-xs text-muted-foreground">
                              {[order.shipping_location.city, order.shipping_location.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-xs">
                                <span className="font-medium">{item.quantity}x</span>{" "}
                                <span className="text-muted-foreground">{item.product_name}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {order.desired_delivery_date
                            ? new Date(order.desired_delivery_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleDownloadInvoice(order)}
                            >
                              <DownloadIcon className="mr-1 size-3" />
                              Invoice
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handlePrintBoxLabel(order)}
                            >
                              <PrinterIcon className="mr-1 size-3" />
                              Box Label
                            </Button>
                            {(order.status === "confirmed" || order.status === "processing") && (
                              <Button
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => setConfirmOrder(order)}
                              >
                                <CheckCircleIcon className="mr-1 size-3" />
                                Done
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      <AlertDialog
        open={!!confirmOrder}
        onOpenChange={(open) => {
          if (!open) setConfirmOrder(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as fulfilled?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark order{" "}
              <strong>{confirmOrder?.order_number}</strong> as fulfilled and
              ready for delivery. The box should be placed in the vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmOrder && handleMarkProcessingDone(confirmOrder)}
            >
              Mark Fulfilled
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
