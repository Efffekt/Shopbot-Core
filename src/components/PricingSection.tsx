import { ScrollReveal } from "./ScrollReveal";

const starterFeatures = [
  "Skreddersydd widget og merkevare",
  "Opplæring og nettside-skraping",
  "Avansert innsikt og statistikk",
  "Flerspråklig (norsk + engelsk)",
  "Norsk support · GDPR-compliant",
];

export function PricingSection() {
  return (
    <section id="priser" className="py-32 px-6 bg-preik-surface transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <ScrollReveal animation="up">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
              Prising
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-preik-text mb-6">
              Enkel og transparent
            </h2>
            <p className="text-lg text-preik-text-muted max-w-xl mx-auto">
              Veiledende priser — vi skreddersyr en pakke som passer din bedrift.
            </p>
          </div>
        </ScrollReveal>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter */}
          <ScrollReveal animation="up" stagger={1}>
            <div className="bg-preik-bg rounded-3xl border border-preik-accent p-8 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-preik-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative flex flex-col flex-1">
                <div className="mb-6 h-7">
                  <span className="inline-block px-4 py-1 rounded-full bg-preik-accent/10 text-sm font-medium text-preik-accent">
                    Anbefalt
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-preik-text mb-2">
                  Starter
                </h3>

                <div className="mb-1">
                  <span className="text-sm text-preik-text-muted">Fra </span>
                  <span className="text-4xl font-brand font-light text-preik-text">
                    299
                  </span>
                  <span className="text-sm text-preik-text-muted"> kr/mnd</span>
                </div>

                <p className="text-sm text-preik-text-muted mb-6">
                  1 000 meldinger/mnd
                </p>

                <p className="text-preik-text-muted text-sm mb-8">
                  Alt du trenger for å komme i gang
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {starterFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-preik-text text-sm">
                      <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] bg-preik-accent text-white hover:bg-preik-accent-hover"
                >
                  Kom i gang
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Vekst */}
          <ScrollReveal animation="up" stagger={2}>
            <div className="bg-preik-bg rounded-3xl border border-preik-border p-8 relative overflow-hidden flex flex-col h-full">
              <div className="relative flex flex-col flex-1">
                <div className="mb-6 h-7" />

                <h3 className="text-xl font-semibold text-preik-text mb-2">
                  Vekst
                </h3>

                <div className="mb-1">
                  <span className="text-sm text-preik-text-muted">Fra </span>
                  <span className="text-4xl font-brand font-light text-preik-text">
                    899
                  </span>
                  <span className="text-sm text-preik-text-muted"> kr/mnd</span>
                </div>

                <p className="text-sm text-preik-text-muted mb-6">
                  5 000 meldinger/mnd
                </p>

                <p className="text-preik-text-muted text-sm mb-8">
                  For bedrifter med høyere volum
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-preik-text text-sm font-medium">
                    <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Alt i Starter</span>
                  </li>
                  <li className="flex items-center gap-3 text-preik-text text-sm">
                    <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>5x meldingsvolum</span>
                  </li>
                  <li className="flex items-center gap-3 text-preik-text text-sm">
                    <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Prioritert support</span>
                  </li>
                </ul>

                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] bg-preik-accent/10 text-preik-accent hover:bg-preik-accent/20"
                >
                  Ta kontakt
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Bedrift / Custom */}
          <ScrollReveal animation="up" stagger={3}>
            <div className="bg-preik-bg rounded-3xl border border-preik-border p-8 relative overflow-hidden flex flex-col h-full">
              <div className="relative flex flex-col flex-1">
                <div className="mb-6 h-7" />

                <h3 className="text-xl font-semibold text-preik-text mb-2">
                  Bedrift
                </h3>

                <div className="mb-1">
                  <span className="text-4xl font-brand font-light text-preik-text">
                    Tilpasset
                  </span>
                </div>

                <p className="text-sm text-preik-text-muted mb-6">
                  volum og behov tilpasset deg
                </p>

                <p className="text-preik-text-muted text-sm mb-8">
                  For etablerte bedrifter med egne behov
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-preik-text text-sm font-medium">
                    <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Alt i Vekst</span>
                  </li>
                  <li className="flex items-center gap-3 text-preik-text text-sm">
                    <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tilpasset meldingsvolum</span>
                  </li>
                  <li className="flex items-center gap-3 text-preik-text text-sm">
                    <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Dedikert kontaktperson</span>
                  </li>
                </ul>

                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] bg-preik-accent/10 text-preik-accent hover:bg-preik-accent/20"
                >
                  Kontakt oss for tilbud
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Custom note */}
        <ScrollReveal animation="up" delay={400}>
          <p className="text-center text-preik-text-muted text-sm mt-10">
            Alle priser er veiledende.{" "}
            <a href="#kontakt" className="text-preik-accent hover:underline">
              Vi skreddersyr en pakke for din bedrift.
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
