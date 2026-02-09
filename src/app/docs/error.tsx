"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Docs error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-preik-text mb-2">Noe gikk galt</h2>
        <p className="text-preik-text-muted mb-6 text-sm">
          Kunne ikke laste dokumentasjonen. Prøv igjen eller gå tilbake.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-preik-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Prøv igjen
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-preik-border text-preik-text text-sm font-medium rounded-xl hover:bg-preik-surface transition-colors"
          >
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}
