"use client";

import { use, useCallback, useEffect, useState } from "react";
import { apiClient, type Product, type Strain, type Cart, type Company, type Menu, type PaymentTerm } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontOnboarding } from "@/components/storefront/onboarding-steps";
import { DealsBanner } from "@/components/storefront/deals-banner";
import { CodPromoBanner } from "@/components/storefront/cod-promo-banner";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import posthog from "posthog-js";
import { MapPinIcon, ChevronDownIcon } from "lucide-react";

export default function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [cart, setCart] = useState<Cart | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [bulkPhone, setBulkPhone] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [showOldStrains, setShowOldStrains] = useState(false);

  useEffect(() => {
    apiClient.getPublicSettings()
      .then((s) => setBulkPhone(s.bulk_sales_phone || ""))
      .catch(() => { /* ignore */ });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getPaymentTerms()
      .then(setPaymentTerms)
      .catch(() => { /* COD promo simply won't render */ });
  }, [isAuthenticated]);

  const fetchCart = useCallback(async (cId: number) => {
    try {
      const cartData = await apiClient.getCart(cId);
      setCart(cartData);
    } catch {
      // Cart may not exist yet
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [menuData, company, strains] = await Promise.all([
          apiClient.resolveMenuForCompany(slug),
          apiClient.getCompany(slug),
          apiClient.getStrains(),
        ]);
        setMenu(menuData);

        // Map visible menu items to Product-shaped objects with effective pricing
        const menuProducts = (menuData.items || [])
          .filter((item) => menuData.show_bulk || !item.bulk)
          .map((item) => ({
            id: item.product_id,
            name: item.product_name,
            slug: item.product_slug,
            product_type: item.product_type,
            default_price: item.effective_price != null ? String(item.effective_price) : null,
            price_tbd: item.price_tbd,
            thumbnail_url: item.thumbnail_url,
            strain_id: item.strain_id,
            strain_name: item.strain_name,
            unit_weight: item.unit_weight,
            minimum_order_quantity: item.minimum_order_quantity,
            coming_soon: item.coming_soon,
            best_seller: item.best_seller,
            new_drop: item.new_drop,
            has_current_coa: item.has_current_coa,
            cannabis: item.cannabis,
            thc_content: item.thc_content,
            cbd_content: item.cbd_content,
            in_stock: item.in_stock,
          } as Product))
          // In-stock products first, out-of-stock pushed to the end.
          // Stable sort preserves the menu's intended order within each group.
          .sort((a, b) => Number(b.in_stock) - Number(a.in_stock));
        setProducts(menuProducts);
        setCompany(company);

        const map: Record<number, Strain> = {};
        for (const strain of strains) {
          map[strain.id] = strain;
        }
        setStrainMap(map);

        await fetchCart(company.id);
      } catch (err) {
        console.error("Failed to load storefront:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, slug, fetchCart]);

  useEffect(() => {
    function onCartUpdated() {
      if (company) fetchCart(company.id);
    }
    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, [company, fetchCart]);

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!company) return;
    try {
      const updated = await apiClient.addToCart(company.id, productId, quantity, menu?.id);
      setCart(updated);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      const product = products.find((p) => p.id === productId);
      posthog.capture("product_added_to_cart", {
        product_id: productId,
        product_name: product?.name,
        quantity,
        company_slug: slug,
        company_name: company.name,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-lg text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Dispensary header */}
      {company && (
        <div className="mb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">
                {company.name}
              </h1>

              {company.locations.length > 0 && (
                <div className="">
                  {company.locations.map((loc) => (
                    <div key={loc.id} className="flex items-center gap-2">
                      <MapPinIcon className="size-4" />
                      <p className="text-lg text-muted-foreground">
                        {[loc.name, loc.address, loc.city, loc.state, loc.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt={company.name}
                className="size-20 shrink-0 rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* COD discount + bulk-pricing contact — single consolidated callout at the top of the page */}
      <CodPromoBanner
        paymentTerms={paymentTerms}
        disabled={menu?.disable_discounts}
        bulkPhone={bulkPhone}
      />

      {/* Onboarding — renders nothing once setup is complete & cart has items, or after the first order */}
      {company && (
        <StorefrontOnboarding slug={slug} company={company} cart={cart} />
      )}

      {/* Active deals — only shown when the cart has discounts attached and the menu allows them */}
      <DealsBanner discounts={cart?.discounts} disabled={menu?.disable_discounts} />

      {/* Products */}
      {products.length === 0 ? (
        <p className="text-lg text-muted-foreground">No products available.</p>
      ) : (
        (() => {
          const inStock = products.filter((p) => p.in_stock);
          const outOfStock = products.filter((p) => !p.in_stock);
          return (
            <>
              {inStock.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold mb-4">Our strains</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {inStock.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        slug={slug}
                        strain={product.strain_id ? strainMap[product.strain_id] : undefined}
                        discounts={cart?.discounts}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </>
              )}

              {outOfStock.length > 0 && (
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={() => setShowOldStrains((v) => !v)}
                    aria-expanded={showOldStrains}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronDownIcon
                      className={`size-4 transition-transform ${showOldStrains ? "rotate-180" : ""}`}
                    />
                    {showOldStrains
                      ? `Hide older strains (${outOfStock.length})`
                      : `See older strains (${outOfStock.length})`}
                  </button>

                  {showOldStrains && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5">
                      {outOfStock.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          slug={slug}
                          strain={product.strain_id ? strainMap[product.strain_id] : undefined}
                          discounts={cart?.discounts}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()
      )}

    </div>
  );
}
