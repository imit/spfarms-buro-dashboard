"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type SampleBatch,
  type SampleHandoff,
  type SampleInventoryRow,
  SAMPLE_HANDOFF_STATUS_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageIcon, SendIcon, CheckCircleIcon } from "lucide-react";

export default function SamplesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<SampleInventoryRow[]>([]);
  const [batches, setBatches] = useState<SampleBatch[]>([]);
  const [handoffs, setHandoffs] = useState<SampleHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([
      apiClient.getSampleInventory(),
      apiClient.getSampleBatches(),
      apiClient.getSampleHandoffs(),
    ])
      .then(([inv, bat, hand]) => {
        setInventory(inv);
        setBatches(bat);
        setHandoffs(hand);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  const totalAvailable = inventory.reduce((s, r) => s + r.available_count, 0);

  return (
    <div className="space-y-8 px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Samples</h2>
          <p className="text-sm text-muted-foreground">
            Prepare, give, and track sample deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/samples/prepare">
              <PackageIcon className="mr-2 size-4" />
              Prepare
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/samples/give">
              <SendIcon className="mr-2 size-4" />
              Give
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/samples/drop">
              <CheckCircleIcon className="mr-2 size-4" />
              Drop
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {/* Inventory Summary */}
          <section>
            <h3 className="text-lg font-medium mb-3">
              Available Inventory ({totalAvailable})
            </h3>
            {inventory.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No prepared samples in stock.
                </p>
                <Button asChild className="mt-3" size="sm">
                  <Link href="/admin/samples/prepare">Prepare samples</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {inventory.map((row) => (
                  <div
                    key={`${row.strain_id}-${row.weight}`}
                    className="rounded-lg border bg-card p-4 shadow-xs"
                  >
                    <p className="font-medium">{row.strain_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.weight}g
                      {row.strain_category && (
                        <> &middot; {row.strain_category}</>
                      )}
                    </p>
                    <p className="text-2xl font-semibold mt-2">
                      {row.available_count}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Batches */}
          <section>
            <h3 className="text-lg font-medium mb-3">Recent Batches</h3>
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No batches created yet.
              </p>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Strain
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Units
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Prepared By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/samples/batches/${b.id}`)
                        }
                      >
                        <td className="px-4 py-3 font-medium">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{b.strain?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {b.weight}g
                        </td>
                        <td className="px-4 py-3 text-right">
                          {b.unit_count}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {b.item_counts.prepared} avail /{" "}
                            {b.item_counts.assigned} out /{" "}
                            {b.item_counts.dropped} done
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {b.prepared_by.full_name || b.prepared_by.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Handoffs */}
          <section>
            <h3 className="text-lg font-medium mb-3">Recent Handoffs</h3>
            {handoffs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No handoffs recorded yet.
              </p>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Given By
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Receiver
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Company
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {handoffs.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/samples/handoffs/${h.id}`)
                        }
                      >
                        <td className="px-4 py-3 font-medium">
                          {new Date(h.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {h.given_by.full_name || h.given_by.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {h.receiver.full_name || h.receiver.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {h.company?.name || "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {h.items.length}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              h.status === "dropped" ? "default" : "secondary"
                            }
                          >
                            {SAMPLE_HANDOFF_STATUS_LABELS[h.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
