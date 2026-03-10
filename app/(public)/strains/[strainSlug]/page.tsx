"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import { apiClient, type Strain, CATEGORY_LABELS } from "@/lib/api";

const TERPENE_COLORS = [
  "bg-emerald-400", "bg-amber-400", "bg-violet-400", "bg-sky-400",
  "bg-rose-400", "bg-lime-400", "bg-orange-400", "bg-indigo-400",
];

const CATEGORY_COLORS: Record<string, string> = {
  indica: "bg-indigo-400 text-white",
  sativa: "bg-amber-400 text-white",
  hybrid: "bg-rose-400 text-white",
};

const ELEMENT_CARD_COLORS: Record<string, { bg: string; text: string }> = {
  indica: { bg: "bg-indigo-400", text: "text-indigo-950" },
  sativa: { bg: "bg-amber-300", text: "text-amber-950" },
  hybrid: { bg: "bg-rose-300", text: "text-rose-950" },
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return words[0][0].toUpperCase() + words.slice(1).map(w => w[0].toLowerCase()).join("");
}

export default function StrainDetailPage({
  params,
}: {
  params: Promise<{ strainSlug: string }>;
}) {
  const { strainSlug } = use(params);
  const router = useRouter();
  const [strain, setStrain] = useState<Strain | null>(null);
  const [otherStrains, setOtherStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [strainData, allStrains] = await Promise.all([
          apiClient.getPublicStrain(strainSlug),
          apiClient.getPublicStrains(),
        ]);
        setStrain(strainData);
        setOtherStrains(
          allStrains.filter((s) => s.active && s.image_url && s.id !== strainData.id)
        );
      } catch (err) {
        console.error("Failed to load strain:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [strainSlug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-lg opacity-60">Loading...</p>
      </div>
    );
  }

  if (!strain) {
    return <p className="text-lg opacity-60 py-32 text-center">Strain not found.</p>;
  }

  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain.total_thc) || nonZero(strain.current_coa?.thc_percent);
  const cbd = nonZero(strain.cbd);
  const cbg = nonZero(strain.cbg);
  const totalCannabinoids = nonZero(strain.total_cannabinoids);
  const coaPdfUrl = strain.current_coa?.pdf_url;
  const smellTags = strain.smell_tags ?? [];
  const effectTags = strain.effect_tags ?? [];
  const dominantTerpenes = strain.dominant_terpenes;
  const coaTerpenes = strain.current_coa?.terpenes;
  const totalTerpenes = nonZero(strain.total_terpenes);

  return (
    <div className="px-6 lg:px-10 py-12 lg:py-20 max-w-7xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100 transition-opacity mb-8"
      >
        <ArrowLeftIcon className="size-4" />
        Back
      </button>

      <div className="grid gap-10 md:gap-16 md:grid-cols-2">
        {/* Image */}
        <div className="flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-lg rounded-3xl bg-white overflow-hidden">
            {strain.image_url ? (
              <img
                src={strain.image_url}
                alt={strain.name}
                className="size-full object-contain p-8"
              />
            ) : (
              <div className="size-full flex items-center justify-center opacity-40">
                No image
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          {/* Category badge */}
          {strain.category && (
            <span className={`inline-block rounded-full px-4 py-1 text-sm font-medium mb-4 ${CATEGORY_COLORS[strain.category] || "bg-muted"}`}>
              {CATEGORY_LABELS[strain.category]}
            </span>
          )}

          {/* Name */}
          {strain.title_image_url ? (
            <img
              src={strain.title_image_url}
              alt={strain.name}
              className="h-20 md:h-24 w-auto object-contain mb-6"
            />
          ) : (
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              {strain.name}
            </h1>
          )}

          {/* Cannabinoid stats */}
          {(thc || cbd || cbg || totalCannabinoids) && (
            <div className="border rounded-xl p-5 mb-6 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {thc && (
                  <div>
                    <p className="text-2xl font-bold">{thc}%</p>
                    <p className="text-sm opacity-60">THC</p>
                  </div>
                )}
                {cbd && (
                  <div>
                    <p className="text-2xl font-bold">{cbd}%</p>
                    <p className="text-sm opacity-60">CBD</p>
                  </div>
                )}
                {cbg && (
                  <div>
                    <p className="text-2xl font-bold">{cbg}%</p>
                    <p className="text-sm opacity-60">CBG</p>
                  </div>
                )}
                {totalCannabinoids && (
                  <div>
                    <p className="text-2xl font-bold">{totalCannabinoids}%</p>
                    <p className="text-sm opacity-60">Total Cannabinoids</p>
                  </div>
                )}
              </div>

              {coaPdfUrl && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={coaPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-base font-semibold underline underline-offset-4 hover:opacity-70"
                  >
                    <DownloadIcon className="size-4" />
                    Download COA
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Element card + Effects + Flavours */}
          {(strain.category || effectTags.length > 0 || smellTags.length > 0) && (
            <div className="border rounded-xl p-5 mb-6 bg-white">
              <div className="flex gap-6">
                {/* Element card */}
                {strain.category && (
                  <div className={`shrink-0 w-28 rounded-xl p-4 flex flex-col justify-between ${ELEMENT_CARD_COLORS[strain.category]?.bg || "bg-muted"} ${ELEMENT_CARD_COLORS[strain.category]?.text || ""}`}>
                    <p className="text-xs font-mono uppercase tracking-wide opacity-70">
                      {CATEGORY_LABELS[strain.category]}
                    </p>
                    <p className="text-3xl font-bold text-center leading-none py-3">
                      {getInitials(strain.name)}
                    </p>
                    <p className="text-xs font-semibold text-center leading-tight">
                      {strain.name}
                    </p>
                  </div>
                )}

                {/* Effects + Flavours */}
                {(effectTags.length > 0 || smellTags.length > 0) && (
                  <div className="grid grid-cols-2 gap-6">
                    {effectTags.length > 0 && (
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wide opacity-50 mb-3">Top effects</p>
                        <div className="space-y-2">
                          {effectTags.map((tag) => (
                            <div key={tag} className="flex items-center gap-2">
                              <span className="opacity-40 text-lg">✦</span>
                              <span className="text-base capitalize">{tag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {smellTags.length > 0 && (
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wide opacity-50 mb-3">Top flavours</p>
                        <div className="space-y-2">
                          {smellTags.map((tag) => (
                            <div key={tag} className="flex items-center gap-2">
                              <span className="opacity-40 text-lg">✦</span>
                              <span className="text-base capitalize">{tag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Terpenes */}
              {(dominantTerpenes || (coaTerpenes && Object.keys(coaTerpenes).length > 0)) && (
                <div className="mt-5 pt-5 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-50">Terpenes</p>
                    {totalTerpenes && (
                      <span className="text-xs opacity-50">({totalTerpenes}%)</span>
                    )}
                  </div>
                  {coaTerpenes && Object.keys(coaTerpenes).length > 0 ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {Object.entries(coaTerpenes)
                        .sort(([, a], [, b]) => b - a)
                        .map(([name], i) => (
                          <div key={name} className="inline-flex items-center gap-1.5">
                            <span className={`size-3 shrink-0 rounded-full ${TERPENE_COLORS[i % TERPENE_COLORS.length]}`} />
                            <span className="text-base capitalize">{name.replace(/_/g, " ")}</span>
                          </div>
                        ))}
                    </div>
                  ) : dominantTerpenes ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {dominantTerpenes.split(",").map((t, i) => (
                        <div key={t.trim()} className="inline-flex items-center gap-1.5">
                          <span className={`size-3 shrink-0 rounded-full ${TERPENE_COLORS[i % TERPENE_COLORS.length]}`} />
                          <span className="text-base">{t.trim()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {strain.description && (
            <div className="mb-6">
              <p className="text-xs font-mono uppercase tracking-wide opacity-50 mb-3">About this strain</p>
              <div className={`relative ${!descExpanded ? "max-h-28 overflow-hidden" : ""}`}>
                <p className="text-lg leading-relaxed">{strain.description}</p>
                {!descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FFFBF9] to-transparent" />
                )}
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 text-base font-semibold hover:opacity-70 transition-opacity"
              >
                {descExpanded ? "show less" : "show more"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Other strains */}
      {otherStrains.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">Other strains</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherStrains.map((s) => (
              <Link
                key={s.id}
                href={`/strains/${s.slug || s.id}`}
                className="group rounded-3xl bg-white overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between p-5 pb-0">
                  {s.category && (
                    <span className="text-sm font-medium opacity-70">
                      {CATEGORY_LABELS[s.category]}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center px-8 py-4">
                  <img
                    src={s.image_url!}
                    alt={s.name}
                    className="h-[180px] w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-5 pb-5">
                  {s.title_image_url ? (
                    <img src={s.title_image_url} alt={s.name} className="h-14 w-auto object-contain" />
                  ) : (
                    <h3 className="text-2xl font-black leading-none">{s.name}</h3>
                  )}
                  {(s.total_thc || s.cbg) && (
                    <div className="flex gap-4 mt-2 text-sm">
                      {s.total_thc && <span>THC <span className="font-bold">{parseFloat(s.total_thc).toFixed(0)}%</span></span>}
                      {s.cbg && <span>CBG <span className="font-bold">{parseFloat(s.cbg).toFixed(0)}%</span></span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
