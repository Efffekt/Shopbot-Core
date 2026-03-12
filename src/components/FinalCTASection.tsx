import { ScrollReveal } from "./ScrollReveal";

export function FinalCTASection() {
  return (
    <section className="py-24 px-6 bg-preik-surface transition-colors duration-200">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal animation="up">
          <h2 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-6">
            Klar til å komme i gang?
          </h2>
        </ScrollReveal>
        <ScrollReveal animation="up" delay={100}>
          <p className="text-lg text-preik-text-muted mb-10 max-w-xl mx-auto">
            Gi kundene dine svar på sekunder — med en AI-assistent som kjenner bedriften din ut og inn.
          </p>
        </ScrollReveal>
        <ScrollReveal animation="scale" delay={200}>
          <a
            href="/registrer"
            className="inline-flex items-center justify-center rounded-full bg-preik-accent px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-surface"
          >
            Kom i gang fra 299 kr/mnd
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
