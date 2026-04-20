"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type BusinessAnalyticsData,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  ArrowLeftIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ReceiptIcon,
  PercentIcon,
  ShoppingCartIcon,
  UsersIcon,
  BoxIcon,
  ClockIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const FALLBACK_COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const PRODUCT_TYPE_COLORS: Record<string, string> = {
  flower: "#16a34a", pre_roll: "#f59e0b", concentrate: "#8b5cf6", edible: "#ec4899",
  vape: "#06b6d4", tincture: "#84cc16", bulk_flower: "#4f46e5", topical: "#ef4444",
};

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#16a34a" },
  expenses: { label: "Expenses", color: "#ef4444" },
  net: { label: "Net Income", color: "#4f46e5" },
};

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<BusinessAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    apiClient.getBusinessAnalytics(months).then(setData).catch(() => {}).finally(() => setIsLoading(false));
  }, [isAuthenticated, months]);

  if (authLoading || !isAuthenticated) return null;

  const s = data?.summary;
  const categoryColors: Record<string, string> = {};
  data?.expense_category_totals.forEach((ct, i) => {
    categoryColors[ct.name] = ct.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
  });

  // Combined actuals + forecast
  const combined = [
    ...(data?.monthly || []).map((m) => ({ ...m, type: "actual" as const })),
    ...(data?.forecast || []).map((f) => ({ ...f, type: "forecast" as const })),
  ];

  const allCatNames = data?.expense_category_totals.map((c) => c.name) || [];
  const stackedExpenseData = (data?.monthly || []).map((m) => ({ month: m.month, ...m.expense_by_category }));
  const pieData = (data?.expense_category_totals || []).map((ct, i) => ({
    name: ct.name, value: ct.total, color: ct.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));
  const productTypePie = (data?.product_type_revenue || []).map((pt) => ({
    name: pt.label, value: pt.total_revenue, color: PRODUCT_TYPE_COLORS[pt.product_type] || "#94a3b8",
  }));

  return (
    <div className="space-y-8 px-10 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/expenses"><Button variant="ghost" size="sm"><ArrowLeftIcon className="mr-1.5 size-4" />Back</Button></Link>
          <div>
            <h2 className="text-2xl font-semibold">Business Analytics</h2>
            <p className="text-sm text-muted-foreground">Revenue, orders, expenses, and forecasts</p>
          </div>
        </div>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="rounded-md border px-3 py-2 text-sm">
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading analytics...</p>
      ) : !data || !s ? (
        <p className="text-sm text-muted-foreground">Could not load analytics data.</p>
      ) : (
        <>
          {/* ── KPI Row 1: Financial ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KPI icon={<DollarSignIcon className="size-5 text-green-600" />} label="Revenue" value={fmt(s.total_revenue)} />
            <KPI icon={<ReceiptIcon className="size-5 text-red-500" />} label="Expenses" value={fmt(s.total_expenses)} />
            <KPI
              icon={s.net_income >= 0 ? <TrendingUpIcon className="size-5 text-green-600" /> : <TrendingDownIcon className="size-5 text-red-600" />}
              label="Net Income" value={fmt(s.net_income)}
              valueClass={s.net_income >= 0 ? "text-green-600" : "text-red-600"}
            />
            <KPI icon={<PercentIcon className="size-5 text-indigo-500" />} label="Profit Margin" value={`${s.profit_margin}%`} />
            <KPI icon={<ClockIcon className="size-5 text-amber-500" />} label="Avg Days to Pay" value={`${data.order_metrics.avg_days_to_payment}d`} />
          </div>

          {/* ── KPI Row 2: Orders ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KPI icon={<ShoppingCartIcon className="size-5 text-sky-500" />} label="Orders" value={String(s.order_count)} />
            <KPI icon={<DollarSignIcon className="size-5 text-violet-500" />} label="Avg Order Value" value={fmt(s.avg_order_value)} />
            <KPI icon={<BoxIcon className="size-5 text-amber-600" />} label="Units Sold" value={s.total_units_sold.toLocaleString()} />
            <KPI icon={<DollarSignIcon className="size-5 text-teal-500" />} label="Avg Unit Price" value={fmt(s.avg_unit_price)} />
            <KPI icon={<UsersIcon className="size-5 text-pink-500" />} label="Customers" value={String(s.unique_customers)} />
          </div>

          {/* ── Revenue vs Expenses + Forecast ── */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Revenue vs Expenses (with forecast)</h3>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </div>

          {/* ── Order Volume + AOV + AUP Trends ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Order Volume & Customers</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={combined}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#4f46e5" name="Orders" />
                  <Bar dataKey="customers" fill="#ec4899" name="Customers" />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Avg Order Value & Unit Price</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart data={combined}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_order_value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="AOV" />
                  <Line type="monotone" dataKey="avg_unit_price" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Avg Unit Price" />
                </LineChart>
              </ChartContainer>
            </div>
          </div>

          {/* ── Revenue by Product Type + Expense Breakdown ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Revenue by Product Type</h3>
              {productTypePie.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No order data yet.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ChartContainer config={chartConfig} className="h-[220px] w-[220px]">
                    <PieChart>
                      <Pie data={productTypePie} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" nameKey="name">
                        {productTypePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} />
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-1.5">
                    {productTypePie.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="font-medium">{fmt(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Expense Breakdown</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No expense data yet.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ChartContainer config={chartConfig} className="h-[220px] w-[220px]">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" nameKey="name">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} />
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-1.5">
                    {pieData.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="font-medium">{fmt(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Expense by Category Stacked ── */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Monthly Expenses by Category</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={stackedExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                {allCatNames.map((name, i) => (
                  <Bar key={name} dataKey={name} stackId="exp" fill={categoryColors[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                ))}
              </BarChart>
            </ChartContainer>
          </div>

          {/* ── Weekly Order & Price Detail ── */}
          {data.weekly.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-6 shadow-xs">
                  <h3 className="text-sm font-semibold mb-4">Weekly Orders & Revenue</h3>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={data.weekly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week_label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number, name: string) => name === "Revenue" ? fmt(value) : value} />
                      <Legend />
                      <Bar yAxisId="rev" dataKey="revenue" fill="#16a34a" name="Revenue" />
                      <Bar yAxisId="ord" dataKey="orders" fill="#4f46e5" name="Orders" />
                    </BarChart>
                  </ChartContainer>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-xs">
                  <h3 className="text-sm font-semibold mb-4">Weekly Unit Price & AOV</h3>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <LineChart data={data.weekly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week_label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(value: number) => fmt(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="avg_unit_price" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Avg Unit Price" />
                      <Line type="monotone" dataKey="avg_order_value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Avg Order Value" />
                    </LineChart>
                  </ChartContainer>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-xs">
                <h3 className="text-sm font-semibold mb-4">Weekly Breakdown</h3>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Week</th>
                        <th className="px-3 py-2 text-right font-medium">Revenue</th>
                        <th className="px-3 py-2 text-right font-medium">Orders</th>
                        <th className="px-3 py-2 text-right font-medium">Units</th>
                        <th className="px-3 py-2 text-right font-medium">AOV</th>
                        <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                        <th className="px-3 py-2 text-right font-medium">Customers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.weekly.map((w) => (
                        <tr key={w.week} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium text-xs">{w.week_label}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-green-600">{fmt(w.revenue)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{w.orders}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{w.units_sold}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(w.avg_order_value)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">{fmt(w.avg_unit_price)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{w.customers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Top Products + Top Customers ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Top Products by Revenue</h3>
              {data.top_products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No product data yet.</p>
              ) : (
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Product</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Avg Price</th>
                        <th className="px-3 py-2 text-right font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_products.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            <div className="font-medium truncate max-w-[200px]">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.order_count} orders</div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{p.total_quantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(p.avg_price)}</td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(p.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Top Customers</h3>
              {data.top_customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No customer data yet.</p>
              ) : (
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Customer</th>
                        <th className="px-3 py-2 text-right font-medium">Orders</th>
                        <th className="px-3 py-2 text-right font-medium">Avg Order</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_customers.map((c) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`/admin/companies/${c.slug}`)}>
                          <td className="px-3 py-2 font-medium truncate max-w-[200px]">{c.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{c.order_count}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(c.avg_order)}</td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(c.total_spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Order Breakdown Cards ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniCard label="Discounts Given" value={fmt(data.order_metrics.total_discounts_given)} sub="General discounts" />
            <MiniCard label="PT Discounts" value={fmt(data.order_metrics.total_payment_term_discounts)} sub="Early payment incentives" />
            <MiniCard label="Tax Collected" value={fmt(data.order_metrics.total_tax_collected)} />
            <MiniCard label="Delivery Fees" value={fmt(data.order_metrics.total_delivery_fees)} />
          </div>

          {/* ── Forecast Table ── */}
          {data.forecast.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">3-Month Forecast</h3>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Month</th>
                      <th className="px-4 py-3 text-right font-medium">Revenue</th>
                      <th className="px-4 py-3 text-right font-medium">Expenses</th>
                      <th className="px-4 py-3 text-right font-medium">Net</th>
                      <th className="px-4 py-3 text-right font-medium">Orders</th>
                      <th className="px-4 py-3 text-right font-medium">AOV</th>
                      <th className="px-4 py-3 text-right font-medium">Units</th>
                      <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-3 text-right font-medium">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast.map((f) => (
                      <tr key={f.month} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{f.month}</td>
                        <td className="px-4 py-3 text-right text-green-600 tabular-nums">{fmt(f.revenue)}</td>
                        <td className="px-4 py-3 text-right text-red-500 tabular-nums">{fmt(f.expenses)}</td>
                        <td className={`px-4 py-3 text-right font-medium tabular-nums ${f.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(f.net)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{f.orders}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(f.avg_order_value)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{f.units_sold}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(f.avg_unit_price)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{f.customers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Based on weighted moving average of the last {months} months.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 mb-1.5">{icon}<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span></div>
      <p className={`text-xl font-semibold tabular-nums ${valueClass || ""}`}>{value}</p>
    </div>
  );
}

function MiniCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-xs">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
