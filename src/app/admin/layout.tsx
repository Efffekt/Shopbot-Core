import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import Link from "next/link";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "@/lib/admin-emails";

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

  const email = user.email?.toLowerCase();

  // Must be an admin or super admin
  if (!email || (!SUPER_ADMIN_EMAILS.includes(email) && !ADMIN_EMAILS.includes(email))) {
    redirect("/dashboard");
  }

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);

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
              <span className={`text-xs uppercase tracking-wide font-medium px-2 py-1 rounded ${
                isSuperAdmin
                  ? "text-red-500 bg-red-500/10"
                  : "text-blue-500 bg-blue-500/10"
              }`}>
                {isSuperAdmin ? "Super Admin" : "Admin"}
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
