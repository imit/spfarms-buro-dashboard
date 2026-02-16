"use client";

import { LabelForm } from "@/components/label-form";

export default function NewLabelPage() {
  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New Label</h2>
        <p className="text-sm text-muted-foreground">
          Create a new product label design
        </p>
      </div>
      <LabelForm />
    </div>
  );
}
