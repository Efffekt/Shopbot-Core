"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/tilbakestill-passord`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

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
              Glemt passord?
            </h1>
            <p className="text-preik-text-muted">
              Skriv inn e-posten din, så sender vi deg en lenke for å tilbakestille passordet.
            </p>
          </div>

          <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-preik-text mb-2">
                  Sjekk e-posten din
                </h2>
                <p className="text-preik-text-muted mb-6">
                  Vi har sendt en lenke til <strong className="text-preik-text">{email}</strong> for å tilbakestille passordet ditt.
                </p>
                <Link
                  href="/login"
                  className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors"
                >
                  Tilbake til innlogging
                </Link>
              </div>
            ) : (
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
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                    placeholder="din@epost.no"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-preik-accent text-white font-semibold rounded-xl hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Sender..." : "Send tilbakestillingslenke"}
                </button>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
                >
                  Tilbake til innlogging
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
