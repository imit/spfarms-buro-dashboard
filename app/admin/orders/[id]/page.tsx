"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, DownloadIcon, CheckCircleIcon, BanknoteIcon, FileSignatureIcon, ExternalLinkIcon, ShieldAlertIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { apiClient, type Order, type OrderStatus, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import { EmailTimeline } from "@/components/email-timeline";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function formatLocation(loc: { name?: string | null; address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null } | null) {
  if (!loc) return "Not specified";
  const parts = [loc.name, loc.address, [loc.city, loc.state, loc.zip_code].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(" — ") || "Not specified";
}

const STATUSES = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [sendingBankInfo, setSendingBankInfo] = useState(false);
  const [sendingAgreement, setSendingAgreement] = useState(false);
  const [sendingLicenseReminder, setSendingLicenseReminder] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"bank_info" | "agreement" | "license_reminder" | null>(null);
  const [timelineKey, setTimelineKey] = useState(0);
  const [editingContacts, setEditingContacts] = useState(false);
  const [contactDrafts, setContactDrafts] = useState<{ full_name: string; email: string; phone_number: string }[]>([]);
  const [savingContacts, setSavingContacts] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const data = await apiClient.getOrder(Number(id));
        setOrder(data);
        setInternalNotes(data.internal_notes || "");
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const updated = await apiClient.updateOrder(Number(id), { status: newStatus });
      setOrder(updated);
      toast.success("Status updated");
    } catch {
      showError("update the order status");
    }
  };

  const saveInternalNotes = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.updateOrder(Number(id), { internal_notes: internalNotes });
      setOrder(updated);
      toast.success("Notes saved");
    } catch {
      showError("save the notes");
    } finally {
      setSaving(false);
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

  const downloadDeliveryAgreement = async () => {
    try {
      const blob = await apiClient.getOrderDeliveryAgreement(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delivery-agreement-${order?.order_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download the delivery agreement");
    }
  };

  const downloadPaymentTerms = async () => {
    try {
      const blob = await apiClient.getOrderPaymentTermsPdf(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-terms-${order?.order_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download the payment terms");
    }
  };

  const confirmAndSend = async () => {
    if (!confirmAction) return;
    if (confirmAction === "bank_info") await handleSendBankInfo();
    else if (confirmAction === "agreement") await handleSendAgreement();
    else if (confirmAction === "license_reminder") await handleSendLicenseReminder();
    setConfirmAction(null);
  };

  const handleSendBankInfo = async () => {
    setSendingBankInfo(true);
    try {
      await apiClient.sendBankInfo(Number(id));
      toast.success("Bank info email sent");
      setTimelineKey((k) => k + 1);
    } catch {
      showError("send bank info");
    } finally {
      setSendingBankInfo(false);
    }
  };

  const handleSendAgreement = async () => {
    setSendingAgreement(true);
    try {
      const updated = await apiClient.sendPaymentTermsAgreement(Number(id));
      setOrder(updated);
      toast.success("Payment terms agreement sent");
      setTimelineKey((k) => k + 1);
    } catch {
      showError("send payment terms agreement");
    } finally {
      setSendingAgreement(false);
    }
  };

  const handleSendLicenseReminder = async () => {
    setSendingLicenseReminder(true);
    try {
      await apiClient.sendLicenseReminder(Number(id));
      toast.success("License reminder sent");
      setTimelineKey((k) => k + 1);
    } catch {
      showError("send license reminder");
    } finally {
      setSendingLicenseReminder(false);
    }
  };

  const startEditingContacts = () => {
    const contacts = order?.order_users.filter((ou) => ou.role === "contact") ?? [];
    setContactDrafts(
      contacts.length > 0
        ? contacts.map((c) => ({ full_name: c.full_name || "", email: c.email, phone_number: c.phone_number || "" }))
        : [{ full_name: "", email: "", phone_number: "" }]
    );
    setEditingContacts(true);
  };

  const saveContacts = async () => {
    const valid = contactDrafts.filter((c) => c.email.trim());
    setSavingContacts(true);
    try {
      const updated = await apiClient.updateOrderContacts(Number(id), valid);
      setOrder(updated);
      setEditingContacts(false);
      toast.success("Contacts updated");
    } catch {
      showError("update the contacts");
    } finally {
      setSavingContacts(false);
    }
  };

  const markProcessingDone = async () => {
    try {
      const updated = await apiClient.markProcessingDone(Number(id));
      setOrder(updated);
      setShowDoneConfirm(false);
      toast.success("Order marked as fulfilled");
    } catch {
      showError("mark the order as fulfilled");
    }
  };

  if (isLoading) {
    return <p className="px-10 text-muted-foreground">Loading order...</p>;
  }

  if (!order) {
    return <p className="px-10 text-muted-foreground">Order not found.</p>;
  }

  const companyDetails = order.company_details;

  return (
    <div className="space-y-6 px-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/orders")}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back to Orders
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {order.order_number}
            {order.order_type === "preorder" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {ORDER_TYPE_LABELS.preorder}
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {order.company?.slug ? (
              <Link href={`/admin/companies/${order.company.slug}`} className="hover:underline">{order.company.name}</Link>
            ) : (
              order.company?.name ?? "Unknown company"
            )} — {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => {
              if (e.target.value !== order.status) {
                setPendingStatus(e.target.value);
              }
            }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setConfirmAction("bank_info")} disabled={sendingBankInfo}>
            <BanknoteIcon className="mr-1.5 size-4" />
            {sendingBankInfo ? "Sending..." : "Send Bank Info"}
          </Button>
          {order.payment_term_days != null && order.payment_term_days > 0 && (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("agreement")} disabled={sendingAgreement}>
              <FileSignatureIcon className="mr-1.5 size-4" />
              {sendingAgreement ? "Sending..." : "Send Terms Agreement"}
            </Button>
          )}
          {companyDetails && !companyDetails.license_number && (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("license_reminder")} disabled={sendingLicenseReminder}>
              <ShieldAlertIcon className="mr-1.5 size-4" />
              {sendingLicenseReminder ? "Sending..." : "License Reminder"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={downloadInvoice}>
            <DownloadIcon className="mr-1.5 size-4" />
            Invoice
          </Button>
          <Button variant="outline" size="sm" onClick={downloadDeliveryAgreement}>
            <FileSignatureIcon className="mr-1.5 size-4" />
            Delivery Agreement
          </Button>
          {order.payment_term_days != null && order.payment_term_days > 0 && (
            <Button variant="outline" size="sm" onClick={downloadPaymentTerms}>
              <DownloadIcon className="mr-1.5 size-4" />
              Payment Terms
            </Button>
          )}
          {order.status === "processing" && (
            <Button size="sm" onClick={() => setShowDoneConfirm(true)}>
              <CheckCircleIcon className="mr-1.5 size-4" />
              Mark Done
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground">Desired Delivery</p>
              <p className="font-medium">
                {order.desired_delivery_date
                  ? new Date(order.desired_delivery_date).toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Shipping</p>
              <p className="font-medium">{formatLocation(order.shipping_location)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Billing</p>
              <p className="font-medium">{formatLocation(order.billing_location)}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/50">
              <h3 className="font-semibold text-sm">Order Items</h3>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {item.product_name}
                      {order.order_type === "preorder" && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Pre-order
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium text-sm">
                    {formatPrice(item.line_total)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.payment_term_discount_amount && parseFloat(order.payment_term_discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Payment Discount ({order.payment_term_name})</span>
                  <span>-{formatPrice(order.payment_term_discount_amount)}</span>
                </div>
              )}
              {order.discount_details?.map((d, i) => (
                <div key={i} className="flex justify-between text-sm text-green-600">
                  <span>{d.name}</span>
                  <span>-{formatPrice(d.amount)}</span>
                </div>
              ))}
              {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({parseFloat(order.tax_rate || "0")}%)</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Vendor notes */}
          {order.notes_to_vendor && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-1">Notes from Customer</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes_to_vendor}</p>
            </div>
          )}

          {/* Internal notes */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="internalNotes" className="font-semibold">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              placeholder="Add internal notes about this order..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
            />
            <Button size="sm" onClick={saveInternalNotes} disabled={saving}>
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>

          {/* Email History */}
          <EmailTimeline key={timelineKey} orderId={Number(id)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* People on order */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Order People</h3>
              {!editingContacts && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingContacts}>
                  <PencilIcon className="mr-1 size-3" />
                  Edit
                </Button>
              )}
            </div>

            {editingContacts ? (
              <div className="space-y-4">
                {/* Show orderer as read-only */}
                {order.order_users.filter((ou) => ou.role === "orderer").map((ou) => (
                  <div key={ou.id} className="text-sm">
                    <p className="font-medium">{ou.full_name || ou.email}</p>
                    <p className="text-xs text-muted-foreground">{ou.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">Ordered by</Badge>
                  </div>
                ))}

                {/* Editable contacts */}
                <div className="border-t pt-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Contacts</p>
                  {contactDrafts.map((draft, i) => (
                    <div key={i} className="space-y-2 rounded border p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Contact {i + 1}</span>
                        {contactDrafts.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setContactDrafts((d) => d.filter((_, j) => j !== i))}
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Full name"
                        value={draft.full_name}
                        onChange={(e) => setContactDrafts((d) => d.map((c, j) => j === i ? { ...c, full_name: e.target.value } : c))}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={draft.email}
                        onChange={(e) => setContactDrafts((d) => d.map((c, j) => j === i ? { ...c, email: e.target.value } : c))}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Phone"
                        value={draft.phone_number}
                        onChange={(e) => setContactDrafts((d) => d.map((c, j) => j === i ? { ...c, phone_number: e.target.value } : c))}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => setContactDrafts((d) => [...d, { full_name: "", email: "", phone_number: "" }])}
                  >
                    <PlusIcon className="mr-1 size-3" />
                    Add Contact
                  </Button>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="text-xs h-7" onClick={saveContacts} disabled={savingContacts}>
                    {savingContacts ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingContacts(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {order.order_users.map((ou) => (
                  <div key={ou.id} className="text-sm">
                    <p className="font-medium">{ou.full_name || ou.email}</p>
                    <p className="text-xs text-muted-foreground">{ou.email}</p>
                    {ou.phone_number && (
                      <p className="text-xs text-muted-foreground">{ou.phone_number}</p>
                    )}
                    <Badge variant="outline" className="mt-1 text-xs">
                      {ou.role === "orderer" ? "Ordered by" : "Contact"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company details */}
          {companyDetails && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Company</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{companyDetails.name}</p>
                {companyDetails.license_number ? (
                  <p className="text-muted-foreground">OCM: {companyDetails.license_number}</p>
                ) : (
                  <p className="text-xs font-medium text-amber-600">Missing OCM license</p>
                )}
                {companyDetails.email && (
                  <p className="text-muted-foreground">{companyDetails.email}</p>
                )}
                {companyDetails.phone_number && (
                  <p className="text-muted-foreground">{companyDetails.phone_number}</p>
                )}

                {companyDetails.locations.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Locations</p>
                    {companyDetails.locations.map((loc) => (
                      <p key={loc.id} className="text-xs text-muted-foreground">
                        {loc.name && <span className="font-medium">{loc.name}: </span>}
                        {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {companyDetails.members.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Members</p>
                    {companyDetails.members.map((member) => (
                      <div key={member.id} className="text-xs text-muted-foreground">
                        {member.full_name || member.email}
                        {member.company_title && ` — ${member.company_title}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-1">Payment Terms</h3>
            <p className="text-sm text-muted-foreground">
              {order.payment_term_name || "ACH / Bank Transfer"}
            </p>
            {order.payment_terms_accepted_at && (
              <p className="text-xs text-green-600 mt-1">
                Accepted {new Date(order.payment_terms_accepted_at).toLocaleDateString()}
              </p>
            )}
            {order.payment_due_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Due {new Date(order.payment_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>

          {order.payment_term_agreement && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Terms Agreement</h3>

              {order.payment_term_agreement.signed ? (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircleIcon className="size-4" />
                    Signed
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {order.payment_term_agreement.signer_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {order.payment_term_agreement.signer_email}</p>
                    <p><span className="text-muted-foreground">Signed:</span> {new Date(order.payment_term_agreement.signed_at!).toLocaleString()}</p>
                    <p><span className="text-muted-foreground">IP:</span> {order.payment_term_agreement.signer_ip}</p>
                  </div>
                  {order.payment_term_agreement.signature_data && (
                    <div className="rounded-md border bg-white p-2">
                      <img
                        src={order.payment_term_agreement.signature_data}
                        alt="Signature"
                        className="h-16 w-full object-contain"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-amber-600">Awaiting signature</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {new Date(order.payment_term_agreement.sent_at!).toLocaleString()}
                  </p>
                  {order.payment_term_agreement.expired ? (
                    <p className="text-xs text-red-500">Link expired</p>
                  ) : order.payment_term_agreement.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(order.payment_term_agreement.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {order.payment_term_agreement.agreement_url && (
                <a
                  href={order.payment_term_agreement.agreement_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLinkIcon className="size-3.5" />
                  View Agreement
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change order status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the status from{" "}
              <strong>{ORDER_STATUS_LABELS[order.status]}</strong> to{" "}
              <strong>{ORDER_STATUS_LABELS[pendingStatus as OrderStatus]}</strong>.
              {pendingStatus === "fulfilled" || pendingStatus === "delivered" ? (
                <> This is an internal status — no email will be sent to the customer.</>
              ) : pendingStatus === "payment_received" ? (
                <> A payment received thank you email will be sent to all members of{" "}
                <strong>{order.company?.name ?? "the company"}</strong>.</>
              ) : (
                <> An email notification will be sent to all members of{" "}
                <strong>{order.company?.name ?? "the company"}</strong>.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (pendingStatus) {
                await updateStatus(pendingStatus);
                setPendingStatus(null);
              }
            }}>
              Confirm &amp; Notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDoneConfirm} onOpenChange={setShowDoneConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as fulfilled?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark order <strong>{order.order_number}</strong> as
              fulfilled and ready for delivery. No email will be sent to the
              customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markProcessingDone}>
              Mark Fulfilled
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "bank_info" && "Send bank info email?"}
              {confirmAction === "agreement" && "Send payment terms agreement?"}
              {confirmAction === "license_reminder" && "Send license reminder?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "bank_info" && (
                <>This will send a bank info email to all members of <strong>{order.company?.name ?? "the company"}</strong>.</>
              )}
              {confirmAction === "agreement" && (
                <>This will send a payment terms agreement for signing to all members of <strong>{order.company?.name ?? "the company"}</strong>. Any existing unsigned agreement will be replaced.</>
              )}
              {confirmAction === "license_reminder" && (
                <>This will send a license reminder email to all members of <strong>{order.company?.name ?? "the company"}</strong> asking them to add their license number.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSend}>
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
