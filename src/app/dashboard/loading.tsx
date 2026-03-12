export default function DashboardLoading() {
  return (
    <div>
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
    </div>
  );
}
