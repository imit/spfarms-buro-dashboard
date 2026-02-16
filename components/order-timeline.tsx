"use client";

import { CheckIcon } from "lucide-react";
import type { OrderStatus } from "@/lib/api";
import { TIMELINE_STEPS, getStepIndex, STATUS_COLORS } from "@/lib/order-utils";

export function OrderTimeline({
  status,
  createdAt,
  desiredDeliveryDate,
}: {
  status: OrderStatus;
  createdAt: string;
  desiredDeliveryDate?: string | null;
}) {
  const isCancelled = status === "cancelled";
  const currentIndex = isCancelled ? -1 : getStepIndex(status);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold text-sm mb-4">Order Status</h3>

      {isCancelled ? (
        <div className="flex items-center gap-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <div className="size-3 rounded-full bg-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Order Cancelled
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {TIMELINE_STEPS.map((step, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;
            const stepColor = STATUS_COLORS[step.key];
            const isLast = index === TIMELINE_STEPS.length - 1;

            return (
              <div key={step.key} className="relative flex gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  {/* Dot */}
                  <div
                    className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      isPast
                        ? `${stepColor.dot} border-transparent`
                        : isCurrent
                        ? `${stepColor.dot} border-transparent ring-4 ring-offset-2 ring-offset-background ${step.key === "pending" ? "ring-amber-200" : step.key === "confirmed" ? "ring-blue-200" : step.key === "processing" ? "ring-violet-200" : step.key === "shipped" ? "ring-cyan-200" : "ring-emerald-200"}`
                        : "bg-muted border-muted-foreground/20"
                    }`}
                  >
                    {isPast && (
                      <CheckIcon className="size-3.5 text-white" />
                    )}
                    {isCurrent && (
                      <div className="size-2 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`w-0.5 grow min-h-6 ${
                        isPast ? "bg-muted-foreground/30" : "bg-muted-foreground/10"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm font-medium leading-6 ${
                      isCurrent
                        ? stepColor.text
                        : isPast
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Timestamps */}
                  {step.key === "pending" && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {step.key === "delivered" && desiredDeliveryDate && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled:{" "}
                      {new Date(desiredDeliveryDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
