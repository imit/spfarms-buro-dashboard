"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${slug}/storefront`);
  }, [slug, router]);

  return null;
}
