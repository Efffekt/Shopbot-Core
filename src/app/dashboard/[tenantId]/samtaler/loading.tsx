export default function SamtalerLoading() {
  return (
    <div>
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <div className="h-8 w-40 bg-preik-border rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-72 bg-preik-border rounded-lg animate-pulse mb-6" />

        {/* Filter bar skeleton */}
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] h-10 bg-preik-border rounded-xl animate-pulse" />
            <div className="w-36 h-10 bg-preik-border rounded-xl animate-pulse" />
            <div className="w-28 h-10 bg-preik-border rounded-xl animate-pulse" />
            <div className="w-16 h-10 bg-preik-border rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Conversation card skeletons */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-preik-surface rounded-2xl border border-preik-border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-preik-border rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-preik-border rounded-full animate-pulse" />
                    <div className="h-5 w-20 bg-preik-border rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
