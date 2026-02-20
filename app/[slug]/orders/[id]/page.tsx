"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import { apiClient, type Order, type AppSettings, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/order-timeline";
import { toast } from "sonner";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function formatLocation(loc: { name?: string | null; address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null } | null) {
  if (!loc) return "Not specified";
  const parts = [loc.name, loc.address, [loc.city, loc.state, loc.zip_code].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(" — ") || "Not specified";
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [data, s] = await Promise.all([
          apiClient.getOrder(Number(id)),
          apiClient.getSettings(),
        ]);
        setOrder(data);
        setSettings(s);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, id]);

  const downloadInvoice = async () => {
    try {
      const blob = await apiClient.getOrderInvoice(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order?.order_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading order...</p>;
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found.</p>;
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/${slug}/orders`)}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Orders
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Summary</h1>
          <p className="text-lg text-muted-foreground">
            {order.order_number}
            {order.order_type === "preorder" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {ORDER_TYPE_LABELS.preorder}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <Button variant="outline" size="sm" onClick={downloadInvoice}>
            <DownloadIcon className="mr-1.5 size-4" />
            Invoice PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Desired Delivery</p>
              <p className="font-medium">
                {order.desired_delivery_date
                  ? new Date(order.desired_delivery_date).toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Shipping</p>
              <p className="font-medium">{formatLocation(order.shipping_location)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Billing</p>
              <p className="font-medium">{formatLocation(order.billing_location)}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/50">
              <h2 className="font-semibold text-sm">Order Items</h2>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {item.product_name}
                      {order.order_type === "preorder" && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Pre-order
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium text-sm">
                    {formatPrice(item.line_total)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.payment_term_discount_amount && parseFloat(order.payment_term_discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Payment Discount ({order.payment_term_name})</span>
                  <span>-{formatPrice(order.payment_term_discount_amount)}</span>
                </div>
              )}
              {order.discount_details?.map((d, i) => (
                <div key={i} className="flex justify-between text-sm text-green-600">
                  <span>{d.name}</span>
                  <span>-{formatPrice(d.amount)}</span>
                </div>
              ))}
              {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({parseFloat(order.tax_rate || "0")}%)</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes_to_vendor && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-1">Notes to Vendor</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes_to_vendor}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            createdAt={order.created_at}
            desiredDeliveryDate={order.desired_delivery_date}
          />

          {/* People */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">People</h3>
            <div className="space-y-3">
              {order.order_users.map((ou) => (
                <div key={ou.id} className="text-sm">
                  <p className="font-medium">{ou.full_name || ou.email}</p>
                  <p className="text-xs text-muted-foreground">{ou.email}</p>
                  {ou.phone_number && (
                    <p className="text-xs text-muted-foreground">{ou.phone_number}</p>
                  )}
                  <Badge variant="outline" className="mt-1 text-xs">
                    {ou.role === "orderer" ? "Ordered by" : "Contact"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-1">Payment Terms</h3>
            <p className="text-sm text-muted-foreground">
              {order.payment_term_name || "ACH / Bank Transfer"}
            </p>
          </div>

          {settings?.bank_info && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-1">Payment Information</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {settings.bank_info}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
