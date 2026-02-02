import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      <nav className="bg-preik-surface border-b border-preik-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="preik-wordmark text-2xl">
                preik
              </Link>
              <span className="text-xs text-preik-text-muted uppercase tracking-wide font-medium">
                Dashboard
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-preik-text-muted">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
                >
                  Logg ut
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
