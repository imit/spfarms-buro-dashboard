"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Product } from "@/lib/api";
import { ProductForm } from "@/components/product-form";

export default function EditProductPage({
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

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground px-10">Loading...</p>;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm mx-10">
        {error}
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Edit Product</h2>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={product} mode="edit" />
    </div>
  );
}
