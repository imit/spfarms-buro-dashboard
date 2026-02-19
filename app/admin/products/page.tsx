"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Product,
  type ProductType,
  type ProductStatus,
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";

type TypeFilter = "all" | "cannabis" | "promo" | "bulk";
type StatusFilter = "all" | ProductStatus;

const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][];
const STATUSES = Object.entries(PRODUCT_STATUS_LABELS) as [ProductStatus, string][];

function statusVariant(status: ProductStatus) {
  switch (status) {
    case "active":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
  }
}

function formatPrice(price: string | null) {
  if (!price) return "—";
  return `$${parseFloat(price).toFixed(2)}`;
}

export default function ProductsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchProducts() {
      try {
        const data = await apiClient.getProducts();
        setProducts(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [isAuthenticated]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter === "cannabis" && !p.cannabis) return false;
      if (typeFilter === "promo" && p.cannabis) return false;
      if (typeFilter === "bulk" && !p.bulk) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, typeFilter, statusFilter]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage cannabis and promotional products
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusIcon className="mr-2 size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={typeFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter("all")}
            >
              All
            </Button>
            <Button
              variant={typeFilter === "cannabis" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter("cannabis")}
            >
              Cannabis
            </Button>
            <Button
              variant={typeFilter === "promo" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter("promo")}
            >
              Promo
            </Button>
            <Button
              variant={typeFilter === "bulk" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter("bulk")}
            >
              Bulk
            </Button>
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            {STATUSES.map(([value, label]) => (
              <Button
                key={value}
                variant={statusFilter === value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No products yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/products/new">Add your first product</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Strain</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/admin/products/${p.slug}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.thumbnail_url ? (
                        <img
                          src={p.thumbnail_url}
                          alt={p.name}
                          className="size-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded-md bg-muted" />
                      )}
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.sku && (
                          <div className="text-xs text-muted-foreground">
                            SKU: {p.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {PRODUCT_TYPE_LABELS[p.product_type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.strain_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(p.default_price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(p.status)}>
                      {PRODUCT_STATUS_LABELS[p.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
