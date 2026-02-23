"use client";

import { useState, useRef } from "react";
import {
  apiClient,
  type Label,
  type MetrcLabelSetSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  UploadIcon,
  Trash2Icon,
  FileTextIcon,
  QrCodeIcon,
  TagIcon,
} from "lucide-react";

interface MetrcLabelSetPanelProps {
  label: Label;
  onUpdated: () => void;
}

export function MetrcLabelSetPanel({
  label,
  onUpdated,
}: MetrcLabelSetPanelProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // PDF form
  const [pdfName, setPdfName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags form
  const [tagsName, setTagsName] = useState("");
  const [tagsText, setTagsText] = useState("");

  const sets = label.metrc_label_sets ?? [];

  async function handlePdfImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setError("");
    setIsImporting(true);

    try {
      await apiClient.createMetrcLabelSetFromPdf(
        label.slug,
        file,
        pdfName || undefined
      );
      setPdfName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't import the METRC PDF"
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function handleTagsImport() {
    const tags = tagsText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return;

    setError("");
    setIsImporting(true);

    try {
      await apiClient.createMetrcLabelSetFromTags(
        label.slug,
        tags,
        tagsName || undefined
      );
      setTagsName("");
      setTagsText("");
      setShowForm(false);
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't import the METRC tags"
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDelete(setId: number) {
    try {
      await apiClient.deleteMetrcLabelSet(label.slug, setId);
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't delete the METRC label set"
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">METRC Label Sets</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
        >
          <UploadIcon className="mr-2 size-4" />
          Import METRC Tags
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <Tabs defaultValue="pdf">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">
                <FileTextIcon className="mr-2 size-4" />
                Upload PDF
              </TabsTrigger>
              <TabsTrigger value="tags">
                <TagIcon className="mr-2 size-4" />
                Paste Tags
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="space-y-3 pt-3">
              <Field>
                <FieldLabel>Name (optional)</FieldLabel>
                <Input
                  value={pdfName}
                  onChange={(e) => setPdfName(e.target.value)}
                  placeholder="e.g. Rainbow Gelato Labels"
                  disabled={isImporting}
                />
              </Field>
              <Field>
                <FieldLabel>METRC Label PDF</FieldLabel>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  disabled={isImporting}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Upload the multi-page PDF from METRC. Each page will be
                extracted as a separate label image.
              </p>
              <Button
                onClick={handlePdfImport}
                disabled={isImporting}
                size="sm"
              >
                {isImporting ? "Extracting..." : "Import PDF"}
              </Button>
            </TabsContent>

            <TabsContent value="tags" className="space-y-3 pt-3">
              <Field>
                <FieldLabel>Name (optional)</FieldLabel>
                <Input
                  value={tagsName}
                  onChange={(e) => setTagsName(e.target.value)}
                  placeholder="e.g. Batch #3 Tags"
                  disabled={isImporting}
                />
              </Field>
              <Field>
                <FieldLabel>Tag Strings (one per line)</FieldLabel>
                <Textarea
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder={"1A41203000015F1000000039\n1A41203000015F1000000040\n..."}
                  rows={6}
                  className="font-mono text-sm"
                  disabled={isImporting}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Paste METRC tag strings, one per line. These will be rendered as{" "}
                {label.design?.metrc_zone?.render_as === "qr_code"
                  ? "QR codes"
                  : label.design?.metrc_zone?.render_as === "barcode"
                    ? "barcodes"
                    : label.design?.metrc_zone?.render_as === "text"
                      ? "text"
                      : "the configured format"}{" "}
                on each label.
              </p>
              <Button
                onClick={handleTagsImport}
                disabled={isImporting || !tagsText.trim()}
                size="sm"
              >
                {isImporting ? "Importing..." : "Import Tags"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {sets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No METRC label sets imported yet. Import tags to enable per-label
          unique METRC identifiers when printing.
        </p>
      ) : (
        <div className="space-y-2">
          {sets.map((set: MetrcLabelSetSummary) => (
            <div
              key={set.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  {set.source_type === "pdf_upload" ? (
                    <QrCodeIcon className="size-4" />
                  ) : (
                    <TagIcon className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{set.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {set.item_count} label{set.item_count !== 1 ? "s" : ""}{" "}
                    &middot;{" "}
                    {set.source_type === "pdf_upload"
                      ? "PDF upload"
                      : "Tag strings"}{" "}
                    &middot;{" "}
                    {new Date(set.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2Icon className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete METRC label set?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{set.name}&quot; and
                      all {set.item_count} extracted label
                      {set.item_count !== 1 ? "s" : ""}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(set.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
