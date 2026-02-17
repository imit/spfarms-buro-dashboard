"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import { apiClient, type Order, type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const STATUSES = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getOrder(Number(id));
        setOrder(data);
        setInternalNotes(data.internal_notes || "");
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const updated = await apiClient.updateOrder(Number(id), { status: newStatus });
      setOrder(updated);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const saveInternalNotes = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.updateOrder(Number(id), { internal_notes: internalNotes });
      setOrder(updated);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

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
    return <p className="px-10 text-muted-foreground">Loading order...</p>;
  }

  if (!order) {
    return <p className="px-10 text-muted-foreground">Order not found.</p>;
  }

  const companyDetails = order.company_details;

  return (
    <div className="space-y-6 px-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/orders")}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Orders
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">
            {order.company.name} — {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => {
              if (e.target.value !== order.status) {
                setPendingStatus(e.target.value);
              }
            }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={downloadInvoice}>
            <DownloadIcon className="mr-1.5 size-4" />
            Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
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
              <h3 className="font-semibold text-sm">Order Items</h3>
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
                    <p className="font-medium text-sm">{item.product_name}</p>
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

          {/* Vendor notes */}
          {order.notes_to_vendor && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-1">Notes from Customer</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes_to_vendor}</p>
            </div>
          )}

          {/* Internal notes */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="internalNotes" className="font-semibold">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              placeholder="Add internal notes about this order..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
            />
            <Button size="sm" onClick={saveInternalNotes} disabled={saving}>
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* People on order */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Order People</h3>
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

          {/* Company details */}
          {companyDetails && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Company</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{companyDetails.name}</p>
                {companyDetails.email && (
                  <p className="text-muted-foreground">{companyDetails.email}</p>
                )}
                {companyDetails.phone_number && (
                  <p className="text-muted-foreground">{companyDetails.phone_number}</p>
                )}

                {companyDetails.locations.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Locations</p>
                    {companyDetails.locations.map((loc) => (
                      <p key={loc.id} className="text-xs text-muted-foreground">
                        {loc.name && <span className="font-medium">{loc.name}: </span>}
                        {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {companyDetails.members.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Members</p>
                    {companyDetails.members.map((member) => (
                      <div key={member.id} className="text-xs text-muted-foreground">
                        {member.full_name || member.email}
                        {member.company_title && ` — ${member.company_title}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-1">Payment Terms</h3>
            <p className="text-sm text-muted-foreground">
              {order.payment_term_name || "ACH / Bank Transfer"}
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change order status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the status from{" "}
              <strong>{ORDER_STATUS_LABELS[order.status]}</strong> to{" "}
              <strong>{ORDER_STATUS_LABELS[pendingStatus as OrderStatus]}</strong>.
              An email notification will be sent to all members of{" "}
              <strong>{order.company.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (pendingStatus) {
                await updateStatus(pendingStatus);
                setPendingStatus(null);
              }
            }}>
              Confirm &amp; Notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
