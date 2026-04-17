"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type Expense,
  type ExpenseCategory,
  type ExpensesListResponse,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  ReceiptIcon,
  Settings2Icon,
  TrashIcon,
  PencilIcon,
  BarChart3Icon,
  FlaskConicalIcon,
} from "lucide-react";
import { toast } from "sonner";

function formatPrice(amount: number | string | null) {
  if (!amount) return "$0.00";
  return `$${Number(amount).toFixed(2)}`;
}

const PAYMENT_METHODS = ["cash", "check", "transfer", "card"];

export default function ExpensesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 25, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    expense_category_id: 0,
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    vendor: "",
    payment_method: "",
    notes: "",
    recurring: false,
    recurring_frequency: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Category management dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#4f46e5");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await apiClient.getExpenseCategories(true);
      setCategories(cats);
    } catch {}
  }, []);

  const loadExpenses = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.getExpenses({
        page,
        per_page: 25,
        category_id: filterCategory ? Number(filterCategory) : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      });
      setExpenses(res.data.map((d) => ({ ...d.attributes, id: Number(d.id) })));
      setMeta(res.meta);
    } catch {}
    setIsLoading(false);
  }, [filterCategory, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadCategories();
    loadExpenses();
  }, [isAuthenticated, loadCategories, loadExpenses]);

  const activeCategories = categories.filter((c) => c.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expense_category_id || !formData.description || !formData.amount) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient.updateExpense(editingId, {
          ...formData,
          amount: Number(formData.amount),
          recurring_frequency: formData.recurring ? formData.recurring_frequency : "",
        });
        toast.success("Expense updated");
      } else {
        await apiClient.createExpense({
          ...formData,
          amount: Number(formData.amount),
          recurring_frequency: formData.recurring ? formData.recurring_frequency : "",
        });
        toast.success("Expense added");
      }
      resetForm();
      loadExpenses(meta.page);
    } catch {
      toast.error("Failed to save expense");
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      expense_category_id: 0,
      description: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      vendor: "",
      payment_method: "",
      notes: "",
      recurring: false,
      recurring_frequency: "",
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (exp: Expense) => {
    setFormData({
      expense_category_id: exp.category.id,
      description: exp.description,
      amount: String(exp.amount),
      expense_date: exp.expense_date,
      vendor: exp.vendor || "",
      payment_method: exp.payment_method || "",
      notes: exp.notes || "",
      recurring: exp.recurring,
      recurring_frequency: exp.recurring_frequency || "",
    });
    setEditingId(exp.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await apiClient.deleteExpense(id);
      toast.success("Expense deleted");
      loadExpenses(meta.page);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await apiClient.createExpenseCategory({
        name: newCatName.trim(),
        color: newCatColor,
        position: categories.length,
      });
      setNewCatName("");
      setNewCatColor("#4f46e5");
      loadCategories();
      toast.success("Category added");
    } catch {
      toast.error("Failed to add category");
    }
  };

  const handleToggleCategory = async (cat: ExpenseCategory) => {
    try {
      await apiClient.updateExpenseCategory(cat.id, { active: !cat.active });
      loadCategories();
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (cat: ExpenseCategory) => {
    try {
      await apiClient.deleteExpenseCategory(cat.id);
      loadCategories();
      toast.success("Category removed");
    } catch {
      toast.error("Cannot delete category with expenses. Deactivate instead.");
    }
  };

  if (authLoading || !isAuthenticated) return null;

  // Summary for current month
  const now = new Date();
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = currentMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-8 px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Expenses</h2>
          <p className="text-sm text-muted-foreground">Track and manage your expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/expenses/analytics">
            <Button variant="outline" size="sm">
              <BarChart3Icon className="mr-1.5 size-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/admin/expenses/simulate">
            <Button variant="outline" size="sm">
              <FlaskConicalIcon className="mr-1.5 size-4" />
              Simulate
            </Button>
          </Link>
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2Icon className="mr-1.5 size-4" />
                Categories
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Expense Categories</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border"
                  />
                  <Button size="sm" onClick={handleAddCategory}>Add</Button>
                </div>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${!cat.active ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="size-4 rounded-full"
                          style={{ backgroundColor: cat.color || "#94a3b8" }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                        {cat.expenses_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {cat.expenses_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCategory(cat)}
                        >
                          {cat.active ? "Deactivate" : "Activate"}
                        </Button>
                        {cat.expenses_count === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}>
            <PlusIcon className="mr-1.5 size-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <ReceiptIcon className="size-5" />
            <span className="text-xs font-medium uppercase tracking-wide">This Month</span>
          </div>
          <p className="text-2xl font-semibold">{formatPrice(totalThisMonth)}</p>
        </div>
        {activeCategories.slice(0, 4).map((cat) => {
          const catTotal = currentMonthExpenses
            .filter((e) => e.category.id === cat.id)
            .reduce((s, e) => s + Number(e.amount), 0);
          return (
            <div key={cat.id} className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: cat.color || "#94a3b8" }} />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cat.name}</span>
              </div>
              <p className="text-2xl font-semibold">{formatPrice(catTotal)}</p>
            </div>
          );
        })}
      </div>

      {/* Add / Edit form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold">{editingId ? "Edit Expense" : "New Expense"}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category *</label>
              <select
                value={formData.expense_category_id}
                onChange={(e) => setFormData({ ...formData, expense_category_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value={0}>Select category</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="What was purchased"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date *</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Who was paid"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                />
                Recurring
              </label>
              {formData.recurring && (
                <select
                  value={formData.recurring_frequency}
                  onChange={(e) => setFormData({ ...formData, recurring_frequency: e.target.value })}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Add Expense"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {activeCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="To"
        />
        {(filterCategory || filterStartDate || filterEndDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterCategory(""); setFilterStartDate(""); setFilterEndDate(""); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Expenses table */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : expenses.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <ReceiptIcon className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No expenses yet. Add your first one above.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Vendor</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Method</th>
                  <th className="px-4 py-3 text-left font-medium">By</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: exp.category.color || "#94a3b8" }}
                        />
                        <span>{exp.category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {exp.description}
                      {exp.recurring && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          {exp.recurring_frequency || "recurring"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{exp.vendor || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(exp.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{exp.payment_method || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{exp.user.full_name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)}>
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(exp.id)}>
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.total_pages} ({meta.total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => loadExpenses(meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.total_pages}
                  onClick={() => loadExpenses(meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
