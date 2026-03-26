"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Menu, type MenuItem, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, Trash2, Copy, LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function MenuDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Metadata form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState<
    "company_member_only" | "anyone_with_link"
  >("anyone_with_link");
  const [status, setStatus] = useState<"draft" | "active" | "archived">(
    "draft"
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Product picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(
    new Set()
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const populateForm = useCallback((m: Menu) => {
    setName(m.name);
    setDescription(m.description || "");
    setAccessType(m.access_type);
    setStatus(m.status);
    setExpiresAt(m.expires_at ? m.expires_at.split("T")[0] : "");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchMenu() {
      try {
        const data = await apiClient.getMenu(slug);
        setMenu(data);
        populateForm(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load menu"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenu();
  }, [isAuthenticated, slug, populateForm]);

  async function handleSaveMetadata() {
    if (!menu) return;
    setIsSaving(true);
    setError("");

    try {
      const data: Parameters<typeof apiClient.updateMenu>[1] = {
        name: name.trim(),
        description: description.trim(),
      };
      if (!menu.is_default) {
        data.access_type = accessType;
        data.status = status;
        data.expires_at = expiresAt || undefined;
      }
      const updated = await apiClient.updateMenu(menu.slug, data);
      setMenu(updated);
      populateForm(updated);
      toast.success("Menu updated");

      // If slug changed after rename, redirect
      if (updated.slug !== slug) {
        router.replace(`/admin/menus/${updated.slug}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update menu";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenPicker() {
    setPickerOpen(true);
    setSelectedProductIds(new Set());

    if (allProducts.length === 0) {
      setIsLoadingProducts(true);
      try {
        const products = await apiClient.getProducts();
        setAllProducts(products);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setIsLoadingProducts(false);
      }
    }
  }

  function toggleProductSelection(productId: number) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  async function handleAddSelected() {
    if (!menu || selectedProductIds.size === 0) return;
    setIsAddingItems(true);

    try {
      const items = Array.from(selectedProductIds).map((product_id) => ({
        product_id,
      }));
      const updated = await apiClient.batchAddMenuItems(menu.slug, items);
      setMenu(updated);
      setSelectedProductIds(new Set());
      setPickerOpen(false);
      toast.success(`Added ${items.length} product(s) to menu`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add products"
      );
    } finally {
      setIsAddingItems(false);
    }
  }

  async function handleUpdateItemPrice(item: MenuItem, value: string) {
    if (!menu) return;

    const overridePrice = value.trim() === "" ? null : parseFloat(value);
    if (overridePrice !== null && isNaN(overridePrice)) return;

    try {
      const updated = await apiClient.updateMenuItem(menu.slug, item.id, {
        override_price: overridePrice,
      });
      setMenu(updated);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update price"
      );
    }
  }

  async function handleToggleVisible(item: MenuItem) {
    if (!menu) return;

    try {
      const updated = await apiClient.updateMenuItem(menu.slug, item.id, {
        visible: !item.visible,
      });
      setMenu(updated);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update visibility"
      );
    }
  }

  async function handleRemoveItem(item: MenuItem) {
    if (!menu) return;

    try {
      const updated = await apiClient.removeMenuItem(menu.slug, item.id);
      setMenu(updated);
      toast.success(`Removed ${item.product_name}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove item"
      );
    }
  }

  function handleCopyShareUrl() {
    if (!menu?.share_url) return;
    navigator.clipboard.writeText(menu.share_url);
    toast.success("Share URL copied to clipboard");
  }

  // Filter products that aren't already in the menu
  const menuProductIds = new Set(
    (menu?.items || []).map((item) => item.product_id)
  );
  const availableProducts = allProducts.filter(
    (p) => !menuProductIds.has(p.id)
  );

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground px-10">Loading...</p>;
  }

  if (error && !menu) {
    return (
      <div className="space-y-4 px-10">
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/menus">Back to Menus</Link>
        </Button>
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="space-y-8 px-10">
      {/* ===== TOP SECTION: Menu Metadata ===== */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/menus">Back</Link>
            </Button>
            <h2 className="text-2xl font-semibold">{menu.name}</h2>
            {menu.is_default && (
              <Badge variant="secondary">Default</Badge>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-5 max-w-2xl">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Access Type — hidden for default menu */}
          {!menu.is_default && (
            <div className="space-y-3">
              <Label>Access Type</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="access_type"
                    value="company_member_only"
                    checked={accessType === "company_member_only"}
                    onChange={() => setAccessType("company_member_only")}
                    className="accent-primary"
                  />
                  Company Members Only
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="access_type"
                    value="anyone_with_link"
                    checked={accessType === "anyone_with_link"}
                    onChange={() => setAccessType("anyone_with_link")}
                    className="accent-primary"
                  />
                  Anyone with Link
                </label>
              </div>
            </div>
          )}

          {/* Status — hidden for default menu */}
          {!menu.is_default && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as "draft" | "active" | "archived"
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Expires At — hidden for default menu */}
          {!menu.is_default && (
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At</Label>
              <Input
                id="expires_at"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          )}

          {/* Share URL — hidden for default menu */}
          {menu.share_url && !menu.is_default && (
            <div className="space-y-2">
              <Label>Share URL</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{menu.share_url}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareUrl}
                >
                  <Copy className="size-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Save */}
          <div className="pt-2">
            <Button onClick={handleSaveMetadata} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM SECTION: Menu Items ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Menu Items ({menu.items?.length || 0})
          </h3>

          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenPicker}>
                <PlusIcon className="size-4 mr-1" />
                Add Products
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add Products to Menu</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-1 py-2">
                {isLoadingProducts ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Loading products...
                  </p>
                ) : availableProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    All products are already in this menu.
                  </p>
                ) : (
                  availableProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedProductIds.has(product.id)}
                        onCheckedChange={() =>
                          toggleProductSelection(product.id)
                        }
                      />
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.name}
                          className="size-8 rounded object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          --
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium truncate">
                        {product.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.default_price
                          ? `$${parseFloat(product.default_price).toFixed(2)}`
                          : "No price"}
                      </span>
                    </label>
                  ))
                )}
              </div>

              {availableProducts.length > 0 && (
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedProductIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    disabled={
                      selectedProductIds.size === 0 || isAddingItems
                    }
                    onClick={handleAddSelected}
                  >
                    {isAddingItems
                      ? "Adding..."
                      : `Add Selected (${selectedProductIds.size})`}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Items Table */}
        {menu.items && menu.items.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium px-4 py-3 w-10"></th>
                  <th className="text-left font-medium px-4 py-3">
                    Product
                  </th>
                  <th className="text-left font-medium px-4 py-3">
                    Default Price
                  </th>
                  <th className="text-left font-medium px-4 py-3">
                    Override Price
                  </th>
                  <th className="text-center font-medium px-4 py-3">
                    Visible
                  </th>
                  <th className="text-right font-medium px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {menu.items.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    onUpdatePrice={handleUpdateItemPrice}
                    onToggleVisible={handleToggleVisible}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No items in this menu yet. Click &quot;Add Products&quot; to
              get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Menu Item Row Component ----

function MenuItemRow({
  item,
  onUpdatePrice,
  onToggleVisible,
  onRemove,
}: {
  item: MenuItem;
  onUpdatePrice: (item: MenuItem, value: string) => void;
  onToggleVisible: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}) {
  const [priceValue, setPriceValue] = useState(
    item.override_price != null ? String(item.override_price) : ""
  );
  const [isRemoving, setIsRemoving] = useState(false);

  function handlePriceBlur() {
    const current =
      item.override_price != null ? String(item.override_price) : "";
    if (priceValue !== current) {
      onUpdatePrice(item, priceValue);
    }
  }

  function handlePriceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePriceBlur();
    }
  }

  async function handleRemove() {
    setIsRemoving(true);
    await onRemove(item);
    // If onRemove fails, parent handles it, row stays
    setIsRemoving(false);
  }

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      {/* Thumbnail */}
      <td className="px-4 py-3">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.product_name}
            className="size-8 rounded object-cover"
          />
        ) : (
          <div className="size-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
            --
          </div>
        )}
      </td>

      {/* Product Name */}
      <td className="px-4 py-3 font-medium">{item.product_name}</td>

      {/* Default Price (grayed out) */}
      <td className="px-4 py-3 text-muted-foreground">
        {item.default_price != null
          ? `$${Number(item.default_price).toFixed(2)}`
          : "--"}
      </td>

      {/* Override Price */}
      <td className="px-4 py-3">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={priceValue}
          onChange={(e) => setPriceValue(e.target.value)}
          onBlur={handlePriceBlur}
          onKeyDown={handlePriceKeyDown}
          placeholder="--"
          className="h-8 w-28"
        />
      </td>

      {/* Visible */}
      <td className="px-4 py-3 text-center">
        <Checkbox
          checked={item.visible}
          onCheckedChange={() => onToggleVisible(item)}
        />
      </td>

      {/* Remove */}
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  );
}
