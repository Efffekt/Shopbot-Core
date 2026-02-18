export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-preik-bg">
      <header className="px-6 py-6 border-b border-preik-border">
        <div className="h-8 w-16 bg-preik-border rounded animate-pulse" />
      </header>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="h-10 w-24 bg-preik-border rounded animate-pulse mb-4" />
        <div className="h-6 w-64 bg-preik-border rounded animate-pulse mb-12" />
        <div className="grid gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-preik-surface rounded-2xl border border-preik-border overflow-hidden"
            >
              <div className="h-48 bg-preik-border animate-pulse" />
              <div className="p-8 space-y-3">
                <div className="h-4 w-32 bg-preik-border rounded animate-pulse" />
                <div className="h-7 w-3/4 bg-preik-border rounded animate-pulse" />
                <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-preik-border rounded animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
                  <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
