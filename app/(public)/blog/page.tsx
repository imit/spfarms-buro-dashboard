export default function BlogPage() {
  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-4xl mx-auto">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">Blog</h1>
      <p className="text-lg text-foreground/70 mb-12">
        Stories from the farm, industry insights, and product updates.
      </p>
      <div className="space-y-8">
        {/* Blog posts will be populated from API */}
        <div className="rounded-2xl border border-foreground/10 p-6 text-center text-foreground/50">
          Posts coming soon
        </div>
      </div>
    </div>
  );
}
