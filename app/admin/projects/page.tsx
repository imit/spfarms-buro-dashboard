"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Label,
  type QrCode,
  type SheetLayout,
  LABEL_STATUS_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TagIcon, QrCodeIcon, LayoutGridIcon } from "lucide-react";

type Tab = "labels" | "qr-codes" | "sheet-layouts";

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("labels");
  const [labels, setLabels] = useState<Label[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [sheetLayouts, setSheetLayouts] = useState<SheetLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [labelsData, qrData, layoutsData] = await Promise.all([
          apiClient.getLabels(),
          apiClient.getQrCodes(),
          apiClient.getSheetLayouts(),
        ]);
        setLabels(labelsData);
        setQrCodes(qrData);
        setSheetLayouts(layoutsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  if (authLoading) return null;

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: "labels", label: "Labels", count: labels.length, icon: <TagIcon className="h-4 w-4" /> },
    { id: "qr-codes", label: "QR Codes", count: qrCodes.length, icon: <QrCodeIcon className="h-4 w-4" /> },
    { id: "sheet-layouts", label: "Sheet Layouts", count: sheetLayouts.length, icon: <LayoutGridIcon className="h-4 w-4" /> },
  ];

  const addUrls: Record<Tab, string> = {
    labels: "/admin/projects/labels/new",
    "qr-codes": "/admin/projects/qr-codes/new",
    "sheet-layouts": "/admin/projects/sheet-layouts/new",
  };

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Labels, QR codes, and print layouts
          </p>
        </div>
        <Link href={addUrls[activeTab]}>
          <Button size="sm">
            <PlusIcon className="mr-1 h-4 w-4" />
            Add {activeTab === "qr-codes" ? "QR Code" : activeTab === "sheet-layouts" ? "Sheet Layout" : "Label"}
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="ml-1 text-xs text-muted-foreground">({tab.count})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {activeTab === "labels" && <LabelsTable labels={labels} />}
          {activeTab === "qr-codes" && <QrCodesTable qrCodes={qrCodes} />}
          {activeTab === "sheet-layouts" && <SheetLayoutsTable layouts={sheetLayouts} />}
        </>
      )}
    </div>
  );
}

function LabelsTable({ labels }: { labels: Label[] }) {
  const router = useRouter();

  if (labels.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">No labels yet</p>
        <Link href="/admin/projects/labels/new">
          <Button size="sm" className="mt-3">
            <PlusIcon className="mr-1 h-4 w-4" />
            Create First Label
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Strain</th>
            <th className="px-4 py-3 text-left font-medium">Size</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => (
            <tr
              key={label.id}
              className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
              onClick={() => router.push(`/admin/projects/labels/${label.slug}`)}
            >
              <td className="px-4 py-3 font-medium">{label.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{label.strain_name || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {label.width_cm} × {label.height_cm} cm
              </td>
              <td className="px-4 py-3">
                <Badge variant={label.status === "active" ? "default" : "secondary"}>
                  {LABEL_STATUS_LABELS[label.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(label.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QrCodesTable({ qrCodes }: { qrCodes: QrCode[] }) {
  const router = useRouter();

  if (qrCodes.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">No QR codes yet</p>
        <Link href="/admin/projects/qr-codes/new">
          <Button size="sm" className="mt-3">
            <PlusIcon className="mr-1 h-4 w-4" />
            Create First QR Code
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Data</th>
            <th className="px-4 py-3 text-left font-medium">Product</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {qrCodes.map((qr) => (
            <tr
              key={qr.id}
              className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
              onClick={() => router.push(`/admin/projects/qr-codes/${qr.slug}`)}
            >
              <td className="px-4 py-3 font-medium">{qr.name}</td>
              <td className="px-4 py-3">
                <Badge variant="secondary">{qr.data_type === "url" ? "URL" : "Text"}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                {qr.encoded_data}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{qr.product_name || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(qr.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SheetLayoutsTable({ layouts }: { layouts: SheetLayout[] }) {
  const router = useRouter();

  if (layouts.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">No sheet layouts yet</p>
        <Link href="/admin/projects/sheet-layouts/new">
          <Button size="sm" className="mt-3">
            <PlusIcon className="mr-1 h-4 w-4" />
            Create First Layout
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Sheet</th>
            <th className="px-4 py-3 text-left font-medium">Label Size</th>
            <th className="px-4 py-3 text-left font-medium">Grid</th>
            <th className="px-4 py-3 text-left font-medium">Labels/Sheet</th>
          </tr>
        </thead>
        <tbody>
          {layouts.map((layout) => (
            <tr
              key={layout.id}
              className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
              onClick={() => router.push(`/admin/projects/sheet-layouts/${layout.slug}`)}
            >
              <td className="px-4 py-3 font-medium">
                {layout.name}
                {layout.default && (
                  <Badge variant="secondary" className="ml-2">Default</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {layout.sheet_width_cm} × {layout.sheet_height_cm} cm
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {layout.label_width_cm} × {layout.label_height_cm} cm
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {layout.columns} × {layout.rows}
              </td>
              <td className="px-4 py-3 font-medium">{layout.labels_per_sheet}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
