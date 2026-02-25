"use client";

import { use, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircleIcon, LoaderIcon, AlertCircleIcon } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AgreementOrder {
  order_number: string;
  company_name: string;
  total: string;
  subtotal: string;
  payment_term_name: string;
  payment_term_days: number;
  payment_term_discount_percentage: string;
  created_at: string;
  items: {
    product_name: string;
    strain_name: string | null;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
}

interface AgreementData {
  signed: boolean;
  signer_name: string | null;
  signed_at: string | null;
  order: AgreementOrder;
  bank_info: string;
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
  const { token } = use(params);
  const sigRef = useRef<SignatureCanvas>(null);
  const [data, setData] = useState<AgreementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "Agreement not found");
          return;
        }
        const json = await res.json();
        setData(json.data);
        if (json.data.signed) setSigned(true);
      } catch {
        setError("Failed to load agreement");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token]);

  const handleSign = async () => {
    if (!signerName.trim() || !signerEmail.trim()) return;
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    setSubmitting(true);
    try {
      const signatureData = sigRef.current.toDataURL("image/png");
      const res = await fetch(
        `${API_BASE_URL}/api/v1/public/payment_term_agreements/${token}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signer_name: signerName,
            signer_email: signerEmail,
            signature_data: signatureData,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to sign agreement");
        return;
      }

      setSigned(true);
    } catch {
      setError("Failed to sign agreement");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-md">
          <CheckCircleIcon className="mx-auto size-12 text-green-500" />
          <h1 className="text-2xl font-bold">Agreement Signed</h1>
          <p className="text-muted-foreground">
            Thank you for signing the payment terms agreement for order{" "}
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
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Payment Terms Agreement</h1>
        <p className="text-muted-foreground mt-1">
          Order {order.order_number} &middot; {order.company_name}
        </p>
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
                {item.strain_name && (
                  <span className="text-muted-foreground"> ({item.strain_name})</span>
                )}
                <span className="text-muted-foreground"> x{item.quantity}</span>
              </div>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between font-semibold mt-1">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="rounded-lg border p-4 mb-6 bg-muted/30">
        <h2 className="font-semibold text-sm mb-3">Payment Terms</h2>
        <div className="space-y-3 text-sm">
          <p>
            This agreement confirms that <strong>{order.company_name}</strong>{" "}
            agrees to pay SPFarms Cannabis the total amount of{" "}
            <strong>{formatPrice(order.total)}</strong> for order{" "}
            <strong>{order.order_number}</strong> under the following terms:
          </p>
          <div className="rounded-md border bg-background p-3 space-y-1">
            <p>
              <strong>Payment Term:</strong> {order.payment_term_name} ({order.payment_term_days} days)
            </p>
            <p>
              <strong>Due Date:</strong>{" "}
              {new Date(
                new Date(order.created_at).getTime() + order.payment_term_days * 86400000
              ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p>
              <strong>Amount Due:</strong> {formatPrice(order.total)}
            </p>
          </div>
          <p>
            Payment may be made via ACH transfer, direct bank transfer, or
            check (accepted by driver at time of delivery). Failure to pay within
            the agreed terms may result in suspension of future orders.
          </p>
        </div>
      </div>

      {/* Bank Info */}
      {data.bank_info && (
        <div className="rounded-lg border p-4 mb-6">
          <h3 className="font-semibold text-sm mb-1">Payment Information</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {data.bank_info}
          </p>
        </div>
      )}

      {/* Signature Section */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Sign Agreement</h2>

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
          disabled={submitting || !signerName.trim() || !signerEmail.trim()}
        >
          {submitting ? "Signing..." : "Sign Agreement"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By signing, you agree to the payment terms outlined above.
        </p>
      </div>
    </div>
  );
}
