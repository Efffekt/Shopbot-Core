import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import Link from "next/link";
import { SUPER_ADMIN_EMAILS } from "@/lib/admin-emails";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Must be logged in
  if (!user) {
    redirect("/login");
  }

  // Must be a super admin
  if (!user.email || !SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-preik-bg">
      {/* Admin Header */}
      <nav className="bg-preik-surface border-b border-preik-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="preik-wordmark text-2xl">
                preik
              </Link>
              <span className="text-xs text-red-500 uppercase tracking-wide font-medium bg-red-500/10 px-2 py-1 rounded">
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
              >
                Dashboard
              </Link>
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
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
