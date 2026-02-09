export default function TenantDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-5 w-20 bg-preik-border rounded animate-pulse" />
        <div className="h-9 w-56 bg-preik-border rounded animate-pulse" />
        <div className="h-4 w-72 bg-preik-border rounded animate-pulse" />
        <div className="h-6 w-16 bg-preik-border rounded-full animate-pulse mt-1" />
      </div>

      {/* Quick action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-preik-surface border border-preik-border rounded-2xl p-6 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-preik-border rounded-xl animate-pulse" />
            <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
            <div className="h-3 w-16 bg-preik-border rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Credit usage card */}
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
        <div className="h-6 w-64 bg-preik-border rounded animate-pulse" />
        <div className="h-3 w-full bg-preik-border rounded-full animate-pulse" />
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
        </div>
      </div>

      {/* Configuration card */}
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
        <div className="h-6 w-36 bg-preik-border rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
              <div className="h-4 w-32 bg-preik-border rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
