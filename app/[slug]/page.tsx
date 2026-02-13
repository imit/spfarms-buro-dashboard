"use client";

import { use } from "react";

export default function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <div className="px-4 lg:px-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p className="text-muted-foreground mt-2">
        Storefront, settings, and notifications coming soon.
      </p>
    </div>
  );
}
