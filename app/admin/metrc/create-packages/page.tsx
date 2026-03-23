"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";

interface MetrcPackage {
  Label: string;
  Quantity: number;
  UnitOfMeasureName: string;
  UnitOfMeasureAbbreviation: string;
  LocationName: string;
  PackagedDate: string;
  Note: string;
  Item: {
    Name: string;
    StrainName: string;
    ProductCategoryName: string;
    UnitOfMeasureName: string;
  };
}

interface MetrcItem {
  Id: number;
  Name: string;
  ProductCategoryName: string;
  UnitOfMeasureName: string;
}

interface MetrcTag {
  Label: string;
  TagTypeName: string;
}

interface NewPackage {
  sourceLabel: string;
  tag: string;
  item: string;
  quantity: number;
  unitOfMeasure: string;
  note: string;
  packageDate: string;
  expirationDate: string;
  sellByDate: string;
  isFinishedGood: boolean;
  isTradeSample: boolean;
}

const today = new Date().toISOString().split("T")[0];
const oneYearFromToday = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];

function emptyPackage(): NewPackage {
  return {
    sourceLabel: "",
    tag: "",
    item: "",
    quantity: 1,
    unitOfMeasure: "Each",
    note: "",
    packageDate: today,
    expirationDate: "",
    sellByDate: "",
    isFinishedGood: true,
    isTradeSample: false,
  };
}

