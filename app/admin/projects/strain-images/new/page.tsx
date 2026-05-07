"use client";

import { StrainImageForm } from "@/components/strain-image-form";

export default function NewStrainImagePage() {
  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New Strain Image</h2>
        <p className="text-sm text-muted-foreground">
          Generate or upload an L2+L3 composite reusable across labels, the storefront, etc.
        </p>
      </div>
      <StrainImageForm />
    </div>
  );
}
