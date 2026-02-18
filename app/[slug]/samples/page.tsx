"use client";

import { use, useEffect, useState } from "react";
import { apiClient, type SampleHandoff } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function SamplesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const [handoffs, setHandoffs] = useState<SampleHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getSampleHandoffs({ status: "dropped" })
      .then(setHandoffs)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, slug]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading samples...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Samples</h1>

      {handoffs.length === 0 ? (
        <p className="text-muted-foreground">No samples received yet.</p>
      ) : (
        <div className="space-y-4">
          {handoffs.map((h) => {
            const totalWeight = h.items.reduce((sum, i) => sum + i.weight, 0);

            return (
              <div key={h.id} className="rounded-lg border bg-card">
                <button
                  type="button"
                  className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setExpanded(expanded === h.id ? null : h.id)
                  }
                >
                  <div>
                    <p className="font-medium">
                      {h.dropped_at
                        ? new Date(
                            h.dropped_at + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : new Date(h.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {h.items.length}{" "}
                      {h.items.length === 1 ? "package" : "packages"} &middot;{" "}
                      {totalWeight}g total
                      {h.given_by.full_name && (
                        <> &middot; From {h.given_by.full_name}</>
                      )}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {expanded === h.id ? "Hide" : "Details"}
                  </span>
                </button>

                {expanded === h.id && (
                  <div className="border-t px-5 pb-4">
                    {h.notes && (
                      <p className="text-sm text-muted-foreground py-3 border-b whitespace-pre-wrap">
                        {h.notes}
                      </p>
                    )}
                    <table className="w-full text-sm mt-3">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left font-medium py-1.5">UID</th>
                          <th className="text-left font-medium py-1.5">
                            Strain
                          </th>
                          <th className="text-right font-medium py-1.5">
                            Weight
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="py-2 font-mono text-xs text-muted-foreground">
                              {item.sample_uid}
                            </td>
                            <td className="py-2 font-medium">
                              {item.strain_name}
                            </td>
                            <td className="py-2 text-right">{item.weight}g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
