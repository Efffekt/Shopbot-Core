import { ScrollReveal } from "./ScrollReveal";

const startFeatures = [
  "Skreddersydd widget i din merkevare",
  "Opplæring på innholdet ditt",
  "Nettside-skraping av opptil 500 sider",
  "Avansert innsikt og statistikk",
  "Flerspråklig støtte (norsk + engelsk)",
  "Norsk support",
  "GDPR-compliant",
];

const vekstFeatures = [
  { text: "Alt i Start", bold: true },
  { text: "5x meldingsvolum", bold: false },
  { text: "Nettside-skraping av opptil 1500 sider", bold: false },
  { text: "Prioritert support", bold: false },
];

const proffFeatures = [
  { text: "Alt i Vekst", bold: true },
  { text: "Tilpasset meldingsvolum", bold: false },
  { text: "Nettside-skraping og opplæring tilpasset behov", bold: false },
  { text: "Tilpasset antall sider og kilder", bold: false },
  { text: "Dedikert kontaktperson", bold: false },
];

const checkIcon = (
  <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

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
              Velg pakken som passer din bedrift — kom raskt i gang.
            </p>
          </div>
        </ScrollReveal>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Start */}
          <ScrollReveal animation="up" stagger={1}>
            <div className="bg-preik-bg rounded-3xl border border-preik-accent p-8 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-preik-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative flex flex-col flex-1">
                <div className="mb-6 h-7">
                  <span className="inline-block px-4 py-1 rounded-full bg-preik-accent text-sm font-medium text-white">
                    Anbefalt
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-preik-text mb-2">
                  Start
                </h3>

                <div className="mb-1">
                  <span className="text-sm text-preik-text-muted">Fra </span>
                  <span className="text-4xl font-brand font-light text-preik-text">
                    299
                  </span>
                  <span className="text-sm text-preik-text-muted"> kr/mnd</span>
                </div>

                <p className="text-sm font-medium text-preik-text mb-4">
                  1 000 meldinger per måned
                </p>

                <p className="text-preik-text-muted text-sm mb-8">
                  For bedrifter som vil komme raskt i gang med AI-kundeservice på egne nettsider.
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {startFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-preik-text text-sm">
                      {checkIcon}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-xs text-preik-text-muted mb-4 text-center font-medium">
                    Ingen skjulte kostnader
                  </p>
                  <a
                    href="/registrer?plan=starter"
                    className="inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] bg-preik-accent text-white hover:bg-preik-accent-hover"
                  >
                    Kom i gang
                  </a>
                </div>
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

                <p className="text-sm font-medium text-preik-text mb-4">
                  5 000 meldinger per måned
                </p>

                <p className="text-preik-text-muted text-sm mb-8">
                  For bedrifter med mer trafikk, flere henvendelser og behov for høyere kapasitet.
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {vekstFeatures.map((feature, index) => (
                    <li key={index} className={`flex items-center gap-3 text-preik-text text-sm ${feature.bold ? "font-medium" : ""}`}>
                      {checkIcon}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-xs text-preik-text-muted mb-4 text-center font-medium">
                    Ingen skjulte kostnader
                  </p>
                  <a
                    href="/registrer?plan=pro"
                    className="inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] border border-preik-accent text-preik-text hover:bg-preik-accent hover:text-white"
                  >
                    Kom i gang
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Proff */}
          <ScrollReveal animation="up" stagger={3}>
            <div className="bg-preik-bg rounded-3xl border border-preik-border p-8 relative overflow-hidden flex flex-col h-full">
              <div className="relative flex flex-col flex-1">
                <div className="mb-6 h-7" />

                <h3 className="text-xl font-semibold text-preik-text mb-2">
                  Proff
                </h3>

                <div className="mb-1">
                  <span className="text-4xl font-brand font-light text-preik-text">
                    Tilpasset
                  </span>
                  <span className="text-sm text-preik-text-muted"> pris</span>
                </div>

                <p className="text-sm font-medium text-preik-text mb-4">
                  Volum og behov tilpasset deg
                </p>

                <p className="text-preik-text-muted text-sm mb-8">
                  For bedrifter som trenger mer kapasitet, flere kilder og tettere oppfølging.
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {proffFeatures.map((feature, index) => (
                    <li key={index} className={`flex items-center gap-3 text-preik-text text-sm ${feature.bold ? "font-medium" : ""}`}>
                      {checkIcon}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-xs text-preik-text-muted mb-4 text-center font-medium">
                    Ingen skjulte kostnader
                  </p>
                  <a
                    href="#kontakt"
                    className="inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] border border-preik-accent text-preik-text hover:bg-preik-accent hover:text-white"
                  >
                    Kontakt oss for tilbud
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Custom note */}
        <ScrollReveal animation="up" delay={400}>
          <p className="text-center text-preik-text-muted text-sm mt-10">
            Trenger du noe tilpasset?{" "}
            <a href="#kontakt" className="text-preik-accent hover:underline">
              Vi skreddersyr en pakke for din bedrift.
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
