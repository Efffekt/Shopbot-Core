export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-20 bg-preik-border rounded animate-pulse" />

      {/* Account settings card */}
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-6">
        <div className="h-8 w-48 bg-preik-border rounded animate-pulse" />

        {/* Email (read-only) */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-preik-border rounded animate-pulse" />
          <div className="h-12 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          <div className="h-3 w-56 bg-preik-border rounded animate-pulse" />
        </div>

        {/* Password form */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 bg-preik-border rounded animate-pulse" />
              <div className="h-12 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
            </div>
          ))}
          <div className="h-11 w-36 bg-preik-border rounded-xl animate-pulse" />
        </div>

        {/* Blog settings */}
        <div className="border-t border-preik-border pt-6 space-y-4">
          <div className="h-6 w-36 bg-preik-border rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
            <div className="h-12 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-preik-border rounded animate-pulse" />
            <div className="h-24 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          </div>
          <div className="h-11 w-28 bg-preik-border rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Credit usage card */}
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
        <div className="h-6 w-32 bg-preik-border rounded animate-pulse" />
        <div className="bg-preik-bg border border-preik-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-5 w-24 bg-preik-border rounded animate-pulse" />
            <div className="h-5 w-12 bg-preik-border rounded-full animate-pulse" />
          </div>
          <div className="h-2.5 w-full bg-preik-border rounded-full animate-pulse" />
          <div className="flex justify-between">
            <div className="h-3 w-40 bg-preik-border rounded animate-pulse" />
            <div className="h-3 w-28 bg-preik-border rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Support card */}
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
        <div className="h-6 w-36 bg-preik-border rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-preik-border rounded-lg animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-preik-border rounded animate-pulse" />
            <div className="h-3 w-28 bg-preik-border rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
