"use client";

import { SheetLayoutForm } from "@/components/sheet-layout-form";

export default function NewSheetLayoutPage() {
  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New Sheet Layout</h2>
        <p className="text-sm text-muted-foreground">
          Define a new sticker sheet layout for printing labels
        </p>
      </div>
      <SheetLayoutForm />
    </div>
  );
}
