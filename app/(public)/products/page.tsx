export default function ProductsPage() {
  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-7xl mx-auto">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">Our Products</h1>
      <p className="text-lg text-foreground/70 mb-12 max-w-2xl">
        Small-batch, craft cannabis grown in the Catskill Mountains.
        Every strain is hand-selected and carefully cultivated.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Product cards will be populated from API */}
        <div className="rounded-2xl border border-foreground/10 p-6 text-center text-foreground/50">
          Products coming soon
        </div>
      </div>
    </div>
  );
}
