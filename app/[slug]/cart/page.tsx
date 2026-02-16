"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon, MinusIcon, PlusIcon, TrashIcon, PlusCircleIcon,
} from "lucide-react";
import {
  apiClient,
  type Cart,
  type Company,
  type Location,
  type CreateOrderParams,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

interface ContactUser {
  full_name: string;
  email: string;
  phone_number: string;
}

export default function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Checkout fields
  const [shippingLocationId, setShippingLocationId] = useState<string>("");
  const [billingLocationId, setBillingLocationId] = useState<string>("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [notesToVendor, setNotesToVendor] = useState("");
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState("");
  const [contactUsers, setContactUsers] = useState<ContactUser[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const companyData = await apiClient.getCompany(slug);
        setCompany(companyData);
        const cartData = await apiClient.getCart(companyData.id);
        setCart(cartData);

        if (companyData.locations.length > 0) {
          setShippingLocationId(String(companyData.locations[0].id));
          setBillingLocationId(String(companyData.locations[0].id));
        }
      } catch (err) {
        console.error("Failed to load cart:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug]);

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.updateCartItem(company.id, itemId, newQuantity);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.removeCartItem(company.id, itemId);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      toast.error("Failed to remove item");
    }
  };

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

  const handlePlaceOrder = async () => {
    if (!company || !cart || cart.items.length === 0) return;

    setSubmitting(true);
    try {
      const orderParams: CreateOrderParams = {
        company_id: company.id,
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

      const validContacts = contactUsers.filter((c) => c.email.trim());
      if (validContacts.length > 0) {
        orderParams.contact_users = validContacts;
      }

      const order = await apiClient.createOrder(orderParams);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Order placed successfully!");
      router.push(`/${slug}/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading cart...</p>;
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
        onClick={() => router.push(`/${slug}/storefront`)}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Continue Shopping
      </Button>

      <h1 className="text-2xl font-bold mb-6">Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
                ) : (
                  <div className="size-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)}</p>
              </div>

              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <MinusIcon className="size-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <PlusIcon className="size-3" />
                </Button>
              </div>

              <div className="w-20 text-right font-medium text-sm">
                {formatPrice(
                  parseFloat(item.unit_price || "0") * item.quantity
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}

          <div className="flex justify-end pt-2 text-lg font-semibold">
            Subtotal: {formatPrice(cart.subtotal)}
          </div>
        </div>

        {/* Checkout Form */}
        <div className="space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold">Checkout</h2>

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

            {/* Payment Method */}
            <div className="rounded-md border p-3 bg-muted/50">
              <p className="text-sm font-medium">Payment Method</p>
              <p className="text-xs text-muted-foreground">ACH / Bank Transfer</p>
            </div>

            {/* Place Order */}
            <Button
              className="w-full"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={submitting || cart.items.length === 0}
            >
              {submitting ? "Placing Order..." : `Place Order — ${formatPrice(cart.subtotal)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
