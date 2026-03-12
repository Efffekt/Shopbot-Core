"use client";

import LiquidGlass from "liquid-glass-react";
import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    number: "01",
    title: "Vi henter innholdet ditt",
    description: "Vi samler inn innhold fra nettsiden din — produkter, FAQ og dokumentasjon.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI-en settes opp",
    description: "Innholdet blir prosessert slik at AI-en forstår bedriften din og kan svare kundene dine.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Legg til på din side",
    description: "Du får en enkel kode-snippet som legges inn på nettsiden. Ferdig på minutter.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
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
        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <ScrollReveal key={index} animation="up" stagger={index + 1}>
              <div className="relative text-center md:text-left">
                {/* Connecting arrow — hidden on last step and on mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[-24px] z-0">
                    <div className="h-px border-t-2 border-dashed border-preik-accent/20" />
                    <svg className="absolute -right-1 -top-[5px] w-3 h-3 text-preik-accent/30" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M2 1l8 5-8 5V1z" />
                    </svg>
                  </div>
                )}

                {/* Step number badge — positioned above the glass card */}
                <div className="absolute -top-3 left-8 md:left-8 z-10">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-preik-accent text-xs font-semibold text-white tracking-wider">
                    STEG {step.number}
                  </span>
                </div>

                {/* Liquid Glass Card */}
                <LiquidGlass
                  displacementScale={40}
                  blurAmount={0.05}
                  saturation={120}
                  aberrationIntensity={1}
                  elasticity={0.15}
                  cornerRadius={16}
                  overLight
                  className="h-full"
                  padding="32px"
                >
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-preik-accent/10 text-preik-accent mb-5 mt-2">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-medium text-preik-text mb-3">{step.title}</h3>
                  <p className="text-preik-text-muted leading-relaxed">{step.description}</p>
                </LiquidGlass>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
