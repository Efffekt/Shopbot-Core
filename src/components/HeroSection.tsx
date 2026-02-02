"use client";

import { PreikWave } from "./PreikWave";
import { AnimatedChat } from "./AnimatedChat";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-preik-bg transition-colors duration-200">
      {/* Preik-bølgen background - subtle wave pattern */}
      <div className="absolute inset-0 opacity-[0.08] text-preik-accent">
        <PreikWave className="absolute inset-0 w-full h-full" />
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-preik-surface to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center px-6 pt-32 pb-24">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text and CTA */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
              AI-drevet kundeservice
            </p>

            {/* Main slogan */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-preik-text transition-colors duration-200 font-brand font-light leading-[0.95]">
              Ikke mer leting.
              <br />
              <span className="text-preik-text-muted">Bare god </span>
              <span className="preik-wordmark-accent">preik.</span>
            </h1>

            {/* Supporting text */}
            <p className="mt-8 max-w-xl text-lg sm:text-xl text-preik-text-muted leading-relaxed transition-colors duration-200">
              Skreddersydde AI-assistenter som forstår bedriften din og svarer kundene dine – på ordentlig norsk.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#kontakt"
                className="inline-flex items-center justify-center rounded-full bg-preik-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-bg"
              >
                Kom i gang
              </a>
              <a
                href="#hvordan"
                className="inline-flex items-center justify-center rounded-full border border-preik-border px-7 py-3.5 text-sm font-medium text-preik-text-muted transition-colors hover:border-preik-text-muted hover:text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-border focus:ring-offset-2 focus:ring-offset-preik-bg"
              >
                Se hvordan det fungerer
              </a>
            </div>
          </div>

          {/* Right - Animated chat */}
          <div className="flex justify-center lg:justify-end">
            <AnimatedChat />
          </div>
        </div>
      </div>
    </section>
  );
}
