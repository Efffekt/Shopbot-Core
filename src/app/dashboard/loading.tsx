export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-preik-bg">
      <nav className="bg-preik-surface border-b border-preik-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="preik-wordmark text-2xl">preik</span>
              <span className="text-xs text-preik-text-muted uppercase tracking-wide font-medium">
                Dashboard
              </span>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-32 bg-preik-border rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-48 bg-preik-border rounded animate-pulse mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-3"
            >
              <div className="h-6 w-32 bg-preik-border rounded animate-pulse" />
              <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
              <div className="h-4 w-48 bg-preik-border rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
