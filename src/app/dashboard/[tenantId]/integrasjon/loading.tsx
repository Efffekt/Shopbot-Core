export default function IntegrationLoading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-20 bg-preik-border rounded animate-pulse" />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-preik-border rounded animate-pulse" />
          <div className="h-4 w-80 bg-preik-border rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-preik-border rounded-xl animate-pulse" />
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Appearance card */}
          <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
            <div className="h-6 w-24 bg-preik-border rounded animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-8 h-8 bg-preik-border rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-preik-border rounded animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 flex-1 bg-preik-border rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 bg-preik-border rounded-xl animate-pulse" />
                <div className="h-10 flex-1 bg-preik-border rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Branding card */}
          <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
            <div className="h-6 w-28 bg-preik-border rounded animate-pulse" />
            <div className="h-12 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
            <div className="h-24 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Preview card */}
          <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-36 bg-preik-border rounded animate-pulse" />
              <div className="h-8 w-20 bg-preik-border rounded-lg animate-pulse" />
            </div>
            <div className="h-80 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          </div>

          {/* Embed code card */}
          <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-preik-border rounded animate-pulse" />
              <div className="h-8 w-20 bg-preik-border rounded-lg animate-pulse" />
            </div>
            <div className="h-20 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse font-mono" />
          </div>
        </div>
      </div>
    </div>
  );
}
