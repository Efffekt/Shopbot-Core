export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-preik-bg">
      {/* Header */}
      <header className="px-6 py-6 border-b border-preik-border sticky top-0 bg-preik-bg/80 backdrop-blur-sm z-30">
        <div className="flex items-center justify-between">
          <div className="h-8 w-16 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block fixed left-0 top-[73px] w-64 h-[calc(100vh-73px)] border-r border-preik-border p-4 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-9 bg-preik-border rounded-lg animate-pulse"
              style={{ width: `${120 + (i % 3) * 30}px` }}
            />
          ))}
          <div className="mt-8 p-4 bg-preik-surface rounded-xl border border-preik-border space-y-2">
            <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
            <div className="h-3 w-32 bg-preik-border rounded animate-pulse" />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 px-6 py-8 lg:py-12 lg:ml-64 w-full">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Page title */}
            <div className="space-y-3">
              <div className="h-10 w-56 bg-preik-border rounded animate-pulse" />
              <div className="h-5 w-96 bg-preik-border rounded animate-pulse" />
            </div>

            {/* Sections */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-7 w-48 bg-preik-border rounded animate-pulse" />
                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-4">
                  <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-preik-border rounded animate-pulse" />
                  <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
                  <div className="h-24 w-full bg-preik-bg rounded-xl animate-pulse mt-2" />
                  <div className="h-4 w-3/4 bg-preik-border rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
