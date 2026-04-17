"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type ExpenseCategory,
  type ExpenseForecast,
  type ExpenseAnalyticsData,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ArrowLeftIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import {
  BarChart,
  Bar,
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

const chartConfig: ChartConfig = {
  current: { label: "Current Forecast", color: "#94a3b8" },
  adjusted: { label: "Adjusted", color: "#4f46e5" },
};

export default function SimulatePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [monthsAhead, setMonthsAhead] = useState(3);
  const [baseForecast, setBaseForecast] = useState<ExpenseForecast[] | null>(null);
  const [simResult, setSimResult] = useState<ExpenseForecast[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getExpenseCategories().then((cats) => {
      setCategories(cats);
      const initial: Record<string, number> = {};
      cats.forEach((c) => { initial[String(c.id)] = 0; });
      setAdjustments(initial);
    });
    // Load base forecast
    apiClient.getExpenseAnalytics(6).then((data) => {
      setBaseForecast(data.forecast);
    });
  }, [isAuthenticated]);

  const handleSliderChange = (catId: number, value: number) => {
    setAdjustments((prev) => ({ ...prev, [String(catId)]: value }));
  };

  const handleReset = () => {
    const reset: Record<string, number> = {};
    categories.forEach((c) => { reset[String(c.id)] = 0; });
    setAdjustments(reset);
    setSimResult(null);
    setHasRun(false);
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.simulateExpenses(adjustments, monthsAhead);
      setSimResult(result);
      setHasRun(true);
    } catch {}
    setIsLoading(false);
  };

  if (authLoading || !isAuthenticated) return null;

  // Comparison chart data
  const comparisonData = (simResult || []).map((sim, i) => {
    const base = baseForecast?.[i];
    return {
      month: sim.month,
      "Current Expenses": base?.predicted_expenses || 0,
      "Adjusted Expenses": sim.predicted_expenses,
      "Current Net": base?.predicted_net || 0,
      "Adjusted Net": sim.predicted_net,
    };
  });

  const hasAdjustments = Object.values(adjustments).some((v) => v !== 0);

  return (
    <div className="space-y-8 px-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/expenses">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-1.5 size-4" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">What If?</h2>
          <p className="text-sm text-muted-foreground">
            Adjust categories by percentage and see how it affects your bottom line
          </p>
        </div>
      </div>

      {/* Sliders */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Adjust Expense Categories</h3>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Months ahead:</label>
            <select
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value))}
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={6}>6</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {categories.map((cat) => {
            const value = adjustments[String(cat.id)] || 0;
            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: cat.color || "#94a3b8" }}
                    />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${value > 0 ? "text-red-500" : value < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                    {value > 0 ? "+" : ""}{value}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={100}
                  value={value}
                  onChange={(e) => handleSliderChange(cat.id, Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>-50%</span>
                  <span>0</span>
                  <span>+100%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSimulate} disabled={isLoading || !hasAdjustments} size="sm">
            <PlayIcon className="mr-1.5 size-4" />
            {isLoading ? "Running..." : "Run Simulation"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcwIcon className="mr-1.5 size-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Results */}
      {hasRun && simResult && baseForecast && (
        <>
          {/* Comparison chart */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Forecast Comparison</h3>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Legend />
                <Bar dataKey="Current Expenses" fill="#94a3b8" />
                <Bar dataKey="Adjusted Expenses" fill="#ef4444" />
                <Bar dataKey="Current Net" fill="#86efac" />
                <Bar dataKey="Adjusted Net" fill="#4f46e5" />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Comparison table */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold mb-4">Detailed Comparison</h3>
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Month</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium">Current Expenses</th>
                    <th className="px-4 py-3 text-right font-medium">Adjusted Expenses</th>
                    <th className="px-4 py-3 text-right font-medium">Difference</th>
                    <th className="px-4 py-3 text-right font-medium">Current Net</th>
                    <th className="px-4 py-3 text-right font-medium">Adjusted Net</th>
                  </tr>
                </thead>
                <tbody>
                  {simResult.map((sim, i) => {
                    const base = baseForecast[i];
                    const expDiff = sim.predicted_expenses - (base?.predicted_expenses || 0);
                    return (
                      <tr key={sim.month} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{sim.month}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatPrice(sim.predicted_revenue)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatPrice(base?.predicted_expenses || 0)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatPrice(sim.predicted_expenses)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${expDiff > 0 ? "text-red-500" : expDiff < 0 ? "text-green-600" : ""}`}>
                          {expDiff > 0 ? "+" : ""}{formatPrice(expDiff)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatPrice(base?.predicted_net || 0)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${sim.predicted_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPrice(sim.predicted_net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Per-category breakdown */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Per-Category Adjusted Amounts</h4>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Month</th>
                      {categories.map((cat) => (
                        <th key={cat.id} className="px-4 py-2 text-right font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="size-2 rounded-full" style={{ backgroundColor: cat.color || "#94a3b8" }} />
                            {cat.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {simResult.map((sim) => (
                      <tr key={sim.month} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{sim.month}</td>
                        {categories.map((cat) => (
                          <td key={cat.id} className="px-4 py-2 text-right text-muted-foreground">
                            {formatPrice(sim.by_category[cat.name] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!hasRun && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Adjust the sliders above and click &quot;Run Simulation&quot; to see how changes affect your forecasted expenses and net income.
          </p>
        </div>
      )}
    </div>
  );
}
