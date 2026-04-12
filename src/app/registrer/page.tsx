"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  starter: { name: "Start", price: "299 kr/mnd" },
  pro: { name: "Vekst", price: "899 kr/mnd" },
  business: { name: "Proff", price: "Tilpasset pris" },
};

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const plan = searchParams.get("plan");
  const planInfo = plan ? PLAN_LABELS[plan] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Passordet ma vare minst 8 tegn.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passordene samsvarer ikke.");
      return;
    }

    if (!companyName.trim() || companyName.trim().length < 2) {
      setError("Bedriftsnavn er påkrevd (minst 2 tegn).");
      return;
    }

    setLoading(true);

    const loginParams = new URLSearchParams({ confirmed: "true" });
    if (plan) loginParams.set("plan", plan);
    const loginUrl = `${window.location.origin}/login?${loginParams.toString()}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: loginUrl,
        data: {
          company_name: companyName.trim(),
          pending_plan: plan || null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check if email confirmation is required
    // Supabase returns a user even when confirmation is pending
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-preik-text mb-2">Sjekk e-posten din</h2>
        <p className="text-preik-text-muted text-sm mb-6">
          Vi har sendt en bekreftelseslenke til <strong className="text-preik-text">{email}</strong>.
          Klikk pa lenken for a aktivere kontoen din.
        </p>
        <Link
          href="/login"
          className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors text-sm"
        >
          Ga til innlogging
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {planInfo && (
          <div className="bg-preik-accent/10 border border-preik-accent/20 px-4 py-3 rounded-xl text-sm">
            <p className="text-preik-text-muted">Valgt pakke</p>
            <p className="text-preik-text font-semibold mt-0.5">
              {planInfo.name} <span className="text-preik-text-muted font-normal">· {planInfo.price}</span>
            </p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-medium text-preik-text mb-2"
          >
            Bedriftsnavn
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            placeholder="F.eks. Min Bedrift AS"
          />
        </div>

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
            placeholder="Minst 8 tegn"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-preik-text mb-2"
          >
            Bekreft passord
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            placeholder="Gjenta passord"
          />
        </div>

        <p className="text-xs text-preik-text-muted">
          Ved a registrere deg godtar du vare{" "}
          <Link href="/vilkar" className="text-preik-accent hover:underline">vilkar</Link>
          {" "}og{" "}
          <Link href="/personvern" className="text-preik-accent hover:underline">personvernerklaring</Link>.
        </p>

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
            href={searchParams.get("plan") ? `/login?plan=${searchParams.get("plan")}` : "/login"}
            className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors"
          >
            Logg inn
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
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
              Kom i gang med Preik
            </p>
          </div>

          <Suspense>
            <SignupForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
