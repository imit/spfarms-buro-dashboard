"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon, DownloadIcon, ChevronDownIcon, PlusIcon,
  Trash2Icon, PackageIcon, FileTextIcon, TruckIcon,
  CalendarIcon, XIcon, ChevronRightIcon, UploadIcon,
} from "lucide-react";
import {
  apiClient, type Shipment, type ShipmentStatus, type ShipmentOrderSummary,
  type Order, type SheetLayout, type Label as LabelType, type Strain,
  SHIPMENT_STATUS_LABELS,
} from "@/lib/api";
import { statusBadgeClasses } from "@/lib/order-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

const STATUS_BADGE_COLORS: Record<ShipmentStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  loading: "bg-amber-100 text-amber-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUSES = Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][];

function formatPrice(amount: string | number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Status change
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Add orders dialog
  const [showAddOrders, setShowAddOrders] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loadingAvailableOrders, setLoadingAvailableOrders] = useState(false);
  const [addOrderIds, setAddOrderIds] = useState<number[]>([]);
  const [addingOrders, setAddingOrders] = useState(false);

  // Remove order confirmation
  const [removeOrderId, setRemoveOrderId] = useState<number | null>(null);

  // Expanded orders
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Selected orders for batch actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

  // METRC print dialog
  const [sheetLayouts, setSheetLayouts] = useState<SheetLayout[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [showMetrcDialog, setShowMetrcDialog] = useState(false);
  const [metrcSheetLayoutId, setMetrcSheetLayoutId] = useState("");
  const [metrcPrinting, setMetrcPrinting] = useState(false);

  // Per-order METRC import
  const [metrcImportItemId, setMetrcImportItemId] = useState<number | null>(null);
  const [metrcImportOrderId, setMetrcImportOrderId] = useState<number | null>(null);
  const [metrcLabelId, setMetrcLabelId] = useState("");
  const [metrcFile, setMetrcFile] = useState<File | null>(null);
  const [metrcImporting, setMetrcImporting] = useState(false);

  // Per-set METRC print
  const [metrcPrintSetId, setMetrcPrintSetId] = useState<number | null>(null);
  const [metrcPrintOrderId, setMetrcPrintOrderId] = useState<number | null>(null);
  const [perSetSheetLayoutId, setPerSetSheetLayoutId] = useState("");
  const [perSetPrinting, setPerSetPrinting] = useState(false);

  // Sample METRC
  const [strains, setStrains] = useState<Strain[]>([]);
  const [showSampleImport, setShowSampleImport] = useState(false);
  const [sampleLabelId, setSampleLabelId] = useState("");
  const [sampleStrainId, setSampleStrainId] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleImporting, setSampleImporting] = useState(false);
  const [samplePrintSetId, setSamplePrintSetId] = useState<number | null>(null);
  const [samplePrintLayoutId, setSamplePrintLayoutId] = useState("");
  const [samplePrinting, setSamplePrinting] = useState(false);
  const [showBatchSampleDialog, setShowBatchSampleDialog] = useState(false);
  const [batchSampleLayoutId, setBatchSampleLayoutId] = useState("");
  const [batchSamplePrinting, setBatchSamplePrinting] = useState(false);

  const loadShipment = useCallback(async () => {
    try {
      const data = await apiClient.getShipment(Number(id));
      setShipment(data);
      setNotes(data.notes || "");
    } catch (err) {
      console.error("Failed to load shipment:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadShipment();
    apiClient.getSheetLayouts().then(setSheetLayouts).catch(() => {});
    apiClient.getLabels().then(setLabels).catch(() => {});
    apiClient.getStrains().then(setStrains).catch(() => {});
  }, [isAuthenticated, loadShipment]);

  const updateStatus = async (newStatus: string) => {
    try {
      const updated = await apiClient.updateShipment(Number(id), { status: newStatus });
      setShipment(updated);
      toast.success("Status updated");
    } catch {
      showError("update the shipment status");
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const updated = await apiClient.updateShipment(Number(id), { notes });
      setShipment(updated);
      toast.success("Notes saved");
    } catch {
      showError("save the notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const openAddOrders = async () => {
    setShowAddOrders(true);
    setLoadingAvailableOrders(true);
    setAddOrderIds([]);
    try {
      const orders = await apiClient.getOrders();
      const existingIds = new Set(shipment?.orders.map((o) => o.id) ?? []);
      const eligible = orders.filter(
        (o) => !existingIds.has(o.id) && (o.status === "fulfilled" || o.status === "confirmed" || o.status === "processing")
      );
      setAvailableOrders(eligible);
    } catch {
      showError("load available orders");
    } finally {
      setLoadingAvailableOrders(false);
    }
  };

  const handleAddOrders = async () => {
    if (addOrderIds.length === 0) return;
    setAddingOrders(true);
    try {
      const updated = await apiClient.addOrdersToShipment(Number(id), addOrderIds);
      setShipment(updated);
      setShowAddOrders(false);
      toast.success(`${addOrderIds.length} order${addOrderIds.length !== 1 ? "s" : ""} added`);
    } catch {
      showError("add orders to the shipment");
    } finally {
      setAddingOrders(false);
    }
  };

  const handleRemoveOrder = async () => {
    if (removeOrderId === null) return;
    try {
      const updated = await apiClient.removeOrderFromShipment(Number(id), removeOrderId);
      setShipment(updated);
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(removeOrderId);
        return next;
      });
      toast.success("Order removed from shipment");
    } catch {
      showError("remove the order from the shipment");
    } finally {
      setRemoveOrderId(null);
    }
  };

  const toggleExpanded = (orderId: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelected = (orderId: number) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleAllSelected = () => {
    if (!shipment) return;
    if (selectedOrderIds.size === shipment.orders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(shipment.orders.map((o) => o.id)));
    }
  };

  // --- PDF Downloads ---

  const downloadAllDocuments = async () => {
    try {
      const blob = await apiClient.downloadShipmentBatchAllDocuments(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-documents-${shipment?.shipment_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All documents downloaded");
    } catch {
      showError("download all documents");
    }
  };

  const downloadBatchInvoices = async () => {
    try {
      const blob = await apiClient.downloadShipmentBatchInvoices(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${shipment?.shipment_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download batch invoices");
    }
  };

  const downloadBatchDeliveryAgreements = async () => {
    try {
      const blob = await apiClient.downloadShipmentBatchDeliveryAgreements(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delivery-agreements-${shipment?.shipment_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download batch delivery agreements");
    }
  };

  const downloadBatchPaymentTerms = async () => {
    try {
      const blob = await apiClient.downloadShipmentBatchPaymentTerms(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-terms-${shipment?.shipment_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download batch payment terms");
    }
  };

  const downloadBatchMetrcLabels = async () => {
    if (!metrcSheetLayoutId) return;
    setMetrcPrinting(true);
    try {
      const blob = await apiClient.downloadShipmentBatchMetrcLabels(Number(id), metrcSheetLayoutId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metrc-labels-${shipment?.shipment_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setShowMetrcDialog(false);
      toast.success("PDF downloaded");
    } catch {
      showError("download batch METRC labels");
    } finally {
      setMetrcPrinting(false);
    }
  };

  // Per-order PDF downloads
  const downloadOrderInvoice = async (orderId: number, orderNumber: string) => {
    try {
      const blob = await apiClient.getOrderInvoice(orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download the invoice");
    }
  };

  const downloadOrderDeliveryAgreement = async (orderId: number, orderNumber: string) => {
    try {
      const blob = await apiClient.getOrderDeliveryAgreement(orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delivery-agreement-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download the delivery agreement");
    }
  };

  const downloadOrderPaymentTerms = async (orderId: number, orderNumber: string) => {
    try {
      const blob = await apiClient.getOrderPaymentTermsPdf(orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-terms-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("download the payment terms");
    }
  };

  const printBoxLabel = (order: ShipmentOrderSummary) => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title>Box Label - ${order.order_number}</title>
<style>
  @page { size: 4in 6in; margin: 0.25in; }
  body { font-family: Arial, Helvetica, sans-serif; padding: 0.5in; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; font-size: 12px; color: #666; }
  .order-number { font-size: 28px; font-weight: bold; text-align: center; margin: 16px 0; letter-spacing: 2px; }
  .section { margin-bottom: 14px; }
  .section-label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
  .section-value { font-size: 14px; line-height: 1.4; }
  .items { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 12px; }
  .items table { width: 100%; font-size: 12px; border-collapse: collapse; }
  .items th { text-align: left; font-weight: 600; padding: 4px 0; border-bottom: 1px solid #eee; }
  .items td { padding: 3px 0; }
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #ccc; padding-top: 10px; }
</style></head>
<body onload="window.print()">
  <div class="header"><h1>SPFarms</h1><p>Cannabis Delivery</p></div>
  <div class="order-number">${order.order_number}</div>
  <div class="section"><div class="section-label">Ship To</div><div class="section-value"><strong>${order.company_name}</strong></div></div>
  ${order.desired_delivery_date ? `<div class="section"><div class="section-label">Desired Delivery</div><div class="section-value">${new Date(order.desired_delivery_date).toLocaleDateString()}</div></div>` : ""}
  <div class="items"><table><thead><tr><th>Product</th><th style="text-align:right">Qty</th></tr></thead>
  <tbody>${order.items.map((i) => `<tr><td>${i.product_name}</td><td style="text-align:right">${i.quantity}</td></tr>`).join("")}</tbody></table></div>
  <div class="footer">Packed on ${new Date().toLocaleDateString()} - ${order.items.length} item${order.items.length !== 1 ? "s" : ""}</div>
</body></html>`);
    win.document.close();
  };

  // Selected orders batch downloads
  const downloadSelectedInvoices = async () => {
    const orders = shipment?.orders.filter((o) => selectedOrderIds.has(o.id)) ?? [];
    for (const order of orders) {
      await downloadOrderInvoice(order.id, order.order_number);
    }
  };

  const downloadSelectedDeliveryAgreements = async () => {
    const orders = shipment?.orders.filter((o) => selectedOrderIds.has(o.id)) ?? [];
    for (const order of orders) {
      await downloadOrderDeliveryAgreement(order.id, order.order_number);
    }
  };

  const downloadSelectedPaymentTerms = async () => {
    const orders = shipment?.orders.filter((o) => selectedOrderIds.has(o.id)) ?? [];
    for (const order of orders) {
      await downloadOrderPaymentTerms(order.id, order.order_number);
    }
  };

  // Per-set METRC print
  const handlePerSetMetrcPrint = async () => {
    if (!metrcPrintSetId || !metrcPrintOrderId || !perSetSheetLayoutId) return;
    setPerSetPrinting(true);
    try {
      const blob = await apiClient.printOrderMetrcLabels(metrcPrintOrderId, metrcPrintSetId, perSetSheetLayoutId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metrc-labels.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMetrcPrintSetId(null);
      setMetrcPrintOrderId(null);
      toast.success("PDF downloaded");
    } catch {
      showError("print METRC labels");
    } finally {
      setPerSetPrinting(false);
    }
  };

  // METRC import for a specific order item
  const handleMetrcImport = async () => {
    if (!metrcImportItemId || !metrcImportOrderId || !metrcLabelId || !metrcFile) return;
    setMetrcImporting(true);
    try {
      await apiClient.importOrderMetrc(metrcImportOrderId, metrcImportItemId, metrcLabelId, metrcFile);
      await loadShipment();
      setMetrcImportItemId(null);
      setMetrcImportOrderId(null);
      setMetrcFile(null);
      setMetrcLabelId("");
      toast.success("METRC labels imported");
    } catch {
      showError("import METRC labels");
    } finally {
      setMetrcImporting(false);
    }
  };

  // Sample METRC import
  const handleSampleMetrcImport = async () => {
    if (!sampleLabelId || !sampleStrainId || !sampleFile) return;
    setSampleImporting(true);
    try {
      await apiClient.importShipmentSampleMetrc(Number(id), sampleLabelId, Number(sampleStrainId), sampleFile);
      await loadShipment();
      setShowSampleImport(false);
      setSampleFile(null);
      setSampleLabelId("");
      setSampleStrainId("");
      toast.success("Sample METRC labels imported");
    } catch {
      showError("import sample METRC labels");
    } finally {
      setSampleImporting(false);
    }
  };

  // Sample METRC print
  const handleSampleMetrcPrint = async () => {
    if (!samplePrintSetId || !samplePrintLayoutId) return;
    setSamplePrinting(true);
    try {
      const blob = await apiClient.printShipmentSampleMetrcLabels(Number(id), samplePrintSetId, samplePrintLayoutId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sample-metrc-labels.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSamplePrintSetId(null);
      toast.success("PDF downloaded");
    } catch {
      showError("print sample METRC labels");
    } finally {
      setSamplePrinting(false);
    }
  };

  // Batch sample METRC download
  const handleBatchSampleMetrcDownload = async () => {
    if (!batchSampleLayoutId) return;
    setBatchSamplePrinting(true);
    try {
      const blob = await apiClient.downloadShipmentBatchSampleMetrcLabels(Number(id), batchSampleLayoutId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sample-metrc-labels-${shipment?.shipment_number || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setShowBatchSampleDialog(false);
      toast.success("PDF downloaded");
    } catch {
      showError("download batch sample METRC labels");
    } finally {
      setBatchSamplePrinting(false);
    }
  };

  // Sample METRC delete
  const handleDeleteSampleMetrcSet = async (setId: number) => {
    try {
      await apiClient.deleteShipmentSampleMetrcSet(Number(id), setId);
      await loadShipment();
      toast.success("Sample METRC set deleted");
    } catch {
      showError("delete sample METRC set");
    }
  };

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="px-10"><p className="text-muted-foreground">Loading...</p></div>;
  if (!shipment) return <div className="px-10"><p className="text-muted-foreground">Shipment not found.</p></div>;

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin/shipments">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{shipment.shipment_number}</h2>
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_BADGE_COLORS[shipment.status]
              )}>
                {SHIPMENT_STATUS_LABELS[shipment.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {shipment.scheduled_date
                ? `Scheduled: ${formatDate(shipment.scheduled_date)}`
                : "No scheduled date"}
              {" · "}
              {shipment.totals.order_count} order{shipment.totals.order_count !== 1 ? "s" : ""}
              {" · "}
              {formatPrice(shipment.totals.total_value)}
            </p>
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon className="mr-1.5 size-4" />
                Print All
                <ChevronDownIcon className="ml-1.5 size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium" onClick={downloadAllDocuments}>
                All Documents (1 PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadBatchInvoices}>All Invoices</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadBatchDeliveryAgreements}>All Delivery Agreements</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadBatchPaymentTerms}>All Payment Terms</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setShowMetrcDialog(true); setMetrcSheetLayoutId(""); }}>
                All METRC Labels
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={openAddOrders}>
            <PlusIcon className="mr-1.5 size-4" />
            Add Orders
          </Button>
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <CalendarIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Scheduled</p>
              <p className="text-sm font-medium">{formatDate(shipment.scheduled_date) || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <TruckIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Departed</p>
              <p className="text-sm font-medium">{formatDate(shipment.departed_at) || "Pending"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <PackageIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Orders</p>
              <p className="text-sm font-medium">{shipment.totals.order_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted">
              <FileTextIcon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Items</p>
              <p className="text-sm font-medium">{shipment.totals.total_items}</p>
            </div>
          </div>
        </div>

        {/* Driver info */}
        {shipment.driver && (
          <div className="pt-4 mt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Driver: <span className="font-medium text-foreground">{shipment.driver.full_name || shipment.driver.email}</span>
            </p>
          </div>
        )}

        {/* Status change */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t">
          <span className="text-xs text-muted-foreground mr-1">Change status:</span>
          <select
            value={shipment.status}
            onChange={(e) => { if (e.target.value !== shipment.status) setPendingStatus(e.target.value); }}
            className="flex h-8 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders list */}
      <div className="rounded-xl border bg-card shadow-xs">
        <div className="px-3 sm:px-5 py-3.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={shipment.orders.length > 0 && selectedOrderIds.size === shipment.orders.length}
              onCheckedChange={toggleAllSelected}
            />
            <h3 className="font-semibold text-sm">
              Orders ({shipment.orders.length})
            </h3>
          </div>
        </div>

        {shipment.orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No orders in this shipment yet.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openAddOrders}>
              <PlusIcon className="mr-1.5 size-4" />
              Add Orders
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {shipment.orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const isSelected = selectedOrderIds.has(order.id);

              return (
                <div key={order.id} className="group">
                  {/* Order card header */}
                  <div className={cn("px-3 sm:px-5 py-3 flex items-center gap-3", isSelected && "bg-muted/30")}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelected(order.id)}
                    />
                    <button
                      onClick={() => toggleExpanded(order.id)}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <ChevronRightIcon className={cn("size-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                    </button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{order.company_name}</span>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs text-muted-foreground hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.order_number}
                        </Link>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          statusBadgeClasses(order.status as Parameters<typeof statusBadgeClasses>[0])
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        {order.desired_delivery_date && (
                          <> &middot; Delivery: {new Date(order.desired_delivery_date).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">{formatPrice(order.total)}</span>
                    {/* Per-order PDF actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()}>
                          <DownloadIcon className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadOrderInvoice(order.id, order.order_number)}>Invoice</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadOrderDeliveryAgreement(order.id, order.order_number)}>Delivery Agreement</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadOrderPaymentTerms(order.id, order.order_number)}>Payment Terms</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => printBoxLabel(order)}>Box Label</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setRemoveOrderId(order.id); }}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-4 pt-1 ml-12 space-y-3">
                      {/* Line items */}
                      <div className="rounded-lg border divide-y">
                        {order.items.map((item) => (
                          <div key={item.id} className="px-3 py-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{item.product_name}</p>
                              </div>
                              <div className="text-right shrink-0 text-sm">
                                <span className="text-muted-foreground">{item.quantity} x {formatPrice(item.unit_price)}</span>
                                <span className="ml-2 font-medium">{formatPrice(parseFloat(item.unit_price) * item.quantity)}</span>
                              </div>
                            </div>

                            {/* METRC section */}
                            {item.metrc_label_sets && item.metrc_label_sets.length > 0 && (
                              <div className="space-y-1">
                                {item.metrc_label_sets.map((ms) => (
                                  <div key={ms.id} className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="text-[10px]">METRC</Badge>
                                    <span className="text-muted-foreground">{ms.name} ({ms.item_count} tags)</span>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      className="h-5 text-[10px] px-1.5"
                                      onClick={() => {
                                        setMetrcPrintSetId(ms.id);
                                        setMetrcPrintOrderId(order.id);
                                        setPerSetSheetLayoutId("");
                                      }}
                                    >
                                      <FileTextIcon className="mr-0.5 size-2.5" />
                                      Print
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-5 text-[10px] px-1.5"
                                onClick={() => {
                                  setMetrcImportItemId(item.id);
                                  setMetrcImportOrderId(order.id);
                                  setMetrcLabelId("");
                                  setMetrcFile(null);
                                }}
                              >
                                <UploadIcon className="mr-0.5 size-2.5" />
                                Import METRC
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sample METRC section */}
      <div className="rounded-xl border bg-card shadow-xs">
        <div className="px-3 sm:px-5 py-3.5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Sample METRC Labels</h3>
          <div className="flex items-center gap-2">
            {shipment.sample_metrc_sets && shipment.sample_metrc_sets.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setShowBatchSampleDialog(true); setBatchSampleLayoutId(""); }}>
                <DownloadIcon className="mr-1.5 size-3.5" />
                Download All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setShowSampleImport(true); setSampleLabelId(""); setSampleStrainId(""); setSampleFile(null); }}>
              <UploadIcon className="mr-1.5 size-3.5" />
              Import
            </Button>
          </div>
        </div>
        {(!shipment.sample_metrc_sets || shipment.sample_metrc_sets.length === 0) ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No sample METRC labels imported yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {shipment.sample_metrc_sets.map((ms) => (
              <div key={ms.id} className="px-3 sm:px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">SAMPLE</Badge>
                    <span className="text-sm font-medium">{ms.strain_name}</span>
                    <span className="text-xs text-muted-foreground">{ms.label_name}</span>
                    <span className="text-xs text-muted-foreground">({ms.item_count} tag{ms.item_count !== 1 ? "s" : ""})</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 text-xs px-2"
                  onClick={() => { setSamplePrintSetId(ms.id); setSamplePrintLayoutId(""); }}
                >
                  <FileTextIcon className="mr-1 size-3" />
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteSampleMetrcSet(ms.id)}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes section */}
      <div className="rounded-xl border bg-card shadow-xs">
        <div className="px-3 sm:px-5 py-3.5 border-b">
          <h3 className="font-semibold text-sm">Notes</h3>
        </div>
        <div className="px-3 sm:px-5 py-4 space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this shipment..."
            rows={3}
          />
          <Button
            size="sm"
            onClick={saveNotes}
            disabled={savingNotes || notes === (shipment.notes || "")}
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </div>

      {/* Selected orders batch action bar */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
          <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
            <span className="text-sm font-medium">
              {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadSelectedInvoices}>
                <DownloadIcon className="mr-1.5 size-3.5" />
                Invoices
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSelectedDeliveryAgreements}>
                <DownloadIcon className="mr-1.5 size-3.5" />
                Delivery Agreements
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSelectedPaymentTerms}>
                <DownloadIcon className="mr-1.5 size-3.5" />
                Payment Terms
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrderIds(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Dialogs --- */}

      {/* Status change confirmation */}
      <AlertDialog open={pendingStatus !== null} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Shipment Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change status to <strong>{pendingStatus ? SHIPMENT_STATUS_LABELS[pendingStatus as ShipmentStatus] : ""}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingStatus) updateStatus(pendingStatus); setPendingStatus(null); }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove order confirmation */}
      <AlertDialog open={removeOrderId !== null} onOpenChange={(open) => { if (!open) setRemoveOrderId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this order from the shipment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveOrder}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add orders dialog */}
      <Dialog open={showAddOrders} onOpenChange={setShowAddOrders}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Orders to Shipment</DialogTitle>
          </DialogHeader>
          {loadingAvailableOrders ? (
            <p className="text-sm text-muted-foreground py-4">Loading orders...</p>
          ) : availableOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No eligible orders available.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border divide-y max-h-72 overflow-y-auto">
                {availableOrders.map((order) => (
                  <label
                    key={order.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors",
                      addOrderIds.includes(order.id) && "bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={addOrderIds.includes(order.id)}
                      onCheckedChange={() => {
                        setAddOrderIds((prev) =>
                          prev.includes(order.id) ? prev.filter((i) => i !== order.id) : [...prev, order.id]
                        );
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{order.order_number}</span>
                        <span className="text-xs text-muted-foreground">{order.company?.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium shrink-0">{formatPrice(order.total)}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddOrders(false)}>Cancel</Button>
                <Button onClick={handleAddOrders} disabled={addOrderIds.length === 0 || addingOrders}>
                  {addingOrders ? "Adding..." : `Add ${addOrderIds.length} Order${addOrderIds.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch METRC Labels Dialog */}
      <Dialog open={showMetrcDialog} onOpenChange={setShowMetrcDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print All METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a sheet layout for printing:</p>
              <Select value={metrcSheetLayoutId} onValueChange={setMetrcSheetLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet layout..." />
                </SelectTrigger>
                <SelectContent>
                  {sheetLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.slug}>
                      {layout.name} ({layout.columns}x{layout.rows})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMetrcDialog(false)}>Cancel</Button>
              <Button onClick={downloadBatchMetrcLabels} disabled={!metrcSheetLayoutId || metrcPrinting}>
                {metrcPrinting ? "Generating PDF..." : "Print"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Per-set METRC Print Dialog */}
      <Dialog open={metrcPrintSetId !== null} onOpenChange={(open) => { if (!open) { setMetrcPrintSetId(null); setMetrcPrintOrderId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a sheet layout:</p>
              <Select value={perSetSheetLayoutId} onValueChange={setPerSetSheetLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet layout..." />
                </SelectTrigger>
                <SelectContent>
                  {sheetLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.slug}>
                      {layout.name} ({layout.columns}x{layout.rows})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setMetrcPrintSetId(null); setMetrcPrintOrderId(null); }}>Cancel</Button>
              <Button onClick={handlePerSetMetrcPrint} disabled={!perSetSheetLayoutId || perSetPrinting}>
                {perSetPrinting ? "Generating PDF..." : "Print"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* METRC Import Dialog */}
      <Dialog open={metrcImportItemId !== null} onOpenChange={(open) => { if (!open) { setMetrcImportItemId(null); setMetrcImportOrderId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a label design:</p>
              <Select value={metrcLabelId} onValueChange={setMetrcLabelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select label..." />
                </SelectTrigger>
                <SelectContent>
                  {labels.map((label) => (
                    <SelectItem key={label.id} value={String(label.id)}>
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Upload METRC PDF:</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setMetrcFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setMetrcImportItemId(null); setMetrcImportOrderId(null); }}>Cancel</Button>
              <Button onClick={handleMetrcImport} disabled={!metrcLabelId || !metrcFile || metrcImporting}>
                {metrcImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sample METRC Import Dialog */}
      <Dialog open={showSampleImport} onOpenChange={setShowSampleImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Sample METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a label design:</p>
              <Select value={sampleLabelId} onValueChange={setSampleLabelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select label..." />
                </SelectTrigger>
                <SelectContent>
                  {labels.map((label) => (
                    <SelectItem key={label.id} value={String(label.id)}>
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select strain:</p>
              <Select value={sampleStrainId} onValueChange={setSampleStrainId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strain..." />
                </SelectTrigger>
                <SelectContent>
                  {strains.map((strain) => (
                    <SelectItem key={strain.id} value={String(strain.id)}>
                      {strain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Upload METRC PDF:</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSampleImport(false)}>Cancel</Button>
              <Button onClick={handleSampleMetrcImport} disabled={!sampleLabelId || !sampleStrainId || !sampleFile || sampleImporting}>
                {sampleImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Sample METRC Download Dialog */}
      <Dialog open={showBatchSampleDialog} onOpenChange={setShowBatchSampleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download All Sample METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a sheet layout for printing:</p>
              <Select value={batchSampleLayoutId} onValueChange={setBatchSampleLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet layout..." />
                </SelectTrigger>
                <SelectContent>
                  {sheetLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.slug}>
                      {layout.name} ({layout.columns}x{layout.rows})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBatchSampleDialog(false)}>Cancel</Button>
              <Button onClick={handleBatchSampleMetrcDownload} disabled={!batchSampleLayoutId || batchSamplePrinting}>
                {batchSamplePrinting ? "Generating PDF..." : "Download"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sample METRC Print Dialog */}
      <Dialog open={samplePrintSetId !== null} onOpenChange={(open) => { if (!open) setSamplePrintSetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Sample METRC Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a sheet layout:</p>
              <Select value={samplePrintLayoutId} onValueChange={setSamplePrintLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet layout..." />
                </SelectTrigger>
                <SelectContent>
                  {sheetLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.slug}>
                      {layout.name} ({layout.columns}x{layout.rows})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSamplePrintSetId(null)}>Cancel</Button>
              <Button onClick={handleSampleMetrcPrint} disabled={!samplePrintLayoutId || samplePrinting}>
                {samplePrinting ? "Generating PDF..." : "Print"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
