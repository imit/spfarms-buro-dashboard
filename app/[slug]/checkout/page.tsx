"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  ArrowLeftIcon, PlusCircleIcon, TrashIcon, LoaderIcon,
} from "lucide-react";
import {
  apiClient,
  type Cart,
  type Company,
  type Location,
  type PaymentTerm,
  type CheckoutPreview,
  type CreateOrderParams,
  type OrderType,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BoxProgress, useMinimumOrderMet } from "@/components/storefront/box-progress";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

interface ContactUser {
  full_name: string;
  email: string;
  phone_number: string;
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreorder = searchParams.get("type") === "preorder";
  const orderType: OrderType = isPreorder ? "preorder" : "standard";

  const [cart, setCart] = useState<Cart | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [selectedPaymentTermId, setSelectedPaymentTermId] = useState<number | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Checkout form fields
  const [shippingLocationId, setShippingLocationId] = useState<string>("");
  const [billingLocationId, setBillingLocationId] = useState<string>("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [notesToVendor, setNotesToVendor] = useState("");
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [contactUsers, setContactUsers] = useState<ContactUser[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  // Load cart, company, payment terms
  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [companyData, terms] = await Promise.all([
          apiClient.getCompany(slug),
          apiClient.getPaymentTerms(),
        ]);
        setCompany(companyData);
        setPaymentTerms(terms);

        const cartData = await apiClient.getCart(companyData.id);
        setCart(cartData);

        const relevantItems = cartData.items.filter((i) =>
          isPreorder ? i.coming_soon : !i.coming_soon
        );
        if (relevantItems.length === 0) {
          router.replace(`/${slug}/cart`);
          return;
        }

        if (companyData.locations.length > 0) {
          setShippingLocationId(String(companyData.locations[0].id));
          setBillingLocationId(String(companyData.locations[0].id));
        }

        // Set default payment term (first one)
        if (terms.length > 0) {
          setSelectedPaymentTermId(terms[0].id);
        }
      } catch (err) {
        console.error("Failed to load checkout:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug, router]);

  // Fetch checkout preview when payment term changes
  useEffect(() => {
    if (!company || !cart || cart.items.length === 0) return;

    async function fetchPreview() {
      setPreviewLoading(true);
      try {
        const data = await apiClient.getCheckoutPreview(
          company!.id,
          skipPaymentTerms ? undefined : (selectedPaymentTermId || undefined),
          orderType
        );
        setPreview(data);
      } catch (err) {
        console.error("Failed to load preview:", err);
      } finally {
        setPreviewLoading(false);
      }
    }

    fetchPreview();
  }, [company, cart, selectedPaymentTermId]);

  const addContactUser = () => {
    setContactUsers([...contactUsers, { full_name: "", email: "", phone_number: "" }]);
  };

  const updateContactUser = (index: number, field: keyof ContactUser, value: string) => {
    const updated = [...contactUsers];
    updated[index] = { ...updated[index], [field]: value };
    setContactUsers(updated);
  };

  const removeContactUser = (index: number) => {
    setContactUsers(contactUsers.filter((_, i) => i !== index));
  };

  const handleConfirmOrder = async () => {
    if (!company || !cart || cart.items.length === 0) return;

    setSubmitting(true);
    try {
      const orderParams: CreateOrderParams = {
        company_id: company.id,
        order_type: orderType,
        notes_to_vendor: notesToVendor || undefined,
        desired_delivery_date: desiredDeliveryDate || undefined,
      };

      if (shippingLocationId) {
        orderParams.shipping_location_id = Number(shippingLocationId);
      }
      if (billingSameAsShipping) {
        orderParams.billing_location_id = orderParams.shipping_location_id;
      } else if (billingLocationId) {
        orderParams.billing_location_id = Number(billingLocationId);
      }

      if (selectedPaymentTermId && !skipPaymentTerms) {
        orderParams.payment_term_id = selectedPaymentTermId;
        if (termsAccepted) {
          orderParams.payment_terms_accepted = true;
        }
      }

      const validContacts = contactUsers.filter((c) => c.email?.trim());
      if (validContacts.length > 0) {
        orderParams.contact_users = validContacts;
      }

      const order = await apiClient.createOrder(orderParams);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      posthog.capture("order_placed", {
        order_id: order.id,
        order_type: orderType,
        company_slug: slug,
        company_name: company.name,
        item_count: checkoutItems.length,
        total: preview?.total || cart.subtotal,
      });
      toast.success(isPreorder ? "Pre-order placed successfully!" : "Order placed successfully!");
      router.push(`/${slug}/orders/${order.id}`);
    } catch (err) {
      showError("place your order", err);
    } finally {
      setSubmitting(false);
    }
  };

  const checkoutItems = cart?.items.filter((i) =>
    isPreorder ? i.coming_soon : !i.coming_soon
  ) ?? [];
  const isBulkOnly = !isPreorder && checkoutItems.length > 0 && checkoutItems.every((i) => i.bulk);
  const skipPaymentTerms = isPreorder || isBulkOnly;

  const meetsMinimum = isPreorder || useMinimumOrderMet(
    preview?.items ?? cart?.items ?? []
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Loading checkout...</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => router.push(`/${slug}/storefront`)}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  const locations = company?.locations || [];

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/${slug}/cart`)}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Cart
      </Button>

      <h1 className="text-2xl font-bold mb-6">
        {isPreorder ? "Pre-order Checkout" : "Checkout"}
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: Order summary + form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/50">
              <h2 className="font-semibold text-sm">Order Summary</h2>
            </div>
            <div className="divide-y">
              {preview ? preview.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium text-sm">
                    {formatPrice(item.line_total)}
                  </div>
                </div>
              )) : cart.items.filter((i) => isPreorder ? i.coming_soon : !i.coming_soon).map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium text-sm">
                    {formatPrice(parseFloat(item.unit_price || "0") * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            {/* Box progress (standard orders only) */}
            {!isPreorder && (
              <div className="px-4 py-3 border-t">
                <BoxProgress items={preview?.items ?? cart.items} compact />
              </div>
            )}
          </div>

          {/* Checkout Form */}
          <div className="rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold">Shipping & Details</h2>

            {/* Shipping Location */}
            <div className="space-y-1.5">
              <Label htmlFor="shipping">Shipping Address</Label>
              <select
                id="shipping"
                value={shippingLocationId}
                onChange={(e) => setShippingLocationId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a location</option>
                {locations.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name || loc.address} — {loc.city}, {loc.state} {loc.zip_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Location */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billingSame"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="billingSame" className="text-sm font-normal">
                  Billing same as shipping
                </Label>
              </div>
              {!billingSameAsShipping && (
                <select
                  value={billingLocationId}
                  onChange={(e) => setBillingLocationId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a location</option>
                  {locations.map((loc: Location) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name || loc.address} — {loc.city}, {loc.state} {loc.zip_code}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Desired Delivery Date */}
            <div className="space-y-1.5">
              <Label htmlFor="deliveryDate">Desired Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={desiredDeliveryDate}
                onChange={(e) => setDesiredDeliveryDate(e.target.value)}
              />
            </div>

            {/* Notes to Vendor */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes to Vendor</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={notesToVendor}
                onChange={(e) => setNotesToVendor(e.target.value)}
                rows={3}
              />
            </div>

            {/* Contact People */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contact People</Label>
                <Button variant="ghost" size="sm" onClick={addContactUser}>
                  <PlusCircleIcon className="mr-1 size-3.5" />
                  Add
                </Button>
              </div>

              {/* Current user */}
              {user && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Orderer (You)</span>
                  </div>
                  <p className="text-sm font-medium">{user.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.phone_number && (
                    <p className="text-xs text-muted-foreground">{user.phone_number}</p>
                  )}
                </div>
              )}

              {contactUsers.map((contact, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Contact #{i + 1}</span>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => removeContactUser(i)}>
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Full name"
                    value={contact.full_name}
                    onChange={(e) => updateContactUser(i, "full_name", e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContactUser(i, "email", e.target.value)}
                  />
                  <Input
                    placeholder="Phone number"
                    value={contact.phone_number}
                    onChange={(e) => updateContactUser(i, "phone_number", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Payment terms + price breakdown */}
        <div className="space-y-4">
          {/* Payment Terms (hidden for pre-orders and bulk orders) */}
          {!skipPaymentTerms && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Payment Terms</h3>
              {paymentTerms.map((term) => (
                <label
                  key={term.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                    selectedPaymentTermId === term.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    name="payment_term"
                    checked={selectedPaymentTermId === term.id}
                    onChange={() => setSelectedPaymentTermId(term.id)}
                    className="size-4 accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{term.name}</p>
                    {parseFloat(term.discount_percentage) > 0 && (
                      <p className="text-xs text-green-600">
                        {parseFloat(term.discount_percentage)}% discount
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Price Breakdown */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Order Total</h3>

            {previewLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : preview ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(preview.subtotal)}</span>
                </div>

                {parseFloat(preview.payment_term_discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Payment Discount
                      {preview.payment_term && ` (${parseFloat(preview.payment_term.discount_percentage)}%)`}
                    </span>
                    <span>-{formatPrice(preview.payment_term_discount_amount)}</span>
                  </div>
                )}

                {preview.discounts.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm text-green-600">
                    <span>{d.name}</span>
                    <span>-{formatPrice(d.amount)}</span>
                  </div>
                ))}

                {parseFloat(preview.tax_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({parseFloat(preview.tax_rate)}%)
                    </span>
                    <span>{formatPrice(preview.tax_amount)}</span>
                  </div>
                )}

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(preview.total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
            )}
          </div>

          {/* Payment Terms Agreement */}
          {!skipPaymentTerms && (
            <>
              <label
                htmlFor="termsAccepted"
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                  termsAccepted
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="size-5 rounded border-input accent-primary shrink-0"
                />
                <span className="text-sm leading-snug">
                  I agree to the selected{" "}
                  <button
                    type="button"
                    className="underline text-primary font-medium hover:text-primary/80"
                    onClick={(e) => {
                      e.preventDefault();
                      setTermsDialogOpen(true);
                    }}
                  >
                    payment terms
                    {selectedPaymentTermId && paymentTerms.find(t => t.id === selectedPaymentTermId) && (
                      <> ({paymentTerms.find(t => t.id === selectedPaymentTermId)!.name})</>
                    )}
                  </button>
                </span>
              </label>

              <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Payment Terms</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    {selectedPaymentTermId && paymentTerms.find(t => t.id === selectedPaymentTermId) ? (
                      (() => {
                        const term = paymentTerms.find(t => t.id === selectedPaymentTermId)!;
                        const discount = parseFloat(term.discount_percentage);
                        return (
                          <div className="space-y-3">
                            <div className="rounded-lg border p-4 space-y-2">
                              <p className="font-semibold text-base">{term.name}</p>
                              <p className="text-muted-foreground">
                                {term.days === 0
                                  ? <>Payment is due <span className="font-medium text-foreground">on delivery</span> — cash or check accepted at the time of drop-off.</>
                                  : <>Payment is due within <span className="font-medium text-foreground">{term.days} days</span> of the invoice date.</>
                                }
                              </p>
                              {discount > 0 && (
                                <p className="text-green-600">
                                  A <span className="font-medium">{discount}% discount</span> is applied to the order total for this payment term.
                                </p>
                              )}
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              By accepting these terms, you agree to pay the full invoice amount within the specified period. Late payments may be subject to additional fees or changes to your available payment terms.
                            </p>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-muted-foreground">Please select a payment term above to view its details.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Confirm Order */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirmOrder}
            disabled={submitting || !cart || cart.items.length === 0 || !meetsMinimum || (!skipPaymentTerms && !termsAccepted)}
          >
            {submitting
              ? isPreorder ? "Placing Pre-order..." : "Placing Order..."
              : !meetsMinimum
                ? "Minimum order not met"
                : isPreorder
                  ? `Confirm Pre-order — ${formatPrice(preview?.total || cart.subtotal)}`
                  : `Confirm Order — ${formatPrice(preview?.total || cart.subtotal)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
