"use client";

import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New Product</h2>
        <p className="text-sm text-muted-foreground">
          Create a new cannabis or promotional product
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
