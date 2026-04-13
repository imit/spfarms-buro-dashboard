"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";

export default function StrainsPage() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getPublicStrains();
        setStrains(data.filter((s) => s.active && s.image_url));
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-7xl mx-auto">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">Our Strains</h1>
      <p className="text-lg text-foreground/70 mb-12 max-w-2xl">
        Small-batch, craft cannabis grown in the Catskill Mountains.
        Every strain is hand-selected and carefully cultivated.
      </p>

      {isLoading ? (
        <p className="text-lg opacity-60">Loading...</p>
      ) : strains.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 p-6 text-center text-foreground/50">
          No strains available right now
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {strains.map((strain) => {
            const thc = strain.total_thc || strain.current_coa?.thc_percent;
            const cbg = strain.cbg;
            const category = strain.category ? CATEGORY_LABELS[strain.category] : null;

            return (
              <Link
                key={strain.id}
                href={`/strains/${strain.slug || strain.id}`}
                className="group relative rounded-3xl bg-white overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between p-5 pb-0">
                  {category && (
                    <span className="text-sm font-medium opacity-70">{category}</span>
                  )}
                  <div className="size-9 rounded-full border border-current/10 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity ml-auto">
                    <ArrowUpRightIcon className="size-4" />
                  </div>
                </div>

                <div className="flex items-center justify-center px-8 py-4">
                  <img
                    src={strain.image_url!}
                    alt={strain.name}
                    className="h-[220px] w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="px-5 pb-2">
                  {strain.title_image_url ? (
                    <img
                      src={strain.title_image_url}
                      alt={strain.name}
                      className="h-16 md:h-20 w-auto object-contain"
                    />
                  ) : (
                    <h3 className="text-3xl md:text-4xl font-black leading-none">
                      {strain.name}
                    </h3>
                  )}
                </div>

                {(thc || cbg) && (
                  <div className="flex items-center gap-4 px-5 pb-5 pt-2 text-sm">
                    {thc && (
                      <span>
                        THC <span className="font-bold">{parseFloat(thc).toFixed(0)}%</span>
                      </span>
                    )}
                    {cbg && (
                      <span>
                        CBG <span className="font-bold">{parseFloat(cbg).toFixed(0)}%</span>
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
