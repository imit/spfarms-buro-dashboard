"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type AccountsReceivable,
  type AccountsReceivableOrder,
  type PaymentStatus,
  PAYMENT_STATUS_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, CheckCircleIcon, AlertTriangleIcon, DollarSignIcon } from "lucide-react";

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-slate-100 text-slate-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

function formatPrice(amount: number | null) {
  if (!amount) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

function formatDays(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function PaymentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [ar, setAr] = useState<AccountsReceivable | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getAccountsReceivable()
      .then(setAr)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  const totalOutstanding = ar?.outstanding.reduce((sum, o) => sum + o.total, 0) ?? 0;
  const totalOverdue = ar?.outstanding
    .filter((o) => o.days_until_due !== null && o.days_until_due < 0)
    .reduce((sum, o) => sum + o.total, 0) ?? 0;
  const totalCollected = ar?.recently_paid.reduce((sum, o) => sum + o.total, 0) ?? 0;

  return (
    <div className="space-y-8 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Payments</h2>
        <p className="text-sm text-muted-foreground">
          Track outstanding and received payments
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !ar ? (
        <p className="text-sm text-muted-foreground">Could not load payment data.</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-3 text-muted-foreground mb-2">
                <AlertTriangleIcon className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Outstanding</span>
              </div>
              <p className="text-2xl font-semibold">{formatPrice(totalOutstanding)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ar.outstanding.length} order{ar.outstanding.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-3 text-red-500 mb-2">
                <ClockIcon className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Overdue</span>
              </div>
              <p className="text-2xl font-semibold text-red-600">{formatPrice(totalOverdue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ar.outstanding.filter((o) => o.days_until_due !== null && o.days_until_due < 0).length} order{ar.outstanding.filter((o) => o.days_until_due !== null && o.days_until_due < 0).length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-3 text-green-600 mb-2">
                <CheckCircleIcon className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Collected (30d)</span>
              </div>
              <p className="text-2xl font-semibold text-green-600">{formatPrice(totalCollected)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ar.recently_paid.length} payment{ar.recently_paid.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Outstanding table */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-amber-600" />
              <h3 className="text-sm font-semibold">Outstanding Payments</h3>
              {ar.outstanding.length > 0 && (
                <Badge variant="secondary" className="text-xs">{ar.outstanding.length}</Badge>
              )}
            </div>
            {ar.outstanding.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No outstanding payments.</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Order</th>
                      <th className="px-4 py-3 text-left font-medium">Company</th>
                      <th className="px-4 py-3 text-left font-medium">Terms</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium">Delivered</th>
                      <th className="px-4 py-3 text-left font-medium">Timer</th>
                      <th className="px-4 py-3 text-left font-medium">Due</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ar.outstanding.map((o) => {
                      const isOverdue = o.days_until_due !== null && o.days_until_due < 0;
                      return (
                        <tr
                          key={o.id}
                          className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => router.push(`/admin/orders/${o.id}`)}
                        >
                          <td className="px-4 py-3 font-medium">{o.order_number}</td>
                          <td className="px-4 py-3">{o.company_name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.payment_term_name || "COD"}
                            {o.payment_term_days ? ` (Net ${o.payment_term_days})` : ""}
                          </td>
                          <td className="px-4 py-3 font-medium">{formatPrice(o.total)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.delivered_at
                              ? new Date(o.delivered_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {o.days_since_delivery !== null ? (
                              <div className="flex items-center gap-1.5">
                                <ClockIcon className="size-3.5 text-muted-foreground" />
                                <span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                                  {formatDays(o.days_since_delivery)}
                                </span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {o.days_until_due !== null ? (
                              <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                                {isOverdue
                                  ? `${formatDays(Math.abs(o.days_until_due))} overdue`
                                  : `In ${formatDays(o.days_until_due)}`}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isOverdue ? PAYMENT_STATUS_COLORS.overdue : PAYMENT_STATUS_COLORS[o.payment_status]
                            }`}>
                              {isOverdue ? "Overdue" : PAYMENT_STATUS_LABELS[o.payment_status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recently Paid table */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircleIcon className="size-4 text-green-600" />
              <h3 className="text-sm font-semibold">Recently Paid</h3>
              {ar.recently_paid.length > 0 && (
                <Badge variant="secondary" className="text-xs">{ar.recently_paid.length}</Badge>
              )}
            </div>
            {ar.recently_paid.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No recent payments.</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Order</th>
                      <th className="px-4 py-3 text-left font-medium">Company</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium">Method</th>
                      <th className="px-4 py-3 text-left font-medium">Paid On</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ar.recently_paid.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/admin/orders/${o.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">{o.order_number}</td>
                        <td className="px-4 py-3">{o.company_name || "—"}</td>
                        <td className="px-4 py-3 font-medium">{formatPrice(o.total)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.payment_method || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {o.paid_at ? new Date(o.paid_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS.paid}`}>
                            Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
