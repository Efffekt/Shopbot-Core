"use client";

export default function CheckoutStatus() {
  return (
    <div className="max-w-lg mx-auto">
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
        <p className="mt-6 text-sm text-preik-text-muted">
          Har du spørsmål i mellomtiden? Kontakt oss på{" "}
          <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
            hei@preik.ai
          </a>
        </p>
      </div>
    </div>
  );
}
