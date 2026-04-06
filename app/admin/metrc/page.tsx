"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type AppSettings } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react";

const TABS = [
  "facilities",
  "strains",
  "locations",
  "batches",
  "plants",
  "harvests",
  "packages",
  "tags",
  "items",
] as const;

type Tab = (typeof TABS)[number];

const TAB_COLUMNS: Record<Tab, { key: string; label: string }[]> = {
  facilities: [
    { key: "Name", label: "Name" },
    { key: "License.Number", label: "License" },
    { key: "License.LicenseType", label: "Type" },
    { key: "License.StartDate", label: "Start" },
    { key: "License.EndDate", label: "End" },
  ],
  strains: [
    { key: "Name", label: "Name" },
    { key: "Genetics", label: "Genetics" },
    { key: "ThcLevel", label: "THC" },
    { key: "CbdLevel", label: "CBD" },
    { key: "TestingStatus", label: "Testing" },
  ],
  locations: [
    { key: "Name", label: "Name" },
    { key: "LocationTypeName", label: "Type" },
    { key: "ForPlants", label: "Plants" },
    { key: "ForHarvests", label: "Harvests" },
    { key: "ForPackages", label: "Packages" },
  ],
  batches: [
    { key: "Name", label: "Name" },
    { key: "StrainName", label: "Strain" },
    { key: "PlantBatchTypeName", label: "Type" },
    { key: "UntrackedCount", label: "Untracked" },
    { key: "TrackedCount", label: "Tracked" },
    { key: "PlantedDate", label: "Planted" },
  ],
  plants: [
    { key: "Label", label: "Tag" },
    { key: "StrainName", label: "Strain" },
    { key: "GrowthPhase", label: "Phase" },
    { key: "State", label: "State" },
    { key: "LocationName", label: "Location" },
    { key: "PlantedDate", label: "Planted" },
  ],
  harvests: [
    { key: "Id", label: "ID" },
    { key: "Name", label: "Name" },
    { key: "HarvestTypeName", label: "Type" },
    { key: "DryingLocationName", label: "Drying Location" },
    { key: "CurrentWeight", label: "Weight" },
    { key: "TotalWasteWeight", label: "Waste" },
    { key: "PlantCount", label: "Plants" },
    { key: "UnitOfWeightName", label: "UoW" },
    { key: "HarvestStartDate", label: "Started" },
  ],
  packages: [
    { key: "Label", label: "Tag" },
    { key: "Item.Name", label: "Item" },
    { key: "Item.StrainName", label: "Strain" },
    { key: "Quantity", label: "Qty" },
    { key: "UnitOfMeasureAbbreviation", label: "UoM" },
    { key: "SourceHarvestNames", label: "Harvest" },
    { key: "LabTestingState", label: "Lab Status" },
    { key: "IsTestingSample", label: "Testing" },
    { key: "Note", label: "Note" },
    { key: "PackagedDate", label: "Packaged" },
  ],
  tags: [
    { key: "Label", label: "Tag" },
    { key: "TagTypeName", label: "Type" },
    { key: "GroupTagTypeName", label: "Group" },
    { key: "TagInventoryTypeName", label: "Inventory Type" },
    { key: "MaxGroupSize", label: "Max Group" },
  ],
  items: [
    { key: "Name", label: "Name" },
    { key: "ProductCategoryName", label: "Category" },
    { key: "UnitOfMeasureName", label: "UoM" },
    { key: "StrainName", label: "Strain" },
  ],
};

