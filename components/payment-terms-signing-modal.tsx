"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient, type PaymentTerm, type CheckoutPreview } from "@/lib/api";
import { CheckCircleIcon, LoaderIcon } from "lucide-react";
import { showError } from "@/lib/errors";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

interface PaymentTermsSigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName: string;
  paymentTerm: PaymentTerm;
  preview: CheckoutPreview | null;
  userFullName?: string;
  userEmail?: string;
  onSigned: (data: { signer_name: string; signer_email: string; signed_at: string }) => void;
}

export function PaymentTermsSigningModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  paymentTerm,
  preview,
  userFullName,
  userEmail,
  onSigned,
}: PaymentTermsSigningModalProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [signerName, setSignerName] = useState(userFullName || "");
  const [signerEmail, setSignerEmail] = useState(userEmail || "");
  const [submitting, setSubmitting] = useState(false);

  const discount = parseFloat(paymentTerm.discount_percentage);
  const canSign = signerName.trim() && signerEmail.trim();

  const handleSign = async () => {
    if (!canSign) return;
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    setSubmitting(true);
    try {
      const signatureData = sigRef.current.toDataURL("image/png");
      const result = await apiClient.signPaymentTermAgreement({
        company_id: companyId,
        payment_term_id: paymentTerm.id,
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
        signature_data: signatureData,
      });
      onSigned(result);
    } catch (err) {
      showError("sign the payment terms agreement", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Payment Terms Agreement</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {companyName}
          </p>
        </DialogHeader>

        {/* Order Summary */}
        {preview && (
          <div className="rounded-lg border">
            <div className="px-4 py-2.5 border-b bg-muted/50">
              <h3 className="font-semibold text-sm">Order Summary</h3>
            </div>
            <div className="divide-y">
              {preview.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-muted-foreground"> x{item.quantity}</span>
                  </div>
                  <span>{formatPrice(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-2.5">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(preview.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Terms Details */}
        <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
          <h3 className="font-semibold text-sm">Payment Terms</h3>
          <div className="text-sm space-y-3">
            <p>
              This agreement confirms that <strong>{companyName}</strong>{" "}
              agrees to pay SPFarms Cannabis
              {preview && <> the total amount of <strong>{formatPrice(preview.total)}</strong></>}
              {" "}under the following terms:
            </p>
            <div className="rounded-md border bg-background p-3 space-y-1">
              <p>
                <strong>Payment Term:</strong> {paymentTerm.name} ({paymentTerm.days} days)
              </p>
              {discount > 0 && (
                <p className="text-green-600">
                  A <strong>{discount}%</strong> discount is applied for this payment term.
                </p>
              )}
            </div>
            <p>
              Payment may be made via ACH transfer, direct bank transfer, or
              check (accepted by driver at time of delivery). Failure to pay within
              the agreed terms may result in suspension of future orders.
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
                listed in this order.
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
                payable.
              </li>
            </ol>
          </div>
        </div>

        {/* Signature Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Sign Agreement</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-signer-name">Full Name</Label>
              <Input
                id="modal-signer-name"
                placeholder="Your full name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-signer-email">Email</Label>
              <Input
                id="modal-signer-email"
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
            disabled={submitting || !canSign}
          >
            {submitting ? (
              <>
                <LoaderIcon className="mr-2 size-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign & Accept Payment Terms"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By signing, you agree to the payment terms outlined above on behalf of {companyName}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentTermsSignedBadge({
  signerName,
  signedAt,
}: {
  signerName: string;
  signedAt: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 p-4">
      <CheckCircleIcon className="size-5 text-green-600 shrink-0" />
      <div>
        <p className="text-sm font-medium text-green-800">
          Payment terms agreement signed
        </p>
        <p className="text-xs text-green-600">
          Signed by {signerName} on{" "}
          {new Date(signedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
