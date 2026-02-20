"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import {
  apiClient,
  type PaymentTerm,
  type DiscountRecord,
  type DiscountType,
  type AppSettings,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tax rate editing
  const [editingTax, setEditingTax] = useState(false);
  const [taxValue, setTaxValue] = useState("");
  const [savingTax, setSavingTax] = useState(false);

  // Bank info editing
  const [editingBank, setEditingBank] = useState(false);
  const [bankValue, setBankValue] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  // Payment term dialog
  const [ptDialogOpen, setPtDialogOpen] = useState(false);
  const [ptEditing, setPtEditing] = useState<PaymentTerm | null>(null);
  const [ptForm, setPtForm] = useState({
    name: "",
    days: 0,
    discount_percentage: 0,
    active: true,
    position: 0,
  });
  const [ptSaving, setPtSaving] = useState(false);
  const [ptDeleting, setPtDeleting] = useState<PaymentTerm | null>(null);

  // Discount dialog
  const [discDialogOpen, setDiscDialogOpen] = useState(false);
  const [discEditing, setDiscEditing] = useState<DiscountRecord | null>(null);
  const [discForm, setDiscForm] = useState({
    name: "",
    discount_type: "percentage" as DiscountType,
    value: 0,
    active: false,
  });
  const [discSaving, setDiscSaving] = useState(false);
  const [discDeleting, setDiscDeleting] = useState<DiscountRecord | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [s, pt, d] = await Promise.all([
          apiClient.getSettings(),
          apiClient.getPaymentTerms(),
          apiClient.getDiscounts(),
        ]);
        setSettings(s);
        setPaymentTerms(pt);
        setDiscounts(d);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated]);

  // --- Tax Rate ---

  const startEditTax = () => {
    setTaxValue(settings?.tax_rate || "8.875");
    setEditingTax(true);
  };

  const saveTax = async () => {
    setSavingTax(true);
    try {
      const updated = await apiClient.updateSettings({ tax_rate: taxValue });
      setSettings(updated);
      setEditingTax(false);
      toast.success("Tax rate updated");
    } catch {
      toast.error("Failed to update tax rate");
    } finally {
      setSavingTax(false);
    }
  };

  // --- Bank Info ---

  const startEditBank = () => {
    setBankValue(settings?.bank_info || "");
    setEditingBank(true);
  };

  const saveBank = async () => {
    setSavingBank(true);
    try {
      const updated = await apiClient.updateSettings({ bank_info: bankValue });
      setSettings(updated);
      setEditingBank(false);
      toast.success("Bank information updated");
    } catch {
      toast.error("Failed to update bank information");
    } finally {
      setSavingBank(false);
    }
  };

  // --- Payment Terms ---

  const openPtDialog = (pt?: PaymentTerm) => {
    if (pt) {
      setPtEditing(pt);
      setPtForm({
        name: pt.name,
        days: pt.days,
        discount_percentage: parseFloat(pt.discount_percentage),
        active: pt.active,
        position: pt.position,
      });
    } else {
      setPtEditing(null);
      setPtForm({
        name: "",
        days: 0,
        discount_percentage: 0,
        active: true,
        position: paymentTerms.length,
      });
    }
    setPtDialogOpen(true);
  };

  const savePt = async (e: React.FormEvent) => {
    e.preventDefault();
    setPtSaving(true);
    try {
      if (ptEditing) {
        const updated = await apiClient.updatePaymentTerm(ptEditing.id, ptForm);
        setPaymentTerms((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        toast.success("Payment term updated");
      } else {
        const created = await apiClient.createPaymentTerm(ptForm);
        setPaymentTerms((prev) => [...prev, created]);
        toast.success("Payment term created");
      }
      setPtDialogOpen(false);
    } catch {
      toast.error("Failed to save payment term");
    } finally {
      setPtSaving(false);
    }
  };

  const deletePt = async () => {
    if (!ptDeleting) return;
    try {
      await apiClient.deletePaymentTerm(ptDeleting.id);
      setPaymentTerms((prev) => prev.filter((p) => p.id !== ptDeleting.id));
      toast.success("Payment term deleted");
    } catch {
      toast.error("Failed to delete payment term");
    } finally {
      setPtDeleting(null);
    }
  };

  // --- Discounts ---

  const openDiscDialog = (d?: DiscountRecord) => {
    if (d) {
      setDiscEditing(d);
      setDiscForm({
        name: d.name,
        discount_type: d.discount_type,
        value: parseFloat(d.value),
        active: d.active,
      });
    } else {
      setDiscEditing(null);
      setDiscForm({
        name: "",
        discount_type: "percentage",
        value: 0,
        active: false,
      });
    }
    setDiscDialogOpen(true);
  };

  const saveDisc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscSaving(true);
    try {
      if (discEditing) {
        const updated = await apiClient.updateDiscount(discEditing.id, discForm);
        setDiscounts((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
        toast.success("Discount updated");
      } else {
        const created = await apiClient.createDiscount(discForm);
        setDiscounts((prev) => [...prev, created]);
        toast.success("Discount created");
      }
      setDiscDialogOpen(false);
    } catch {
      toast.error("Failed to save discount");
    } finally {
      setDiscSaving(false);
    }
  };

  const deleteDisc = async () => {
    if (!discDeleting) return;
    try {
      await apiClient.deleteDiscount(discDeleting.id);
      setDiscounts((prev) => prev.filter((d) => d.id !== discDeleting.id));
      toast.success("Discount deleted");
    } catch {
      toast.error("Failed to delete discount");
    } finally {
      setDiscDeleting(null);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="px-10">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage tax rate, payment terms, and discounts
        </p>
      </div>

      {/* Tax Rate */}
      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Tax Rate</h3>
            <p className="text-sm text-muted-foreground">
              Applied to all orders after discounts
            </p>
          </div>
          {!editingTax && (
            <Button variant="outline" size="sm" onClick={startEditTax}>
              <PencilIcon className="mr-1.5 size-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editingTax ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.001"
              min="0"
              max="100"
              value={taxValue}
              onChange={(e) => setTaxValue(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="sm" onClick={saveTax} disabled={savingTax}>
              <CheckIcon className="mr-1 size-3.5" />
              {savingTax ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTax(false)}
            >
              <XIcon className="mr-1 size-3.5" />
              Cancel
            </Button>
          </div>
        ) : (
          <p className="text-2xl font-bold">{settings?.tax_rate || "0"}%</p>
        )}
      </div>

      {/* Bank Information */}
      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Bank Information</h3>
            <p className="text-sm text-muted-foreground">
              Shown on order confirmation emails and storefront
            </p>
          </div>
          {!editingBank && (
            <Button variant="outline" size="sm" onClick={startEditBank}>
              <PencilIcon className="mr-1.5 size-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editingBank ? (
          <div className="space-y-3">
            <Textarea
              value={bankValue}
              onChange={(e) => setBankValue(e.target.value)}
              placeholder={"Bank Name\nRouting Number: XXXXXXXXX\nAccount Number: XXXXXXXXX"}
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={saveBank} disabled={savingBank}>
                <CheckIcon className="mr-1 size-3.5" />
                {savingBank ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingBank(false)}
              >
                <XIcon className="mr-1 size-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : settings?.bank_info ? (
          <p className="text-sm whitespace-pre-wrap">{settings.bank_info}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No bank information set</p>
        )}
      </div>

      {/* Payment Terms */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">Payment Terms</h3>
            <p className="text-sm text-muted-foreground">
              Discount tiers based on payment schedule
            </p>
          </div>
          <Button size="sm" onClick={() => openPtDialog()}>
            <PlusIcon className="mr-1.5 size-3.5" />
            Add Term
          </Button>
        </div>

        {paymentTerms.length === 0 ? (
          <div className="p-5 pt-2 text-sm text-muted-foreground">
            No payment terms yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b bg-muted/50">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">Days</th>
                <th className="px-5 py-2.5 text-left font-medium">Discount</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentTerms.map((pt) => (
                <tr
                  key={pt.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-2.5 font-medium">{pt.name}</td>
                  <td className="px-5 py-2.5">
                    {pt.days === 0 ? "Immediate" : `${pt.days} days`}
                  </td>
                  <td className="px-5 py-2.5">
                    {parseFloat(pt.discount_percentage) > 0 ? (
                      <span className="text-green-600">
                        {pt.discount_percentage}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge variant={pt.active ? "default" : "secondary"}>
                      {pt.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openPtDialog(pt)}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setPtDeleting(pt)}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Discounts */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">Discounts</h3>
            <p className="text-sm text-muted-foreground">
              General cart-wide discounts applied to all orders
            </p>
          </div>
          <Button size="sm" onClick={() => openDiscDialog()}>
            <PlusIcon className="mr-1.5 size-3.5" />
            Add Discount
          </Button>
        </div>

        {discounts.length === 0 ? (
          <div className="p-5 pt-2 text-sm text-muted-foreground">
            No discounts yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b bg-muted/50">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">Type</th>
                <th className="px-5 py-2.5 text-left font-medium">Value</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr
                  key={d.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-2.5 font-medium">{d.name}</td>
                  <td className="px-5 py-2.5 capitalize">{d.discount_type}</td>
                  <td className="px-5 py-2.5">
                    {d.discount_type === "percentage"
                      ? `${d.value}%`
                      : `$${parseFloat(d.value).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge variant={d.active ? "default" : "secondary"}>
                      {d.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openDiscDialog(d)}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDiscDeleting(d)}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Term Dialog */}
      <Dialog
        open={ptDialogOpen}
        onOpenChange={(open) => {
          if (!open) setPtDialogOpen(false);
        }}
      >
        <DialogContent>
          <form onSubmit={savePt}>
            <DialogHeader>
              <DialogTitle>
                {ptEditing ? "Edit Payment Term" : "New Payment Term"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Field>
                <FieldLabel htmlFor="pt-name">Name</FieldLabel>
                <Input
                  id="pt-name"
                  value={ptForm.name}
                  onChange={(e) =>
                    setPtForm({ ...ptForm, name: e.target.value })
                  }
                  placeholder="e.g. Net 15"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="pt-days">Days</FieldLabel>
                  <Input
                    id="pt-days"
                    type="number"
                    min="0"
                    value={ptForm.days}
                    onChange={(e) =>
                      setPtForm({ ...ptForm, days: Number(e.target.value) })
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pt-discount">Discount %</FieldLabel>
                  <Input
                    id="pt-discount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ptForm.discount_percentage}
                    onChange={(e) =>
                      setPtForm({
                        ...ptForm,
                        discount_percentage: Number(e.target.value),
                      })
                    }
                    required
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="pt-position">Position</FieldLabel>
                  <Input
                    id="pt-position"
                    type="number"
                    min="0"
                    value={ptForm.position}
                    onChange={(e) =>
                      setPtForm({ ...ptForm, position: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pt-active">Status</FieldLabel>
                  <Select
                    value={ptForm.active ? "true" : "false"}
                    onValueChange={(v) =>
                      setPtForm({ ...ptForm, active: v === "true" })
                    }
                  >
                    <SelectTrigger id="pt-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPtDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={ptSaving}>
                {ptSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Term Delete Confirmation */}
      <AlertDialog
        open={!!ptDeleting}
        onOpenChange={(open) => {
          if (!open) setPtDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Term</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{ptDeleting?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePt}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discount Dialog */}
      <Dialog
        open={discDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDiscDialogOpen(false);
        }}
      >
        <DialogContent>
          <form onSubmit={saveDisc}>
            <DialogHeader>
              <DialogTitle>
                {discEditing ? "Edit Discount" : "New Discount"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Field>
                <FieldLabel htmlFor="disc-name">Name</FieldLabel>
                <Input
                  id="disc-name"
                  value={discForm.name}
                  onChange={(e) =>
                    setDiscForm({ ...discForm, name: e.target.value })
                  }
                  placeholder="e.g. Welcome Discount"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="disc-type">Type</FieldLabel>
                  <Select
                    value={discForm.discount_type}
                    onValueChange={(v) =>
                      setDiscForm({
                        ...discForm,
                        discount_type: v as DiscountType,
                      })
                    }
                  >
                    <SelectTrigger id="disc-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="disc-value">
                    {discForm.discount_type === "percentage"
                      ? "Percentage"
                      : "Amount ($)"}
                  </FieldLabel>
                  <Input
                    id="disc-value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discForm.value}
                    onChange={(e) =>
                      setDiscForm({
                        ...discForm,
                        value: Number(e.target.value),
                      })
                    }
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="disc-active">Status</FieldLabel>
                <Select
                  value={discForm.active ? "true" : "false"}
                  onValueChange={(v) =>
                    setDiscForm({ ...discForm, active: v === "true" })
                  }
                >
                  <SelectTrigger id="disc-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDiscDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={discSaving}>
                {discSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discount Delete Confirmation */}
      <AlertDialog
        open={!!discDeleting}
        onOpenChange={(open) => {
          if (!open) setDiscDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{discDeleting?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDisc}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
