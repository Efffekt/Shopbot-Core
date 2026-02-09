export default function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-preik-bg">
      <header className="px-6 py-6">
        <div className="h-8 w-16 bg-preik-border rounded animate-pulse" />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 space-y-2">
            <div className="h-9 w-40 bg-preik-border rounded animate-pulse mx-auto" />
            <div className="h-5 w-72 bg-preik-border rounded animate-pulse mx-auto" />
          </div>
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-14 bg-preik-border rounded animate-pulse" />
              <div className="h-12 w-full bg-preik-bg border border-preik-border rounded-xl animate-pulse" />
            </div>
            <div className="h-12 w-full bg-preik-border rounded-xl animate-pulse" />
          </div>
          <div className="mt-6 flex justify-center">
            <div className="h-4 w-36 bg-preik-border rounded animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
