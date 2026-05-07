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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  MinusIcon,
} from "lucide-react";
import { COMPANY_TYPE_LABELS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface OrderLineItem {
  product_id: number;
  product_name: string;
  thumbnail_url: string | null;
  quantity: number;
  unit_price: string;
  default_price: string;
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
  const [codOnly, setCodOnly] = useState(false);
  const [disableDiscount, setDisableDiscount] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");

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

  const filteredCompanies = companies.filter(
    (c) =>
      companySearch.length >= 1 &&
      (c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.slug?.toLowerCase().includes(companySearch.toLowerCase()))
  );

  const filteredProducts = products
    .filter((p) => p.status === "active" && !p.coming_soon && !p.bulk && p.product_type !== "bulk_flower")
    .filter(
      (p) =>
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.strain_name?.toLowerCase().includes(productSearch.toLowerCase())
    );

  function addItem(product: Product) {
    if (items.some((i) => i.product_id === product.id)) return;
    const price = product.default_price || "0";
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        thumbnail_url: product.thumbnail_url,
        quantity: 1,
        unit_price: price,
        default_price: price,
      },
    ]);
    setProductSearch("");
  }

  function updateItem(
    productId: number,
    field: "quantity" | "unit_price",
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, [field]: value } : i))
    );
  }

  function bumpQty(productId: number, delta: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
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
        cod_only: codOnly || undefined,
        disable_payment_term_discount: disableDiscount || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: parseFloat(i.unit_price) || 0,
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

  const subtotal = items.reduce(
    (sum, i) => sum + (parseFloat(i.unit_price) || 0) * i.quantity,
    0
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-10 max-w-4xl pb-32 sm:pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold truncate">Create Manual Order</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Build an order for a customer and send it for their approval
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Customer */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <h3 className="text-base font-medium">Customer</h3>

        {!selectedCompany ? (
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="h-14 text-lg rounded-xl pl-12"
            />
            {companySearch.length >= 1 && (
              <div className="mt-2 rounded-xl border bg-popover shadow-md max-h-72 overflow-y-auto divide-y">
                {filteredCompanies.length === 0 ? (
                  <p className="text-base text-muted-foreground p-4">No companies found</p>
                ) : (
                  filteredCompanies.slice(0, 20).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                      onClick={() => {
                        setSelectedCompanyId(String(c.id));
                        setCompanySearch("");
                        setShippingLocationId("");
                        setBillingLocationId("");
                      }}
                    >
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="size-9 rounded-md object-cover" />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                          <BuildingIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-base">{c.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {COMPANY_TYPE_LABELS[c.company_type]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border bg-muted/30 px-5 py-4">
            {selectedCompany.logo_url ? (
              <img
                src={selectedCompany.logo_url}
                alt=""
                className="size-11 rounded-lg object-cover mt-0.5"
              />
            ) : (
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted mt-0.5">
                <BuildingIcon className="size-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-base truncate">{selectedCompany.name}</span>
                <span className="text-xs text-muted-foreground">
                  {COMPANY_TYPE_LABELS[selectedCompany.company_type]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
            <div className="flex flex-col items-end gap-2 mt-0.5 shrink-0">
              <Link
                href={`/admin/companies/${selectedCompany.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 -mr-2"
                target="_blank"
              >
                View
                <ExternalLinkIcon className="size-3" />
              </Link>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -mr-2"
                onClick={() => {
                  setSelectedCompanyId("");
                  setShippingLocationId("");
                  setBillingLocationId("");
                  setItems([]);
                }}
              >
                Change
              </button>
            </div>
          </div>
        )}

        {selectedCompany && locations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field>
              <FieldLabel className="text-base">Shipping location</FieldLabel>
              <Select
                value={shippingLocationId}
                onValueChange={setShippingLocationId}
              >
                <SelectTrigger className="h-12 rounded-xl">
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
              <FieldLabel className="text-base">Billing location</FieldLabel>
              <Select
                value={billingLocationId}
                onValueChange={setBillingLocationId}
              >
                <SelectTrigger className="h-12 rounded-xl">
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
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <h3 className="text-base font-medium">Products</h3>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="h-14 text-lg rounded-xl pl-12"
          />
        </div>

        {productSearch && (
          <div className="rounded-xl border bg-popover shadow-md max-h-72 overflow-y-auto divide-y">
            {filteredProducts.length === 0 ? (
              <p className="text-base text-muted-foreground p-4">
                No products found
              </p>
            ) : (
              filteredProducts.slice(0, 20).map((p) => {
                const added = items.some((i) => i.product_id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors text-left",
                      added && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => addItem(p)}
                    disabled={added}
                  >
                    <span className="flex items-center gap-3">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="size-9 rounded-md object-cover" />
                      ) : (
                        <div className="size-9 rounded-md bg-muted" />
                      )}
                      <span className="text-base">
                        <span className="font-medium">{p.name}</span>
                        {p.strain_name && (
                          <span className="text-muted-foreground">
                            {" "}({p.strain_name})
                          </span>
                        )}
                      </span>
                    </span>
                    {added ? (
                      <span className="text-xs text-muted-foreground">Added</span>
                    ) : (
                      <PlusIcon className="size-4 text-muted-foreground" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Line items */}
        {items.length > 0 && (
          <div className="space-y-2 pt-1">
            {items.map((item) => {
              const total = (parseFloat(item.unit_price) || 0) * item.quantity;
              const priceChanged =
                parseFloat(item.unit_price) !== parseFloat(item.default_price);
              return (
                <div
                  key={item.product_id}
                  className="rounded-xl border bg-background p-3 sm:p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4"
                >
                  {/* Header: image + name + remove (sm:remove moves to end) */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="size-11 sm:size-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="size-11 sm:size-12 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-base truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Default ${parseFloat(item.default_price).toFixed(2)}
                        {priceChanged && (
                          <span className="text-amber-600 ml-1">· custom</span>
                        )}
                      </p>
                    </div>
                    {/* Remove on mobile only */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(item.product_id)}
                      className="text-muted-foreground hover:text-destructive shrink-0 sm:hidden"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>

                  {/* Controls row */}
                  <div className="flex items-end gap-2 sm:gap-3">
                    {/* Price */}
                    <div className="space-y-1 flex-1 sm:flex-initial">
                      <label className="block text-[11px] font-medium text-muted-foreground px-1 uppercase tracking-wide">
                        Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(item.product_id, "unit_price", e.target.value)
                          }
                          className={cn(
                            "h-12 text-base pl-7 rounded-lg tabular-nums w-full sm:w-28",
                            priceChanged && "border-amber-500/60"
                          )}
                        />
                      </div>
                    </div>

                    {/* Qty stepper */}
                    <div className="space-y-1 shrink-0">
                      <label className="block text-[11px] font-medium text-muted-foreground px-1 uppercase tracking-wide">
                        Qty
                      </label>
                      <div className="flex h-12 items-center rounded-lg border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => bumpQty(item.product_id, -1)}
                          disabled={item.quantity <= 1}
                          className="flex h-full w-10 sm:w-9 items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="size-4" />
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.product_id,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="h-full w-10 sm:w-12 bg-transparent text-center text-base font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => bumpQty(item.product_id, 1)}
                          className="flex h-full w-10 sm:w-9 items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="space-y-1 shrink-0 text-right ml-auto sm:ml-0">
                      <label className="block text-[11px] font-medium text-muted-foreground px-1 uppercase tracking-wide">
                        Total
                      </label>
                      <p className="h-12 flex items-center justify-end font-semibold text-base tabular-nums sm:w-24">
                        ${total.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove on desktop only */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(item.product_id)}
                      className="text-muted-foreground hover:text-destructive shrink-0 hidden sm:inline-flex self-end mb-1"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Subtotal */}
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 sm:px-5 py-3 mt-3">
              <span className="text-sm font-medium text-muted-foreground">
                Subtotal · {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {items.length === 0 && !productSearch && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Search for products above to add them to the order
          </p>
        )}
      </div>

      {/* Pricing & payment */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-base font-medium">Pricing &amp; payment</h3>
          <p className="text-sm text-muted-foreground">
            How the customer pays for this order
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !codOnly;
              setCodOnly(next);
              if (next) setDisableDiscount(true);
            }}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
              codOnly
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/40"
            )}
          >
            <Checkbox
              checked={codOnly}
              className="size-5 mt-0.5 pointer-events-none"
              tabIndex={-1}
            />
            <div className="space-y-0.5">
              <p className="font-medium text-sm">COD only</p>
              <p className="text-xs text-muted-foreground">
                Cash on delivery — customer can&apos;t pick Net 15 / Net 30
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={codOnly}
            onClick={() => setDisableDiscount(!disableDiscount)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
              disableDiscount
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/40",
              codOnly && "opacity-60 cursor-not-allowed"
            )}
          >
            <Checkbox
              checked={disableDiscount}
              className="size-5 mt-0.5 pointer-events-none"
              tabIndex={-1}
              disabled={codOnly}
            />
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Custom pricing</p>
              <p className="text-xs text-muted-foreground">
                No payment term discounts applied to the prices above
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <h3 className="text-base font-medium">Details</h3>
        <FieldGroup className="space-y-4">
          <Field>
            <FieldLabel className="text-base">Desired delivery date</FieldLabel>
            <Input
              type="date"
              value={desiredDeliveryDate}
              onChange={(e) => setDesiredDeliveryDate(e.target.value)}
              className="h-12 text-base rounded-xl"
            />
          </Field>
          <Field>
            <FieldLabel className="text-base">Notes to customer</FieldLabel>
            <Textarea
              placeholder="Notes visible to the customer..."
              value={notesToVendor}
              onChange={(e) => setNotesToVendor(e.target.value)}
              className="rounded-xl text-base min-h-[88px]"
            />
          </Field>
          <Field>
            <FieldLabel className="text-base">Internal notes</FieldLabel>
            <Textarea
              placeholder="Internal notes (not visible to customer)..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="rounded-xl text-base min-h-[88px]"
            />
          </Field>
        </FieldGroup>
      </div>

      {/* Submit — desktop inline */}
      <div className="hidden sm:flex items-center justify-between gap-4 pb-10">
        <p className="text-sm text-muted-foreground flex-1">
          {codOnly
            ? "Customer will receive a link to review and confirm the order (COD, no payment term selection)."
            : "Customer will receive a link to review, select payment terms (COD, Net 15, Net 30), and sign."}
        </p>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedCompanyId || items.length === 0}
          className="h-14 px-8 text-base font-semibold rounded-xl"
        >
          <SendIcon className="mr-2 size-5" />
          {submitting ? "Creating..." : "Create & send"}
        </Button>
      </div>

      {/* Submit — mobile sticky bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""} · subtotal
            </span>
            <span className="text-base font-semibold tabular-nums">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedCompanyId || items.length === 0}
          className="h-14 w-full text-base font-semibold rounded-xl"
        >
          <SendIcon className="mr-2 size-5" />
          {submitting ? "Creating..." : "Create & send"}
        </Button>
      </div>
    </div>
  );
}
