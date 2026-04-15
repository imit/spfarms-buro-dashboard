"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { CheckCircleIcon, LoaderIcon, AlertCircleIcon, ShoppingBagIcon, MailIcon, CheckIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AgreementOrder {
  id: number;
  order_number: string;
  status: string;
  company_name: string;
  company_slug: string | null;
  total: string;
  subtotal: string;
  tax_amount: string | null;
  delivery_fee: string | null;
  delivery_fee_waived: boolean;
  payment_term_name: string | null;
  payment_term_days: number | null;
  payment_term_discount_percentage: string | null;
  payment_term_discount_amount: string | null;
  created_at: string;
  items: {
    product_name: string;
    strain_name: string | null;
    quantity: number;
    unit_price: string;
    line_total: string;
    is_bulk?: boolean;
    bulk_grams?: number | null;
    bulk_lbs?: number | null;
    bulk_price_per_pound?: number | null;
    coa_pdf_url?: string | null;
  }[];
}

interface PaymentTermOption {
  id: number;
  name: string;
  days: number;
  discount_percentage: string;
}

interface AgreementData {
  signed: boolean;
  signer_name: string | null;
  signed_at: string | null;
  requires_payment_term_selection: boolean;
  order: AgreementOrder;
  bank_info: string;
  payment_terms?: PaymentTermOption[];
  disable_payment_term_discount?: boolean;
}

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

export default function PaymentTermAgreementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoaderIcon className="size-6 animate-spin text-muted-foreground" /></div>}>
      <PaymentTermAgreementContent params={params} />
    </Suspense>
  );
}

function PaymentTermAgreementContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const sigRef = useRef<SignatureCanvas>(null);
  const [data, setData] = useState<AgreementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [rejected, setRejected] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Magic link auto-login: if magic_token is in the URL, log the user in
  // and redirect to the full order page. If it fails, stay here — this page
  // works fine without auth.
  const magicTokenAttempted = useRef(false);
  useEffect(() => {
    const magicToken = searchParams.get("magic_token");
    if (!magicToken || magicTokenAttempted.current) return;
    magicTokenAttempted.current = true;

    (async () => {
      try {
        const { user } = await apiClient.verifyMagicLink(magicToken);
        loginWithToken(user);
        // Redirect to the authenticated order page
        // We'll get the order info from the agreement data once loaded
      } catch {
        // Magic link failed — no problem, this page works without auth
      }
      // Clean magic_token from URL
      const p = new URLSearchParams(window.location.search);
      p.delete("magic_token");
      const clean = `${window.location.pathname}${p.toString() ? `?${p}` : ""}`;
      window.history.replaceState({}, "", clean);
    })();
  }, [searchParams, loginWithToken]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = body.error || "Agreement not found";
          setError(msg);
          posthog.capture("agreement_load_error", { error: msg, status: res.status });
          return;
        }
        const json = await res.json();
        setData(json.data);
        const o = json.data.order;
        posthog.capture("agreement_viewed", {
          order_number: o.order_number,
          company_name: o.company_name,
          company_slug: o.company_slug,
          total: o.total,
          payment_term_name: o.payment_term_name,
          payment_term_days: o.payment_term_days,
          already_signed: json.data.signed,
          is_draft: o.status === "draft",
        });
        if (json.data.signed) setSigned(true);
      } catch {
        setError("Failed to load agreement");
        posthog.capture("agreement_load_error", { error: "network_failure" });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-2">
          <AlertCircleIcon className="mx-auto size-10 text-muted-foreground" />
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please contact SPFarms if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { order } = data;
  const requiresTermSelection = data.requires_payment_term_selection;
  const selectedTerm = data.payment_terms?.find((t) => t.id === selectedTermId);
  const isCod = selectedTerm ? selectedTerm.days === 0 : false;

  const handleSign = async () => {
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
        `${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || "Failed to sign agreement";
        setError(msg);
        posthog.capture("agreement_sign_error", {
          error: msg,
          status: res.status,
          order_number: order.order_number,
          company_name: order.company_name,
        });
        return;
      }

      setSigned(true);
      posthog.capture("agreement_signed", {
        order_number: order.order_number,
        company_name: order.company_name,
        company_slug: order.company_slug,
        total: order.total,
        payment_term_name: order.payment_term_name || selectedTerm?.name,
        signer_name: signerName,
        signer_email: signerEmail,
      });
    } catch {
      setError("Failed to sign agreement");
      posthog.capture("agreement_sign_error", {
        error: "network_failure",
        order_number: order.order_number,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason || undefined }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to decline order");
        return;
      }
      setRejected(true);
      posthog.capture("agreement_rejected", {
        order_number: order.order_number,
        company_name: order.company_name,
        reason: rejectReason || undefined,
      });
    } catch {
      setError("Failed to decline order");
    } finally {
      setRejecting(false);
    }
  };

  // Compute estimated total with selected term discount
  const subtotalNum = parseFloat(order.subtotal) || 0;
  const discountDisabled = data?.disable_payment_term_discount ?? false;
  const discountPct = !discountDisabled && selectedTerm ? parseFloat(selectedTerm.discount_percentage) || 0 : 0;
  const termDiscount = subtotalNum * discountPct / 100;
  const afterDiscount = subtotalNum - termDiscount;
  const taxNum = parseFloat(order.tax_amount || "0") || 0;
  const deliveryNum = parseFloat(order.delivery_fee || "0") || 0;
  const estimatedTotal = requiresTermSelection && selectedTerm
    ? afterDiscount + taxNum + deliveryNum
    : parseFloat(order.total) || 0;

  if (rejected) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-md">
          <div className="mx-auto w-36">
            <Logo />
          </div>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
            <AlertCircleIcon className="size-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Order Declined</h1>
          <p className="text-muted-foreground">
            Order <strong>{order.order_number}</strong> has been declined.
            We&apos;ve notified SPFarms. If you change your mind, please contact us.
          </p>
          <a href="mailto:wholesale@spfarms.com">
            <Button variant="outline">
              <MailIcon className="mr-2 size-4" />
              Contact Us
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-md">
          <div className="mx-auto w-36">
            <Logo />
          </div>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="size-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">
            {requiresTermSelection ? "Order Confirmed" : "Agreement Signed"}
          </h1>
          <p className="text-muted-foreground">
            Thank you for {requiresTermSelection ? "confirming" : "signing the payment terms agreement for"} order{" "}
            <strong>{order.order_number}</strong>. We will be in touch regarding
            payment details.
          </p>
          {data.bank_info && (
            <div className="mt-4 rounded-lg border p-4 text-left">
              <h3 className="font-semibold text-sm mb-1">Payment Information</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.bank_info}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}/invoice`);
                  if (!res.ok) throw new Error();
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `invoice-${order.order_number}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch {
                  alert("Failed to download invoice");
                }
              }}
            >
              <DownloadIcon className="mr-2 size-4" />
              Download Invoice
            </Button>
            {order.company_slug && (
              <Link href={`/${order.company_slug}`}>
                <Button variant="outline">
                  <ShoppingBagIcon className="mr-2 size-4" />
                  Place Another Order
                </Button>
              </Link>
            )}
            <a href="mailto:wholesale@spfarms.com">
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {requiresTermSelection
              ? "Review & Confirm Order"
              : "Payment Terms Agreement"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Order {order.order_number} &middot; {order.company_name}
          </p>
        </div>
        <div className="w-32 shrink-0">
          <Logo />
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-lg border mb-6">
        <div className="px-4 py-3 border-b bg-muted/50">
          <h2 className="font-semibold text-sm">Order Summary</h2>
        </div>
        <div className="divide-y">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium">{item.product_name}</span>
                {item.is_bulk && item.bulk_lbs ? (
                  <span className="text-muted-foreground"> — {item.bulk_lbs % 1 === 0 ? item.bulk_lbs.toFixed(0) : item.bulk_lbs.toFixed(2)} lb{item.bulk_lbs !== 1 ? "s" : ""} ({item.bulk_grams}g) @ ${item.bulk_price_per_pound}/lb</span>
                ) : (
                  <>
                    {item.strain_name && (
                      <span className="text-muted-foreground"> ({item.strain_name})</span>
                    )}
                    <span className="text-muted-foreground"> x{item.quantity}</span>
                  </>
                )}
                {item.coa_pdf_url && (
                  <a href={item.coa_pdf_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-blue-600 hover:underline">COA</a>
                )}
              </div>
              <span>{formatPrice(item.line_total)}</span>
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
              <span>{selectedTerm.name} discount ({selectedTerm.discount_percentage}%)</span>
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
            <span>{formatPrice(requiresTermSelection ? estimatedTotal : order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Term Selection (for draft orders) */}
      {requiresTermSelection && data.payment_terms && (
        <div className="rounded-lg border p-4 mb-6">
          <h2 className="font-semibold text-sm mb-3">Select Payment Terms</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how you&apos;d like to pay for this order:
          </p>
          <div className="space-y-2">
            {data.payment_terms.map((term) => {
              const isSelected = selectedTermId === term.id;
              const discount = discountDisabled ? 0 : (parseFloat(term.discount_percentage) || 0);
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
                        {term.discount_percentage}% discount
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Terms (for non-draft orders with terms already set) */}
      {!requiresTermSelection && order.payment_term_name && (order.payment_term_days || 0) === 0 && (
        <div className="rounded-lg border p-4 mb-6 bg-muted/30">
          <h2 className="font-semibold text-sm mb-3">Order Confirmation</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              By confirming, <strong className="text-foreground">{order.company_name}</strong> agrees to pay{" "}
              <strong className="text-foreground">{formatPrice(order.total)}</strong> for order{" "}
              <strong className="text-foreground">{order.order_number}</strong> on delivery.
            </p>
            <p>Payment accepted via ACH, bank transfer, or check.</p>
          </div>
        </div>
      )}

      {!requiresTermSelection && order.payment_term_name && (order.payment_term_days || 0) > 0 && (
        <div className="rounded-lg border p-4 mb-6 bg-muted/30">
          <h2 className="font-semibold text-sm mb-3">Payment Terms Agreement</h2>
          <div className="space-y-3 text-sm">
            <p>
              This agreement confirms that <strong>{order.company_name}</strong> agrees to pay{" "}
              <strong>{formatPrice(order.total)}</strong> for order{" "}
              <strong>{order.order_number}</strong> within{" "}
              <strong>{order.payment_term_days} days</strong> of delivery.
            </p>
            <div className="rounded-md border bg-background p-3 space-y-1">
              <p><strong>Payment Term:</strong> {order.payment_term_name}</p>
              <p><strong>Amount Due:</strong> {formatPrice(order.total)}</p>
            </div>
            <p className="text-muted-foreground">
              Payment may be made via ACH transfer, direct bank transfer, or
              check. Late payments may result in a 1.5% monthly fee on overdue balances.
            </p>
          </div>
        </div>
      )}

      {/* Terms for draft orders with selected non-COD term */}
      {requiresTermSelection && selectedTerm && selectedTerm.days > 0 && (
        <div className="rounded-lg border p-4 mb-6 bg-muted/30">
          <h2 className="font-semibold text-sm mb-3">Payment Terms Agreement</h2>
          <div className="space-y-3 text-sm">
            <p>
              By signing below, <strong>{order.company_name}</strong> agrees to pay{" "}
              <strong>{formatPrice(estimatedTotal)}</strong> for order{" "}
              <strong>{order.order_number}</strong> within{" "}
              <strong>{selectedTerm.days} days</strong> of delivery ({selectedTerm.name}).
            </p>
            <p className="text-muted-foreground">
              Payment may be made via ACH transfer, direct bank transfer, or
              check. Late payments may result in a 1.5% monthly fee on overdue balances.
            </p>
          </div>
        </div>
      )}

      {/* Bank Info */}
      {data.bank_info && (
        <div className="rounded-lg border p-4 mb-6">
          <h3 className="font-semibold text-sm mb-1">Payment Information</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {data.bank_info}
          </p>
        </div>
      )}

      {/* Signature Section — skip for COD */}
      {isCod ? (
        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSign}
            disabled={submitting || (requiresTermSelection && !selectedTermId)}
          >
            {submitting ? "Confirming..." : "Confirm Order"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Payment will be collected on delivery.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">
            {requiresTermSelection ? "Confirm & Sign" : "Sign Agreement"}
          </h2>

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
              !signerEmail.trim() ||
              (requiresTermSelection && !selectedTermId)
            }
          >
            {submitting
              ? "Signing..."
              : requiresTermSelection
              ? "Confirm Order & Sign"
              : "Sign Agreement"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By signing, you agree to the {requiresTermSelection ? "order and " : ""}payment terms outlined above.
          </p>
        </div>
      )}

      {/* Decline section (draft orders only) */}
      {requiresTermSelection && (
        <div className="mt-8 border-t pt-6">
          {!showRejectForm ? (
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              onClick={() => setShowRejectForm(true)}
            >
              I don&apos;t want this order
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Decline this order?</p>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Reason (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={rejecting}
                >
                  {rejecting ? "Declining..." : "Decline Order"}
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
      )}
    </div>
  );
}
