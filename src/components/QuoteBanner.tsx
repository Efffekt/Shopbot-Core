import { ScrollReveal } from "./ScrollReveal";

export function QuoteBanner() {
  return (
    <section className="bg-preik-surface py-24 px-6 relative overflow-hidden transition-colors duration-200">
      {/* Decorative corner lines */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-preik-border" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-preik-border" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-preik-border" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-preik-border" />

      <div className="max-w-3xl mx-auto text-center relative">
        <ScrollReveal animation="scale">
          <span className="text-5xl font-brand text-preik-text/15 leading-none select-none">
            &ldquo;
          </span>
          <p className="text-xl sm:text-2xl md:text-3xl font-brand font-light text-preik-text leading-snug -mt-4">
            Dette er ikke kundeservice. Det er en fagekspert som aldri sover.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-preik-border" />
            <span className="text-xs font-mono uppercase tracking-widest text-preik-text-muted">
              Preik
            </span>
            <span className="h-px w-8 bg-preik-border" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
