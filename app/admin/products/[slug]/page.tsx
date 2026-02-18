"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Product,
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

function formatPrice(price: string | null) {
  if (!price) return null;
  return `$${parseFloat(price).toFixed(2)}`;
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchProduct() {
      try {
        const data = await apiClient.getProduct(slug);
        setProduct(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load product"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [isAuthenticated, slug]);

  async function handleDelete() {
    if (!product) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteProduct(product.slug);
      router.push("/admin/products");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete product"
      );
      setIsDeleting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground px-10">Loading...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4 px-10">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/admin/products">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              {product.thumbnail_url && (
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="size-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-semibold">{product.name}</h2>
                {product.sku && (
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline">
              {PRODUCT_TYPE_LABELS[product.product_type]}
            </Badge>
            <Badge variant={statusVariant(product.status)}>
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
            {!product.cannabis && (
              <Badge variant="secondary">Promo</Badge>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground ml-11">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products/${product.slug}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {product.name}. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow
              label="Type"
              value={PRODUCT_TYPE_LABELS[product.product_type]}
            />
            <DetailRow label="Product ID" value={product.product_uid} />
            <DetailRow label="SKU" value={product.sku} />
            <DetailRow label="Barcode" value={product.barcode} />
            <DetailRow label="Brand" value={product.brand} />
            <DetailRow label="Slug" value={product.slug} />
            <DetailRow
              label="Created"
              value={new Date(product.created_at).toLocaleDateString()}
            />
          </dl>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Pricing</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow label="Price" value={formatPrice(product.default_price)} />
          </dl>
        </div>

        {/* Weight & Box Configuration */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Weight & Box Configuration</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow
              label="Unit Weight"
              value={
                product.unit_weight
                  ? `${product.unit_weight} ${product.unit_weight_uom || ""}`
                  : null
              }
            />
            <DetailRow
              label="Box Capacity"
              value={product.box_capacity?.toString()}
            />
            <DetailRow
              label="Min Order Qty"
              value={product.minimum_order_quantity?.toString()}
            />
            <DetailRow
              label="Shipping"
              value={product.requires_shipping ? "Required" : "Not required"}
            />
          </dl>
        </div>

        {/* Cannabis Info */}
        {product.cannabis && product.strain_name && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Cannabis Info</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow label="Strain" value={product.strain_name} />
            </dl>
          </div>
        )}

        {/* SEO */}
        {(product.meta_title || product.meta_description) && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">SEO</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow label="Meta Title" value={product.meta_title} />
              <DetailRow
                label="Meta Description"
                value={product.meta_description}
              />
            </dl>
          </div>
        )}

        {/* METRC */}
        {product.metrc_item_id && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">METRC</h3>
            <Separator className="mb-1" />
            <dl>
              <DetailRow label="Item ID" value={product.metrc_item_id} />
              <DetailRow label="Item Name" value={product.metrc_item_name} />
              <DetailRow label="Tag" value={product.metrc_tag} />
              <DetailRow label="License" value={product.metrc_license_number} />
              <DetailRow
                label="Last Synced"
                value={
                  product.metrc_last_synced_at
                    ? new Date(product.metrc_last_synced_at).toLocaleString()
                    : null
                }
              />
            </dl>
          </div>
        )}
      </div>

      {/* Gallery */}
      {product.image_urls && product.image_urls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Gallery</h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {product.image_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${product.name} image ${i + 1}`}
                className="rounded-lg object-cover aspect-square w-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
