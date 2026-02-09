export default function TenantDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-preik-border rounded animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-preik-surface border border-preik-border rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-preik-surface border border-preik-border rounded-2xl animate-pulse" />
    </div>
  );
}
