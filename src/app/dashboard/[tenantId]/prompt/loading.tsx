export default function PromptLoading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-20 bg-preik-border rounded animate-pulse" />

      {/* Header */}
      <div className="space-y-2 mb-6">
        <div className="h-8 w-40 bg-preik-border rounded animate-pulse" />
        <div className="h-4 w-48 bg-preik-border rounded animate-pulse" />
        <div className="flex items-center gap-3 mt-2">
          <div className="h-5 w-20 bg-preik-border rounded-full animate-pulse" />
          <div className="h-3 w-40 bg-preik-border rounded animate-pulse" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prompt editor */}
        <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
          <div className="h-4 w-32 bg-preik-border rounded animate-pulse" />
          <div className="h-[420px] w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-preik-border rounded animate-pulse" />
            <div className="h-10 w-28 bg-preik-border rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Widget preview */}
        <div className="bg-preik-surface border border-preik-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-preik-border rounded animate-pulse" />
            <div className="h-8 w-8 bg-preik-border rounded animate-pulse" />
          </div>
          <div className="h-[420px] w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
          <div className="h-3 w-56 bg-preik-border rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
