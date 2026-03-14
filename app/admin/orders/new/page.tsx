"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type Company,
  type Product,
  type Location,
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
import { COMPANY_TYPE_LABELS } from "@/lib/api";

interface OrderLineItem {
  product_id: number;
  product_name: string;
  thumbnail_url: string | null;
  quantity: number;
}

export default function NewManualOrderPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [shippingLocationId, setShippingLocationId] = useState("");
  const [billingLocationId, setBillingLocationId] = useState("");
  const [notesToVendor, setNotesToVendor] = useState("");
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .getCompanies({ per_page: 500 })
      .then((res) => setCompanies(res.data))
      .catch(() => {});
    apiClient
      .getProducts()
      .then(setProducts)
      .catch(() => {});
  }, [isAuthenticated]);

  const selectedCompany = companies.find(
    (c) => String(c.id) === selectedCompanyId
  );
  const locations: Location[] = selectedCompany?.locations ?? [];

  const filteredProducts = products
    .filter((p) => p.status === "active" && !p.coming_soon)
    .filter(
      (p) =>
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.strain_name?.toLowerCase().includes(productSearch.toLowerCase())
    );

  function addItem(product: Product) {
    if (items.some((i) => i.product_id === product.id)) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        thumbnail_url: product.thumbnail_url,
        quantity: 1,
      },
    ]);
    setProductSearch("");
  }

  function updateItem(
    productId: number,
    field: "quantity",
    value: number
  ) {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, [field]: value } : i))
    );
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  async function handleSubmit() {
    if (!selectedCompanyId || items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const order = await apiClient.createManualOrder({
        company_id: Number(selectedCompanyId),
        shipping_location_id: shippingLocationId
          ? Number(shippingLocationId)
          : undefined,
        billing_location_id: billingLocationId
          ? Number(billingLocationId)
          : undefined,
        notes_to_vendor: notesToVendor || undefined,
        desired_delivery_date: desiredDeliveryDate || undefined,
        internal_notes: internalNotes || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
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
          <h2 className="text-2xl font-semibold">Create Manual Order</h2>
          <p className="text-sm text-muted-foreground">
            Build an order for a customer and send it for their approval
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Company selector */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Customer</h3>
        <Field>
          <FieldLabel>Company</FieldLabel>
          <Select
            value={selectedCompanyId}
            onValueChange={(val) => {
              setSelectedCompanyId(val);
              setShippingLocationId("");
              setBillingLocationId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company..." />
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

        {selectedCompany && (
          <div className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
            {selectedCompany.logo_url ? (
              <img
                src={selectedCompany.logo_url}
                alt=""
                className="size-9 rounded-md object-cover mt-0.5"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-md bg-muted mt-0.5">
                <BuildingIcon className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedCompany.name}</span>
                <span className="text-xs text-muted-foreground">
                  {COMPANY_TYPE_LABELS[selectedCompany.company_type]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {selectedCompany.locations.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-3" />
                    {selectedCompany.locations.length} location{selectedCompany.locations.length !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <UsersIcon className="size-3" />
                  {selectedCompany.members_count} member{selectedCompany.members_count !== 1 ? "s" : ""}
                </span>
                {selectedCompany.orders_count > 0 && (
                  <span>{selectedCompany.orders_count} past order{selectedCompany.orders_count !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
            <Link
              href={`/admin/companies/${selectedCompany.slug}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-0.5"
              target="_blank"
            >
              View
              <ExternalLinkIcon className="size-3" />
            </Link>
          </div>
        )}

        {selectedCompany && locations.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Shipping Location</FieldLabel>
              <Select
                value={shippingLocationId}
                onValueChange={setShippingLocationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name || l.address || `Location #${l.id}`}
                      {l.city ? `, ${l.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Billing Location</FieldLabel>
              <Select
                value={billingLocationId}
                onValueChange={setBillingLocationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Same as shipping" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name || l.address || `Location #${l.id}`}
                      {l.city ? `, ${l.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Products</h3>

        {/* Product search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Product dropdown results */}
        {productSearch && (
          <div className="rounded-md border max-h-48 overflow-y-auto divide-y">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">
                No products found
              </p>
            ) : (
              filteredProducts.slice(0, 20).map((p) => (
                <button
                  key={p.id}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                  onClick={() => addItem(p)}
                  disabled={items.some((i) => i.product_id === p.id)}
                >
                  <span className="flex items-center gap-2">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="size-7 rounded object-cover" />
                    ) : (
                      <div className="size-7 rounded bg-muted" />
                    )}
                    <span>
                      <span className="font-medium">{p.name}</span>
                      {p.strain_name && (
                        <span className="text-muted-foreground">
                          {" "}({p.strain_name})
                        </span>
                      )}
                    </span>
                  </span>
                  <PlusIcon className="size-3.5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Line items table */}
        {items.length > 0 && (
          <div className="rounded-md border divide-y">
            <div className="grid grid-cols-[1fr,80px,40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
              <span>Product</span>
              <span>Qty</span>
              <span />
            </div>
            {items.map((item) => (
              <div
                key={item.product_id}
                className="grid grid-cols-[1fr,80px,40px] gap-2 px-3 py-2 items-center text-sm"
              >
                <span className="flex items-center gap-2 font-medium truncate">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt="" className="size-7 rounded object-cover shrink-0" />
                  ) : (
                    <div className="size-7 rounded bg-muted shrink-0" />
                  )}
                  <span className="truncate">{item.product_name}</span>
                </span>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      item.product_id,
                      "quantity",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(item.product_id)}
                >
                  <Trash2Icon className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && !productSearch && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Search for products above to add them to the order
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Details</h3>
        <FieldGroup>
          <Field>
            <FieldLabel>Desired Delivery Date</FieldLabel>
            <Input
              type="date"
              value={desiredDeliveryDate}
              onChange={(e) => setDesiredDeliveryDate(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Notes to Customer</FieldLabel>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Notes visible to the customer..."
              value={notesToVendor}
              onChange={(e) => setNotesToVendor(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Internal Notes</FieldLabel>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Internal notes (not visible to customer)..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </Field>
        </FieldGroup>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-10">
        <p className="text-sm text-muted-foreground">
          The customer will receive a link to review the order, select payment
          terms (COD, Net 15, Net 30), and sign the agreement.
        </p>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || !selectedCompanyId || items.length === 0}
        >
          <SendIcon className="mr-2 size-4" />
          {submitting ? "Creating..." : "Create & Send to Customer"}
        </Button>
      </div>
    </div>
  );
}
