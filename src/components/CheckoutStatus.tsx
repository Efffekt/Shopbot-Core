"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutStatus({ tenantId, tenantName }: { tenantId?: string; tenantName?: string }) {
  const router = useRouter();
  const [polling, setPolling] = useState(!tenantId);

  // Poll for tenant creation if not yet provisioned
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, router]);

  // Stop polling once tenant appears
  useEffect(() => {
    if (tenantId) setPolling(false);
  }, [tenantId]);

  return (
    <div className="max-w-lg mx-auto mb-8">
      <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-3xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-brand font-light text-preik-text">
          Betaling mottatt!
        </h2>
        <p className="mt-4 text-preik-text-muted">
          Takk for at du valgte Preik! Vi tar kontakt med deg innen kort tid for å starte onboarding.
        </p>
        <p className="mt-3 text-sm text-preik-text-muted">
          Vi vil snakke med deg for å forstå bedriften din, tilpasse chatboten og sørge for at alt er skreddersydd til dine behov.
        </p>

        {tenantId ? (
          <Link
            href={`/dashboard/${tenantId}`}
            className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-preik-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            Gå til {tenantName || "dashbordet"}
          </Link>
        ) : (
          <p className="mt-6 text-sm text-preik-text-muted animate-pulse">
            Klargjør dashbordet ditt...
          </p>
        )}

        <p className="mt-4 text-sm text-preik-text-muted">
          Har du spørsmål i mellomtiden? Kontakt oss på{" "}
          <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
            hei@preik.ai
          </a>
        </p>
      </div>
    </div>
  );
}
