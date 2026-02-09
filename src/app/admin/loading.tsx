export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-preik-bg p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="h-9 w-48 bg-preik-border rounded animate-pulse" />
        <div className="h-4 w-56 bg-preik-border rounded animate-pulse" />
      </div>

      {/* Navigation pills */}
      <div className="flex items-center gap-3 mb-8">
        {[80, 64, 72, 80, 60, 56, 72, 96, 56].map((w, i) => (
          <div
            key={i}
            className="h-10 bg-preik-border rounded-xl animate-pulse"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Content area - overview cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 bg-preik-border rounded animate-pulse" />
              <div className="h-8 w-8 bg-preik-border rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-preik-border rounded animate-pulse" />
            <div className="h-3 w-32 bg-preik-border rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