export default function CreatePackagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Source data
  const [sourcePackages, setSourcePackages] = useState<MetrcPackage[]>([]);
  const [items, setItems] = useState<MetrcItem[]>([]);
  const [availableTags, setAvailableTags] = useState<MetrcTag[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [count, setCount] = useState(1);
  const [packageDate, setPackageDate] = useState(today);
  const [expirationDate, setExpirationDate] = useState(oneYearFromToday);
  const [sellByDate, setSellByDate] = useState(oneYearFromToday);
  const [unitWeight, setUnitWeight] = useState(3.5);
  const [unitWeightUom, setUnitWeightUom] = useState("Grams");
  const [sourceQuantity, setSourceQuantity] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [isFinishedGood, setIsFinishedGood] = useState(true);
  const [isTradeSample, setIsTradeSample] = useState(false);

  // Results
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const [pkgRes, itemRes, tagRes] = await Promise.all([
        apiClient.getMetrcProxy("packages", { status: "active" }),
        apiClient.getMetrcProxy("items"),
        apiClient.getMetrcProxy("tags", { tag_type: "package" }),
      ]);

      const pkgEnvelope = pkgRes as { Data?: MetrcPackage[] };
      setSourcePackages(pkgEnvelope?.Data || (Array.isArray(pkgRes) ? pkgRes as MetrcPackage[] : []));
      setItems(Array.isArray(itemRes) ? itemRes as MetrcItem[] : []);
      setAvailableTags(Array.isArray(tagRes) ? tagRes as MetrcTag[] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const selectedSourcePkg = sourcePackages.find((p) => p.Label === selectedSource);
  const selectedItemObj = items.find((i) => i.Name === selectedItem);

  // Convert total weight (in unitWeightUom) to source package UoM
  const totalWeightGrams = count * unitWeight * (unitWeightUom === "Ounces" ? 28.3495 : unitWeightUom === "Kilograms" ? 1000 : unitWeightUom === "Pounds" ? 453.592 : 1);
  const sourceUom = selectedSourcePkg?.UnitOfMeasureName || "Grams";
  const suggestedPull = sourceUom === "Kilograms" ? totalWeightGrams / 1000
    : sourceUom === "Ounces" ? totalWeightGrams / 28.3495
    : sourceUom === "Pounds" ? totalWeightGrams / 453.592
    : totalWeightGrams;

  async function handleSubmit() {
    if (!selectedSource || !selectedItem || count < 1) {
      setError("Select a source package, item, and count");
      return;
    }

    if (availableTags.length < 1) {
      setError("No tags available");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const tag = availableTags[0];
      const uom = selectedItemObj?.UnitOfMeasureName || "Each";

      // One package with quantity = count (e.g. 32 units in 1 package)
      const packages = [{
        Tag: tag.Label,
        Location: selectedSourcePkg?.LocationName || "",
        Item: selectedItem,
        Quantity: count,
        UnitOfMeasure: uom,
        PatientLicenseNumber: "",
        Note: note,
        IsProductionBatch: false,
        ProductionBatchNumber: "",
        IsDonation: false,
        IsTradeSample: isTradeSample,
        ProductRequiresRemediation: false,
        RemediationMethodId: null,
        RemediationDate: null,
        RemediationSteps: "",
        ActualDate: packageDate,
        ExpirationDate: expirationDate || null,
        SellByDate: sellByDate || null,
        Ingredients: [
          {
            Package: selectedSource,
            Quantity: sourceQuantity,
            UnitOfMeasure: selectedSourcePkg?.UnitOfMeasureName || uom,
          },
        ],
      }];

      await apiClient.postMetrcProxy("create_packages", { packages });

      setResult({
        success: true,
        message: `Created package of ${count} ${uom} from ${selectedSource}`,
      });

      // Refresh data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create packages");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold">Create Packages</h2>
        <p className="text-sm text-muted-foreground">
          Create sellable packages from a bulk source package
        </p>
      </div>

      <Button variant="outline" size="sm" onClick={() => router.push("/admin/metrc")}>
        Back to Metrc
      </Button>

      {error && <ErrorAlert message={error} />}
      {result?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {result.message}
        </div>
      )}

      {loadingData ? (
        <p className="text-muted-foreground">Loading Metrc data...</p>
      ) : (
        <div className="space-y-6">
          {/* Source Package */}
          <fieldset className="rounded-lg border p-4 space-y-3">
            <legend className="px-2 text-sm font-medium">Source Package (Bulk)</legend>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a bulk package...</option>
              {sourcePackages.map((p) => (
                <option key={p.Label} value={p.Label}>
                  {p.Item?.StrainName || "Unknown Strain"} — {p.Item?.ProductCategoryName || "?"} — {p.Quantity} {p.UnitOfMeasureAbbreviation} ({p.Label.slice(-4)})
                </option>
              ))}
            </select>
            {selectedSourcePkg && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Strain: <strong>{selectedSourcePkg.Item?.StrainName || "-"}</strong></span>
                <span>Item: <strong>{selectedSourcePkg.Item?.Name || "-"}</strong></span>
                <span>Qty: <strong>{selectedSourcePkg.Quantity} {selectedSourcePkg.UnitOfMeasureAbbreviation}</strong></span>
                <span>Location: <strong>{selectedSourcePkg.LocationName || "-"}</strong></span>
                <span>Tag: <strong className="font-mono">{selectedSourcePkg.Label}</strong></span>
              </div>
            )}
          </fieldset>

          {/* New Package Config */}
          <fieldset className="rounded-lg border p-4 space-y-4">
            <legend className="px-2 text-sm font-medium">New Package</legend>

            <div className="grid grid-cols-2 gap-4">
              {/* Item */}
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Item (Product Definition)</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select an item...</option>
                  {items.map((item) => (
                    <option key={item.Id} value={item.Name}>
                      {item.Name} ({item.ProductCategoryName}) — {item.UnitOfMeasureName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => {
                    const c = parseInt(e.target.value) || 1;
                    setCount(c);
                    const totalG = c * unitWeight * (unitWeightUom === "Ounces" ? 28.3495 : unitWeightUom === "Kilograms" ? 1000 : unitWeightUom === "Pounds" ? 453.592 : 1);
                    const su = selectedSourcePkg?.UnitOfMeasureName || "Grams";
                    const pull = su === "Kilograms" ? totalG / 1000 : su === "Ounces" ? totalG / 28.3495 : su === "Pounds" ? totalG / 453.592 : totalG;
                    setSourceQuantity(Math.round(pull * 1000) / 1000);
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Units in this package
                </p>
              </div>

              {/* Unit weight */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Weight per unit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={unitWeight}
                    onChange={(e) => {
                      setUnitWeight(parseFloat(e.target.value) || 0);
                      const totalG = count * (parseFloat(e.target.value) || 0) * (unitWeightUom === "Ounces" ? 28.3495 : unitWeightUom === "Kilograms" ? 1000 : unitWeightUom === "Pounds" ? 453.592 : 1);
                      const su = selectedSourcePkg?.UnitOfMeasureName || "Grams";
                      const pull = su === "Kilograms" ? totalG / 1000 : su === "Ounces" ? totalG / 28.3495 : su === "Pounds" ? totalG / 453.592 : totalG;
                      setSourceQuantity(Math.round(pull * 1000) / 1000);
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <select
                    value={unitWeightUom}
                    onChange={(e) => setUnitWeightUom(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="Grams">g</option>
                    <option value="Ounces">oz</option>
                    <option value="Kilograms">kg</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {count} x {unitWeight}{unitWeightUom === "Grams" ? "g" : unitWeightUom === "Ounces" ? "oz" : "kg"} = {Math.round(suggestedPull * 1000) / 1000} {selectedSourcePkg?.UnitOfMeasureAbbreviation || sourceUom}
                </p>
              </div>

              {/* Source quantity (editable) */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Pull from source ({selectedSourcePkg?.UnitOfMeasureAbbreviation || "?"})
                </label>
                <input
                  type="number"
                  step="0.001"
                  min={0}
                  value={sourceQuantity}
                  onChange={(e) => setSourceQuantity(parseFloat(e.target.value) || "")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available: {selectedSourcePkg?.Quantity ?? "?"} {selectedSourcePkg?.UnitOfMeasureAbbreviation || ""}
                </p>
              </div>

              {/* Package Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Package Date</label>
                <input
                  type="date"
                  value={packageDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setPackageDate(d);
                    if (d) {
                      const y = new Date(new Date(d).setFullYear(new Date(d).getFullYear() + 1)).toISOString().split("T")[0];
                      setExpirationDate(y);
                      setSellByDate(y);
                    }
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Expiration Date</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Sell-By Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Sell-By Date</label>
                <input
                  type="date"
                  value={sellByDate}
                  onChange={(e) => setSellByDate(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Note */}
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isFinishedGood}
                  onChange={(e) => setIsFinishedGood(e.target.checked)}
                />
                Finished Good
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isTradeSample}
                  onChange={(e) => setIsTradeSample(e.target.checked)}
                />
                Trade Sample
              </label>
            </div>
          </fieldset>

          {/* Tag preview */}
          {availableTags.length > 0 && (
            <fieldset className="rounded-lg border p-4 space-y-2">
              <legend className="px-2 text-sm font-medium">Package Tag</legend>
              <Badge variant="outline" className="font-mono text-xs">
                {availableTags[0].Label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                1 tag for {count} units
              </p>
            </fieldset>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button onClick={handleSubmit} disabled={submitting || !selectedSource || !selectedItem}>
              {submitting ? "Creating..." : `Create Package (${count} ${selectedItemObj?.UnitOfMeasureName || "units"})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
