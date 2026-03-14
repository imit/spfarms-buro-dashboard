"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import {
  ArrowLeftIcon,
  DownloadIcon,
  CheckCircleIcon,
  CheckIcon,
  XIcon,
  LoaderIcon,
  ShoppingBagIcon,
  MailIcon,
} from "lucide-react";
import {
  apiClient,
  type Order,
  type AppSettings,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/order-timeline";
import { Logo } from "@/components/shared/logo";
import { showError } from "@/lib/errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function formatLocation(
  loc: {
    name?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  } | null
) {
  if (!loc) return "Not specified";
  const parts = [
    loc.name,
    loc.address,
    [loc.city, loc.state, loc.zip_code].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(" — ") || "Not specified";
}

interface PaymentTermOption {
  id: number;
  name: string;
  days: number;
  discount_percentage: string;
}

interface AgreementData {
  requires_payment_term_selection: boolean;
  payment_terms?: PaymentTermOption[];
  order: {
    subtotal: string;
    tax_amount: string | null;
    delivery_fee: string | null;
    delivery_fee_waived: boolean;
  };
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Draft order state
  const [agreementData, setAgreementData] = useState<AgreementData | null>(
    null
  );
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [signed, setSigned] = useState(false);
  const [rejected, setRejected] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [data, s] = await Promise.all([
          apiClient.getOrder(Number(id)),
          apiClient.getSettings(),
        ]);
        setOrder(data);
        setSettings(s);

        // If draft order with agreement, load agreement data for payment term selection
        if (
          data.status === "draft" &&
          data.payment_term_agreement?.agreement_url
        ) {
          const token =
            data.payment_term_agreement.agreement_url.split("/agreements/")[1];
          if (token) {
            try {
              const res = await fetch(
                `${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}`
              );
              if (res.ok) {
                const json = await res.json();
                setAgreementData(json.data);
              }
            } catch {
              // Agreement data is optional enhancement
            }
          }
        }
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, id]);

  const agreementToken =
    order?.payment_term_agreement?.agreement_url?.split("/agreements/")[1];
  const isDraft = order?.status === "draft";
  const requiresTermSelection =
    agreementData?.requires_payment_term_selection ?? false;
  const paymentTerms = agreementData?.payment_terms ?? [];
  const selectedTerm = paymentTerms.find((t) => t.id === selectedTermId);

  // Compute estimated total with selected term discount
  const subtotalNum = parseFloat(order?.subtotal || "0") || 0;
  const discountPct = selectedTerm
    ? parseFloat(selectedTerm.discount_percentage) || 0
    : 0;
  const termDiscount = (subtotalNum * discountPct) / 100;
  const afterDiscount = subtotalNum - termDiscount;
  const taxNum = parseFloat(order?.tax_amount || "0") || 0;
  const deliveryNum = parseFloat(order?.delivery_fee || "0") || 0;
  const estimatedTotal =
    requiresTermSelection && selectedTerm
      ? afterDiscount + taxNum + deliveryNum
      : parseFloat(order?.total || "0") || 0;

  const isCod = selectedTerm ? selectedTerm.days === 0 : false;

  const handleSign = async () => {
    if (!agreementToken) return;
    if (!isCod) {
      if (!signerName.trim() || !signerEmail.trim()) return;
      if (!sigRef.current || sigRef.current.isEmpty()) return;
    }
    if (requiresTermSelection && !selectedTermId) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (!isCod) {
        payload.signer_name = signerName;
        payload.signer_email = signerEmail;
        payload.signature_data = sigRef.current!.toDataURL("image/png");
      }
      if (selectedTermId) {
        payload.payment_term_id = selectedTermId;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/v1/public/payment_term_agreements/${agreementToken}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showError("sign the agreement", new Error(body.error || "Failed"));
        return;
      }

      setSigned(true);
    } catch {
      showError("sign the agreement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!agreementToken) return;
    setRejecting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/public/payment_term_agreements/${agreementToken}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showError("decline the order", new Error(body.error || "Failed"));
        return;
      }

      setRejected(true);
    } catch {
      showError("decline the order");
    } finally {
      setRejecting(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const blob = await apiClient.getOrderInvoice(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order?.order_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download the invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found.</p>;
  }

  // ── Signed success state ──
  if (signed) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-5 max-w-md">
          <div className="mx-auto w-36">
            <Logo />
          </div>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="size-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Order Confirmed</h1>
          <p className="text-muted-foreground">
            Thank you for confirming order{" "}
            <strong>{order.order_number}</strong>. We&apos;ll start processing
            it right away.
          </p>
          {settings?.bank_info && (
            <div className="rounded-lg border p-4 text-left">
              <h3 className="font-semibold text-sm mb-1">
                Payment Information
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {settings.bank_info}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/${slug}/orders`)}
          >
            <ShoppingBagIcon className="mr-2 size-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  // ── Rejected success state ──
  if (rejected) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-5 max-w-md">
          <div className="mx-auto w-36">
            <Logo />
          </div>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100">
            <XIcon className="size-7 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold">Order Declined</h1>
          <p className="text-muted-foreground">
            Order <strong>{order.order_number}</strong> has been declined.
            SPFarms has been notified.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${slug}/orders`)}
            >
              Back to Orders
            </Button>
            <a href="mailto:info@spfarmsny.com">
              <Button variant="ghost">
                <MailIcon className="mr-2 size-4" />
                Contact Us
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Draft order: single-column review & sign page ──
  if (isDraft && agreementToken) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => router.push(`/${slug}/orders`)}
        >
          <ArrowLeftIcon className="mr-1.5 size-4" />
          Back to Orders
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Review & Confirm Order</h1>
          <p className="text-muted-foreground mt-1">
            {order.order_number} &middot;{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Order Items */}
        <div className="rounded-lg border mb-6">
          <div className="px-4 py-3 border-b bg-muted/50">
            <h2 className="font-semibold text-sm">Order Items</h2>
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      className="size-full object-cover"
                    />
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
                <span className="text-sm font-medium">
                  {formatPrice(item.line_total)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {requiresTermSelection && selectedTerm && termDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  {selectedTerm.name} discount (
                  {selectedTerm.discount_percentage}%)
                </span>
                <span>-{formatPrice(termDiscount)}</span>
              </div>
            )}
            {taxNum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(taxNum)}</span>
              </div>
            )}
            {deliveryNum > 0 && !order.delivery_fee_waived && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatPrice(deliveryNum)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-1 border-t">
              <span>Total</span>
              <span>{formatPrice(estimatedTotal)}</span>
            </div>
          </div>
        </div>

        {/* Delivery / Location info */}
        <div className="rounded-lg border p-4 mb-6 space-y-2 text-sm">
          {order.desired_delivery_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested Delivery</span>
              <span className="font-medium">
                {new Date(order.desired_delivery_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {order.shipping_location && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-right">
                {formatLocation(order.shipping_location)}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {order.notes_to_vendor && (
          <div className="rounded-lg border-l-3 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Note from SPFarms
            </p>
            <p className="text-sm">{order.notes_to_vendor}</p>
          </div>
        )}

        {/* Payment Term Selection */}
        {requiresTermSelection && paymentTerms.length > 0 && (
          <div className="rounded-lg border p-4 mb-6">
            <h2 className="font-semibold text-sm mb-3">
              Select Payment Terms
            </h2>
            <div className="space-y-2">
              {paymentTerms.map((term) => {
                const isSelected = selectedTermId === term.id;
                const discount =
                  parseFloat(term.discount_percentage) || 0;
                return (
                  <button
                    key={term.id}
                    className={`w-full text-left rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-foreground/30"
                    }`}
                    onClick={() => setSelectedTermId(term.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-5 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="size-3 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{term.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {term.days === 0
                              ? "Pay on delivery"
                              : `Pay within ${term.days} days of delivery`}
                          </p>
                        </div>
                      </div>
                      {discount > 0 && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          {term.discount_percentage}% off
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Agreement Terms (shown after selecting non-COD payment term) */}
        {requiresTermSelection && selectedTerm && selectedTerm.days > 0 && (
          <div className="rounded-lg border p-4 mb-6 bg-muted/30">
            <h2 className="font-semibold text-sm mb-3">Payment Terms Agreement</h2>
            <div className="space-y-3 text-sm">
              <p>
                By signing below, <strong>{order.company?.name}</strong> (&quot;Buyer&quot;) agrees to
                pay Catskill Mountain Cannabis LLC dba SPFarms (&quot;Seller&quot;) the total amount of{" "}
                <strong>{formatPrice(estimatedTotal)}</strong> for order{" "}
                <strong>{order.order_number}</strong> under{" "}
                <strong>{selectedTerm.name}</strong> terms
                {` (${selectedTerm.days} days from delivery)`}.
              </p>
              <p>
                Payment may be made via ACH transfer, direct bank transfer, or
                check (accepted by driver at time of delivery). Failure to pay
                within the agreed terms may result in suspension of future
                orders and referral to collections.
              </p>
              <ol className="list-decimal list-outside pl-5 space-y-2 text-muted-foreground">
                <li>
                  Buyer agrees to timely accept all product transfers in the state
                  tracking system upon delivery. Failure to accept transfer does not
                  relieve Buyer of payment obligations.
                </li>
                <li>
                  Buyer represents and warrants that it holds a valid and active
                  New York State cannabis retail license issued by the Office of
                  Cannabis Management and is authorized to receive the products
                  listed in this order. Buyer agrees to notify Seller immediately
                  of any suspension, restriction, or lapse in its license.
                </li>
                <li>
                  Title and risk of loss transfer to Buyer upon physical delivery
                  and signed receipt.
                </li>
                <li>
                  All sales are final. Claims for shortages or damage must be made
                  at time of delivery. No returns permitted except for
                  state-mandated recalls or verified defects.
                </li>
                <li>
                  Upon default, all outstanding invoices become immediately due and
                  payable. Seller may suspend future orders and charge a late fee
                  of 1.5% per month on overdue balances.
                </li>
                <li>
                  This agreement shall be governed by the laws of the State of
                  New York. Any disputes shall be resolved in the courts of
                  New York State.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Signature Section — skip for COD */}
        {selectedTerm && selectedTerm.days > 0 ? (
          <div className="rounded-lg border p-4 mb-6 space-y-4">
            <h2 className="font-semibold text-sm">Confirm & Sign</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="signerName">Full Name</Label>
                <Input
                  id="signerName"
                  placeholder="Your full name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signerEmail">Email</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  placeholder="Your email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Signature</Label>
              <div className="rounded-md border bg-white">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    className: "w-full",
                    style: { width: "100%", height: 150 },
                  }}
                  penColor="#050403"
                />
              </div>
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear signature
              </button>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSign}
              disabled={
                submitting ||
                !signerName.trim() ||
                !signerEmail.trim()
              }
            >
              {submitting ? (
                <>
                  <LoaderIcon className="mr-2 size-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="mr-2 size-4" />
                  Confirm Order & Sign
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By signing, you agree to the order and payment terms outlined
              above.
            </p>
          </div>
        ) : selectedTerm ? (
          <div className="mb-6">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSign}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderIcon className="mr-2 size-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="mr-2 size-4" />
                  Confirm Order
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Payment will be collected on delivery.
            </p>
          </div>
        ) : null}

        {/* Reject / Decline */}
        <div className="border-t pt-6">
          {!showRejectForm ? (
            <button
              className="text-sm text-muted-foreground hover:text-red-600 transition-colors w-full text-center"
              onClick={() => setShowRejectForm(true)}
            >
              I don&apos;t want this order — decline
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
              <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">
                Decline Order
              </h3>
              <p className="text-sm text-muted-foreground">
                This will cancel the order and notify SPFarms.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="rejectReason">
                  Reason{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <textarea
                  id="rejectReason"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Let us know why you're declining..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={rejecting}
                >
                  {rejecting ? (
                    <>
                      <LoaderIcon className="mr-2 size-3.5 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    "Decline Order"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRejectForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Regular order detail (non-draft) ──
  return (
    <div className="rounded-2xl bg-white border shadow-sm p-8 md:p-10 max-w-5xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => router.push(`/${slug}/orders`)}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Orders
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order Summary</h1>
          <p className="text-xl text-muted-foreground mt-1">
            {order.order_number}
            {order.order_type === "preorder" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {ORDER_TYPE_LABELS.preorder}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClasses(order.status)}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <Button variant="outline" onClick={downloadInvoice}>
            <DownloadIcon className="mr-1.5 size-4" />
            Invoice PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-5 rounded-xl border p-5 text-base">
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-medium mt-0.5">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Desired Delivery</p>
              <p className="font-medium mt-0.5">
                {order.desired_delivery_date
                  ? new Date(order.desired_delivery_date).toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Shipping</p>
              <p className="font-medium mt-0.5">
                {formatLocation(order.shipping_location)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Billing</p>
              <p className="font-medium mt-0.5">
                {formatLocation(order.billing_location)}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border">
            <div className="px-5 py-4 border-b bg-muted/50">
              <h2 className="font-semibold text-base">Order Items</h2>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.product_name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base">
                      {item.product_name}
                      {order.order_type === "preorder" && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Pre-order
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium text-base">
                    {formatPrice(item.line_total)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t px-5 py-4 space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.payment_term_discount_amount &&
                parseFloat(order.payment_term_discount_amount) > 0 && (
                  <div className="flex justify-between text-base text-green-600">
                    <span>
                      Payment Discount ({order.payment_term_name})
                    </span>
                    <span>
                      -{formatPrice(order.payment_term_discount_amount)}
                    </span>
                  </div>
                )}
              {order.discount_details?.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between text-base text-green-600"
                >
                  <span>{d.name}</span>
                  <span>-{formatPrice(d.amount)}</span>
                </div>
              ))}
              {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">
                    Tax ({parseFloat(order.tax_rate || "0")}%)
                  </span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
              )}
              {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
              )}
              {order.delivery_fee_waived && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Delivery Fee Waived</span>
                  <span>$0.00</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes_to_vendor && (
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold text-base mb-2">
                Notes to Vendor
              </h3>
              <p className="text-base text-muted-foreground whitespace-pre-wrap">
                {order.notes_to_vendor}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            createdAt={order.created_at}
            desiredDeliveryDate={order.desired_delivery_date}
          />

          {/* People */}
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold text-base mb-3">People</h3>
            <div className="space-y-3">
              {order.order_users.map((ou) => (
                <div key={ou.id} className="text-base">
                  <p className="font-medium">{ou.full_name || ou.email}</p>
                  <p className="text-sm text-muted-foreground">{ou.email}</p>
                  {ou.phone_number && (
                    <p className="text-sm text-muted-foreground">
                      {ou.phone_number}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1 text-xs">
                    {ou.role === "orderer" ? "Ordered by" : "Contact"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="font-semibold text-base mb-2">Payment Terms</h3>
            <p className="text-base text-muted-foreground">
              {order.payment_term_name || "ACH / Bank Transfer"}
            </p>
          </div>

          {order.payment_term_agreement && (
            <div className="rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold text-base">Terms Agreement</h3>
              {order.payment_term_agreement.signed ? (
                <>
                  <div className="flex items-center gap-1.5 text-base text-green-600">
                    <CheckCircleIcon className="size-4" />
                    Signed by {order.payment_term_agreement.signer_name} on{" "}
                    {new Date(
                      order.payment_term_agreement.signed_at!
                    ).toLocaleDateString()}
                  </div>
                  {order.payment_term_agreement.signature_data && (
                    <div className="rounded-lg border bg-white p-2">
                      <img
                        src={order.payment_term_agreement.signature_data}
                        alt="Signature"
                        className="h-14 w-full object-contain"
                      />
                    </div>
                  )}
                </>
              ) : order.payment_term_agreement.expired ? (
                <p className="text-base text-red-500">
                  Agreement link has expired — contact SPFarms for a new one
                </p>
              ) : (
                <p className="text-base text-amber-600">
                  Agreement sent — check your email to review and sign
                </p>
              )}
            </div>
          )}

          {settings?.bank_info && (
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold text-base mb-2">
                Payment Information
              </h3>
              <p className="text-base text-muted-foreground whitespace-pre-wrap">
                {settings.bank_info}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
