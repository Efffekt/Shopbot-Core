export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-preik-bg">
      <header className="px-6 py-6 border-b border-preik-border">
        <div className="h-8 w-16 bg-preik-border rounded animate-pulse" />
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <div className="h-5 w-28 bg-preik-border rounded animate-pulse mb-8" />

        {/* Article header */}
        <div className="space-y-3 mb-8">
          <div className="h-4 w-32 bg-preik-border rounded animate-pulse" />
          <div className="h-10 w-full bg-preik-border rounded animate-pulse" />
          <div className="h-10 w-3/4 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-40 bg-preik-border rounded animate-pulse mt-2" />
        </div>

        {/* Cover image */}
        <div className="w-full aspect-[2/1] bg-preik-border rounded-2xl animate-pulse mb-10" />

        {/* Article content */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-preik-border rounded animate-pulse" />
          <div className="h-8 w-48 bg-preik-border rounded animate-pulse mt-6" />
          <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-preik-border rounded animate-pulse" />
        </div>
      </main>
    </div>
  );
}
