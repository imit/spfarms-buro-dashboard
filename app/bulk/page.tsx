"use client";

import { useEffect, useState } from "react";
import { apiClient, type Product, type Strain } from "@/lib/api";
import { Logo } from "@/components/shared/logo";
import { PandaSymbol } from "@/components/shared/panda-symbol";
import { PhoneIcon, MailIcon, MapPinIcon, FileTextIcon } from "lucide-react";

export default function BulkPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [bulkPhone, setBulkPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [productData, strains, settings] = await Promise.all([
          apiClient.getPublicProducts(),
          apiClient.getPublicStrains(),
          apiClient.getPublicSettings(),
        ]);
        setProducts(productData.filter((p) => p.bulk));
        setBulkPhone(settings.bulk_sales_phone || "");

        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);
      } catch (err) {
        console.error("Failed to load bulk products:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center px-8">
          <p style={{ color: "#050403", opacity: 0.5 }}>Loading...</p>
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <PandaSymbol />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-32">
                <Logo />
              </div>
              <span className="text-lg font-semibold text-amber-600">Bulk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Current bulk flower availability
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {products.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No bulk products available at this time.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Strain</th>
                  <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">THC</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">COA</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const strain = p.strain_id ? strainMap[p.strain_id] : undefined;
                  const thc = (strain?.total_thc && parseFloat(strain.total_thc) > 0)
                    ? strain.total_thc
                    : (p.thc_content && parseFloat(p.thc_content) > 0 ? p.thc_content : null);
                  const coaUrl = strain?.current_coa?.pdf_url;

                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnail_url ? (
                            <img
                              src={p.thumbnail_url}
                              alt={p.name}
                              className="size-10 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="size-10 rounded-md bg-muted shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {p.strain_name || ""}
                              {thc ? ` · THC ${thc}%` : ""}
                              {coaUrl && (
                                <>
                                  {" · "}
                                  <a href={coaUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium">COA</a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {p.strain_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">
                        {thc ? `${thc}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">
                        TBD
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {coaUrl ? (
                          <a
                            href={coaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-xs"
                          >
                            <FileTextIcon className="size-3.5" />
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Cultivation & Quality */}
        <div className="mt-10 rounded-lg border bg-card p-8">
          <h2 className="text-lg font-semibold mb-2">Cultivation &amp; Quality</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              All SPFarms flower is cultivated <strong className="text-foreground">indoors</strong> using{" "}
              <strong className="text-foreground">living soil methodology</strong> with proprietary genetics developed in-house.
              Our controlled environment produces consistent cannabinoid profiles and terpene expression across harvests.
            </p>
            <p>
              Every harvest is <strong className="text-foreground">hand-trimmed</strong> and slow-cured to preserve trichome integrity and maximize shelf appeal.
              All batches are third-party lab tested with full COA documentation available per strain.
            </p>
          </div>
        </div>

        {/* Contact section */}
        <div className="mt-6 rounded-lg border bg-card p-8">
          <h2 className="text-lg font-semibold mb-1">Interested in bulk pricing?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Reach out to us for current pricing, availability, and to place an order.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {bulkPhone && (
              <a
                href={`tel:${bulkPhone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <PhoneIcon className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Call Us</p>
                  <p className="text-sm text-muted-foreground">{bulkPhone}</p>
                </div>
              </a>
            )}
            <a
              href="mailto:info@spfarmsny.com"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
            >
              <MailIcon className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Email Us</p>
                <p className="text-sm text-muted-foreground">info@spfarmsny.com</p>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <MapPinIcon className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">Catskills, New York</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-12 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} SPFarms. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
