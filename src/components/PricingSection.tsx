const features = [
  "Ubegrenset antall samtaler",
  "Opplæring på ditt innhold",
  "Automatiske oppdateringer",
  "Tilpasset merkevare og tone",
  "Norsk support",
  "GDPR-compliant",
];

export function PricingSection() {
  return (
    <section id="priser" className="py-32 px-6 bg-preik-surface transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
            Prising
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-preik-text mb-6">
            Enkel og transparent
          </h2>
          <p className="text-lg text-preik-text-muted max-w-xl mx-auto">
            Skreddersydd løsning for din bedrift. Ingen skjulte kostnader.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-preik-bg rounded-3xl border border-preik-border p-10 relative overflow-hidden">
            {/* Subtle accent gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-preik-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1.5 rounded-full bg-preik-accent/10 text-sm font-medium text-preik-accent mb-6">
                  Alt inkludert
                </span>
                <div className="mb-2">
                  <span className="text-5xl md:text-6xl font-brand font-light text-preik-text">Tilpasset</span>
                </div>
                <p className="text-preik-text-muted">pris basert på dine behov</p>
              </div>

              <ul className="space-y-4 mb-10">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-preik-text">
                    <svg className="w-5 h-5 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#kontakt"
                className="inline-flex items-center justify-center w-full rounded-full bg-preik-accent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-preik-accent-hover hover:scale-[1.02]"
              >
                Ta kontakt for tilbud
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
