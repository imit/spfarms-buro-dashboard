export default function AboutPage() {
  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-4xl mx-auto">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-8">About SPFarms</h1>
      <div className="prose prose-lg max-w-none text-foreground/80 space-y-6">
        <p>
          SPFarms is a licensed micro cannabis cultivator based in the Catskill Mountains of New York.
          We grow small-batch, craft cannabis with a focus on quality, sustainability, and community.
        </p>
        <p>
          Our mission is to produce the finest cannabis while supporting the local economy
          and building lasting relationships with dispensary partners across the state.
        </p>
      </div>
    </div>
  );
}
