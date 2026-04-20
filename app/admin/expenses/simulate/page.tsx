"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type ExpenseCategory,
  type SimulationResult,
  type BusinessAnalyticsData,
  type BusinessForecast,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  ArrowLeftIcon,
  PlayIcon,
  RotateCcwIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UsersIcon,
  PercentIcon,
  PlusCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowRightIcon,
  SparklesIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const chartConfig: ChartConfig = {
  base: { label: "Current", color: "#94a3b8" },
  adjusted: { label: "Simulated", color: "#4f46e5" },
};

// ── Slider with live preview ──

interface SliderProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  baseValue: number;
  isCurrency?: boolean;
  perMonth?: boolean;
}

function SimSlider({ icon, label, sublabel, value, onChange, min = -50, max = 100, baseValue, isCurrency = true, perMonth = true }: SliderProps) {
  const adjusted = baseValue * (1 + value / 100);
  const diff = adjusted - baseValue;
  const isUp = value > 0;
  const isDown = value < 0;
  const isNeutral = value === 0;

  return (
    <div className={`rounded-xl border bg-card p-4 space-y-3 transition-colors ${!isNeutral ? "ring-1 ring-indigo-500/20 border-indigo-200" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
        </div>
        <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
          isUp ? "bg-red-50 text-red-600" : isDown ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
        }`}>
          {value > 0 ? "+" : ""}{value}%
        </span>
      </div>

      {/* Live preview: current → new */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">{isCurrency ? fmt(baseValue) : fmtNum(baseValue)}</span>
        <ArrowRightIcon className={`size-3 shrink-0 ${isNeutral ? "text-muted-foreground/40" : "text-indigo-500"}`} />
        <span className={`font-semibold tabular-nums ${isNeutral ? "text-muted-foreground" : ""}`}>
          {isCurrency ? fmt(adjusted) : fmtNum(adjusted)}
        </span>
        {!isNeutral && (
          <span className={`text-[10px] font-medium ${isUp ? "text-red-500" : "text-green-600"}`}>
            ({diff > 0 ? "+" : ""}{isCurrency ? fmt(diff) : fmtNum(diff)}{perMonth ? "/mo" : ""})
          </span>
        )}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>{min}%</span>
        <span>0</span>
        <span>+{max}%</span>
      </div>
    </div>
  );
}

// ── Main page ──

export default function SimulatePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [monthsAhead, setMonthsAhead] = useState(3);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Base data for live preview (loaded on mount)
  const [baseData, setBaseData] = useState<BusinessAnalyticsData | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);

  // Revenue levers
  const [orderVolumePct, setOrderVolumePct] = useState(0);
  const [unitPricePct, setUnitPricePct] = useState(0);
  const [customerGrowthPct, setCustomerGrowthPct] = useState(0);
  const [discountChangePct, setDiscountChangePct] = useState(0);

  // Expense levers
  const [expenseAdj, setExpenseAdj] = useState<Record<string, number>>({});
  const [newExpenseMonthly, setNewExpenseMonthly] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load categories + base analytics in parallel
    Promise.all([
      apiClient.getExpenseCategories(),
      apiClient.getBusinessAnalytics(6),
    ]).then(([cats, analytics]) => {
      setCategories(cats);
      setBaseData(analytics);
      const init: Record<string, number> = {};
      cats.forEach((c) => { init[String(c.id)] = 0; });
      setExpenseAdj(init);
    }).finally(() => setBaseLoading(false));
  }, [isAuthenticated]);

  const handleReset = () => {
    setOrderVolumePct(0);
    setUnitPricePct(0);
    setCustomerGrowthPct(0);
    setDiscountChangePct(0);
    setNewExpenseMonthly(0);
    const init: Record<string, number> = {};
    categories.forEach((c) => { init[String(c.id)] = 0; });
    setExpenseAdj(init);
    setResult(null);
    setHasRun(false);
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.simulateBusiness({
        months_ahead: monthsAhead,
        expense_adjustments: expenseAdj,
        order_volume_pct: orderVolumePct,
        unit_price_pct: unitPricePct,
        customer_growth_pct: customerGrowthPct,
        discount_change_pct: discountChangePct,
        new_expense_monthly: newExpenseMonthly,
      });
      setResult(res);
      setHasRun(true);
    } catch {}
    setIsLoading(false);
  };

  if (authLoading || !isAuthenticated) return null;

  // Compute base averages for live slider preview
  const monthly = baseData?.monthly || [];
  const recentMonths = monthly.slice(-3); // last 3 months for avg
  const avgOrders = recentMonths.length ? recentMonths.reduce((s, m) => s + m.orders, 0) / recentMonths.length : 0;
  const avgUnitPrice = recentMonths.length ? recentMonths.reduce((s, m) => s + m.avg_unit_price, 0) / recentMonths.length : 0;
  const avgCustomers = recentMonths.length ? recentMonths.reduce((s, m) => s + m.customers, 0) / recentMonths.length : 0;
  const avgRevenue = recentMonths.length ? recentMonths.reduce((s, m) => s + m.revenue, 0) / recentMonths.length : 0;

  // Per-category average monthly expense
  const catAvgExpense: Record<string, number> = {};
  categories.forEach((cat) => {
    if (recentMonths.length) {
      catAvgExpense[String(cat.id)] = recentMonths.reduce((s, m) => s + (m.expense_by_category[cat.name] || 0), 0) / recentMonths.length;
    } else {
      catAvgExpense[String(cat.id)] = 0;
    }
  });

  const hasChanges = orderVolumePct !== 0 || unitPricePct !== 0 || customerGrowthPct !== 0 ||
    discountChangePct !== 0 || newExpenseMonthly !== 0 || Object.values(expenseAdj).some((v) => v !== 0);

  // Chart data
  const comparisonData = (result?.adjusted || []).map((adj, i) => {
    const base = result?.base[i];
    return {
      month: adj.month,
      "Current Revenue": base?.revenue || 0,
      "Simulated Revenue": adj.revenue,
      "Current Net": base?.net || 0,
      "Simulated Net": adj.net,
    };
  });

  const orderCompData = (result?.adjusted || []).map((adj, i) => {
    const base = result?.base[i];
    return {
      month: adj.month,
      "Current Orders": base?.orders || 0,
      "Simulated Orders": adj.orders,
      "Current AOV": base?.avg_order_value || 0,
      "Simulated AOV": adj.avg_order_value,
    };
  });

  // Impact summary
  const totalBaseRev = result?.base.reduce((s, m) => s + m.revenue, 0) || 0;
  const totalAdjRev = result?.adjusted.reduce((s, m) => s + m.revenue, 0) || 0;
  const totalBaseExp = result?.base.reduce((s, m) => s + m.expenses, 0) || 0;
  const totalAdjExp = result?.adjusted.reduce((s, m) => s + m.expenses, 0) || 0;
  const totalBaseNet = totalBaseRev - totalBaseExp;
  const totalAdjNet = totalAdjRev - totalAdjExp;

  if (baseLoading) {
    return (
      <div className="space-y-6 px-10">
        <h2 className="text-2xl font-semibold">Business Simulator</h2>
        <p className="text-sm text-muted-foreground">Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-10 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/expenses"><Button variant="ghost" size="sm"><ArrowLeftIcon className="mr-1.5 size-4" />Back</Button></Link>
        <div>
          <h2 className="text-2xl font-semibold">Business Simulator</h2>
          <p className="text-sm text-muted-foreground">Drag the sliders to see how changes affect your bottom line</p>
        </div>
      </div>

      {/* Current baseline summary */}
      <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Your current monthly averages (last 3 months)</p>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <span><span className="text-muted-foreground">Revenue:</span> <span className="font-semibold">{fmt(avgRevenue)}/mo</span></span>
          <span><span className="text-muted-foreground">Orders:</span> <span className="font-semibold">{fmtNum(avgOrders)}/mo</span></span>
          <span><span className="text-muted-foreground">Unit Price:</span> <span className="font-semibold">{fmt(avgUnitPrice)}</span></span>
          <span><span className="text-muted-foreground">Customers:</span> <span className="font-semibold">{fmtNum(avgCustomers)}/mo</span></span>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">What if...</h3>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Forecast:</label>
            <select value={monthsAhead} onChange={(e) => setMonthsAhead(Number(e.target.value))} className="rounded-md border px-2 py-1 text-sm">
              <option value={1}>1 month ahead</option>
              <option value={3}>3 months ahead</option>
              <option value={6}>6 months ahead</option>
            </select>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Revenue levers */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Revenue & Orders</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SimSlider
                icon={<ShoppingCartIcon className="size-4 text-sky-500" />}
                label="Order Volume"
                sublabel="How many orders per month?"
                value={orderVolumePct}
                onChange={setOrderVolumePct}
                baseValue={avgOrders}
                isCurrency={false}
              />
              <SimSlider
                icon={<DollarSignIcon className="size-4 text-amber-500" />}
                label="Unit Price"
                sublabel="Average price per unit sold"
                value={unitPricePct}
                onChange={setUnitPricePct}
                baseValue={avgUnitPrice}
                perMonth={false}
              />
              <SimSlider
                icon={<UsersIcon className="size-4 text-pink-500" />}
                label="Customers"
                sublabel="Active dispensaries ordering"
                value={customerGrowthPct}
                onChange={setCustomerGrowthPct}
                baseValue={avgCustomers}
                isCurrency={false}
              />
              <SimSlider
                icon={<PercentIcon className="size-4 text-violet-500" />}
                label="Discounts Given"
                sublabel="More discounts = less revenue kept"
                value={discountChangePct}
                onChange={setDiscountChangePct}
                min={-20}
                max={30}
                baseValue={avgRevenue}
                perMonth={false}
              />
            </div>
          </div>

          {/* Expense levers */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Expenses</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categories.map((cat) => (
                <SimSlider
                  key={cat.id}
                  icon={<div className="size-3.5 rounded-full" style={{ backgroundColor: cat.color || "#94a3b8" }} />}
                  label={cat.name}
                  sublabel={`Currently ${fmt(catAvgExpense[String(cat.id)] || 0)}/mo`}
                  value={expenseAdj[String(cat.id)] || 0}
                  onChange={(v) => setExpenseAdj((prev) => ({ ...prev, [String(cat.id)]: v }))}
                  baseValue={catAvgExpense[String(cat.id)] || 0}
                />
              ))}
              {/* New monthly cost — flat dollar input */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <PlusCircleIcon className="size-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Add New Monthly Cost</p>
                    <p className="text-[10px] text-muted-foreground">New hire, rent, equipment lease, subscription...</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={newExpenseMonthly || ""}
                    onChange={(e) => setNewExpenseMonthly(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border px-3 py-2.5 pl-7 text-lg font-semibold tabular-nums"
                    placeholder="0"
                  />
                </div>
                {newExpenseMonthly > 0 && (
                  <p className="text-xs text-red-500 font-medium">+{fmt(newExpenseMonthly)}/mo added to expenses</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button onClick={handleSimulate} disabled={isLoading || !hasChanges} size="lg">
              <PlayIcon className="mr-1.5 size-4" />
              {isLoading ? "Running..." : "Run Simulation"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcwIcon className="mr-1.5 size-4" />Reset All
            </Button>
            {hasChanges && !hasRun && (
              <span className="text-xs text-muted-foreground ml-2">Hit run to see results below</span>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {hasRun && result && (
        <>
          {/* Impact summary — plain English */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Impact Summary ({monthsAhead} month{monthsAhead > 1 ? "s" : ""})</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <ImpactCard label="Revenue" base={totalBaseRev} adjusted={totalAdjRev} />
              <ImpactCard label="Expenses" base={totalBaseExp} adjusted={totalAdjExp} invert />
              <ImpactCard label="Net Income" base={totalBaseNet} adjusted={totalAdjNet} />
              <ImpactCard label="Orders/mo" base={result.base[0]?.orders || 0} adjusted={result.adjusted[0]?.orders || 0} isCurrency={false} />
              <ImpactCard label="Unit Price" base={result.base[0]?.avg_unit_price || 0} adjusted={result.adjusted[0]?.avg_unit_price || 0} />
              <ImpactCard label="Customers/mo" base={result.base[0]?.customers || 0} adjusted={result.adjusted[0]?.customers || 0} isCurrency={false} />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Revenue & Net Income</h3>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                  <Bar dataKey="Current Revenue" fill="#d1d5db" />
                  <Bar dataKey="Simulated Revenue" fill="#16a34a" />
                  <Bar dataKey="Current Net" fill="#e5e7eb" />
                  <Bar dataKey="Simulated Net" fill="#4f46e5" />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <h3 className="text-sm font-semibold mb-4">Orders & Avg Order Value</h3>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={orderCompData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="orders" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="aov" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number, name: string) => name.includes("AOV") ? fmt(value) : value} />
                  <Legend />
                  <Line yAxisId="orders" type="monotone" dataKey="Current Orders" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" />
                  <Line yAxisId="orders" type="monotone" dataKey="Simulated Orders" stroke="#4f46e5" strokeWidth={2} />
                  <Line yAxisId="aov" type="monotone" dataKey="Current AOV" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" />
                  <Line yAxisId="aov" type="monotone" dataKey="Simulated AOV" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </div>
          </div>

          {/* Month-by-month table */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Month-by-Month Breakdown</h3>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2.5 text-left font-medium">Month</th>
                    <th className="px-3 py-2.5 text-right font-medium" colSpan={2}>Revenue</th>
                    <th className="px-3 py-2.5 text-right font-medium" colSpan={2}>Expenses</th>
                    <th className="px-3 py-2.5 text-right font-medium" colSpan={2}>Net Income</th>
                    <th className="px-3 py-2.5 text-right font-medium" colSpan={2}>Orders</th>
                    <th className="px-3 py-2.5 text-right font-medium" colSpan={2}>Unit Price</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-1"></th>
                    <th className="px-3 py-1 text-right text-[10px] text-muted-foreground font-normal">Now</th>
                    <th className="px-3 py-1 text-right text-[10px] text-indigo-600 font-normal">Simulated</th>
                    <th className="px-3 py-1 text-right text-[10px] text-muted-foreground font-normal">Now</th>
                    <th className="px-3 py-1 text-right text-[10px] text-indigo-600 font-normal">Simulated</th>
                    <th className="px-3 py-1 text-right text-[10px] text-muted-foreground font-normal">Now</th>
                    <th className="px-3 py-1 text-right text-[10px] text-indigo-600 font-normal">Simulated</th>
                    <th className="px-3 py-1 text-right text-[10px] text-muted-foreground font-normal">Now</th>
                    <th className="px-3 py-1 text-right text-[10px] text-indigo-600 font-normal">Simulated</th>
                    <th className="px-3 py-1 text-right text-[10px] text-muted-foreground font-normal">Now</th>
                    <th className="px-3 py-1 text-right text-[10px] text-indigo-600 font-normal">Simulated</th>
                  </tr>
                </thead>
                <tbody>
                  {result.adjusted.map((adj, i) => {
                    const base = result.base[i];
                    return (
                      <tr key={adj.month} className="border-b last:border-0">
                        <td className="px-3 py-2.5 font-medium">{adj.month}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">{fmt(base?.revenue || 0)}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-green-600">{fmt(adj.revenue)}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">{fmt(base?.expenses || 0)}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-red-500">{fmt(adj.expenses)}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">{fmt(base?.net || 0)}</td>
                        <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${adj.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(adj.net)}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">{base?.orders || 0}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums">{adj.orders}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">{fmt(base?.avg_unit_price || 0)}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums">{fmt(adj.avg_unit_price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!hasRun && (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            Drag the sliders above and hit <span className="font-medium text-foreground">Run Simulation</span> to see results.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground/70">
            <span>&quot;What if I get 20% more orders?&quot;</span>
            <span>&quot;What if I raise prices by $5?&quot;</span>
            <span>&quot;What if I hire someone for $3k/mo?&quot;</span>
          </div>
        </div>
      )}

      {/* AI Advisor */}
      <AdvisorPanel baseData={baseData} result={result} sliders={{
        orderVolumePct, unitPricePct, customerGrowthPct, discountChangePct,
        newExpenseMonthly, expenseAdj, categories,
      }} />
    </div>
  );
}

// ── AI Advisor ──

const STORAGE_KEY = "spf_advisor_log";

interface SavedMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

function loadSavedMessages(): SavedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(msgs: SavedMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
}

function buildAdvisorContext(
  baseData: BusinessAnalyticsData | null,
  result: SimulationResult | null,
  sliders: { orderVolumePct: number; unitPricePct: number; customerGrowthPct: number; discountChangePct: number; newExpenseMonthly: number },
) {
  const lines: string[] = [];
  if (baseData?.summary) {
    const s = baseData.summary;
    lines.push("## Current Performance (recent period)");
    lines.push(`- Revenue: $${s.total_revenue.toLocaleString()}`);
    lines.push(`- Expenses: $${s.total_expenses.toLocaleString()}`);
    lines.push(`- Net Income: $${s.net_income.toLocaleString()}`);
    lines.push(`- Profit Margin: ${s.profit_margin}%`);
    lines.push(`- Orders: ${s.order_count}`);
    lines.push(`- Avg Order Value: $${s.avg_order_value.toFixed(2)}`);
    lines.push(`- Avg Unit Price: $${s.avg_unit_price.toFixed(2)}`);
    lines.push(`- Total Units Sold: ${s.total_units_sold}`);
    lines.push(`- Unique Customers: ${s.unique_customers}`);
  }
  if (baseData?.monthly && baseData.monthly.length > 0) {
    lines.push("\n## Monthly Trend");
    baseData.monthly.forEach((m) => {
      lines.push(`- ${m.month}: Revenue $${m.revenue.toLocaleString()}, ${m.orders} orders, AOV $${m.avg_order_value.toFixed(0)}, Unit Price $${m.avg_unit_price.toFixed(2)}, Expenses $${m.expenses.toLocaleString()}, ${m.customers} customers`);
    });
  }
  if (baseData?.top_products && baseData.top_products.length > 0) {
    lines.push("\n## Top Products");
    baseData.top_products.slice(0, 5).forEach((p) => {
      lines.push(`- ${p.name}: ${p.total_quantity} units, $${p.total_revenue.toLocaleString()} revenue, avg $${p.avg_price.toFixed(2)}`);
    });
  }
  if (baseData?.top_customers && baseData.top_customers.length > 0) {
    lines.push("\n## Top Customers");
    baseData.top_customers.slice(0, 5).forEach((c) => {
      lines.push(`- ${c.name}: ${c.order_count} orders, $${c.total_spent.toLocaleString()} total`);
    });
  }
  if (baseData?.expense_category_totals && baseData.expense_category_totals.length > 0) {
    lines.push("\n## Expense Breakdown");
    baseData.expense_category_totals.forEach((c) => {
      lines.push(`- ${c.name}: $${c.total.toLocaleString()}`);
    });
  }
  if (result) {
    lines.push("\n## Current Simulation Settings");
    if (sliders.orderVolumePct) lines.push(`- Order Volume: ${sliders.orderVolumePct > 0 ? "+" : ""}${sliders.orderVolumePct}%`);
    if (sliders.unitPricePct) lines.push(`- Unit Price: ${sliders.unitPricePct > 0 ? "+" : ""}${sliders.unitPricePct}%`);
    if (sliders.customerGrowthPct) lines.push(`- Customer Growth: ${sliders.customerGrowthPct > 0 ? "+" : ""}${sliders.customerGrowthPct}%`);
    if (sliders.discountChangePct) lines.push(`- Discount Change: ${sliders.discountChangePct > 0 ? "+" : ""}${sliders.discountChangePct}%`);
    if (sliders.newExpenseMonthly) lines.push(`- New Monthly Cost: $${sliders.newExpenseMonthly.toLocaleString()}`);
    lines.push("\n## Simulation Results (per month)");
    result.adjusted.forEach((a, i) => {
      const b = result.base[i];
      lines.push(`- ${a.month}: Rev $${a.revenue.toLocaleString()} (was $${b?.revenue.toLocaleString()}), Exp $${a.expenses.toLocaleString()}, Net $${a.net.toLocaleString()}, ${a.orders} orders, UP $${a.avg_unit_price.toFixed(2)}`);
    });
  }
  if (baseData?.forecast && baseData.forecast.length > 0) {
    lines.push("\n## Base Forecast (no changes)");
    baseData.forecast.forEach((f) => {
      lines.push(`- ${f.month}: Rev $${f.revenue.toLocaleString()}, Exp $${f.expenses.toLocaleString()}, ${f.orders} orders`);
    });
  }
  return lines.join("\n");
}

function AdvisorPanel({ baseData, result, sliders }: {
  baseData: BusinessAnalyticsData | null;
  result: SimulationResult | null;
  sliders: {
    orderVolumePct: number; unitPricePct: number; customerGrowthPct: number;
    discountChangePct: number; newExpenseMonthly: number;
    expenseAdj: Record<string, number>; categories: ExpenseCategory[];
  };
}) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [savedLog, setSavedLog] = useState<SavedMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  // Load saved messages on mount
  useEffect(() => {
    setSavedLog(loadSavedMessages());
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [savedLog, streamingText]);

  const handleSend = async (text: string) => {
    if (!text.trim() || streaming) return;
    setInput("");
    setStreaming(true);
    setStreamingText("");

    const userMsg: SavedMessage = { id: crypto.randomUUID(), role: "user", text: text.trim(), timestamp: new Date().toISOString() };
    const updatedWithUser = [...savedLog, userMsg];
    setSavedLog(updatedWithUser);
    saveMessages(updatedWithUser);

    try {
      // Build messages array for the API (include recent conversation for context)
      const recentMsgs = updatedWithUser.slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      }));

      const context = buildAdvisorContext(baseData, result, sliders);

      const res = await fetch("/api/chat/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: recentMsgs, context }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      const assistantMsg: SavedMessage = { id: crypto.randomUUID(), role: "assistant", text: fullText, timestamp: new Date().toISOString() };
      const final = [...updatedWithUser, assistantMsg];
      setSavedLog(final);
      saveMessages(final);
    } catch {
      const errMsg: SavedMessage = { id: crypto.randomUUID(), role: "assistant", text: "Sorry, something went wrong. Try again.", timestamp: new Date().toISOString() };
      const final = [...updatedWithUser, errMsg];
      setSavedLog(final);
      saveMessages(final);
    }
    setStreaming(false);
    setStreamingText("");
  };

  const handleClearLog = () => {
    if (!confirm("Clear conversation history?")) return;
    setSavedLog([]);
    saveMessages([]);
  };

  const quickPrompts = [
    "What should I focus on to increase profit?",
    "Are my prices competitive for the NY cannabis market?",
    "What happens if I add 2 new dispensary accounts?",
    "How can I reduce expenses without hurting growth?",
    "What's a realistic revenue target for next quarter?",
  ];

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-amber-500" />
          <div className="text-left">
            <p className="text-sm font-semibold">AI Business Advisor</p>
            <p className="text-[10px] text-muted-foreground">
              Ask for recommendations based on your actual data
              {savedLog.length > 0 && ` (${savedLog.length} messages saved)`}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "collapse" : "expand"}</span>
      </button>

      {open && (
        <div className="border-t">
          {/* Messages */}
          <div ref={scrollRef} className="overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: 500, minHeight: 200 }}>
            {savedLog.length === 0 && !streaming && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  I have access to your orders, revenue, expenses, products, and customers. Ask me anything — the conversation is saved.
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {savedLog.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {streaming && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-muted text-foreground">
                  {streamingText}
                </div>
              </div>
            )}
            {streaming && !streamingText && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input + clear */}
          <div className="border-t px-4 py-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pricing, growth strategy, cost optimization..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                disabled={streaming}
              />
              <button type="submit" disabled={!input.trim() || streaming} className="rounded-full bg-primary p-1.5 text-primary-foreground hover:opacity-80 disabled:opacity-40">
                <SendIcon className="size-3.5" />
              </button>
            </form>
            {savedLog.length > 0 && (
              <div className="flex justify-end mt-2">
                <button type="button" onClick={handleClearLog} className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">
                  Clear conversation history
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Impact card ──

function ImpactCard({ label, base, adjusted, invert = false, isCurrency = true }: {
  label: string; base: number; adjusted: number; invert?: boolean; isCurrency?: boolean;
}) {
  const diff = adjusted - base;
  const pct = base !== 0 ? ((diff / base) * 100).toFixed(1) : "0";
  const isPositive = invert ? diff < 0 : diff > 0;
  const isNegative = invert ? diff > 0 : diff < 0;

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-muted-foreground line-through text-xs tabular-nums">{isCurrency ? fmt(base) : fmtNum(base)}</span>
        <span className="font-semibold tabular-nums">{isCurrency ? fmt(adjusted) : fmtNum(adjusted)}</span>
      </div>
      {diff !== 0 && (
        <div className={`flex items-center gap-1 mt-0.5 ${isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-muted-foreground"}`}>
          {isPositive ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
          <span className="text-[10px] font-medium">
            {diff > 0 ? "+" : ""}{isCurrency ? fmt(diff) : fmtNum(diff)} ({pct}%)
          </span>
        </div>
      )}
    </div>
  );
}
