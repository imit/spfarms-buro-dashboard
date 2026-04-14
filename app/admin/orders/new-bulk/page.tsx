"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type Company,
  type Strain,
  type Location,
  COMPANY_TYPE_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  SendIcon,
  SearchIcon,
  ExternalLinkIcon,
  BuildingIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";

const GRAMS_PER_POUND = 453.592;

interface BulkLineItem {
  strain_id: number;
  strain_name: string;
  pounds: string;
  price_per_pound: string;
}

function poundsToGrams(lbs: number): string {
  const g = lbs * GRAMS_PER_POUND;
  return g % 1 === 0 ? g.toFixed(0) : g.toFixed(1);
}

function lineTotal(pounds: number, pricePerPound: number): number {
  return pounds * pricePerPound;
}

export default function NewBulkOrderPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [items, setItems] = useState<BulkLineItem[]>([]);
  const [shippingLocationId, setShippingLocationId] = useState("");
  const [billingLocationId, setBillingLocationId] = useState("");
  const [notesToVendor, setNotesToVendor] = useState("");
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [disableDiscount, setDisableDiscount] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [strainSearch, setStrainSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getCompanies({ per_page: 500 }).then((res) => setCompanies(res.data)).catch(() => {});
    apiClient.getStrains().then(setStrains).catch(() => {});
  }, [isAuthenticated]);

  const selectedCompany = companies.find((c) => String(c.id) === selectedCompanyId);
  const locations: Location[] = selectedCompany?.locations ?? [];

  const filteredCompanies = companies.filter(
    (c) => companySearch.length >= 1 && c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const activeStrains = strains.filter((s) => s.active);
  const filteredStrains = activeStrains.filter(
    (s) =>
      strainSearch &&
      s.name.toLowerCase().includes(strainSearch.toLowerCase()) &&
      !items.some((i) => i.strain_id === s.id)
  );

  function addStrain(strain: Strain) {
    setItems((prev) => [
      ...prev,
      { strain_id: strain.id, strain_name: strain.name, pounds: "1", price_per_pound: "950" },
    ]);
    setStrainSearch("");
  }

  function updateItem(index: number, field: "pounds" | "price_per_pound", value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function setGrams(index: number, gramsStr: string) {
    const grams = parseFloat(gramsStr) || 0;
    const lbs = grams / GRAMS_PER_POUND;
    updateItem(index, "pounds", lbs % 1 === 0 ? lbs.toFixed(0) : lbs.toFixed(4));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const orderTotal = items.reduce((sum, item) => {
    const lbs = parseFloat(item.pounds) || 0;
    const p = parseFloat(item.price_per_pound) || 0;
    return sum + lineTotal(lbs, p);
  }, 0);

  async function handleSubmit() {
    if (!selectedCompanyId || items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const order = await apiClient.createBulkOrder({
        company_id: Number(selectedCompanyId),
        shipping_location_id: shippingLocationId ? Number(shippingLocationId) : undefined,
        billing_location_id: billingLocationId ? Number(billingLocationId) : undefined,
        notes_to_vendor: notesToVendor || undefined,
        desired_delivery_date: desiredDeliveryDate || undefined,
        internal_notes: internalNotes || undefined,
        disable_payment_term_discount: disableDiscount,
        items: items.map((i) => ({
          strain_id: i.strain_id,
          pounds: parseFloat(i.pounds) || 0,
          grams: (parseFloat(i.pounds) || 0) * GRAMS_PER_POUND,
          price_per_pound: parseFloat(i.price_per_pound) || 0,
        })),
      });
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Create Bulk Order</h2>
          <p className="text-sm text-muted-foreground">
            Build a bulk flower order by strain and send it for customer confirmation
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Company selector */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Customer</h3>
        {!selectedCompany ? (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search companies..." value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} className="pl-9" />
            {companySearch.length >= 1 && (
              <div className="mt-1 rounded-md border max-h-48 overflow-y-auto divide-y">
                {filteredCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">No companies found</p>
                ) : (
                  filteredCompanies.slice(0, 20).map((c) => (
                    <button
                      key={c.id}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                      onClick={() => { setSelectedCompanyId(String(c.id)); setCompanySearch(""); }}
                    >
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="size-6 rounded object-cover" />
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded bg-muted">
                          <BuildingIcon className="size-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{COMPANY_TYPE_LABELS[c.company_type]}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
            {selectedCompany.logo_url ? (
              <img src={selectedCompany.logo_url} alt="" className="size-8 rounded-md object-cover" />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <BuildingIcon className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium">{selectedCompany.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{COMPANY_TYPE_LABELS[selectedCompany.company_type]}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/companies/${selectedCompany.slug}`} target="_blank" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View <ExternalLinkIcon className="size-3" />
              </Link>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setSelectedCompanyId(""); setItems([]); }}>
                Change
              </button>
            </div>
          </div>
        )}

        {selectedCompany && locations.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Shipping Location</FieldLabel>
              <Select value={shippingLocationId} onValueChange={setShippingLocationId}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name || l.address || `Location #${l.id}`}{l.city ? `, ${l.city}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Billing Location</FieldLabel>
              <Select value={billingLocationId} onValueChange={setBillingLocationId}>
                <SelectTrigger><SelectValue placeholder="Same as shipping" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name || l.address || `Location #${l.id}`}{l.city ? `, ${l.city}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </div>

      {/* Strains */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Strains</h3>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search strains to add..." value={strainSearch} onChange={(e) => setStrainSearch(e.target.value)} className="pl-9" />
        </div>

        {strainSearch && (
          <div className="rounded-md border max-h-48 overflow-y-auto divide-y">
            {filteredStrains.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">No strains found</p>
            ) : (
              filteredStrains.slice(0, 20).map((s) => (
                <button
                  key={s.id}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                  onClick={() => addStrain(s)}
                >
                  <span className="font-medium">{s.name}</span>
                  <PlusIcon className="size-3.5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}

        {items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Strain</th>
                <th className="text-left py-2 px-2 font-medium w-24">Pounds</th>
                <th className="text-left py-2 px-2 font-medium w-24">Grams</th>
                <th className="text-left py-2 px-2 font-medium w-28">$/lb</th>
                <th className="text-right py-2 px-2 font-medium w-24">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, idx) => {
                const lbs = parseFloat(item.pounds) || 0;
                const p = parseFloat(item.price_per_pound) || 0;
                const total = lineTotal(lbs, p);
                const grams = poundsToGrams(lbs);
                return (
                  <tr key={item.strain_id}>
                    <td className="py-2 px-3 font-medium">{item.strain_name}</td>
                    <td className="py-2 px-2">
                      <Input type="number" min={0} step="0.5" value={item.pounds} onChange={(e) => updateItem(idx, "pounds", e.target.value)} className="h-8 text-sm w-full" />
                    </td>
                    <td className="py-2 px-2">
                      <Input type="number" min={0} step="1" value={grams} onChange={(e) => setGrams(idx, e.target.value)} className="h-8 text-sm w-full" />
                    </td>
                    <td className="py-2 px-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input type="number" min={0} step="10" value={item.price_per_pound} onChange={(e) => updateItem(idx, "price_per_pound", e.target.value)} className="h-8 text-sm pl-5 w-full" />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-medium">${total.toFixed(2)}</td>
                    <td className="py-2 px-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => removeItem(idx)}>
                        <Trash2Icon className="size-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={4} className="py-2 px-3 text-right text-xs font-medium text-muted-foreground">Total</td>
                <td className="py-2 px-2 text-right font-bold">${orderTotal.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}

        {items.length === 0 && !strainSearch && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Search for strains above to add them to the order
          </p>
        )}
      </div>

      {/* Details */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Details</h3>
        <FieldGroup>
          <Field>
            <FieldLabel>Desired Delivery Date</FieldLabel>
            <Input type="date" value={desiredDeliveryDate} onChange={(e) => setDesiredDeliveryDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Notes to Customer</FieldLabel>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Notes visible to the customer..."
              value={notesToVendor}
              onChange={(e) => setNotesToVendor(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Internal Notes</FieldLabel>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Internal notes (not visible to customer)..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={disableDiscount} onChange={(e) => setDisableDiscount(e.target.checked)} className="rounded border-gray-300" />
            Disable payment term discount (custom pricing)
          </label>
        </FieldGroup>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-10">
        <p className="text-sm text-muted-foreground">
          Customer will receive a link to review, select payment terms, and confirm.
        </p>
        <Button size="lg" onClick={handleSubmit} disabled={submitting || !selectedCompanyId || items.length === 0}>
          <SendIcon className="mr-2 size-4" />
          {submitting ? "Creating..." : "Create & Send to Customer"}
        </Button>
      </div>
    </div>
  );
}
