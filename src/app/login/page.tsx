"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "@/lib/admin-emails";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect");
    if (redirect) {
      router.push(redirect);
    } else if (data.user?.email && (SUPER_ADMIN_EMAILS.includes(data.user.email.toLowerCase()) || ADMIN_EMAILS.includes(data.user.email.toLowerCase()))) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-preik-text mb-2"
          >
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            placeholder="din@epost.no"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-preik-text"
            >
              Passord
            </label>
            <Link
              href="/glemt-passord"
              className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
            >
              Glemt passord?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-preik-accent text-white font-semibold rounded-xl hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Logger inn..." : "Logg inn"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-preik-text-muted">
          Har du ikke en konto?{" "}
          <Link
            href="/#kontakt"
            className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors"
          >
            Kontakt oss
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-preik-bg transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-6">
        <Link href="/" className="preik-wordmark text-2xl">
          preik
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-brand font-light text-preik-text mb-2">
              Logg inn
            </h1>
            <p className="text-preik-text-muted">
              Få tilgang til ditt dashbord
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
