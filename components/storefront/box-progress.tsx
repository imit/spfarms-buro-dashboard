"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

const WEIGHT_NAMES: Record<number, string> = {
  3.5: "Eighth",
  7: "Quarter",
  14: "Half",
  28: "Ounce",
};

export interface BoxProgressItem {
  product_name: string;
  quantity: number;
  unit_weight: string | null;
  box_capacity: number;
  minimum_order_quantity: number;
  strain_name: string | null;
  thumbnail_url?: string | null;
  bulk?: boolean;
}

interface WeightGroup {
  weight: number;
  weightLabel: string;
  totalQty: number;
  boxCapacity: number;
  minimumOrder: number;
  items: { name: string; quantity: number; thumbnailUrl?: string | null }[];
}

function groupByWeight(items: BoxProgressItem[]): WeightGroup[] {
  const groups = new Map<number, WeightGroup>();

  for (const item of items) {
    if (item.bulk) continue;
    if (!item.unit_weight) continue;
    const w = parseFloat(item.unit_weight);
    if (isNaN(w)) continue;

    const existing = groups.get(w);
    if (existing) {
      existing.totalQty += item.quantity;
      existing.boxCapacity = Math.max(existing.boxCapacity, item.box_capacity);
      existing.minimumOrder = Math.max(existing.minimumOrder, item.minimum_order_quantity);
      existing.items.push({
        name: item.strain_name || item.product_name,
        quantity: item.quantity,
        thumbnailUrl: item.thumbnail_url,
      });
    } else {
      const commonName = WEIGHT_NAMES[w];
      groups.set(w, {
        weight: w,
        weightLabel: commonName ? `${commonName} (${w}g)` : `${w}g`,
        totalQty: item.quantity,
        boxCapacity: item.box_capacity,
        minimumOrder: item.minimum_order_quantity,
        items: [{
          name: item.strain_name || item.product_name,
          quantity: item.quantity,
          thumbnailUrl: item.thumbnail_url,
        }],
      });
    }
  }

  return Array.from(groups.values());
}

export function useMinimumOrderMet(items: BoxProgressItem[]): boolean {
  return useMemo(() => {
    if (items.length === 0) return false;
    const nonBulkItems = items.filter((i) => !i.bulk);
    if (nonBulkItems.length === 0) return true; // only bulk items — no box minimum applies
    const groups = groupByWeight(items);
    if (groups.length === 0) return true;
    return groups.every((g) => g.totalQty >= g.minimumOrder);
  }, [items]);
}

export function BoxProgress({
  items,
  compact = false,
}: {
  items: BoxProgressItem[];
  compact?: boolean;
}) {
  const groups = useMemo(() => groupByWeight(items), [items]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const progressPercent = Math.min(
          (group.totalQty / group.boxCapacity) * 100,
          100
        );
        const halfBoxPercent = (group.minimumOrder / group.boxCapacity) * 100;
        const belowMinimum = group.totalQty < group.minimumOrder;
        const atMinimum =
          group.totalQty >= group.minimumOrder &&
          group.totalQty < group.boxCapacity;
        const fullBox = group.totalQty >= group.boxCapacity;
        const remaining = group.minimumOrder - group.totalQty;

        return (
          <div key={group.weight} className="space-y-2">
            {!compact && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{group.weightLabel} Pouches</span>
                <span className="text-muted-foreground">
                  {group.totalQty} / {group.boxCapacity}
                </span>
              </div>
            )}

            <div className="relative">
              <Progress
                value={progressPercent}
                className={`h-3 ${
                  fullBox
                    ? "[&>div]:bg-green-500"
                    : atMinimum
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-red-400"
                }`}
              />
              {/* Half-box marker */}
              <div
                className="absolute top-0 h-3 w-px bg-foreground/30"
                style={{ left: `${halfBoxPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {fullBox
                  ? "Full box"
                  : atMinimum
                    ? `Half box (min ${group.minimumOrder})`
                    : `Add ${remaining} more for minimum`}
              </span>
              {!fullBox && group.totalQty > 0 && (
                <span>
                  {group.boxCapacity - group.totalQty} to fill box
                </span>
              )}
            </div>

            {/* Strain breakdown */}
            {!compact && group.items.length > 0 && (
              <div className="space-y-1">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-muted-foreground ml-2 shrink-0">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
