"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type StrainImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { ArrowLeftIcon, PencilIcon, Trash2Icon, LockIcon, UnlockIcon } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function StrainImageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<StrainImage | null>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [isSavingFields, setIsSavingFields] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      apiClient.getStrainImage(slug).then((si) => {
        setItem(si);
        setBatchNumber(si.batch_number ?? "");
        setHarvestDate(si.harvest_date ?? "");
      }),
      apiClient.getStrainImageSvg(slug).then(setSvg),
    ])
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, slug]);

  async function handleSaveLabelFields() {
    if (!item) return;
    setIsSavingFields(true);
    try {
      const fd = new FormData();
      fd.append("strain_image[batch_number]", batchNumber);
      fd.append("strain_image[harvest_date]", harvestDate);
      const updated = await apiClient.updateStrainImage(item.slug, fd);
      setItem(updated);
      toast.success("Label fields saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSavingFields(false);
    }
  }

  async function handleToggleLock() {
    if (!item) return;
    setIsToggling(true);
    try {
      const fd = new FormData();
      fd.append("strain_image[locked]", item.locked ? "false" : "true");
      const updated = await apiClient.updateStrainImage(item.slug, fd);
      setItem(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lock toggle failed");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    try {
      await apiClient.deleteStrainImage(item.slug);
      router.push("/admin/projects/strain-images");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (authLoading || !isAuthenticated) return null;
  if (isLoading) return <p className="text-muted-foreground px-10">Loading...</p>;
  if (error) return <div className="mx-10"><ErrorAlert message={error} /></div>;
  if (!item) return null;

  return (
    <div className="px-10 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin/projects/strain-images">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              {item.name}
              {item.locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                  <LockIcon className="size-3" />
                  Locked
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {item.strain_name}
              {item.strain_category && ` · ${item.strain_category}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleLock} disabled={isToggling}>
            {item.locked ? (
              <>
                <UnlockIcon className="mr-2 size-4" />
                Unlock
              </>
            ) : (
              <>
                <LockIcon className="mr-2 size-4" />
                Lock
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild disabled={item.locked}>
            <Link href={`/admin/projects/strain-images/${item.slug}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete strain image?</AlertDialogTitle>
                <AlertDialogDescription>
                  Labels currently using {item.name} will lose their backdrop. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 max-w-xl mx-auto aspect-square flex items-center justify-center">
        {svg ? (
          <div className="w-full [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4 max-w-xl mx-auto space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Label print fields</h3>
          <p className="text-xs text-muted-foreground">
            Used on printed labels when this strain image is selected for a
            METRC import. Falls back to the Label&apos;s own values when blank.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="si-batch" className="text-xs font-medium">Batch number</label>
            <Input
              id="si-batch"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. RM1L1-122025"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="si-harvest" className="text-xs font-medium">Harvest date</label>
            <Input
              id="si-harvest"
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSaveLabelFields} disabled={isSavingFields}>
            {isSavingFields ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Seed: <span className="font-mono">{item.generative_seed}</span>
      </div>
    </div>
  );
}
