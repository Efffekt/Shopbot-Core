"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-preik-text mb-2">Noe gikk galt</h2>
        <p className="text-preik-text-muted mb-6 text-sm">
          Det oppstod en uventet feil. Prøv å laste siden på nytt.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-preik-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          Prøv igjen
        </button>
      </div>
    </div>
  );
}
