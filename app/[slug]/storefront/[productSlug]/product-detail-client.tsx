"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import posthog from "posthog-js";
import { apiClient, type Product, type Strain, type Coa, PRODUCT_TYPE_LABELS, CATEGORY_LABELS } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import { LivingSoilIcon, IndoorGrowIcon } from "./icons";
import { ProductCard } from "@/components/storefront/product-card";

function formatPrice(price: string | null) {
  if (!price) return "—";
  const n = parseFloat(price);
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

const WEIGHT_NAMES: Record<number, string> = {
  3.5: "eights",
  7: "quarters",
  14: "halves",
  28: "ounces",
};

const TERPENE_COLORS = [
  "bg-emerald-400", "bg-amber-400", "bg-violet-400", "bg-sky-400",
  "bg-rose-400", "bg-lime-400", "bg-orange-400", "bg-indigo-400",
  "bg-teal-400", "bg-pink-400", "bg-cyan-400", "bg-yellow-400",
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


const BgPattern = () => (
  <svg width="574" height="629" viewBox="0 0 574 629" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M565.96 371.75C557.935 379.752 525.697 383.633 529.39 402.251C564.904 412.524 581.259 454.459 570.958 487.442C562.822 513.586 520.421 496.711 501.15 504.238C497.457 518.049 512.202 522.749 516.45 532.467C525.225 552.352 531.556 581.427 519.282 600.758C512.674 611.189 471.856 613.83 458.444 610.845C422.818 602.844 409.601 549.632 383.222 538.198C351.095 524.202 298.67 551.824 260.684 533.656C232.333 520.135 217.228 466.554 187.266 454.829C142.394 437.294 96.2723 492.143 46.2075 440.938C30.7966 425.226 21.1613 396.441 6.33341 379.646C-28.6259 340.219 -54.8939 360.21 -99.2942 354.4C-176.571 344.312 -158.717 250.961 -200.951 234.8C-239.02 220.17 -272.674 241.058 -300.164 198.753C-321.517 165.875 -328.126 114.38 -370.638 96.7664C-348.424 148.631 -362.502 201.394 -356.56 252.968C-349.007 317.799 -285.031 302.007 -247.906 334.251C-211.058 366.31 -223.332 424.328 -163.437 443.236C-113.372 459.027 -49.2016 442.523 -9.9106 481.368C6.44445 497.636 17.4959 527.767 34.4896 542.846C78.8066 582.087 179.158 541.208 237.526 560.565C257.935 567.273 289.951 613.143 313.97 622.967C344.208 635.405 388.803 615.969 413.849 653.758C432.648 682.094 400.91 717.242 372.753 727.039C332.213 741.115 214.978 738.764 176.409 718.879C160.36 710.614 138.812 679.189 121.902 667.199C69.088 629.965 -38.5389 681.829 -83.0224 628.697C-100.599 607.729 -110.235 561.674 -130.255 547.335C-152.941 531.068 -195.175 537.696 -224.553 529.272C-275.285 514.642 -271.231 457.443 -288.141 418.307C-309.3 369.453 -347.008 386.248 -391.686 372.912C-384.605 394.355 -364.751 409.064 -358.698 431.748C-339.9 502.046 -369.944 542.265 -282.365 575.67C-237.021 592.915 -146.221 598.645 -139.974 656.32C-139.029 665.034 -137.058 676.31 -144.222 683.203C-167.547 705.544 -300.692 689.831 -333.846 679.479C-435.808 647.684 -393.935 539.545 -404.626 462.355C-416.899 373.731 -519.611 292.448 -454.607 195.003C-443.75 178.657 -415.011 157.319 -412.65 140.234C-406.403 94.9179 -415.483 69.5665 -455.273 44.9809C-422.119 27.1821 -389.242 -1.33825 -349.368 2.01553C-304.579 5.73901 -287.391 69.5665 -255.459 65.3941C-228.524 61.8554 -210.198 11.8128 -193.843 -7.17437C-173.822 -30.4132 -143.472 -41.2403 -122.785 -61.2046C-107.569 -76.0193 -100.405 -94.3462 -82.9946 -108.976C-45.8695 -140.032 -1.83024 -135.12 26.2427 -185.083C49.8728 -227.045 57.7866 -261.639 100.798 -294.517C162.22 -341.47 173.077 -279.068 214.173 -254.007C255.186 -228.946 298.836 -282.792 330.214 -300.591C380.584 -329.375 556.685 -322.562 521.254 -239.298C506.037 -203.516 448.586 -217.221 419.403 -214.95C378.501 -211.781 353.538 -191.606 305.556 -197.231C293.921 -198.604 286.757 -204.757 277.205 -206.13C227.696 -213.207 214.007 -171.351 168.94 -169.978C153.723 -169.529 143.81 -177.689 131.065 -178.877C79.9451 -183.789 56.5093 -179.141 34.8784 -132.03C38.4604 -116.133 145.143 -101.344 164.33 -102.321C219.421 -105.147 242.274 -150.093 287.257 -156.352C324.188 -161.448 331.657 -140.903 358.12 -129.917C399.493 -112.673 454.973 -179.221 506.37 -168.341C557.768 -157.434 532.083 -82.8061 512.785 -52.9125C480.852 -3.42448 447.115 5.92385 387.026 -3.79419C362.646 -7.70254 328.908 -34.4007 305.861 -34.5856C271.291 -34.8496 238.22 1.09126 197.874 -2.97552C151.28 -7.70251 130.982 -68.6251 74.3916 -70.1832C60.3134 -70.5529 46.3186 -61.8383 32.2405 -61.363C8.05502 -60.7292 -13.6869 -73.537 -42.5929 -70.1832C-49.6736 -69.3645 -117.704 -49.2155 -106.569 -38.9429C-75.1919 -55.21 -50.2567 -16.6811 -23.9054 -11.9806C19.4675 -4.16388 57.259 -29.5945 100.826 -14.0668C140.978 0.272605 151.668 54.8574 183.601 64.8395C235.471 80.9218 282.231 32.1467 334.878 55.3855C353.871 63.7304 373.225 84.2492 395.634 87.5237C452.502 95.8686 554.27 28.6873 567.487 130.648C577.594 208.471 540.275 226.719 466.024 219.087C445.615 217.001 421.041 204.272 400.16 205.197C359.064 207.019 342.154 248.611 278.649 236.173C253.048 231.182 230.278 196.403 209.397 189.484C188.516 182.592 161.776 185.84 141.95 181.852C97.7163 172.953 84.61 134.186 58.1476 105.032C15.5245 58.1847 -13.5759 101.942 -59.5866 90.323C-109.013 77.8057 -147.554 -38.9956 -200.84 69.8042C-132.337 63.8888 -149.637 162.891 -90.1864 169.52C-59.7532 172.873 -37.2893 164.898 -5.71767 178.974C29.2416 194.581 55.0376 249.535 96.1335 257.801C127.233 264.059 175.326 239.896 216.034 246.551C246.356 251.463 246.356 273.804 265.626 289.411C323.161 335.809 385.443 263.346 432.287 296.778C442.394 304.041 449.753 323.292 462.248 326.83C490.21 334.832 517.811 310.299 549.938 319.648C564.682 323.926 579.316 358.889 566.098 371.961V371.776L565.96 371.75Z" fill="#1E691C" fill-opacity="0.2" />
  </svg>

)

interface ProductDetailClientProps {
  slug: string;
  productSlug: string;
  product: Product;
  strain: Strain | null;
  otherFlowers: Product[];
  strainMap: Record<number, Strain>;
}

export default function ProductDetailClient({
  slug,
  productSlug,
  product,
  strain,
  otherFlowers,
  strainMap,
}: ProductDetailClientProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [coas, setCoas] = useState<Coa[]>([]);

  useEffect(() => {
    posthog.capture("product_viewed", {
      product_id: product.id,
      product_name: product.name,
      product_type: product.product_type,
      price: product.default_price,
      company_slug: slug,
    });
  }, [product, slug]);

  useEffect(() => {
    async function loadCoas() {
      if (product.strain_id) {
        try {
          const strainCoas = await apiClient.getPublicStrainCoas(product.strain_id);
          setCoas(strainCoas);
        } catch (err) {
          console.error("Failed to load COAs:", err);
        }
      }
    }
    loadCoas();
  }, [product.strain_id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadAuthData() {
      try {
        const company = await apiClient.getCompany(slug);
        setCompanyId(company.id);
      } catch (err) {
        console.error("Failed to load company:", err);
      }
    }

    loadAuthData();
  }, [isAuthenticated, slug]);

  const handleAddToCart = async () => {
    if (!companyId || !product) return;
    setAdding(true);
    try {
      await apiClient.addToCart(companyId, product.id, quantity);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      posthog.capture("product_added_to_cart", {
        product_id: product.id,
        product_name: product.name,
        quantity,
        company_slug: slug,
      });
      toast("Product added to the cart", {
        action: {
          label: "View cart",
          onClick: () => { window.location.href = `/${slug}/cart`; },
        },
      });
      setQuantity(1);
    } catch {
      showError("add this item to your cart");
    } finally {
      setAdding(false);
    }
  };

  const handleOtherAddToCart = async (productId: number, qty: number) => {
    if (!companyId) return;
    try {
      await apiClient.addToCart(companyId, productId, qty);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      const p = otherFlowers.find((f) => f.id === productId);
      posthog.capture("product_added_to_cart", {
        product_id: productId,
        product_name: p?.name,
        quantity: qty,
        company_slug: slug,
      });
      toast("Product added to the cart", {
        action: {
          label: "View cart",
          onClick: () => { window.location.href = `/${slug}/cart`; },
        },
      });
    } catch {
      showError("add this item to your cart");
    }
  };

  const unitWeight = product.unit_weight ? parseFloat(product.unit_weight) : null;
  const nonZero = (v: string | null | undefined) => v && parseFloat(v) > 0 ? v : null;
  const thc = nonZero(strain?.total_thc) || nonZero(product.thc_content);
  const cbd = nonZero(strain?.cbd) || nonZero(product.cbd_content);
  const cbg = nonZero(strain?.cbg);
  const totalCannabinoids = nonZero(strain?.total_cannabinoids);
  const coaPdfUrl = strain?.current_coa?.pdf_url;
  const smellTags = strain?.smell_tags ?? [];
  const effectTags = strain?.effect_tags ?? [];
  const dominantTerpenes = strain?.dominant_terpenes;
  const coaTerpenes = strain?.current_coa?.terpenes;
  const totalTerpenes = nonZero(strain?.total_terpenes);

  const weightLabel = unitWeight
    ? `${unitWeight} gram${unitWeight !== 1 ? "s" : ""}`
    : null;
  const weightName = unitWeight ? WEIGHT_NAMES[unitWeight] : null;

  return (
    <div>
      <button
        onClick={() => router.push(`/${slug}/storefront`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="size-4" />
        Back to Shop
      </button>

      <div className="grid gap-8 md:gap-12 md:grid-cols-2">
        {/* Image */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl border overflow-visible" style={{ backgroundColor: "#fff" }}>
            {product.best_seller && (
              <div className="absolute -top-[15px] -right-[15px] z-10">
                <div className="relative size-20">
                  <svg viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
                    <path d="M71.5107 28.3601C75.6176 30.0584 78.6852 32.4667 80.4599 35.4833C81.4674 37.1506 82 39.0615 82 41.0095C82 42.9576 81.4674 44.8685 80.4599 46.5358C78.6852 49.527 75.6176 51.9353 71.5107 53.6337C73.2092 57.7403 73.6909 61.6189 72.8036 64.9904C72.338 66.8802 71.3643 68.6065 69.988 69.9827C68.6117 71.3589 66.8851 72.3325 64.9953 72.798C63.845 73.0972 62.66 73.2421 61.4715 73.2291C58.7737 73.1637 56.1138 72.5784 53.6378 71.5053C51.9392 75.612 49.5308 78.7046 46.5139 80.4537C44.8464 81.4614 42.9358 81.996 40.9873 82C39.0398 81.9893 37.1309 81.4552 35.4607 80.4537C32.4692 78.7046 30.0607 75.612 28.3621 71.5306C24.2551 73.2037 20.3764 73.6854 17.0046 72.798C15.1128 72.3365 13.3841 71.3643 12.0071 69.9874C10.6302 68.6106 9.65783 66.8821 9.19621 64.9904C8.30897 61.6189 8.79065 57.7403 10.4638 53.6337C6.38222 51.9353 3.28939 49.527 1.54012 46.5358C0.532567 44.8685 0 42.9576 0 41.0095C0 39.0615 0.532567 37.1506 1.54012 35.4833C3.28939 32.4667 6.38222 30.0584 10.4638 28.3601C8.79065 24.2788 8.30897 20.3748 9.19621 17.0034C9.66185 15.1137 10.6355 13.3873 12.0118 12.0111C13.3882 10.6349 15.1147 9.66126 17.0046 9.19566C20.3764 8.30833 24.2551 8.78998 28.3621 10.4885C30.0607 6.4071 32.4692 3.31451 35.4607 1.54C37.1281 0.532526 39.0391 0 40.9873 0C42.9355 0 44.8466 0.532526 46.514 1.54C49.5308 3.31451 51.9393 6.4071 53.6378 10.4885C57.7447 8.78998 61.6236 8.3337 64.9953 9.19566C66.8832 9.6653 68.6076 10.6402 69.9833 12.0158C71.359 13.3914 72.334 15.1156 72.8036 17.0034C73.6909 20.3748 73.2092 24.2788 71.5107 28.3601Z" fill="#FF7274"/>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white leading-tight text-center">
                    best<br/>seller
                  </span>
                </div>
              </div>
            )}
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="size-full object-contain p-4"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {/* Description — desktop only (mobile version below grid) */}
          {(strain?.description || product.description) && (
            <div className="hidden md:block mt-4">
              <p className="text-sm font-mono text-muted-foreground uppercase tracking-wide mb-3">Description</p>
              <div className={`relative ${!descExpanded ? "max-h-30 overflow-hidden" : ""}`}>
                <p className="text-lg leading-relaxed">
                  {strain?.description || product.description}
                </p>
                {!descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-[#FFFBF8] to-transparent" />
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

        {/* Info */}
        <div>
          {/* Product type */}
          <span className="text-sm font-mono text-muted-foreground uppercase tracking-wide">
            {PRODUCT_TYPE_LABELS[product.product_type]}
          </span>

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-bold mt-1 mb-2">{product.name}</h1>

          {/* Category badge */}
          {strain?.category && (
            <span className={`inline-block rounded-full px-4 py-1 text-sm font-medium mb-6 ${CATEGORY_COLORS[strain.category] || "bg-muted text-foreground"}`}>
              {CATEGORY_LABELS[strain.category]}
            </span>
          )}

          <div className="border rounded-xl p-5 mb-5 bg-white">
            {/* Cannabinoid stats */}
            {(thc || cbd || cbg || totalCannabinoids) && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {thc && (
                    <div>
                      <p className="text-2xl font-bold">{thc}%</p>
                      <p className="text-sm text-muted-foreground">THC</p>
                    </div>
                  )}
                  {cbd && (
                    <div>
                      <p className="text-2xl font-bold">{cbd}%</p>
                      <p className="text-sm text-muted-foreground">CBD</p>
                    </div>
                  )}
                  {cbg && (
                    <div>
                      <p className="text-2xl font-bold">{cbg}%</p>
                      <p className="text-sm text-muted-foreground">CBG</p>
                    </div>
                  )}
                  {totalCannabinoids && (
                    <div>
                      <p className="text-2xl font-bold">{totalCannabinoids}%</p>
                      <p className="text-sm text-muted-foreground">Total Cannabinoids</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unit weight + COA row */}
            {(weightLabel || coaPdfUrl) && (
              <div className="">
                <div className="grid grid-cols-2 gap-4">
                  {weightLabel && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Unit weight</p>
                      <p className="text-lg font-semibold">
                        {weightLabel}{weightName ? ` / ${weightName}` : ""}
                      </p>
                    </div>
                  )}
                  {coaPdfUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">COA</p>
                      <a
                        href={coaPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-lg font-semibold underline underline-offset-4 hover:opacity-70"
                      >
                        <DownloadIcon className="size-4" />
                        Download COA
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price + Add — desktop only (mobile has sticky bar) */}
          <div className="hidden md:flex items-center justify-between pt-2 mb-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {product.price_tbd ? "TBD" : formatPrice(product.default_price)}
              </span>
              {!product.price_tbd && (
                <span className="text-lg text-muted-foreground">each</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 rounded-xl border text-center text-lg font-mono py-3 bg-background"
              />
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="relative overflow-hidden rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-xl font-medium px-20 py-4 transition-colors disabled:opacity-50"
              >
                <span className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/30 to-transparent" />
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          {/* Strain Element Card + Effects + Flavours + Terpenes */}
          {(strain || effectTags.length > 0 || smellTags.length > 0 || dominantTerpenes || (coaTerpenes && Object.keys(coaTerpenes).length > 0)) && (
            <div className="flex gap-4 mb-5">


              {/* Effects + Flavours + Terpenes */}
              {(effectTags.length > 0 || smellTags.length > 0 || dominantTerpenes || (coaTerpenes && Object.keys(coaTerpenes).length > 0)) && (
                <div className="flex-1 border rounded-xl p-5 bg-white space-y-5">
                  <div className="flex gap-10">
                    {/* Strain Element Card */}
                    {strain && (
                      <div className={`shrink-0 w-32 rounded-xl p-4 flex flex-col justify-between ${ELEMENT_CARD_COLORS[strain.category || ""]?.bg || "bg-muted"} ${ELEMENT_CARD_COLORS[strain.category || ""]?.text || "text-foreground"}`}>
                        <p className="text-xs font-mono uppercase tracking-wide opacity-70">
                          {(strain.category && CATEGORY_LABELS[strain.category]) || "—"}
                        </p>
                        <p className="text-4xl font-bold text-center leading-none py-4">
                          {getInitials(strain.name)}
                        </p>
                        <p className="text-xs font-semibold text-center leading-tight">
                          {strain.name}
                        </p>
                      </div>
                    )}
                    {/* Two-column: Effects & Flavours */}
                    {(effectTags.length > 0 || smellTags.length > 0) && (
                      <div className="grid grid-cols-2 gap-6">
                        {effectTags.length > 0 && (
                          <div>
                            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-3">Top effects</p>
                            <div className="space-y-2.5">
                              {effectTags.map((tag) => (
                                <div key={tag} className="flex items-center gap-2.5">
                                  <span className="text-muted-foreground text-lg">✦</span>
                                  <span className="text-base capitalize">{tag}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {smellTags.length > 0 && (
                          <div>
                            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-3">Top flavours</p>
                            <div className="space-y-2.5">
                              {smellTags.map((tag) => (
                                <div key={tag} className="flex items-center gap-2.5">
                                  <span className="text-muted-foreground text-lg">✦</span>
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
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide underline underline-offset-4">Terpenes</p>
                        {totalTerpenes && (
                          <span className="text-xs text-muted-foreground">({totalTerpenes}%)</span>
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
            </div>
          )}



          {/* Additional COA documents */}
          {coas.length > 1 && (
            <div className="border-t pt-5 mt-6">
              <p className="text-sm text-muted-foreground mb-3">All Certificates of Analysis</p>
              <div className="space-y-2">
                {coas.map((coa) => (
                  <div key={coa.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">
                      {coa.tested_at ? new Date(coa.tested_at).toLocaleDateString() : "COA"}
                      {coa.thc_percent && <span className="ml-2 text-muted-foreground">THC: {coa.thc_percent}%</span>}
                    </span>
                    {coa.pdf_url && (
                      <a
                        href={coa.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-foreground underline hover:opacity-70"
                      >
                        <DownloadIcon className="size-3.5" />
                        PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description — mobile only (above feature section) */}
      {(strain?.description || product.description) && (
        <div className="md:hidden mt-6">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-wide mb-3">Description</p>
          <div className={`relative ${!descExpanded ? "max-h-30 overflow-hidden" : ""}`}>
            <p className="text-lg leading-relaxed">
              {strain?.description || product.description}
            </p>
            {!descExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-[#FFFBF8] to-transparent" />
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

      {/* Two-column feature section */}
      <div className="grid md:grid-cols-2 gap-4 mt-10">
        {/* Left — info card */}
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col relative overflow-hidden ">


          <div className="space-y-10 relative z-10">
            <div>
              <div className="mb-2"><LivingSoilIcon /></div>
              <p className="text-xl font-bold mb-2">Living soil</p>
              <p className="text-lg leading-relaxed opacity-90">
                Rooted in biologically active living soil that naturally feeds the plant, enhancing terpene expression, complexity, and overall plant health.
              </p>
            </div>
            <div>
              <div className="mb-2"><IndoorGrowIcon /></div>
              <p className="text-xl font-bold mb-2">Indoor grow</p>
              <p className="text-lg leading-relaxed opacity-90">
                Grown in a controlled indoor environment where light, temperature, and humidity are precisely managed for consistent quality.
              </p>
            </div>
          </div>

          <div className="absolute top-0 left-0 z-0 user-select-none">
            <BgPattern />
          </div>
        </div>
        {/* Right — first promotional image */}
        <div className="rounded-2xl overflow-hidden " style={{maxHeight:'800px'}}>
          {product.promotional_image_urls?.[0] ? (
            <img src={product.promotional_image_urls[0].url} alt={product.name} className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center bg-muted text-muted-foreground">
              No image
            </div>
          )}
        </div>
      </div>

      {/* Other flowers */}
      {otherFlowers.length > 0 && (
        <div className="mt-20 mb-20 py-16">
          <h2 className="text-2xl font-bold mb-8">Other flowers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherFlowers.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                slug={slug}
                strain={p.strain_id ? strainMap[p.strain_id] : undefined}
                onAddToCart={handleOtherAddToCart}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Promo gallery — 2nd and 3rd promotional images */}
      {product.promotional_image_urls.length > 1 && (
        <div className="grid grid-cols-2 gap-4 mt-12">
          {product.promotional_image_urls.slice(1, 3).map((img) => (
            <img
              key={img.attachment_id}
              src={img.url}
              alt={product.name}
              className="w-full rounded-2xl object-cover aspect-4/5"
            />
          ))}
        </div>
      )}

      {/* Sticky Price + Add bar — mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-[#FFFBF8] px-4 py-3 safe-area-pb">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">
              {product.price_tbd ? "TBD" : formatPrice(product.default_price)}
            </span>
            {!product.price_tbd && (
              <span className="text-sm text-muted-foreground">each</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 rounded-xl border text-center text-base font-mono py-2.5 bg-background"
            />
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="relative overflow-hidden rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-lg font-medium px-10 py-2.5 transition-colors disabled:opacity-50"
            >
              <span className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/30 to-transparent" />
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for sticky bar on mobile */}
      <div className="md:hidden h-20" />
    </div>
  );
}
