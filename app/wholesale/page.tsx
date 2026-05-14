"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiClient, type Product, type Strain } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { preferredCompanySlug } from "@/lib/active-company";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicProductCard } from "@/components/storefront/public-product-card";
import { Marquee, MetaText, SectionLabel } from "@/components/public/style";

/**
 * Public wholesale landing page.
 *
 * Re-skinned to match the cream/lime/forest design system used by the rest of
 * the marketing site (home, /strains, /about, /wholesale/register). Sections
 * top-to-bottom:
 *
 *   1. PublicHeader — same nav as the rest of the public site
 *   2. Hero — section eyebrow + italic-emphasis headline + intro + dual CTA
 *   3. Marquee — looping lime ticker of brand values (matches home page)
 *   4. Value-prop trio — what dispensaries get when they partner with us
 *   5. Product menu — current strains, no pricing (gated until verified)
 *   6. Closing lime callout — final apply CTA
 *   7. PublicFooter — full forest-deep footer with nav + social
 *
 * Authenticated `account` users are redirected straight to their storefront
 * via {@link preferredCompanySlug} so multi-membership users land on the
 * dispensary they last worked in.
 */
export default function WholesalePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bulkPhone, setBulkPhone] = useState("");

  // Authenticated account users skip the marketing — straight to their
  // dashboard. Uses preferredCompanySlug so multi-membership users land on
  // their last-active dispensary, not the oldest membership.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== "account") return;
    const slug = preferredCompanySlug(user);
    if (slug) router.push(`/${slug}/storefront`);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    async function load() {
      try {
        const [productData, strains] = await Promise.all([
          apiClient.getPublicProducts(),
          apiClient.getPublicStrains(),
        ]);
        setProducts(productData.filter((p) => p.product_type !== "bulk_flower"));
        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);
      } catch (err) {
        console.error("Failed to load wholesale products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    apiClient.getPublicSettings()
      .then((s) => setBulkPhone(s.bulk_sales_phone || ""))
      .catch((err) => console.error("Failed to load public settings:", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-sf-cream text-sf-forest-deep">
      <PublicHeader />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="px-4 pt-10 pb-8 md:px-8 md:pt-20 md:pb-12">
          <div className="mx-auto max-w-[1400px]">
           

            <div className="mt-8 flex flex-wrap items-center gap-6 md:mt-10">
              <PrimaryCTA href="/wholesale/register" label="Apply to be a partner" />
              <Link
                href="/login"
                className="text-sm font-medium text-sf-forest-deep/70 underline underline-offset-4 hover:text-sf-forest-deep"
              >
                Already a partner? Log in →
              </Link>
            </div>
          </div>
        </section>

       

        {/* ── Current menu ────────────────────────────────────────────── */}
        <section className="px-4 pb-12 md:px-8 md:pb-20" id="menu">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel>current menu</SectionLabel>
                <h2 className="mt-3 text-[32px] font-bold leading-[1.05] tracking-tight md:text-[42px]">
                  What we&rsquo;re growing.
                </h2>
              </div>
              <p className="max-w-md text-sm text-sf-forest-deep/70 md:text-right">
                Pricing and COAs unlock once you&rsquo;re verified.
              </p>
            </div>

            {isLoading ? (
              <MenuPlaceholder>Loading menu…</MenuPlaceholder>
            ) : products.length === 0 ? (
              <MenuPlaceholder>
                No products available right now. Check back soon.
              </MenuPlaceholder>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    strain={
                      product.strain_id ? strainMap[product.strain_id] : undefined
                    }
                    onRegister={() => router.push("/wholesale/register")}
                    showPrice={false}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Closing CTA ─────────────────────────────────────────────── */}
        {!isLoading && products.length > 0 && (
          <section className="px-4 pb-16 md:px-8 md:pb-24">
            <div className="mx-auto max-w-[1400px]">
              <div className="rounded-[28px] bg-sf-lime p-8 text-center md:rounded-[40px] md:p-16">
                <SectionLabel className="text-sf-forest-deep">
                  ready to order?
                </SectionLabel>
                <h2 className="mt-4 text-[32px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep md:text-[52px]">
                  Let&rsquo;s <span className="italic font-bold">work</span> together.
                </h2>
               
                <div className="mt-8 flex justify-center md:mt-10">
                  <PrimaryCTA href="/wholesale/register" label="Apply now" />
                </div>
              </div>
            </div>
          </section>
        )}
        <section className="px-4 pb-12 md:px-8 md:pb-16">
          <div className="mx-auto max-w-[1400px]">
            <div className="rounded-[20px] bg-sf-forest-deep px-6 py-5 text-center text-sf-cream md:rounded-[24px] md:px-10 md:py-6">
              <p className="text-base md:text-lg">
                For bulk deals, call{" "}
                <a href={`tel:${bulkPhone.replace(/[^\d+]/g, "")}`} className="font-bold underline underline-offset-4">
                  {bulkPhone || "—"}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Local primitives                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

/** Pill-style primary CTA with the design system's signature cursor.png hover.
 *  Mirrors the pattern used on the dual-callout cards on the home page. */
function PrimaryCTA({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <span className="inline-flex h-12 items-center justify-center rounded-md bg-sf-ink px-8 text-sf-cream transition-colors hover:bg-sf-forest-deep">
        <MetaText size="sm" className="text-sf-cream">
          {label}
        </MetaText>
      </span>
      <Image
        src="/assets/cursor.png"
        alt=""
        width={28}
        height={28}
        aria-hidden="true"
        className="size-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
      />
    </Link>
  );
}

/** Empty/loading state for the product menu. Matches the cream-soft surface
 *  used elsewhere so it doesn't look like an error. */
function MenuPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-sf-cream-soft p-12 text-center">
      <p className="text-sm text-sf-forest-deep/50">{children}</p>
    </div>
  );
}
