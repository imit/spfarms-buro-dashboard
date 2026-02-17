"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, type Sample, PRODUCT_TYPE_LABELS } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

export default function SampleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [sample, setSample] = useState<Sample | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getSample(Number(id))
      .then(setSample)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load sample")
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, id]);

  async function handleDelete() {
    if (!confirm("Delete this sample drop?")) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteSample(Number(id));
      router.push("/admin/samples");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="px-10 text-muted-foreground">Loading...</p>;
  }

  if (error || !sample) {
    return (
      <div className="px-10">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error || "Sample not found"}
        </div>
      </div>
    );
  }

  const canDelete = currentUser?.role === "admin" || currentUser?.role === "editor";

  return (
    <div className="space-y-6 px-10 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/samples">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Sample Drop</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(sample.dropped_at + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="mr-2 size-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">
              <Link
                href={`/admin/companies/${sample.company.slug}`}
                className="hover:underline"
              >
                {sample.company.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Recipient</dt>
            <dd className="font-medium">
              <Link
                href={`/admin/users/${sample.recipient.id}`}
                className="hover:underline"
              >
                {sample.recipient.full_name || sample.recipient.email}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dropped By</dt>
            <dd className="font-medium">
              <Link
                href={`/admin/users/${sample.user.id}`}
                className="hover:underline"
              >
                {sample.user.full_name || sample.user.email}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date</dt>
            <dd className="font-medium">
              {new Date(sample.dropped_at + "T00:00:00").toLocaleDateString()}
            </dd>
          </div>
          {sample.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="font-medium whitespace-pre-wrap">{sample.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card shadow-xs ring-1 ring-foreground/10">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-medium">
            Packages ({sample.items.length}) &mdash;{" "}
            {sample.items.reduce((sum, i) => sum + i.weight, 0)}g total
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t bg-muted/50">
              <th className="px-5 py-2.5 text-left font-medium">UID</th>
              <th className="px-5 py-2.5 text-left font-medium">Product</th>
              <th className="px-5 py-2.5 text-left font-medium">Type</th>
              <th className="px-5 py-2.5 text-right font-medium">Weight</th>
            </tr>
          </thead>
          <tbody>
            {sample.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {item.sample_uid}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/products/${item.product_slug}`}
                    className="hover:underline font-medium"
                  >
                    {item.product_name}
                  </Link>
                  {item.strain_name && (
                    <p className="text-xs text-muted-foreground">{item.strain_name}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {PRODUCT_TYPE_LABELS[item.product_type] || item.product_type}
                </td>
                <td className="px-5 py-3 text-right">{item.weight}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
