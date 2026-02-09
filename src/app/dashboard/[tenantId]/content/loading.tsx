export default function ContentLoading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-20 bg-preik-border rounded animate-pulse" />
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-96 bg-preik-border rounded animate-pulse" />
        </div>

        {/* Source count + button */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
          <div className="h-10 w-36 bg-preik-border rounded-xl animate-pulse" />
        </div>

        {/* Source list */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-preik-bg border border-preik-border rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-40 bg-preik-border rounded animate-pulse" />
                  <div className="h-5 w-12 bg-preik-border rounded-full animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-preik-border rounded animate-pulse" />
                  <div className="h-8 w-8 bg-preik-border rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full bg-preik-border rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-preik-border rounded animate-pulse" />
              <div className="h-3 w-32 bg-preik-border rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
