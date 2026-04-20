"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type Expense,
  type ExpenseCategory,
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
  UploadIcon,
  XIcon,
  FileTextIcon,
  CalendarClockIcon,
  CheckCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

function formatPrice(amount: number | string | null) {
  if (!amount) return "$0";
  const n = Number(amount);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

const PAYMENT_METHODS = ["cash", "check", "transfer", "card"];

export default function ExpensesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 25, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<"actual" | "planned">("actual");

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categoryId, setCategoryId] = useState(0);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("");
  const [planned, setPlanned] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Category management dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#4f46e5");
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("");

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
        status: viewMode,
        category_id: filterCategory ? Number(filterCategory) : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      });
      setExpenses(res.data.map((d) => ({ ...d.attributes, id: Number(d.id) })));
      setMeta(res.meta);
    } catch {}
    setIsLoading(false);
  }, [viewMode, filterCategory, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadCategories();
    loadExpenses();
  }, [isAuthenticated, loadCategories, loadExpenses]);

  const activeCategories = categories.filter((c) => c.active);

  const resetForm = () => {
    setCategoryId(0);
    setDescription("");
    setAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setVendor("");
    setPaymentMethod("");
    setNotes("");
    setRecurring(false);
    setRecurringFrequency("");
    setPlanned(viewMode === "planned");
    setReceiptFile(null);
    setReceiptPreview(null);
    setExistingReceiptUrl(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleFileSelect = (file: File) => {
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setExistingReceiptUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append("expense[expense_category_id]", String(categoryId));
    fd.append("expense[description]", description);
    fd.append("expense[amount]", amount);
    fd.append("expense[expense_date]", expenseDate);
    if (vendor) fd.append("expense[vendor]", vendor);
    if (paymentMethod) fd.append("expense[payment_method]", paymentMethod);
    if (notes) fd.append("expense[notes]", notes);
    fd.append("expense[recurring]", String(recurring));
    if (recurring && recurringFrequency) fd.append("expense[recurring_frequency]", recurringFrequency);
    fd.append("expense[planned]", String(planned));
    if (receiptFile) fd.append("expense[receipt]", receiptFile);
    return fd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !description || !amount) return;
    setSubmitting(true);
    try {
      const fd = buildFormData();
      if (editingId) {
        await apiClient.updateExpense(editingId, fd);
        toast.success("Expense updated");
      } else {
        await apiClient.createExpense(fd);
        toast.success("Expense added");
      }
      resetForm();
      loadExpenses(meta.page);
    } catch {
      toast.error("Failed to save expense");
    }
    setSubmitting(false);
  };

  const handleEdit = (exp: Expense) => {
    setCategoryId(exp.category.id);
    setDescription(exp.description);
    setAmount(String(exp.amount));
    setExpenseDate(exp.expense_date);
    setVendor(exp.vendor || "");
    setPaymentMethod(exp.payment_method || "");
    setNotes(exp.notes || "");
    setRecurring(exp.recurring);
    setRecurringFrequency(exp.recurring_frequency || "");
    setPlanned(exp.planned);
    setReceiptFile(null);
    setReceiptPreview(null);
    setExistingReceiptUrl(exp.receipt_url || null);
    setEditingId(exp.id);
    setShowForm(true);
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

  const handleMarkActual = async (exp: Expense) => {
    try {
      const fd = new FormData();
      fd.append("expense[planned]", "false");
      fd.append("expense[expense_date]", new Date().toISOString().split("T")[0]);
      await apiClient.updateExpense(exp.id, fd);
      toast.success("Marked as paid");
      loadExpenses(meta.page);
    } catch {
      toast.error("Failed to update");
    }
  };

  // Category management
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await apiClient.createExpenseCategory({ name: newCatName.trim(), color: newCatColor, position: categories.length });
      setNewCatName("");
      setNewCatColor("#4f46e5");
      loadCategories();
      toast.success("Category added");
    } catch { toast.error("Failed to add category"); }
  };

  const startEditCategory = (cat: ExpenseCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatColor(cat.color || "#94a3b8");
  };

  const handleSaveCategory = async () => {
    if (!editingCatId || !editCatName.trim()) return;
    try {
      await apiClient.updateExpenseCategory(editingCatId, { name: editCatName.trim(), color: editCatColor });
      setEditingCatId(null);
      loadCategories();
      toast.success("Category updated");
    } catch { toast.error("Failed to update category"); }
  };

  const handleDeleteCategory = async (cat: ExpenseCategory) => {
    const msg = cat.expenses_count > 0
      ? `"${cat.name}" has ${cat.expenses_count} expense${cat.expenses_count > 1 ? "s" : ""}. Deleting will remove the category but keep the expenses (they'll show as uncategorized). Continue?`
      : `Delete "${cat.name}"?`;
    if (!confirm(msg)) return;
    try {
      await apiClient.deleteExpenseCategory(cat.id);
      loadCategories();
      toast.success("Category deleted");
    } catch { toast.error("Failed to delete category"); }
  };

  if (authLoading || !isAuthenticated) return null;

  const now = new Date();
  const currentMonthExpenses = viewMode === "planned"
    ? expenses
    : expenses.filter((e) => {
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
            <Button variant="outline" size="sm"><BarChart3Icon className="mr-1.5 size-4" />Analytics</Button>
          </Link>
          <Link href="/admin/expenses/simulate">
            <Button variant="outline" size="sm"><FlaskConicalIcon className="mr-1.5 size-4" />Simulate</Button>
          </Link>
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Settings2Icon className="mr-1.5 size-4" />Categories</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Manage Expense Categories</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* Add new */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border" />
                  <Button size="sm" onClick={handleAddCategory} disabled={!newCatName.trim()}>Add</Button>
                </div>

                {/* Category list */}
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="rounded-lg border p-3">
                      {editingCatId === cat.id ? (
                        /* Edit mode */
                        <div className="flex items-center gap-2">
                          <input type="color" value={editCatColor} onChange={(e) => setEditCatColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border" />
                          <input
                            type="text"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
                            className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveCategory} disabled={!editCatName.trim()}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCatId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        /* View mode */
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-4 rounded-full" style={{ backgroundColor: cat.color || "#94a3b8" }} />
                            <span className="text-sm font-medium">{cat.name}</span>
                            {cat.expenses_count > 0 && <Badge variant="secondary" className="text-xs">{cat.expenses_count} expenses</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEditCategory(cat)}>
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteCategory(cat)}>
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            <PlusIcon className="mr-1.5 size-4" />Add Expense
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setViewMode("actual")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "actual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ReceiptIcon className="size-3.5" />
          Actual
        </button>
        <button
          onClick={() => setViewMode("planned")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "planned" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarClockIcon className="size-3.5" />
          Planned
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            {viewMode === "planned" ? <CalendarClockIcon className="size-5" /> : <ReceiptIcon className="size-5" />}
            <span className="text-xs font-medium uppercase tracking-wide">{viewMode === "planned" ? "Planned Total" : "This Month"}</span>
          </div>
          <p className="text-2xl font-semibold">{formatPrice(totalThisMonth)}</p>
        </div>
        {activeCategories.slice(0, 4).map((cat) => {
          const catTotal = currentMonthExpenses.filter((e) => e.category.id === cat.id).reduce((s, e) => s + Number(e.amount), 0);
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
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editingId ? "Edit Expense" : "New Expense"}</h3>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="text-muted-foreground"><XIcon className="size-4" /></Button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Left: main fields */}
            <div className="flex-1 p-6 space-y-5">
              {/* Row 1: Amount + Date side by side */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border px-3 py-3 pl-8 text-2xl font-semibold tabular-nums"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="w-44 shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-3 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Category pills */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {activeCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                        categoryId === c.id
                          ? "border-transparent text-white shadow-sm"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                      style={categoryId === c.id ? { backgroundColor: c.color || "#4f46e5" } : undefined}
                    >
                      <div
                        className={`size-2 rounded-full ${categoryId === c.id ? "bg-white/60" : ""}`}
                        style={categoryId !== c.id ? { backgroundColor: c.color || "#94a3b8" } : undefined}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Description (full width) */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  placeholder="e.g. Monthly rent, Fox Farm nutrients, Instagram ad"
                  required
                />
              </div>

              {/* Row 4: Vendor + Method */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vendor</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                    placeholder="Who was paid"
                  />
                </div>
                <div className="w-36 shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="">—</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Planned + Recurring (inline toggles) */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planned}
                    onChange={(e) => setPlanned(e.target.checked)}
                    className="size-4 rounded border accent-amber-500"
                  />
                  <CalendarClockIcon className="size-3.5 text-amber-500" />
                  Planned (future expense)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="size-4 rounded border"
                  />
                  Recurring
                </label>
                {recurring && (
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value)}
                    className="rounded-lg border px-2 py-1.5 text-xs"
                  >
                    <option value="">How often?</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>

              {/* Row 5: Notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none"
                  rows={2}
                  placeholder="Any extra details"
                />
              </div>
            </div>

            {/* Right: receipt upload + submit */}
            <div className="w-full lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l bg-muted/20 p-6 flex flex-col gap-5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Receipt / Document</label>
                {receiptFile || existingReceiptUrl ? (
                  <div className="relative rounded-lg border bg-background overflow-hidden">
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="Receipt" className="h-36 w-full object-cover" />
                    ) : existingReceiptUrl ? (
                      <a href={existingReceiptUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-36 px-3 hover:bg-muted/50 transition-colors">
                        <FileTextIcon className="size-10 text-muted-foreground" />
                        <span className="text-xs text-primary mt-2">View receipt</span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-36 px-3">
                        <FileTextIcon className="size-10 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2 truncate max-w-full">{receiptFile?.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="absolute top-2 right-2 size-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                      }}
                    />
                    <UploadIcon className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">Drop file or click</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">Images, PDFs, docs</p>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting || !categoryId || !description || !amount}>
                {submitting ? "Saving..." : editingId ? "Update Expense" : "Add Expense"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All categories</option>
          {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="From" />
        <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="To" />
        {(filterCategory || filterStartDate || filterEndDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterCategory(""); setFilterStartDate(""); setFilterEndDate(""); }}>Clear</Button>
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
                  <th className="px-4 py-3 text-center font-medium">Receipt</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className={`border-b last:border-0 hover:bg-muted/30 ${exp.planned ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: exp.category.color || "#94a3b8" }} />
                        <span>{exp.category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {exp.description}
                      {exp.recurring && <Badge variant="secondary" className="ml-2 text-[10px]">{exp.recurring_frequency || "recurring"}</Badge>}
                      {exp.planned && <Badge variant="outline" className="ml-2 text-[10px] border-amber-300 text-amber-600">planned</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{exp.vendor || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPrice(exp.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{exp.payment_method || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {exp.receipt_url ? (
                        <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <FileTextIcon className="size-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {exp.planned && (
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleMarkActual(exp)} title="Mark as paid">
                            <CheckCircleIcon className="size-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)}><PencilIcon className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(exp.id)}><TrashIcon className="size-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.total_pages} ({meta.total} total)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => loadExpenses(meta.page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={meta.page >= meta.total_pages} onClick={() => loadExpenses(meta.page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
