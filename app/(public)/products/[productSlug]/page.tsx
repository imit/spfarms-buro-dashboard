import { use } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = use(params);

  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold tracking-tight mb-8 capitalize">
        {productSlug.replace(/-/g, " ")}
      </h1>
      <p className="text-foreground/50">Product detail page — content coming soon.</p>
    </div>
  );
}
