"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Company,
  type Product,
  type CompanyMember,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, XIcon } from "lucide-react";

interface ItemRow {
  product_id: string;
  weight: string;
  count: number;
}

export default function NewSamplePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [droppedAt, setDroppedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ product_id: "", weight: "3.5", count: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getCompanies().then(setCompanies).catch(() => {});
    apiClient
      .getProducts()
      .then((all) => all.filter((p) => p.status === "active"))
      .then(setProducts)
      .catch(() => {});
  }, [isAuthenticated]);

  const selectedCompany = companies.find((c) => String(c.id) === companyId);
  const members: CompanyMember[] = selectedCompany?.members ?? [];

  // Reset recipient when company changes
  function handleCompanyChange(value: string) {
    setCompanyId(value);
    setRecipientId("");
  }

  function updateItem(index: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: "", weight: "3.5", count: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyId) {
      setError("Please select a company.");
      return;
    }
    if (!recipientId) {
      setError("Please select a recipient.");
      return;
    }

    const validItems = items.filter((item) => item.product_id);
    if (validItems.length === 0) {
      setError("Add at least one product.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.createSample({
        company_id: Number(companyId),
        recipient_id: Number(recipientId),
        dropped_at: droppedAt,
        notes: notes || undefined,
        items: validItems.map((item) => ({
          product_id: Number(item.product_id),
          weight: parseFloat(item.weight),
          count: item.count,
        })),
      });
      router.push("/admin/samples");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create sample drop"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-2xl space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Log Sample Drop</h2>
        <p className="text-sm text-muted-foreground">
          Record products given to a dispensary
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {/* Company & Recipient */}
        <section className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Company *</FieldLabel>
              <Select value={companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Recipient *</FieldLabel>
              <Select
                value={recipientId}
                onValueChange={setRecipientId}
                disabled={!companyId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !companyId
                        ? "Select a company first"
                        : members.length === 0
                        ? "No members in this company"
                        : "Select recipient..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.full_name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="dropped_at">Date *</FieldLabel>
              <Input
                id="dropped_at"
                type="date"
                value={droppedAt}
                onChange={(e) => setDroppedAt(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this sample drop..."
                rows={2}
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>
        </section>

        {/* Products */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Products</h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  {index === 0 && (
                    <label className="text-sm font-medium mb-1.5 block">Product</label>
                  )}
                  <Select
                    value={item.product_id}
                    onValueChange={(v) => updateItem(index, "product_id", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  {index === 0 && (
                    <label className="text-sm font-medium mb-1.5 block">Weight</label>
                  )}
                  <Select
                    value={item.weight}
                    onValueChange={(v) => updateItem(index, "weight", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2g</SelectItem>
                      <SelectItem value="3.5">3.5g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  {index === 0 && (
                    <label className="text-sm font-medium mb-1.5 block">Count</label>
                  )}
                  <Input
                    type="number"
                    min={1}
                    value={item.count}
                    onChange={(e) =>
                      updateItem(index, "count", parseInt(e.target.value) || 1)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1 || isSubmitting}
                  className="shrink-0"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={isSubmitting}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Product
          </Button>
        </section>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Log Sample Drop"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/samples")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
