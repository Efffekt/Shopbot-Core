"use client";

import { GlassCard } from "./GlassCard";
import { PreikWave } from "./PreikWave";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTASection() {
  return (
    <section className="relative py-24 px-6 bg-preik-surface transition-colors duration-200 overflow-hidden">
      {/* Subtle wave pattern background */}
      <div className="absolute inset-0 opacity-[0.04] text-preik-accent">
        <PreikWave className="absolute inset-0 w-full h-full" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-12 left-[15%] w-16 h-16 rounded-2xl bg-preik-accent/[0.06] blur-xl animate-float-medium pointer-events-none rotate-12" />
      <div className="absolute bottom-16 right-[12%] w-20 h-20 rounded-full bg-preik-accent/[0.05] blur-2xl animate-float-slow pointer-events-none" />
      <div className="absolute top-1/2 left-[5%] w-3 h-3 rounded-full bg-preik-accent/20 animate-float-fast pointer-events-none" />
      <div className="absolute top-1/3 right-[8%] w-2 h-2 rounded-full bg-preik-accent/15 animate-float-medium pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <ScrollReveal animation="up">
          <GlassCard intensity="strong" className="p-12 md:p-16">
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-6">
                Klar til å komme i gang?
              </h2>
              <p className="text-lg text-preik-text-muted mb-10 max-w-xl mx-auto">
                Gi kundene dine svar på sekunder — med en AI-assistent som kjenner bedriften din ut og inn.
              </p>
              <a
                href="/registrer"
                className="inline-flex items-center justify-center rounded-full bg-preik-accent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-preik-accent-hover hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-bg"
              >
                Kom i gang fra 299 kr/mnd
              </a>
              <p className="mt-4 text-sm text-preik-text-muted">
                Ingen bindingstid · Oppsett på under 48 timer
              </p>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
