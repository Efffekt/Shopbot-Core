export default function AnalyticsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-20 bg-preik-border rounded animate-pulse" />
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-8 w-24 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-72 bg-preik-border rounded animate-pulse" />
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 bg-preik-border rounded animate-pulse" />
          <div className="h-10 w-40 bg-preik-border rounded-xl animate-pulse" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-preik-bg border border-preik-border rounded-xl p-4 space-y-2"
            >
              <div className="w-10 h-10 bg-preik-border rounded-lg animate-pulse" />
              <div className="h-7 w-12 bg-preik-border rounded animate-pulse" />
              <div className="h-3 w-20 bg-preik-border rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="bg-preik-bg border border-preik-border rounded-xl p-4 space-y-3">
          <div className="h-5 w-32 bg-preik-border rounded animate-pulse" />
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                className="flex-1 bg-preik-border rounded-t animate-pulse"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-preik-bg border border-preik-border rounded-xl p-4 space-y-3">
            <div className="h-5 w-36 bg-preik-border rounded animate-pulse" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-preik-border rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
                </div>
                <div className="h-4 w-8 bg-preik-border rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-preik-bg border border-preik-border rounded-xl p-4 space-y-3">
            <div className="h-5 w-36 bg-preik-border rounded animate-pulse" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-6 w-6 bg-preik-border rounded animate-pulse" />
                <div className="h-4 w-32 bg-preik-border rounded animate-pulse" />
                <div className="h-4 w-8 bg-preik-border rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