const TAB_FILTERS: Record<Tab, { key: string; label: string; options: { value: string; label: string }[] }[] | null> = {
  facilities: null,
  strains: null,
  locations: null,
  batches: null,
  plants: [
    {
      key: "phase",
      label: "Phase",
      options: [
        { value: "vegetative", label: "Vegetative" },
        { value: "flowering", label: "Flowering" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
  harvests: [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
  packages: [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
  tags: [
    {
      key: "tag_type",
      label: "Tag Type",
      options: [
        { value: "plant", label: "Plant" },
        { value: "package", label: "Package" },
      ],
    },
  ],
  items: null,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let val: unknown = obj;
  for (const p of parts) {
    if (val == null || typeof val !== "object") return "-";
    val = (val as Record<string, unknown>)[p];
  }
  if (val === true) return "Yes";
  if (val === false) return "No";
  if (val == null) return "-";
  return String(val);
}

export default function MetrcPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("facilities");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedLicense, setSelectedLicense] = useState("");

  useEffect(() => {
    apiClient.getSettings().then((s) => {
      setSettings(s);
      const f = s.facilities?.find((f) => f.metrc_license_number && f.environment === (s.metrc_default_env || "sandbox"));
      if (f?.metrc_license_number) setSelectedLicense(f.metrc_license_number);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  function switchTab(t: Tab) {
    setTab(t);
    setData(null);
    setError("");
    setTotal(null);
    setPage(1);
    setFilters({});
    setExpandedRow(null);
  }

  async function fetchData(p = page) {
    setIsLoading(true);
    setError("");
    setData(null);
    setTotal(null);
    setExpandedRow(null);

    try {
      const opts: Record<string, string | number | undefined> = {
        ...filters,
        page: p,
        ...(selectedLicense && tab !== "facilities" ? { license: selectedLicense } : {}),
      };

      const result = await apiClient.getMetrcProxy(tab, opts);
      const envelope = result as { Data?: Record<string, unknown>[]; Total?: number };

      if (envelope?.Data) {
        setData(envelope.Data);
        setTotal(envelope.Total ?? null);
      } else if (Array.isArray(result)) {
        setData(result as Record<string, unknown>[]);
        setTotal((result as unknown[]).length);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch from Metrc");
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  const columns = TAB_COLUMNS[tab];
  const tabFilters = TAB_FILTERS[tab];

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Metrc Explorer</h2>
          <p className="text-sm text-muted-foreground">
            Browse Metrc data — {settings?.metrc_default_env === "production" ? "Production" : "Sandbox"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/metrc/create-packages">Create Packages</Link>
        </Button>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* License + filters + fetch */}
      <div className="flex flex-wrap items-center gap-3">
        {tab !== "facilities" && settings?.facilities && (
          <Select value={selectedLicense} onValueChange={setSelectedLicense}>
            <SelectTrigger className="w-72 h-8 text-sm">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {settings.facilities
                .filter((f) => f.metrc_license_number && f.environment === (settings.metrc_default_env || "sandbox"))
                .map((f) => (
                  <SelectItem key={f.id} value={f.metrc_license_number!}>
                    {f.name} — {f.metrc_license_number}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
        {tabFilters?.map((f) => (
          <select
            key={f.key}
            value={filters[f.key] || f.options[0].value}
            onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        <Button onClick={() => { setPage(1); fetchData(1); }} disabled={isLoading} size="sm">
          {isLoading ? "Loading..." : "Fetch"}
        </Button>
        {total !== null && (
          <Badge variant="secondary">{total} records</Badge>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {data && data.length === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No records returned.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="rounded-lg border overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <>
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                        {getNestedValue(row, c.key)}
                      </td>
                    ))}
                    <td className="px-2 py-3">
                      <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform ${expandedRow === i ? "rotate-180" : ""}`} />
                    </td>
                  </tr>
                  {expandedRow === i && (
                    <tr key={`${i}-detail`} className="border-b bg-muted/20">
                      <td colSpan={columns.length + 1} className="px-4 py-3">
                        <pre className="text-xs font-mono whitespace-pre-wrap max-h-64 overflow-auto">
                          {JSON.stringify(row, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.length > 0 && total !== null && total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} — showing {data.length} of {total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => { setPage(page - 1); fetchData(page - 1); }}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 20 >= total || isLoading}
              onClick={() => { setPage(page + 1); fetchData(page + 1); }}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {data && data.length > 0 && <RawJson data={data} />}
    </div>
  );
}

function RawJson({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Show"} raw JSON
      </Button>
      {open && (
        <pre className="mt-2 max-h-96 overflow-auto rounded-lg border bg-muted/50 p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
