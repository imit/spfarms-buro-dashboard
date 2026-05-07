"use client";

import { useEffect, useState, useMemo } from "react";
import { apiClient, type Product, type Strain, type Menu } from "@/lib/api";
import { ProductCard } from "@/components/storefront/product-card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

const STORAGE_KEY = "spf:storePreview:menuSlug";

export default function StorePreviewPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "account";

  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null);
  const [strainMap, setStrainMap] = useState<Record<number, Strain>>({});
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load menus + strain map once.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [menusData, strains] = await Promise.all([
          apiClient.getMenus(),
          apiClient.getStrains(),
        ]);
        if (cancelled) return;
        setMenus(menusData);

        const map: Record<number, Strain> = {};
        for (const s of strains) map[s.id] = s;
        setStrainMap(map);

        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const initial = (stored && menusData.find((m) => m.slug === stored))
          || menusData.find((m) => m.is_default)
          || menusData[0];
        if (initial) setSelectedSlug(initial.slug);
      } catch (err) {
        console.error("Failed to load store preview:", err);
      } finally {
        if (!cancelled) setLoadingMenus(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Load full menu (with items) whenever slug changes.
  useEffect(() => {
    if (!selectedSlug) { setActiveMenu(null); return; }
    let cancelled = false;
    setLoadingItems(true);
    apiClient.getMenu(selectedSlug)
      .then((m) => { if (!cancelled) setActiveMenu(m); })
      .catch((err) => console.error("Failed to load menu items:", err))
      .finally(() => { if (!cancelled) setLoadingItems(false); });
    return () => { cancelled = true; };
  }, [selectedSlug]);

  const handleSwitch = (slug: string) => {
    setSelectedSlug(slug);
    if (typeof window !== "undefined") {
      try { localStorage.setItem(STORAGE_KEY, slug); } catch { /* ignore */ }
    }
  };

  const products = useMemo<Product[]>(() => {
    if (!activeMenu?.items) return [];
    return activeMenu.items
      .filter((item) => activeMenu.show_bulk || !item.bulk)
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
        cannabis: item.cannabis,
        thc_content: item.thc_content,
        cbd_content: item.cbd_content,
        in_stock: item.in_stock,
      } as Product));
  }, [activeMenu]);

  if (loadingMenus) {
    return <div className="px-10 py-8"><p className="text-muted-foreground">Loading store preview…</p></div>;
  }

  return (
    <div className="px-10 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Store Preview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            How your storefront looks to dispensary accounts.
          </p>
        </div>

        {isAdmin && menus.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Menu</span>
            <Select value={selectedSlug} onValueChange={handleSwitch}>
              <SelectTrigger className="h-9 min-w-64">
                <SelectValue placeholder="Pick a menu…" />
              </SelectTrigger>
              <SelectContent>
                {menus.map((m) => (
                  <SelectItem key={m.id} value={m.slug}>
                    <div className="flex items-center gap-2">
                      <span>{m.name}</span>
                      {m.is_default && <Badge variant="outline" className="text-[10px] h-4">Default</Badge>}
                      {m.company_name && <span className="text-xs text-muted-foreground">— {m.company_name}</span>}
                      {m.status === "draft" && <Badge variant="secondary" className="text-[10px] h-4">Draft</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {activeMenu && (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-medium">{activeMenu.name}</p>
            {activeMenu.description && (
              <p className="text-xs text-muted-foreground">{activeMenu.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">{activeMenu.access_type}</Badge>
            <Badge variant="outline" className="text-[10px]">{activeMenu.status}</Badge>
            {activeMenu.show_bulk && <Badge variant="outline" className="text-[10px]">Bulk visible</Badge>}
            {activeMenu.disable_discounts && <Badge variant="outline" className="text-[10px]">No discounts</Badge>}
            <span>{activeMenu.item_count} items</span>
          </div>
        </div>
      )}

      {loadingItems ? (
        <p className="text-muted-foreground py-12">Loading menu…</p>
      ) : !activeMenu ? (
        <p className="text-muted-foreground py-12">No menu selected.</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground py-12">No visible products in this menu.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              slug="preview"
              strain={product.strain_id ? strainMap[product.strain_id] : undefined}
              onAddToCart={async () => { /* preview: no cart */ }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
