"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-preik-bg transition-colors duration-200">
        {/* Header */}
        <header className="px-6 py-6">
          <Link href="/" className="preik-wordmark text-2xl">
            preik
          </Link>
        </header>

        {/* Success message */}
        <main className="flex-1 flex items-center justify-center px-6 pb-24">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-brand font-light text-preik-text mb-4">
              Sjekk e-posten din
            </h1>
            <p className="text-preik-text-muted mb-8">
              Vi har sendt en bekreftelseslenke til <span className="text-preik-text font-medium">{email}</span>.
              Klikk på lenken for å aktivere kontoen din.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center py-3 px-6 bg-preik-accent text-white font-semibold rounded-xl hover:bg-preik-accent-hover transition-all"
            >
              Gå til innlogging
            </Link>
          </div>
        </main>
      </div>
    );
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
              Opprett konto
            </h1>
            <p className="text-preik-text-muted">
              Kom i gang med din AI-assistent
            </p>
          </div>

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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-preik-text mb-2"
                >
                  Passord
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                  placeholder="Minst 6 tegn"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-preik-text mb-2"
                >
                  Bekreft passord
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                  placeholder="Skriv passordet på nytt"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-preik-accent text-white font-semibold rounded-xl hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Oppretter konto..." : "Opprett konto"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-preik-text-muted">
                Har du allerede en konto?{" "}
                <Link
                  href="/login"
                  className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors"
                >
                  Logg inn
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-preik-text-muted">
            Ved å opprette en konto godtar du våre{" "}
            <Link href="/vilkar" className="underline hover:text-preik-text">
              vilkår
            </Link>{" "}
            og{" "}
            <Link href="/personvern" className="underline hover:text-preik-text">
              personvernerklæring
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
