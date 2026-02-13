import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    number: "01",
    title: "Vi henter innholdet ditt",
    description: "Vi samler inn innhold fra nettsiden din — produkter, FAQ og dokumentasjon.",
  },
  {
    number: "02",
    title: "AI-en settes opp",
    description: "Innholdet blir prosessert slik at AI-en forstår bedriften din og kan svare kundene dine.",
  },
  {
    number: "03",
    title: "Legg til på din side",
    description: "Du får en enkel kode-snippet som legges inn på nettsiden. Ferdig på minutter.",
  },
];

export function ProcessSection() {
  return (
    <section id="losninger" className="py-32 px-6 bg-preik-surface transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <ScrollReveal animation="up">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
              Tre enkle steg
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-preik-text mb-6">
              Slik fungerer det
            </h2>
            <p className="text-lg text-preik-text-muted max-w-xl mx-auto">
              Fra nettside til AI-assistent på under 48 timer.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <ScrollReveal key={index} animation="up" stagger={index + 1}>
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-preik-accent/10 mb-6">
                  <span className="text-xl font-brand font-light text-preik-accent">{step.number}</span>
                </div>
                <h3 className="text-xl font-medium text-preik-text mb-3">{step.title}</h3>
                <p className="text-preik-text-muted leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
