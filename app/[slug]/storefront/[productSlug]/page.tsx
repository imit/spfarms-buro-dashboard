import { notFound } from "next/navigation";
import { type Product, type Strain } from "@/lib/api";
import {
  getPublicProduct,
  getPublicProducts,
  getPublicStrains,
  getPublicStrain,
} from "@/lib/server-api";
import ProductDetailClient from "./product-detail-client";

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  let product: Product;
  try {
    product = await getPublicProduct(productSlug) as Product;
  } catch {
    notFound();
  }

  const [allProducts, allStrains] = await Promise.all([
    getPublicProducts(),
    getPublicStrains(),
  ]);

  const strainMap: Record<number, Strain> = {};
  (allStrains as Strain[]).forEach((s) => { strainMap[s.id] = s; });

  const otherFlowers = (allProducts as Product[]).filter(
    (p) => p.product_type === "flower" && p.active && !p.bulk && p.status === "active" && p.slug !== productSlug
  );

  let strain: Strain | null = null;
  if (product.strain_id) {
    try {
      strain = await getPublicStrain(String(product.strain_id)) as Strain;
    } catch {
      // strain data optional
    }
  }

  return (
    <ProductDetailClient
      slug={slug}
      productSlug={productSlug}
      product={product}
      strain={strain}
      otherFlowers={otherFlowers}
      strainMap={strainMap}
    />
  );
}
