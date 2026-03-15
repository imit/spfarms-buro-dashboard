"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Shipment,
  type ShipmentStatus,
  SHIPMENT_STATUS_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGE_COLORS: Record<ShipmentStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  loading: "bg-amber-100 text-amber-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Loading", value: "loading" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function formatPrice(amount: number | string | null) {
  if (!amount) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

export default function AdminShipmentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      setIsLoading(true);
      try {
        const data = await apiClient.getShipments(activeTab || undefined);
        setShipments(data);
      } catch (err) {
        console.error("Failed to load shipments:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, activeTab]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Shipments</h2>
          <p className="text-sm text-muted-foreground">
            Manage delivery shipments
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/shipments/new">
            <PlusIcon className="mr-1.5 size-4" />
            New Shipment
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : shipments.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No shipments found.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Shipment #</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Scheduled Date</th>
                <th className="px-4 py-3 text-left font-medium">Orders</th>
                <th className="px-4 py-3 text-left font-medium">Total Value</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.button === 1) {
                      window.open(`/admin/shipments/${shipment.id}`, "_blank");
                    } else {
                      router.push(`/admin/shipments/${shipment.id}`);
                    }
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      window.open(`/admin/shipments/${shipment.id}`, "_blank");
                    }
                  }}
                >
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/shipments/${shipment.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                      {shipment.shipment_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_BADGE_COLORS[shipment.status]
                    )}>
                      {SHIPMENT_STATUS_LABELS[shipment.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {shipment.scheduled_date
                      ? new Date(shipment.scheduled_date).toLocaleDateString()
                      : "Not set"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {shipment.totals.order_count}
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(shipment.totals.total_value)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(shipment.created_at).toLocaleDateString()}
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
