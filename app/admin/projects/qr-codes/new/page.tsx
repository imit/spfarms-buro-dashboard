"use client";

import { QrCodeForm } from "@/components/qr-code-form";

export default function NewQrCodePage() {
  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">New QR Code</h2>
        <p className="text-sm text-muted-foreground">
          Generate a new QR code for products or custom data
        </p>
      </div>
      <QrCodeForm />
    </div>
  );
}
