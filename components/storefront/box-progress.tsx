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
  minimum_order_quantity: number;
  strain_name: string | null;
  thumbnail_url?: string | null;
  bulk?: boolean;
}

interface WeightGroup {
  weight: number;
  weightLabel: string;
  totalQty: number;
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
    if (nonBulkItems.length === 0) return true; // only bulk items — no minimum applies
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
          (group.totalQty / group.minimumOrder) * 100,
          100
        );
        const metMinimum = group.totalQty >= group.minimumOrder;
        const remaining = group.minimumOrder - group.totalQty;

        return (
          <div key={group.weight} className="space-y-2">
            {!compact && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{group.weightLabel} Pouches</span>
                <span className="text-muted-foreground">
                  {group.totalQty} / {group.minimumOrder} min
                </span>
              </div>
            )}

            <Progress
              value={progressPercent}
              className={`h-3 ${
                metMinimum
                  ? "[&>div]:bg-green-500"
                  : "[&>div]:bg-red-400"
              }`}
            />

            <div className="text-xs text-muted-foreground">
              {metMinimum
                ? `Minimum met (${group.minimumOrder} units)`
                : `Add ${remaining} more to meet minimum of ${group.minimumOrder}`}
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
