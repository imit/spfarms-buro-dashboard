"use client";

import { use, useEffect, useState } from "react";
import { apiClient, type Sample, PRODUCT_TYPE_LABELS } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function SamplesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiClient
      .getSamples()
      .then(setSamples)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading samples...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Samples</h1>

      {samples.length === 0 ? (
        <p className="text-muted-foreground">No samples received yet.</p>
      ) : (
        <div className="space-y-4">
          {samples.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card">
              <button
                type="button"
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div>
                  <p className="font-medium">
                    {new Date(s.dropped_at + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {s.items.length} {s.items.length === 1 ? "package" : "packages"} &middot;{" "}
                    {s.items.reduce((sum, i) => sum + i.weight, 0)}g total
                    {s.user.full_name && (
                      <> &middot; Dropped by {s.user.full_name}</>
                    )}
                  </p>
                </div>
                <span className="text-muted-foreground text-sm">
                  {expanded === s.id ? "Hide" : "Details"}
                </span>
              </button>

              {expanded === s.id && (
                <div className="border-t px-5 pb-4">
                  {s.notes && (
                    <p className="text-sm text-muted-foreground py-3 border-b whitespace-pre-wrap">
                      {s.notes}
                    </p>
                  )}
                  <table className="w-full text-sm mt-3">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left font-medium py-1.5">UID</th>
                        <th className="text-left font-medium py-1.5">Product</th>
                        <th className="text-left font-medium py-1.5">Type</th>
                        <th className="text-right font-medium py-1.5">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="py-2 font-mono text-xs text-muted-foreground">
                            {item.sample_uid}
                          </td>
                          <td className="py-2 font-medium">
                            {item.product_name}
                            {item.strain_name && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.strain_name})
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {PRODUCT_TYPE_LABELS[item.product_type] || item.product_type}
                          </td>
                          <td className="py-2 text-right">{item.weight}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
