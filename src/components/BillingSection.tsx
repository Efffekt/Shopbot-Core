"use client";

import { useState } from "react";

interface BillingSectionProps {
  tenantId: string;
  planName: string | null;
  hasStripe: boolean;
}

export default function BillingSection({ tenantId, planName, hasStripe }: BillingSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenPortal() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Noe gikk galt");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Kunne ikke åpne betalingsportalen");
    } finally {
      setLoading(false);
    }
  }

  if (!hasStripe) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-preik-text-muted">
          Ingen aktiv betalingsplan registrert. Abonnementet ditt administreres manuelt.
        </p>
        <p className="text-sm text-preik-text-muted">
          Spørsmål om fakturering?{" "}
          <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
            Kontakt oss
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {planName && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-preik-text-muted">Aktivt abonnement:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-preik-accent/10 text-preik-accent">
            {planName}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <p className="text-sm text-preik-text-muted">
        Administrer abonnement, se fakturaer, oppdater betalingsmetode eller endre plan.
      </p>

      <button
        onClick={handleOpenPortal}
        disabled={loading}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-preik-accent hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-preik-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Åpner...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Administrer abonnement
          </>
        )}
      </button>
    </div>
  );
}
