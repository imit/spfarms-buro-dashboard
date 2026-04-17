"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, type ExpenseAnalyticsData } from "@/lib/api";
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
  ResponsiveContainer,
} from "recharts";

function formatPrice(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const FALLBACK_COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function ExpenseAnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ExpenseAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    apiClient
      .getExpenseAnalytics(months)
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, months]);

  if (authLoading || !isAuthenticated) return null;

  // Build chart config from dynamic categories
  const categoryColors: Record<string, string> = {};
  data?.category_totals.forEach((ct, i) => {
    categoryColors[ct.name] = ct.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
  });

  const chartConfig: ChartConfig = {
    revenue: { label: "Revenue", color: "#16a34a" },
    expenses: { label: "Expenses", color: "#ef4444" },
    net: { label: "Net Income", color: "#4f46e5" },
  };

  // Combine actuals + forecast for the line chart
  const combinedMonthly = [
    ...(data?.monthly || []).map((m) => ({
      month: m.month,
      revenue: m.revenue,
      expenses: m.expenses,
      net: m.net,
      type: "actual" as const,
    })),
    ...(data?.forecast || []).map((f) => ({
      month: f.month,
      revenue: f.predicted_revenue,
      expenses: f.predicted_expenses,
      net: f.predicted_net,
      type: "forecast" as const,
    })),
  ];

  // Stacked bar chart data (expenses by category per month)
  const allCategoryNames = data?.category_totals.map((c) => c.name) || [];
  const stackedData = (data?.monthly || []).map((m) => ({
    month: m.month,
    ...m.by_category,
  }));

  // Pie chart data
  const pieData = (data?.category_totals || []).map((ct, i) => ({
    name: ct.name,
    value: ct.total,
    color: ct.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <div className="space-y-8 px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/expenses">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-1.5 size-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Analytics</h2>
            <p className="text-sm text-muted-foreground">Expenses vs revenue, trends, and forecasts</p>
          </div>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading analytics...</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Could not load analytics data.</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSignIcon className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Revenue</span>
              </div>
              <p className="text-2xl font-semibold">{formatPrice(data.summary.total_revenue)}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <ReceiptIcon className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Expenses</span>
              </div>
              <p className="text-2xl font-semibold">{formatPrice(data.summary.total_expenses)}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-2 mb-2">
                {data.summary.net_income >= 0 ? (
                  <TrendingUpIcon className="size-5 text-green-600" />
                ) : (
                  <TrendingDownIcon className="size-5 text-red-600" />
                )}
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Net Income</span>
              </div>
              <p className={`text-2xl font-semibold ${data.summary.net_income >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPrice(data.summary.net_income)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <PercentIcon className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Profit Margin</span>
              </div>
              <p className="text-2xl font-semibold">{data.summary.profit_margin}%</p>
            </div>
          </div>

          {/* Revenue vs Expenses Line Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Revenue vs Expenses (with forecast)</h3>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={combinedMonthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
            {data.forecast.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Dashed area represents forecasted values based on {months}-month weighted average.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category Breakdown Donut */}
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Where Is Money Going?</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No expense data yet.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ChartContainer config={chartConfig} className="h-[250px] w-[250px]">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-2">
                    {pieData.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <div className="size-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name}:</span>
                        <span className="font-medium">{formatPrice(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Stacked Bar */}
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Monthly by Category</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Legend />
                  {allCategoryNames.map((name, i) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="expenses"
                      fill={categoryColors[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Net Income Area Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Net Income Trend</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={combinedMonthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Forecast Table */}
          {data.forecast.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">3-Month Forecast</h3>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Month</th>
                      <th className="px-4 py-3 text-right font-medium">Revenue</th>
                      <th className="px-4 py-3 text-right font-medium">Expenses</th>
                      <th className="px-4 py-3 text-right font-medium">Net Income</th>
                      {allCategoryNames.map((name) => (
                        <th key={name} className="px-4 py-3 text-right font-medium">{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast.map((f) => (
                      <tr key={f.month} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{f.month}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatPrice(f.predicted_revenue)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{formatPrice(f.predicted_expenses)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${f.predicted_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPrice(f.predicted_net)}
                        </td>
                        {allCategoryNames.map((name) => (
                          <td key={name} className="px-4 py-3 text-right text-muted-foreground">
                            {formatPrice(f.by_category[name] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Based on weighted moving average of the last {months} months of data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
