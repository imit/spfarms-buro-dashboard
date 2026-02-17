"use client";

import { useEffect, useState, useRef, useCallback, type FormEvent, type DragEvent } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Strain,
  type Coa,
  CATEGORY_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeftIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  ExternalLinkIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function StrainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const strainId = Number(id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [strain, setStrain] = useState<Strain | null>(null);
  const [coas, setCoas] = useState<Coa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // COA upload dialog state
  const [coaDialogOpen, setCoaDialogOpen] = useState(false);
  const [coaSubmitting, setCoaSubmitting] = useState(false);
  const [coaError, setCoaError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [coaForm, setCoaForm] = useState({
    tested_at: "",
    status: "",
    thc_percent: "",
    cbd_percent: "",
    total_terpenes_percent: "",
    current: false,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      try {
        const [strainData, coasData] = await Promise.all([
          apiClient.getStrain(strainId),
          apiClient.getStrainCoas(strainId),
        ]);
        setStrain(strainData);
        setCoas(coasData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load strain"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated, strainId]);

  async function handleDelete() {
    if (!strain) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteStrain(strain.id);
      router.push("/admin/strains");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete strain"
      );
      setIsDeleting(false);
    }
  }

  async function handleToggleActive() {
    if (!strain) return;
    setTogglingStatus(true);
    try {
      const formData = new FormData();
      formData.append("strain[active]", String(!strain.active));
      const updated = await apiClient.updateStrain(strain.id, formData);
      setStrain(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  }

  function handlePdfSelect(file: File) {
    if (file.type !== "application/pdf") {
      setCoaError("Only PDF files are accepted");
      return;
    }
    setPdfFile(file);
    setCoaError("");
  }

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePdfSelect(file);
    }
  }, []);

  async function handleCoaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pdfFile) {
      setCoaError("PDF file is required");
      return;
    }
    setCoaError("");
    setCoaSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("coa[pdf]", pdfFile);
      if (coaForm.tested_at) formData.append("coa[tested_at]", coaForm.tested_at);
      if (coaForm.status) formData.append("coa[status]", coaForm.status);
      if (coaForm.thc_percent) formData.append("coa[thc_percent]", coaForm.thc_percent);
      if (coaForm.cbd_percent) formData.append("coa[cbd_percent]", coaForm.cbd_percent);
      if (coaForm.total_terpenes_percent) formData.append("coa[total_terpenes_percent]", coaForm.total_terpenes_percent);
      formData.append("coa[current]", String(coaForm.current));

      const newCoa = await apiClient.createCoa(strainId, formData);
      setCoas((prev) => {
        if (newCoa.current) {
          return [newCoa, ...prev.map((c) => ({ ...c, current: false }))];
        }
        return [newCoa, ...prev];
      });

      const updatedStrain = await apiClient.getStrain(strainId);
      setStrain(updatedStrain);

      // Reset form
      setCoaDialogOpen(false);
      setCoaForm({ tested_at: "", status: "", thc_percent: "", cbd_percent: "", total_terpenes_percent: "", current: false });
      setPdfFile(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    } catch (err) {
      setCoaError(err instanceof Error ? err.message : "Failed to upload COA");
    } finally {
      setCoaSubmitting(false);
    }
  }

  async function handleDeleteCoa(coaId: number) {
    try {
      await apiClient.deleteCoa(strainId, coaId);
      setCoas((prev) => prev.filter((c) => c.id !== coaId));
      const updatedStrain = await apiClient.getStrain(strainId);
      setStrain(updatedStrain);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete COA");
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="px-10 text-muted-foreground">Loading...</p>;
  }

  if (error && !strain) {
    return (
      <div className="space-y-4 px-10">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/strains">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Strains
          </Link>
        </Button>
      </div>
    );
  }

  if (!strain) return null;

  return (
    <div className="space-y-6 px-10">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/admin/strains">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <h2 className="text-2xl font-semibold">{strain.name}</h2>
            {strain.category && (
              <Badge variant="outline">
                {CATEGORY_LABELS[strain.category]}
              </Badge>
            )}
            <button onClick={handleToggleActive} disabled={togglingStatus}>
              <Badge variant={strain.active ? "default" : "secondary"} className="cursor-pointer">
                {togglingStatus ? "..." : strain.active ? "Active" : "Inactive"}
              </Badge>
            </button>
          </div>
          {strain.description && (
            <p className="text-sm text-muted-foreground ml-11">
              {strain.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/strains/${strain.id}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2Icon className="mr-2 size-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete strain?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {strain.name} and all its
                COAs. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Code" value={strain.code} />
            <DetailRow
              label="Category"
              value={strain.category ? CATEGORY_LABELS[strain.category] : null}
            />
            <DetailRow label="THC Range" value={strain.thc_range} />
            <DetailRow label="Terpenes" value={strain.dominant_terpenes} />
            <DetailRow label="Notes" value={strain.notes} />
            <DetailRow
              label="Created"
              value={new Date(strain.created_at).toLocaleDateString()}
            />
          </dl>
        </div>

        {/* Image */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Image</h3>
          <Separator className="mb-3" />
          {strain.image_url ? (
            <img
              src={strain.image_url}
              alt={strain.name}
              className="h-48 w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-sm text-muted-foreground">No image uploaded</p>
            </div>
          )}
        </div>

        {/* Cannabinoid Profile */}
        {(strain.total_thc || strain.cbd || strain.cbg || strain.total_terpenes || strain.total_cannabinoids) && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Cannabinoid Profile</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow label="Total THC" value={strain.total_thc ? `${strain.total_thc}%` : null} />
              <DetailRow label="CBD" value={strain.cbd ? `${strain.cbd}%` : null} />
              <DetailRow label="CBG" value={strain.cbg ? `${strain.cbg}%` : null} />
              <DetailRow label="Total Terpenes" value={strain.total_terpenes ? `${strain.total_terpenes}%` : null} />
              <DetailRow label="Total Cannabinoids" value={strain.total_cannabinoids ? `${strain.total_cannabinoids}%` : null} />
            </dl>
          </div>
        )}

        {/* Smell Profile */}
        {strain.smell_tags && strain.smell_tags.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Smell Profile</h3>
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-1.5">
              {strain.smell_tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COAs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Certificates of Analysis</h3>
          <Dialog open={coaDialogOpen} onOpenChange={(open) => {
            setCoaDialogOpen(open);
            if (!open) {
              setPdfFile(null);
              setCoaError("");
              setCoaForm({ tested_at: "", status: "", thc_percent: "", cbd_percent: "", total_terpenes_percent: "", current: false });
              if (pdfInputRef.current) pdfInputRef.current.value = "";
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="mr-2 size-4" />
                Upload COA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload COA</DialogTitle>
                <DialogDescription>
                  Upload a Certificate of Analysis PDF for {strain.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCoaSubmit} className="space-y-4">
                {coaError && (
                  <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    {coaError}
                  </div>
                )}

                {/* Drag & Drop PDF Zone */}
                {pdfFile ? (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                    <FileTextIcon className="size-8 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pdfFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        if (pdfInputRef.current) pdfInputRef.current.value = "";
                      }}
                      className="rounded-full p-1 hover:bg-muted-foreground/20"
                    >
                      <XIcon className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => pdfInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <UploadIcon className={`size-8 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {isDragOver ? "Drop PDF here" : "Drag & drop PDF here"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfSelect(file);
                  }}
                  className="hidden"
                  disabled={coaSubmitting}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="tested_at">Tested At</FieldLabel>
                    <Input
                      id="tested_at"
                      type="date"
                      value={coaForm.tested_at}
                      onChange={(e) => setCoaForm((prev) => ({ ...prev, tested_at: e.target.value }))}
                      disabled={coaSubmitting}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="coa_status">Status</FieldLabel>
                    <Select
                      value={coaForm.status}
                      onValueChange={(v) => setCoaForm((prev) => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger id="coa_status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="thc_percent">THC %</FieldLabel>
                    <Input
                      id="thc_percent"
                      type="number"
                      step="0.01"
                      value={coaForm.thc_percent}
                      onChange={(e) => setCoaForm((prev) => ({ ...prev, thc_percent: e.target.value }))}
                      placeholder="21.50"
                      disabled={coaSubmitting}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cbd_percent">CBD %</FieldLabel>
                    <Input
                      id="cbd_percent"
                      type="number"
                      step="0.01"
                      value={coaForm.cbd_percent}
                      onChange={(e) => setCoaForm((prev) => ({ ...prev, cbd_percent: e.target.value }))}
                      placeholder="0.30"
                      disabled={coaSubmitting}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="total_terpenes_percent">Total Terpenes %</FieldLabel>
                    <Input
                      id="total_terpenes_percent"
                      type="number"
                      step="0.01"
                      value={coaForm.total_terpenes_percent}
                      onChange={(e) => setCoaForm((prev) => ({ ...prev, total_terpenes_percent: e.target.value }))}
                      placeholder="3.20"
                      disabled={coaSubmitting}
                    />
                  </Field>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="current"
                    checked={coaForm.current}
                    onCheckedChange={(checked) =>
                      setCoaForm((prev) => ({ ...prev, current: checked === true }))
                    }
                    disabled={coaSubmitting}
                  />
                  <label htmlFor="current" className="text-sm font-medium leading-none">
                    Set as current COA
                  </label>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCoaDialogOpen(false)}
                    disabled={coaSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={coaSubmitting || !pdfFile}>
                    {coaSubmitting ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {coas.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <FileTextIcon className="mx-auto size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No COAs uploaded yet.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Tested</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">THC %</th>
                  <th className="px-4 py-3 text-left font-medium">CBD %</th>
                  <th className="px-4 py-3 text-left font-medium">Terpenes %</th>
                  <th className="px-4 py-3 text-left font-medium">Current</th>
                  <th className="px-4 py-3 text-left font-medium">PDF</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {coas.map((coa) => (
                  <tr key={coa.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {coa.tested_at
                        ? new Date(coa.tested_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {coa.status ? (
                        <Badge
                          variant={
                            coa.status === "pass"
                              ? "default"
                              : coa.status === "fail"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {coa.status}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {coa.thc_percent ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {coa.cbd_percent ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {coa.total_terpenes_percent ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {coa.current && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {coa.pdf_url && (
                        <a
                          href={coa.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLinkIcon className="size-3" />
                          View
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <Trash2Icon className="size-3.5 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete COA?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this certificate of analysis.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCoa(coa.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
