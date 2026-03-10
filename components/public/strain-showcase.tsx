"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";

export function StrainShowcase() {
  const [strains, setStrains] = useState<Strain[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getPublicStrains();
        setStrains(data.filter((s) => s.active && s.image_url));
      } catch {
        // Silently fail
      }
    }
    load();
  }, []);

  if (strains.length === 0) return null;

  return (
    <section className="px-6 lg:px-10 py-20 lg:py-28 max-w-8xl mx-auto">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-12">
        Our Strains
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {strains.map((strain) => (
          <StrainCard key={strain.id} strain={strain} />
        ))}
      </div>
    </section>
  );
}

function StrainCard({ strain }: { strain: Strain }) {
  const thc = strain.total_thc || strain.current_coa?.thc_percent;
  const cbg = strain.cbg;
  const category = strain.category ? CATEGORY_LABELS[strain.category] : null;

  return (
    <Link
      href={`/strains/${strain.slug || strain.id}`}
      className="group relative rounded-3xl bg-white overflow-hidden transition-shadow hover:shadow-lg"
    >
      {/* Top row: category + arrow */}
      <div className="flex items-start justify-between p-5 pb-0">
        {category && (
          <span className="text-sm font-medium opacity-70">{category}</span>
        )}
        <div className="size-9 rounded-full border border-current/10 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity ml-auto">
          <ArrowUpRightIcon className="size-4" />
        </div>
      </div>

      {/* Bud image */}
      <div className="flex items-center justify-center px-8 py-4">
        <img
          src={strain.image_url!}
          alt={strain.name}
          className="h-[220px] w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Title image or text name */}
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

      {/* Cannabinoid stats */}
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
}
