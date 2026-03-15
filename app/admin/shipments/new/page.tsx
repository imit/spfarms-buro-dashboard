"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { apiClient, type Order } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import { cn } from "@/lib/utils";

function formatPrice(amount: string | number | null) {
  if (!amount) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

export default function NewShipmentPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadOrders() {
      try {
        const orders = await apiClient.getOrders();
        // Show fulfilled orders that could be added to a shipment
        const eligible = orders.filter(
          (o) => o.status === "fulfilled" || o.status === "confirmed" || o.status === "processing"
        );
        setAvailableOrders(eligible);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, [isAuthenticated]);

  const toggleOrder = (orderId: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const shipment = await apiClient.createShipment({
        scheduled_date: scheduledDate || undefined,
        notes: notes || undefined,
        order_ids: selectedOrderIds.length > 0 ? selectedOrderIds : undefined,
      });
      toast.success("Shipment created");
      router.push(`/admin/shipments/${shipment.id}`);
    } catch {
      showError("create the shipment");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/shipments">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">New Shipment</h2>
          <p className="text-sm text-muted-foreground">
            Create a new delivery shipment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Scheduled Date</Label>
          <Input
            id="scheduled_date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for this shipment..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Orders</Label>
          <p className="text-xs text-muted-foreground">
            Select orders to include in this shipment. You can also add orders later.
          </p>
          {loadingOrders ? (
            <p className="text-sm text-muted-foreground py-4">Loading orders...</p>
          ) : availableOrders.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">No eligible orders available.</p>
            </div>
          ) : (
            <div className="rounded-lg border divide-y max-h-96 overflow-y-auto">
              {availableOrders.map((order) => (
                <label
                  key={order.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
                    selectedOrderIds.includes(order.id) && "bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={selectedOrderIds.includes(order.id)}
                    onCheckedChange={() => toggleOrder(order.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.company?.name ?? "Unknown"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} items
                      {order.desired_delivery_date && (
                        <> &middot; Delivery: {new Date(order.desired_delivery_date).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-medium shrink-0">
                    {formatPrice(order.total)}
                  </span>
                </label>
              ))}
            </div>
          )}
          {selectedOrderIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Shipment"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/shipments">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
