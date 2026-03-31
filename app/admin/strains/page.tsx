"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PlusIcon, MergeIcon, ChevronRightIcon } from "lucide-react";
import { StrainAvatar } from "@/components/grow/strain-avatar";
import { StrainMergeDialog } from "@/components/strain-merge-dialog";

function StrainRow({
  strain: s,
  children,
  onNavigate,
}: {
  strain: Strain;
  children: Strain[];
  onNavigate: (id: number) => void;
}) {
  const hasChildren = children.length > 0;

  return (
    <>
      <tr
        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
        onClick={() => onNavigate(s.id)}
      >
        <td className="px-4 py-3 font-medium">
          <div className="flex items-center gap-2">
            <StrainAvatar name={s.name} size={28} />
            {s.name}
            {hasChildren && (
              <Badge variant="outline" className="text-xs font-normal">
                {children.length} pheno{children.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground">{s.code || "-"}</td>
        <td className="px-4 py-3 text-muted-foreground">
          {s.category ? CATEGORY_LABELS[s.category] : "-"}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {s.thc_range || "-"}
        </td>
        <td className="px-4 py-3 text-muted-foreground">{s.coas_count}</td>
        <td className="px-4 py-3">
          <Badge variant={s.active ? "default" : "secondary"}>
            {s.active ? "Active" : "Inactive"}
          </Badge>
        </td>
      </tr>
      {children.map((c) => (
        <tr
          key={c.id}
          className="border-b last:border-0 hover:bg-muted/20 cursor-pointer bg-muted/10"
          onClick={() => onNavigate(c.id)}
        >
          <td className="px-4 py-2 pl-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChevronRightIcon className="size-3 shrink-0" />
              <StrainAvatar name={c.name} size={22} />
              <span className="text-sm">{c.name}</span>
              <Badge variant="secondary" className="text-xs font-normal">
                pheno
              </Badge>
            </div>
          </td>
          <td className="px-4 py-2 text-muted-foreground text-sm">
            {c.code || "-"}
          </td>
          <td className="px-4 py-2 text-muted-foreground text-sm">
            {c.category ? CATEGORY_LABELS[c.category] : "-"}
          </td>
          <td className="px-4 py-2 text-muted-foreground text-sm">
            {c.thc_range || "-"}
          </td>
          <td className="px-4 py-2 text-muted-foreground text-sm">
            {c.coas_count}
          </td>
          <td className="px-4 py-2">
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function StrainsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchStrains() {
      try {
        const data = await apiClient.getStrains();
        setStrains(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load strains");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStrains();
  }, [isAuthenticated]);

  function refreshStrains() {
    setIsLoading(true);
    apiClient.getStrains().then(setStrains).finally(() => setIsLoading(false));
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Strains</h2>
          <p className="text-sm text-muted-foreground">
            Manage strain library and lab results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMergeOpen(true)}>
            <MergeIcon className="mr-2 size-4" />
            Merge Phenos
          </Button>
          <Button asChild>
            <Link href="/admin/strains/new">
              <PlusIcon className="mr-2 size-4" />
              Add Strain
            </Link>
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : strains.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No strains yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/strains/new">Add your first strain</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">THC Range</th>
                <th className="px-4 py-3 text-left font-medium">COAs</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {strains
                .filter((s) => !s.parent_strain_id)
                .map((s) => {
                  const children = strains.filter(
                    (c) => c.parent_strain_id === s.id
                  );
                  return (
                    <StrainRow
                      key={s.id}
                      strain={s}
                      children={children}
                      onNavigate={(id) => router.push(`/admin/strains/${id}`)}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <StrainMergeDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        strains={strains}
        onMergeComplete={refreshStrains}
      />
    </div>
  );
}
