"use client";

import LiquidGlass from "liquid-glass-react";
import { PreikWave } from "./PreikWave";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTASection() {
  return (
    <section className="relative py-24 px-6 bg-preik-surface transition-colors duration-200 overflow-hidden">
      {/* Subtle wave pattern background */}
      <div className="absolute inset-0 opacity-[0.04] text-preik-accent">
        <PreikWave className="absolute inset-0 w-full h-full" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <ScrollReveal animation="up">
          <LiquidGlass
            displacementScale={50}
            blurAmount={0.06}
            saturation={130}
            aberrationIntensity={1.5}
            elasticity={0.2}
            cornerRadius={24}
            overLight
            padding="48px 32px"
          >
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
          </LiquidGlass>
        </ScrollReveal>
      </div>
    </section>
  );
}
