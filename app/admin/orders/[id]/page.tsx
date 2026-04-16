"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon, DownloadIcon, CheckCircleIcon, BanknoteIcon,
  FileSignatureIcon, ExternalLinkIcon, ShieldAlertIcon, PencilIcon,
  PlusIcon, Trash2Icon, MailIcon, ChevronDownIcon, MessageSquareIcon,
  SendIcon, UploadIcon, ImageIcon, XIcon, FileTextIcon,
  TruckIcon, CalendarIcon, ClockIcon, PackageIcon, AlertTriangleIcon,
} from "lucide-react";
import {
  apiClient, type Order, type OrderStatus, type Comment, type Label as LabelType, type SheetLayout,
  type PaymentStatus, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/api";
import { statusBadgeClasses, STATUS_COLORS, TIMELINE_STEPS, getStepIndex } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import { EmailTimeline } from "@/components/email-timeline";
import { buildBoxLabelHtml } from "@/lib/box-label";

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function formatLocation(loc: { name?: string | null; address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null } | null) {
  if (!loc) return "Not specified";
  const parts = [loc.name, loc.address, [loc.city, loc.state, loc.zip_code].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(" — ") || "Not specified";
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUSES = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [sendStatusEmail, setSendStatusEmail] = useState(true);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [sendingBankInfo, setSendingBankInfo] = useState(false);
  const [sendingAgreement, setSendingAgreement] = useState(false);
  const [sendingLicenseReminder, setSendingLicenseReminder] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"bank_info" | "agreement" | "license_reminder" | null>(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardingSending, setForwardingSending] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);
  const [editingContacts, setEditingContacts] = useState(false);
  const [contactDrafts, setContactDrafts] = useState<{ full_name: string; email: string; phone_number: string }[]>([]);
  const [savingContacts, setSavingContacts] = useState(false);
  const [selectedOrdererId, setSelectedOrdererId] = useState<number | null>(null);
  const [editingLocations, setEditingLocations] = useState(false);
  const [shippingLocationId, setShippingLocationId] = useState<string>("");
  const [billingLocationId, setBillingLocationId] = useState<string>("");
  const [savingLocations, setSavingLocations] = useState(false);
  const [editingPrices, setEditingPrices] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, number>>({});
  const [removedItemIds, setRemovedItemIds] = useState<Set<number>>(new Set());
  const [savingPrices, setSavingPrices] = useState(false);
  const [sendPriceNotification, setSendPriceNotification] = useState(true);
  const [priceCustomMessage, setPriceCustomMessage] = useState("");
  const [resendOrderEmail, setResendOrderEmail] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "delivery" | "payment">("activity");

  // METRC import state
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [sheetLayouts, setSheetLayouts] = useState<SheetLayout[]>([]);
  const [metrcImportItemId, setMetrcImportItemId] = useState<number | null>(null);
  const [metrcLabelId, setMetrcLabelId] = useState("");
  const [metrcFiles, setMetrcFiles] = useState<File[]>([]);
  const [metrcImporting, setMetrcImporting] = useState(false);
  const [metrcPrintSetId, setMetrcPrintSetId] = useState<number | null>(null);
  const [metrcSheetLayoutId, setMetrcSheetLayoutId] = useState("");
  const [metrcPrinting, setMetrcPrinting] = useState(false);
  const [showPrintAllMetrc, setShowPrintAllMetrc] = useState(false);
  const [printAllSheetLayoutId, setPrintAllSheetLayoutId] = useState("");
  const [printAllPrinting, setPrintAllPrinting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const [data, commentsData] = await Promise.all([
          apiClient.getOrder(Number(id)),
          apiClient.getOrderComments(Number(id)),
        ]);
        setOrder(data);
        setInternalNotes(data.internal_notes || "");
        setComments(commentsData);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    apiClient.getLabels().then(setLabels).catch(() => {});
    apiClient.getSheetLayouts().then(setSheetLayouts).catch(() => {});
  }, [isAuthenticated, id]);

  // Auto-poll when any METRC sets are still processing
  useEffect(() => {
    if (!order) return;
    const hasProcessing = order.items?.some((i) =>
      i.metrc_label_sets?.some((ms) => ms.processing_status === "processing")
    );
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiClient.getOrder(Number(id));
        setOrder(data);
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, id]);

  const updateStatus = async (newStatus: string, sendNotification = true) => {
    try {
      const updated = await apiClient.updateOrder(Number(id), { status: newStatus }, sendNotification);
      setOrder(updated);
      toast.success(sendNotification ? "Status updated" : "Status updated (no email sent)");
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showError("download the payment terms");
    }
  };

  const printBoxLabel = () => {
    if (!order) return;
    const shipping = order.shipping_location;
    const win = window.open("", "_blank", "width=600,height=400");
    if (!win) return;
    const address = shipping
      ? [shipping.address, [shipping.city, shipping.state, shipping.zip_code].filter(Boolean).join(", ")].filter(Boolean).join(", ")
      : "";
    win.document.write(buildBoxLabelHtml({
      orderNumber: order.order_number,
      companyName: order.company?.name ?? "",
      address,
      deliveryDate: order.desired_delivery_date ? new Date(order.desired_delivery_date).toLocaleDateString() : null,
      items: order.items.map((i) => ({ name: i.product_name, qty: i.quantity })),
    }));
    win.document.close();
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
    } catch { showError("send bank info"); }
    finally { setSendingBankInfo(false); }
  };

  const handleSendAgreement = async () => {
    setSendingAgreement(true);
    try {
      const updated = await apiClient.sendPaymentTermsAgreement(Number(id));
      setOrder(updated);
      toast.success("Payment terms agreement sent");
      setTimelineKey((k) => k + 1);
    } catch { showError("send payment terms agreement"); }
    finally { setSendingAgreement(false); }
  };

  const handleSendLicenseReminder = async () => {
    setSendingLicenseReminder(true);
    try {
      await apiClient.sendLicenseReminder(Number(id));
      toast.success("License reminder sent");
      setTimelineKey((k) => k + 1);
    } catch { showError("send license reminder"); }
    finally { setSendingLicenseReminder(false); }
  };

  const togglePaymentTermDiscount = async () => {
    if (!order) return;
    try {
      const updated = await apiClient.updateOrder(Number(id), {
        disable_payment_term_discount: !order.disable_payment_term_discount,
      });
      setOrder(updated);
      toast.success(updated.disable_payment_term_discount ? "Payment term discount disabled" : "Payment term discount enabled");
    } catch {
      showError("toggle payment term discount");
    }
  };

  const startEditingContacts = () => {
    const contacts = order?.order_users.filter((ou) => ou.role === "contact") ?? [];
    const orderer = order?.order_users.find((ou) => ou.role === "orderer");
    setSelectedOrdererId(orderer?.user_id ?? null);
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
      const currentOrderer = order?.order_users.find((ou) => ou.role === "orderer");
      let updated: Order | undefined;
      if (selectedOrdererId && selectedOrdererId !== currentOrderer?.user_id) {
        updated = await apiClient.updateOrderOrderer(Number(id), selectedOrdererId);
      }
      updated = await apiClient.updateOrderContacts(Number(id), valid);
      setOrder(updated);
      setEditingContacts(false);
      toast.success("Order people updated");
    } catch { showError("update the order people"); }
    finally { setSavingContacts(false); }
  };

  const markProcessingDone = async () => {
    try {
      const updated = await apiClient.markProcessingDone(Number(id));
      setOrder(updated);
      setShowDoneConfirm(false);
      toast.success("Order marked as fulfilled");
    } catch { showError("mark the order as fulfilled"); }
  };

  const startEditingLocations = () => {
    if (!order) return;
    setShippingLocationId(order.shipping_location?.id ? String(order.shipping_location.id) : "");
    setBillingLocationId(order.billing_location?.id ? String(order.billing_location.id) : "");
    setEditingLocations(true);
  };

  const saveLocations = async () => {
    if (!order) return;
    setSavingLocations(true);
    try {
      const data: { shipping_location_id?: number; billing_location_id?: number } = {};
      if (shippingLocationId) data.shipping_location_id = Number(shippingLocationId);
      if (billingLocationId) data.billing_location_id = Number(billingLocationId);
      const updated = await apiClient.updateOrder(Number(id), data);
      setOrder(updated);
      setEditingLocations(false);
      toast.success("Locations updated");
    } catch { showError("update the locations"); }
    finally { setSavingLocations(false); }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const comment = await apiClient.createOrderComment(Number(id), newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    } catch { showError("add the comment"); }
    finally { setPostingComment(false); }
  };

  const refreshComments = async () => {
    try { const data = await apiClient.getOrderComments(Number(id)); setComments(data); } catch {}
  };

  const handleDeleteOrder = async () => {
    if (!order || deleteConfirmText !== order.order_number) return;
    setDeleting(true);
    try {
      await apiClient.deleteOrder(Number(id));
      router.push("/admin/orders");
    } catch {
      showError("delete the order");
    } finally {
      setDeleting(false);
    }
  };

  const handleForwardOrder = async () => {
    if (!order || !forwardEmail) return;
    setForwardingSending(true);
    try {
      await apiClient.resendOrderEmail(order.id, forwardEmail);
      setShowForwardDialog(false);
      toast.success(`Order sent to ${forwardEmail}`);
      setTimelineKey((k) => k + 1);
    } catch { showError("send the order email"); }
    finally { setForwardingSending(false); }
  };

  const handleMetrcImport = async () => {
    if (!order || !metrcImportItemId || !metrcLabelId || metrcFiles.length === 0) return;
    setMetrcImporting(true);
    try {
      await apiClient.batchImportOrderMetrc(order.id, metrcImportItemId, metrcLabelId, metrcFiles);
      const updated = await apiClient.getOrder(order.id);
      setOrder(updated);
      setMetrcImportItemId(null);
      setMetrcFiles([]);
      setMetrcLabelId("");
      toast.success(`${metrcFiles.length} METRC file${metrcFiles.length !== 1 ? "s" : ""} imported`);
    } catch (err) {
      showError("import METRC labels");
    } finally {
      setMetrcImporting(false);
    }
  };

  const handleMetrcPrint = async () => {
    if (!order || !metrcPrintSetId || !metrcSheetLayoutId) return;
    setMetrcPrinting(true);
    const setId = metrcPrintSetId;
    setMetrcPrintSetId(null);
    toast.info("Generating PDF...");
    try {
      await apiClient.requestMetrcPrint(order.id, setId, metrcSheetLayoutId);
      let status = "generating";
      while (status === "generating") {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await apiClient.getMetrcPrintStatus(order.id, setId);
        status = res.print_status;
      }
      if (status === "done") {
        const blob = await apiClient.downloadMetrcPrint(order.id, setId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${order.order_number}-metrc-set-${setId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      } else {
        toast.error("Failed to generate PDF");
      }
    } catch {
      showError("print METRC labels");
    } finally {
      setMetrcPrinting(false);
    }
  };

  const handleDeleteMetrcSet = async (setId: number) => {
    if (!order) return;
    try {
      const updated = await apiClient.deleteOrderMetrcSet(order.id, setId);
      setOrder(updated);
      toast.success("METRC set deleted");
    } catch {
      showError("delete METRC set");
    }
  };

  const handlePrintAllMetrc = async () => {
    if (!order || !printAllSheetLayoutId) return;
    setPrintAllPrinting(true);
    try {
      const blob = await apiClient.printAllOrderMetrcLabels(order.id, printAllSheetLayoutId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.order_number}-all-metrc-labels.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowPrintAllMetrc(false);
      toast.success("PDF downloaded");
    } catch {
      showError("print all METRC labels");
    } finally {
      setPrintAllPrinting(false);
    }
  };

  // Download each METRC set as a separate PDF (async)
  const handlePrintEachMetrc = async () => {
    if (!order || !printAllSheetLayoutId) return;
    setPrintAllPrinting(true);
    setShowPrintAllMetrc(false);
    toast.info("Generating PDFs in background...");
    try {
      const allSets = order.items.flatMap((item) => {
        const sets = (item.metrc_label_sets ?? []).filter((ms) => ms.processing_status !== "processing");
        return sets.map((ms, idx) => ({
          ...ms,
          productName: item.product_name,
          setIndex: idx + 1,
          setTotal: sets.length,
        }));
      });
      // Request all prints
      for (const ms of allSets) {
        await apiClient.requestMetrcPrint(order.id, ms.id, printAllSheetLayoutId);
      }
      // Poll and download each
      for (const ms of allSets) {
        let status = "generating";
        while (status === "generating") {
          await new Promise((r) => setTimeout(r, 3000));
          const res = await apiClient.getMetrcPrintStatus(order.id, ms.id);
          status = res.print_status;
        }
        if (status === "done") {
          const blob = await apiClient.downloadMetrcPrint(order.id, ms.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${order.order_number}-${ms.productName}${ms.setTotal > 1 ? `-set${ms.setIndex}of${ms.setTotal}` : ""}-${ms.item_count}tags.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          toast.error(`Failed: ${ms.productName}`);
        }
      }
      toast.success(`${allSets.length} PDFs downloaded`);
    } catch {
      showError("print METRC labels");
    } finally {
      setPrintAllPrinting(false);
    }
  };

  const totalMetrcLabels = order?.items.reduce((sum, item) =>
    sum + (item.metrc_label_sets ?? []).reduce((s, ms) => s + ms.item_count, 0), 0
  ) ?? 0;

  const startEditingPrices = () => {
    if (!order) return;
    const prices: Record<number, string> = {};
    const qtys: Record<number, number> = {};
    order.items.forEach((item) => {
      prices[item.id] = parseFloat(item.unit_price).toFixed(2);
      qtys[item.id] = item.quantity;
    });
    setPriceDrafts(prices);
    setQtyDrafts(qtys);
    setRemovedItemIds(new Set());
    setSendPriceNotification(true);
    setPriceCustomMessage("");
    setResendOrderEmail(false);
    setEditingPrices(true);
  };

  const savePrices = async () => {
    if (!order) return;
    const remainingItems = order.items.filter((item) => !removedItemIds.has(item.id));
    if (remainingItems.length === 0) {
      toast.error("Can't remove all items from an order");
      return;
    }
    setSavingPrices(true);
    try {
      const items = remainingItems.map((item) => ({
        id: item.id,
        unit_price: priceDrafts[item.id] || item.unit_price,
        quantity: qtyDrafts[item.id] ?? item.quantity,
      }));
      const updated = await apiClient.updateOrderItems(
        Number(id),
        items,
        Array.from(removedItemIds),
        resendOrderEmail
      );
      setOrder(updated);
      setEditingPrices(false);
      refreshComments();
      toast.success("Order items updated");
    } catch { showError("update the order items"); }
    finally { setSavingPrices(false); }
  };

  if (isLoading) return <p className="px-4 sm:px-10 text-muted-foreground">Loading order...</p>;
  if (!order) return <p className="px-4 sm:px-10 text-muted-foreground">Order not found.</p>;

  const companyDetails = order.company_details;
  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isPaidStatus = order.status === "payment_received";

  return (
    <div className="space-y-6 px-4 pb-6 sm:px-10 sm:pb-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/orders")}>
          <ArrowLeftIcon className="mr-1.5 size-4" />
          Orders
        </Button>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MailIcon className="mr-1.5 size-4" />
                Email
                <ChevronDownIcon className="ml-1.5 size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={async () => {
                try {
                  const members = order.company_details?.members ?? companyDetails?.members ?? [];
                  if (members.length === 0) { toast.error("No company members to send to"); return; }
                  for (const m of members) {
                    await apiClient.resendOrderEmail(order.id, m.email);
                  }
                  toast.success(`Order email resent to ${members.map((m) => m.email).join(", ")}`);
                  setTimelineKey((k) => k + 1);
                } catch { showError("resend the order email"); }
              }}>
                <MailIcon className="mr-2 size-4" />
                Resend Order Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setShowForwardDialog(true); setForwardEmail(""); }}>
                <SendIcon className="mr-2 size-4" />
                Forward Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmAction("bank_info")} disabled={sendingBankInfo}>
                <BanknoteIcon className="mr-2 size-4" />
                {sendingBankInfo ? "Sending..." : "Bank Info"}
              </DropdownMenuItem>
              {order.payment_term_days != null && order.payment_term_days > 0 && (
                <DropdownMenuItem onClick={() => setConfirmAction("agreement")} disabled={sendingAgreement}>
                  <FileSignatureIcon className="mr-2 size-4" />
                  {sendingAgreement ? "Sending..." : "Terms Agreement"}
                </DropdownMenuItem>
              )}
              {companyDetails && !companyDetails.license_number && (
                <DropdownMenuItem onClick={() => setConfirmAction("license_reminder")} disabled={sendingLicenseReminder}>
                  <ShieldAlertIcon className="mr-2 size-4" />
                  {sendingLicenseReminder ? "Sending..." : "License Reminder"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon className="mr-1.5 size-4" />
                PDF
                <ChevronDownIcon className="ml-1.5 size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadInvoice}>Invoice</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadDeliveryAgreement}>Delivery Agreement</DropdownMenuItem>
              {order.payment_term_days != null && order.payment_term_days > 0 && (
                <DropdownMenuItem onClick={downloadPaymentTerms}>Payment Terms</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={printBoxLabel}>Box Label</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero header */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{order.order_number}</h2>
              {order.order_type === "preorder" && (
                <Badge variant="secondary">Pre-order</Badge>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              {order.payment_status && order.payment_status !== "unpaid" && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  order.payment_status === "paid" ? "bg-green-100 text-green-700" :
                  order.payment_status === "overdue" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {PAYMENT_STATUS_LABELS[order.payment_status]}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {order.company?.slug ? (
                <Link href={`/admin/companies/${order.company.slug}`} className="hover:underline font-medium">{order.company.name}</Link>
              ) : (
                order.company?.name ?? "Unknown company"
              )}
              {" · "}
              {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{formatPrice(order.total)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Key info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <CalendarIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Desired Delivery</p>
              <p className="text-sm font-medium">{formatDate(order.desired_delivery_date) || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <TruckIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Delivered</p>
              <p className="text-sm font-medium">{formatDate(order.delivered_at) || "Pending"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <BanknoteIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Terms</p>
              <p className="text-sm font-medium">
                {order.payment_term_name
                  ? `${order.payment_term_name}${order.payment_term_days ? ` · Net ${order.payment_term_days}` : ""}`
                  : "COD"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <ClockIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Payment Due</p>
              <p className="text-sm font-medium">{formatDate(order.payment_due_date) || "—"}</p>
            </div>
          </div>
        </div>

        {/* Progress timeline */}
        {!isCancelled && !isPaidStatus && (
          <div className="pt-5 mt-5 border-t">
            <div className="flex items-center gap-0">
              {TIMELINE_STEPS.map((step, i) => {
                const isActive = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`size-3 rounded-full border-2 transition-colors ${
                        isCurrent ? "border-primary bg-primary scale-125" :
                        isActive ? "border-primary bg-primary" :
                        "border-muted-foreground/30 bg-transparent"
                      }`} />
                      <span className={`text-[10px] mt-1.5 whitespace-nowrap hidden sm:block ${
                        isCurrent ? "font-semibold text-foreground" :
                        isActive ? "text-muted-foreground" :
                        "text-muted-foreground/50"
                      }`}>{step.label}</span>
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mt-[-16px] ${isActive && i < currentStep ? "bg-primary" : "bg-muted-foreground/15"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status actions */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t">
          <span className="text-xs text-muted-foreground mr-1">Change status:</span>
          <select
            value={order.status}
            onChange={(e) => { if (e.target.value !== order.status) setPendingStatus(e.target.value); }}
            className="flex h-8 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {order.status === "processing" && (
            <Button size="sm" className="h-8" onClick={() => setShowDoneConfirm(true)}>
              <CheckCircleIcon className="mr-1.5 size-3.5" />
              Mark Fulfilled
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <div className="rounded-xl border bg-card shadow-xs">
            <div className="px-3 sm:px-5 py-3.5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Order Items</h3>
              <div className="flex items-center gap-1">
                {!editingPrices && totalMetrcLabels > 0 && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setShowPrintAllMetrc(true); setPrintAllSheetLayoutId(""); }}>
                    <FileTextIcon className="mr-1 size-3" />
                    Print All ({totalMetrcLabels})
                  </Button>
                )}
                {!editingPrices && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingPrices}>
                    <PencilIcon className="mr-1 size-3" />
                    Edit Items
                  </Button>
                )}
              </div>
            </div>
            <div className="divide-y">
              {order.items.map((item) => {
                const isRemoved = removedItemIds.has(item.id);
                return (
                <div key={item.id} className={`px-3 sm:px-5 py-3 space-y-2 ${editingPrices && isRemoved ? "opacity-40" : ""}`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="size-10 sm:size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.product_name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <PackageIcon className="size-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${editingPrices && isRemoved ? "line-through" : ""}`}>{item.product_name}</p>
                      {editingPrices && !isRemoved ? (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input
                            type="number" step="0.01" min="0"
                            className="h-7 w-24 text-sm"
                            value={priceDrafts[item.id] ?? ""}
                            onChange={(e) => setPriceDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                          />
                          <span className="text-xs text-muted-foreground">×</span>
                          <Input
                            type="number" step="1" min="1"
                            className="h-7 w-16 text-sm"
                            value={qtyDrafts[item.id] ?? item.quantity}
                            onChange={(e) => setQtyDrafts((d) => ({ ...d, [item.id]: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{formatPrice(item.unit_price)} × {item.quantity}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingPrices ? (
                        isRemoved ? (
                          <Button
                            variant="ghost" size="sm" className="h-7 text-xs"
                            onClick={() => setRemovedItemIds((s) => { const n = new Set(s); n.delete(item.id); return n; })}
                          >
                            Undo
                          </Button>
                        ) : (
                          <>
                            <div className="font-medium text-sm tabular-nums">
                              {formatPrice((parseFloat(priceDrafts[item.id] || "0") * (qtyDrafts[item.id] ?? item.quantity)).toFixed(2))}
                            </div>
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setRemovedItemIds((s) => new Set(s).add(item.id))}
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </>
                        )
                      ) : (
                        <>
                          <div className="font-medium text-sm tabular-nums">
                            {formatPrice(item.line_total)}
                          </div>
                          <Button
                            variant="outline" size="sm" className="h-7 text-xs shrink-0"
                            onClick={() => { setMetrcImportItemId(item.id); setMetrcLabelId(""); setMetrcFiles([]); }}
                          >
                            <UploadIcon className="mr-1 size-3" />
                            METRC
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Imported METRC sets for this item */}
                  {(item.metrc_label_sets ?? []).length > 0 && (() => {
                    const totalMetrc = item.metrc_label_sets!.reduce((s, ms) => s + ms.item_count, 0);
                    const mismatch = totalMetrc !== item.quantity;
                    return (
                      <div className="ml-13 sm:ml-16 space-y-1">
                        {item.metrc_label_sets!.map((ms, msIdx) => (
                          <div key={ms.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                            <FileTextIcon className="size-3 shrink-0" />
                            {item.metrc_label_sets!.length > 1 && (
                              <span className="font-medium text-foreground">{msIdx + 1}/{item.metrc_label_sets!.length}</span>
                            )}
                            <span className="truncate">{ms.label_name}</span>
                            {ms.processing_status === "processing" ? (
                              <span className="text-[10px] text-amber-600 animate-pulse font-medium">Processing...</span>
                            ) : ms.processing_status === "failed" ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Failed</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ms.item_count} labels</Badge>
                            )}
                            <div className="ml-auto flex items-center gap-1">
                              <Button
                                variant="ghost" size="sm" className="h-5 text-[10px] px-1.5"
                                onClick={() => { setMetrcPrintSetId(ms.id); setMetrcSheetLayoutId(""); }}
                              >
                                Print
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMetrcSet(ms.id)}
                              >
                                <Trash2Icon className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {mismatch && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 rounded px-2 py-1">
                            <AlertTriangleIcon className="size-3 shrink-0" />
                            METRC count mismatch: {totalMetrc} label{totalMetrc !== 1 ? "s" : ""} imported but order qty is {item.quantity}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
              })}
            </div>
            {editingPrices && (
              <div className="border-t px-3 sm:px-5 py-3.5 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={resendOrderEmail} onChange={(e) => setResendOrderEmail(e.target.checked)} className="rounded border-gray-300" />
                  Resend order email to company
                </label>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7" onClick={savePrices} disabled={savingPrices}>
                    {savingPrices ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingPrices(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {/* Totals */}
            <div className="border-t px-3 sm:px-5 py-3.5 space-y-1 bg-muted/30">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={order.disable_payment_term_discount}
                    onChange={togglePaymentTermDiscount}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs">Disable payment term discount</span>
                </label>
              </div>
              {order.payment_term_discount_amount && parseFloat(order.payment_term_discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600"><span>Discount ({order.payment_term_name})</span><span>-{formatPrice(order.payment_term_discount_amount)}</span></div>
              )}
              {order.discount_details?.map((d, i) => (
                <div key={i} className="flex justify-between text-sm text-green-600"><span>{d.name}</span><span>-{formatPrice(d.amount)}</span></div>
              ))}
              {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({parseFloat(order.tax_rate || "0")}%)</span><span>{formatPrice(order.tax_amount)}</span></div>
              )}
              {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{formatPrice(order.delivery_fee)}</span></div>
              )}
              {order.delivery_fee_waived && (
                <div className="flex justify-between text-sm text-green-600"><span>Delivery Waived</span><span>$0.00</span></div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1.5 border-t"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Locations */}
          <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Locations</h3>
              {!editingLocations && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingLocations}>
                  <PencilIcon className="mr-1 size-3" />
                  Edit
                </Button>
              )}
            </div>
            {editingLocations ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Shipping</Label>
                  <select value={shippingLocationId} onChange={(e) => setShippingLocationId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
                    <option value="">Select a location</option>
                    {companyDetails?.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name || loc.address} — {loc.city}, {loc.state} {loc.zip_code}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Billing</Label>
                  <select value={billingLocationId} onChange={(e) => setBillingLocationId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
                    <option value="">Select a location</option>
                    {companyDetails?.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name || loc.address} — {loc.city}, {loc.state} {loc.zip_code}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7" onClick={saveLocations} disabled={savingLocations}>{savingLocations ? "Saving..." : "Save"}</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingLocations(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Shipping</p>
                  <p className="font-medium">{formatLocation(order.shipping_location)}</p>
                  {order.shipping_location?.license_number && <p className="text-xs text-muted-foreground">OCM: {order.shipping_location.license_number}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Billing</p>
                  <p className="font-medium">{formatLocation(order.billing_location)}</p>
                  {order.billing_location?.license_number && <p className="text-xs text-muted-foreground">OCM: {order.billing_location.license_number}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes_to_vendor && (
            <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
              <h3 className="font-semibold text-sm mb-1">Notes from Customer</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes_to_vendor}</p>
            </div>
          )}
          <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3">
            <Label htmlFor="internalNotes" className="font-semibold text-sm">Internal Notes</Label>
            <Textarea id="internalNotes" placeholder="Add internal notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} className="text-sm" />
            <Button size="sm" onClick={saveInternalNotes} disabled={saving}>{saving ? "Saving..." : "Save Notes"}</Button>
          </div>

          {/* Tabbed section: Activity / Delivery / Payment */}
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <div className="flex border-b">
              {(["activity", "delivery", "payment"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-foreground bg-muted/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  {tab === "activity" ? "Activity" : tab === "delivery" ? "Delivery" : "Payment"}
                  {tab === "delivery" && order.delivery_proofs && order.delivery_proofs.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{order.delivery_proofs.length}</Badge>
                  )}
                  {tab === "payment" && order.payment_status === "paid" && (
                    <CheckCircleIcon className="inline ml-1.5 size-3.5 text-green-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-3 sm:p-5">
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Add a note..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }} className="text-sm" />
                    <Button size="sm" onClick={postComment} disabled={postingComment || !newComment.trim()}><SendIcon className="size-4" /></Button>
                  </div>
                  {comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                          <MessageSquareIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="whitespace-pre-wrap">{comment.body}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {comment.author.full_name || comment.author.email} — {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No activity yet.</p>
                  )}
                  <div className="pt-3 border-t">
                    <EmailTimeline key={timelineKey} orderId={Number(id)} />
                  </div>
                </div>
              )}
              {activeTab === "delivery" && (
                <DeliveryProofsSection order={order} onUpdate={setOrder} />
              )}
              {activeTab === "payment" && (
                <PaymentSection order={order} onUpdate={setOrder} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* People on order */}
          <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ordered by</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={selectedOrdererId ?? ""} onChange={(e) => setSelectedOrdererId(Number(e.target.value))}>
                    {order.company_details?.members.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name || member.email}{member.company_title ? ` — ${member.company_title}` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t pt-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Contacts</p>
                  {contactDrafts.map((draft, i) => (
                    <div key={i} className="space-y-2 rounded border p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Contact {i + 1}</span>
                        {contactDrafts.length > 1 && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setContactDrafts((d) => d.filter((_, j) => j !== i))}>
                            <Trash2Icon className="size-3" />
                          </Button>
                        )}
                      </div>
                      <Input placeholder="Full name" value={draft.full_name} onChange={(e) => setContactDrafts((d) => d.map((c, j) => j === i ? { ...c, full_name: e.target.value } : c))} className="h-8 text-sm" />
                      <Input placeholder="Email" type="email" value={draft.email} onChange={(e) => setContactDrafts((d) => d.map((c, j) => j === i ? { ...c, email: e.target.value } : c))} className="h-8 text-sm" />
                      <Input placeholder="Phone" value={draft.phone_number} onChange={(e) => setContactDrafts((d) => d.map((c, j) => j === i ? { ...c, phone_number: e.target.value } : c))} className="h-8 text-sm" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setContactDrafts((d) => [...d, { full_name: "", email: "", phone_number: "" }])}>
                    <PlusIcon className="mr-1 size-3" />Add Contact
                  </Button>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="text-xs h-7" onClick={saveContacts} disabled={savingContacts}>{savingContacts ? "Saving..." : "Save"}</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingContacts(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {order.order_users.map((ou) => (
                  <div key={ou.id} className="text-sm">
                    <p className="font-medium">{ou.full_name || ou.email}</p>
                    <p className="text-xs text-muted-foreground">{ou.email}</p>
                    {ou.phone_number && <p className="text-xs text-muted-foreground">{ou.phone_number}</p>}
                    <Badge variant="outline" className="mt-1 text-xs">{ou.role === "orderer" ? "Ordered by" : "Contact"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company */}
          {companyDetails && (
            <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
              <h3 className="font-semibold text-sm mb-3">Company</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{companyDetails.name}</p>
                {companyDetails.license_number ? (
                  <p className="text-muted-foreground">OCM: {companyDetails.license_number}</p>
                ) : (
                  <p className="text-xs font-medium text-amber-600">Missing OCM license</p>
                )}
                {companyDetails.email && <p className="text-muted-foreground">{companyDetails.email}</p>}
                {companyDetails.phone_number && <p className="text-muted-foreground">{companyDetails.phone_number}</p>}
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
                        {member.full_name || member.email}{member.company_title && ` — ${member.company_title}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Terms */}
          <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
            <h3 className="font-semibold text-sm mb-2">Payment Terms</h3>
            <p className="text-sm text-muted-foreground">{order.payment_term_name || "ACH / Bank Transfer"}</p>
            {order.payment_terms_accepted_at && (
              <p className="text-xs text-green-600 mt-1">Accepted {formatDate(order.payment_terms_accepted_at)}</p>
            )}
            {order.payment_due_date && (
              <p className="text-xs text-muted-foreground mt-1">Due {formatDate(order.payment_due_date)}</p>
            )}
          </div>

          {/* Terms Agreement */}
          {order.payment_term_agreement && (
            <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3">
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
                      <img src={order.payment_term_agreement.signature_data} alt="Signature" className="h-16 w-full object-contain" />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-amber-600">Awaiting signature</p>
                  <p className="text-xs text-muted-foreground">Sent {new Date(order.payment_term_agreement.sent_at!).toLocaleString()}</p>
                  {order.payment_term_agreement.expired ? (
                    <p className="text-xs text-red-500">Link expired</p>
                  ) : order.payment_term_agreement.expires_at && (
                    <p className="text-xs text-muted-foreground">Expires {formatDate(order.payment_term_agreement.expires_at)}</p>
                  )}
                </div>
              )}
              {order.payment_term_agreement.agreement_url && (
                <a href={order.payment_term_agreement.agreement_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ExternalLinkIcon className="size-3.5" />View Agreement
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) { setPendingStatus(null); setSendStatusEmail(true); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change order status?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <p>
                  This will change the status from <strong>{ORDER_STATUS_LABELS[order.status]}</strong> to <strong>{ORDER_STATUS_LABELS[pendingStatus as OrderStatus]}</strong>.
                </p>
                {pendingStatus !== "fulfilled" && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                    <Checkbox checked={sendStatusEmail} onCheckedChange={(v) => setSendStatusEmail(v === true)} />
                    <span>Send notification email to {order.company?.name ?? "the company"}</span>
                  </label>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingStatus(null); setSendStatusEmail(true); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (pendingStatus) { await updateStatus(pendingStatus, sendStatusEmail); setPendingStatus(null); setSendStatusEmail(true); } }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDoneConfirm} onOpenChange={setShowDoneConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as fulfilled?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{order.order_number}</strong> as fulfilled and ready for delivery. No email will be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markProcessingDone}>Mark Fulfilled</AlertDialogAction>
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
              {confirmAction === "bank_info" && <>This will send bank info to all members of <strong>{order.company?.name}</strong>.</>}
              {confirmAction === "agreement" && <>This will send a payment terms agreement to <strong>{order.company?.name}</strong>. Any existing unsigned agreement will be replaced.</>}
              {confirmAction === "license_reminder" && <>This will send a license reminder to <strong>{order.company?.name}</strong>.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSend}>Send Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* METRC Import Dialog (Multi-file) */}
      <Dialog open={metrcImportItemId !== null} onOpenChange={(open) => { if (!open) setMetrcImportItemId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import METRC Labels</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Upload METRC PDFs for <strong>{order.items.find((i) => i.id === metrcImportItemId)?.product_name}</strong>
          </p>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Label Template</Label>
              <Select value={metrcLabelId} onValueChange={setMetrcLabelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a label" />
                </SelectTrigger>
                <SelectContent>
                  {labels.map((l) => {
                    const variantCount = l.strain_variants?.length ?? 0;
                    return (
                      <SelectItem key={l.slug} value={l.slug}>
                        {l.name}{l.strain_name ? ` (${l.strain_name})` : ""}{variantCount > 0 ? ` · ${variantCount} variant${variantCount > 1 ? "s" : ""}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">METRC PDFs</Label>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <UploadIcon className="mr-1.5 size-3.5" />
                      Add Files
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setMetrcFiles((prev) => [...prev, ...files]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {metrcFiles.length > 0 && (
                <div className="rounded-lg border max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {metrcFiles.map((file, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-3 py-1.5">
                            <p className="font-mono text-xs truncate max-w-[300px]" title={file.name}>{file.name}</p>
                          </td>
                          <td className="px-1 py-1.5 w-8">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setMetrcFiles((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <XIcon className="size-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {metrcFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">{metrcFiles.length} file{metrcFiles.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMetrcImportItemId(null)}>Cancel</Button>
              <Button
                onClick={handleMetrcImport}
                disabled={!metrcLabelId || metrcFiles.length === 0 || metrcImporting}
              >
                {metrcImporting ? "Importing..." : `Import ${metrcFiles.length} File${metrcFiles.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* METRC Print Dialog */}
      <Dialog open={metrcPrintSetId !== null} onOpenChange={(open) => { if (!open) setMetrcPrintSetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Sheet Layout</Label>
              <Select value={metrcSheetLayoutId} onValueChange={setMetrcSheetLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet layout" />
                </SelectTrigger>
                <SelectContent>
                  {sheetLayouts.map((sl) => (
                    <SelectItem key={sl.slug} value={sl.slug}>
                      {sl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMetrcPrintSetId(null)}>Cancel</Button>
              <Button
                onClick={handleMetrcPrint}
                disabled={!metrcSheetLayoutId || metrcPrinting}
              >
                {metrcPrinting ? "Generating PDF..." : "Print"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward Order Dialog */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send the order details and agreement link to another email address.
          </p>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={forwardEmail}
                onChange={(e) => setForwardEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && forwardEmail) handleForwardOrder(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForwardDialog(false)}>Cancel</Button>
              <Button
                onClick={handleForwardOrder}
                disabled={!forwardEmail || forwardingSending}
              >
                <SendIcon className="mr-1.5 size-4" />
                {forwardingSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print All METRC Labels Dialog */}
      <Dialog open={showPrintAllMetrc} onOpenChange={setShowPrintAllMetrc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print All METRC Labels</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Combine all {totalMetrcLabels} labels from this order onto shared sheets. Labels from different strains will be tiled together to minimize paper waste.
          </p>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Sheet Layout</Label>
              <Select value={printAllSheetLayoutId} onValueChange={setPrintAllSheetLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet layout" />
                </SelectTrigger>
                <SelectContent>
                  {sheetLayouts.map((sl) => (
                    <SelectItem key={sl.slug} value={sl.slug}>
                      {sl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPrintAllMetrc(false)}>Cancel</Button>
              <Button
                variant="outline"
                onClick={handlePrintEachMetrc}
                disabled={!printAllSheetLayoutId || printAllPrinting}
              >
                {printAllPrinting ? "Generating..." : "Download Each Separately"}
              </Button>
              <Button
                onClick={handlePrintAllMetrc}
                disabled={!printAllSheetLayoutId || printAllPrinting}
              >
                {printAllPrinting ? "Generating PDF..." : `Combined (${totalMetrcLabels})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete order — admin only */}
      {user?.role === "admin" && (
        <>
          <div className="mt-12 border-t pt-4">
            <button
              className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete this order
            </button>
          </div>
          <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) { setShowDeleteConfirm(false); setDeleteConfirmText(""); } }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete order permanently?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>This will permanently delete <strong>{order.order_number}</strong> and all associated data (items, agreement, notifications). This cannot be undone.</p>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">Type <strong>{order.order_number}</strong> to confirm:</p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={order.order_number}
                        autoFocus
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOrder}
                  disabled={deleteConfirmText !== order.order_number || deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting..." : "Delete Order"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

/* ── Drag-and-drop file upload zone ── */
function FileDropZone({ onFiles, uploading, label }: { onFiles: (files: File[]) => void; uploading: boolean; label: string }) {
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
    >
      <input type="file" multiple accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length > 0) onFiles(files); e.target.value = ""; }} disabled={uploading} />
      <UploadIcon className="size-5 mx-auto text-muted-foreground mb-1" />
      <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : label}</p>
    </div>
  );
}

/* ── Attachment thumbnail ── */
function AttachmentThumb({ file, onDelete, deleting }: { file: { id: number; filename: string; content_type: string; url: string }; onDelete: () => void; deleting: boolean }) {
  const isImage = file.content_type.startsWith("image/");
  return (
    <div className="group relative rounded-lg border overflow-hidden bg-muted">
      {isImage ? (
        <a href={file.url} target="_blank" rel="noopener noreferrer"><img src={file.url} alt={file.filename} className="h-24 w-full object-cover" /></a>
      ) : (
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-24 px-2">
          <FileTextIcon className="size-6 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-full">{file.filename}</p>
        </a>
      )}
      <button type="button" onClick={onDelete} disabled={deleting}
        className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
        <XIcon className="size-3" />
      </button>
    </div>
  );
}

/* ── Delivery Proofs Section ── */
function DeliveryProofsSection({ order, onUpdate }: { order: Order; onUpdate: (o: Order) => void }) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    try { const updated = await apiClient.uploadDeliveryProofs(order.id, files); onUpdate(updated); toast.success("Delivery proof uploaded"); }
    catch { showError("upload delivery proof"); }
    finally { setUploading(false); }
  }, [order.id, onUpdate]);

  const handleDelete = async (proofId: number) => {
    setDeletingId(proofId);
    try { const updated = await apiClient.deleteDeliveryProof(order.id, proofId); onUpdate(updated); }
    catch { showError("delete delivery proof"); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Delivery Confirmation</h3>
      {order.delivery_proofs && order.delivery_proofs.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {order.delivery_proofs.map((proof) => (
            <AttachmentThumb key={proof.id} file={proof} onDelete={() => handleDelete(proof.id)} deleting={deletingId === proof.id} />
          ))}
        </div>
      )}
      <FileDropZone onFiles={handleUpload} uploading={uploading} label="Drop delivery photos here or click to upload" />
    </div>
  );
}

/* ── Payment Section ── */
const PAYMENT_METHODS = ["ACH", "Wire", "Check", "Zelle", "Cash", "Other"] as const;

function PaymentSection({ order, onUpdate }: { order: Order; onUpdate: (o: Order) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isPaid = order.payment_status === "paid";

  const handleRecordPayment = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.recordPayment(order.id,
        { payment_status: "paid", paid_at: paidAt, payment_method: method || undefined, payment_reference: reference || undefined },
        paymentFiles.length > 0 ? paymentFiles : undefined
      );
      onUpdate(updated); setShowForm(false); setPaymentFiles([]);
      toast.success("Payment recorded");
    } catch { showError("record payment"); }
    finally { setSaving(false); }
  };

  const handleUploadProof = useCallback(async (files: File[]) => {
    setUploading(true);
    try { const updated = await apiClient.uploadPaymentProofs(order.id, files); onUpdate(updated); toast.success("Payment proof uploaded"); }
    catch { showError("upload payment proof"); }
    finally { setUploading(false); }
  }, [order.id, onUpdate]);

  const handleDeleteProof = async (proofId: number) => {
    setDeletingId(proofId);
    try { const updated = await apiClient.deletePaymentProof(order.id, proofId); onUpdate(updated); }
    catch { showError("delete payment proof"); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Payment</h3>
        {isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
            <CheckCircleIcon className="size-3" />Paid
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
            {PAYMENT_STATUS_LABELS[order.payment_status] || "Unpaid"}
          </span>
        )}
      </div>

      {isPaid && (
        <div className="text-sm space-y-1 rounded-lg bg-green-50 p-3">
          {order.paid_at && <p className="text-green-800">Paid on {formatDate(order.paid_at)}</p>}
          {order.payment_method && <p className="text-green-700">Method: {order.payment_method}</p>}
          {order.payment_reference && <p className="text-green-700">Ref: {order.payment_reference}</p>}
        </div>
      )}

      {order.payment_proofs && order.payment_proofs.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {order.payment_proofs.map((proof) => (
            <AttachmentThumb key={proof.id} file={proof} onDelete={() => handleDeleteProof(proof.id)} deleting={deletingId === proof.id} />
          ))}
        </div>
      )}

      {isPaid && <FileDropZone onFiles={handleUploadProof} uploading={uploading} label="Add more payment screenshots" />}

      {!isPaid && !showForm && (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <BanknoteIcon className="mr-1.5 size-4" />Record Payment
        </Button>
      )}

      {!isPaid && showForm && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Date</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Method</Label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs">
                <option value="">Select...</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reference / Transaction ID</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. ACH ref, check number..." className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Screenshot (optional)</Label>
            {paymentFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {paymentFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs bg-card">
                    <ImageIcon className="size-3 text-muted-foreground" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button type="button" onClick={() => setPaymentFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground"><XIcon className="size-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <FileDropZone onFiles={(files) => setPaymentFiles((prev) => [...prev, ...files])} uploading={false} label="Drop payment screenshots here" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="text-xs h-7" onClick={handleRecordPayment} disabled={saving}>{saving ? "Saving..." : "Record Payment"}</Button>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setShowForm(false); setPaymentFiles([]); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
