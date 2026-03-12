"use client";

import { GlassCard } from "./GlassCard";
import { ScrollReveal } from "./ScrollReveal";

/* ─── Step illustrations ─── */

function CrawlIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-full h-auto">
      {/* Browser window */}
      <rect x="10" y="12" width="60" height="44" rx="4" className="stroke-preik-accent" strokeWidth="1.5" opacity="0.6" />
      <line x1="10" y1="22" x2="70" y2="22" className="stroke-preik-accent" strokeWidth="1" opacity="0.3" />
      <circle cx="17" cy="17" r="1.5" className="fill-preik-accent" opacity="0.4" />
      <circle cx="23" cy="17" r="1.5" className="fill-preik-accent" opacity="0.4" />
      <circle cx="29" cy="17" r="1.5" className="fill-preik-accent" opacity="0.4" />
      {/* Content lines */}
      <rect x="16" y="28" width="28" height="2" rx="1" className="fill-preik-accent" opacity="0.3" />
      <rect x="16" y="34" width="40" height="2" rx="1" className="fill-preik-accent" opacity="0.2" />
      <rect x="16" y="40" width="20" height="2" rx="1" className="fill-preik-accent" opacity="0.2" />
      <rect x="16" y="46" width="34" height="2" rx="1" className="fill-preik-accent" opacity="0.15" />
      {/* Scanning beam */}
      <line x1="12" y1="30" x2="68" y2="30" className="stroke-preik-accent" strokeWidth="1.5" opacity="0.5" strokeDasharray="3 2" />
      {/* Data flowing to document */}
      <path d="M72 34 L86 34" className="stroke-preik-accent" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      <path d="M72 38 L82 44" className="stroke-preik-accent" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      {/* Document */}
      <rect x="86" y="22" width="24" height="32" rx="2" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1.5" opacity="0.7" />
      <rect x="90" y="28" width="16" height="1.5" rx="0.75" className="fill-preik-accent" opacity="0.3" />
      <rect x="90" y="33" width="12" height="1.5" rx="0.75" className="fill-preik-accent" opacity="0.2" />
      <rect x="90" y="38" width="14" height="1.5" rx="0.75" className="fill-preik-accent" opacity="0.2" />
      <rect x="90" y="43" width="10" height="1.5" rx="0.75" className="fill-preik-accent" opacity="0.15" />
      {/* Decorative dots */}
      <circle cx="18" cy="72" r="2" className="fill-preik-accent" opacity="0.1" />
      <circle cx="50" cy="80" r="3" className="fill-preik-accent" opacity="0.08" />
      <circle cx="100" cy="68" r="1.5" className="fill-preik-accent" opacity="0.12" />
    </svg>
  );
}

function AISetupIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-full h-auto">
      {/* Central brain/node */}
      <circle cx="60" cy="44" r="14" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1.5" opacity="0.7" />
      {/* Inner sparkle */}
      <path d="M60 34 L60 38 M60 50 L60 54 M50 44 L54 44 M66 44 L70 44" className="stroke-preik-accent" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M53.5 37.5 L56 40 M64 48 L66.5 50.5 M53.5 50.5 L56 48 M64 40 L66.5 37.5" className="stroke-preik-accent" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      {/* Orbiting nodes */}
      <circle cx="30" cy="28" r="6" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1" opacity="0.5" />
      <circle cx="90" cy="28" r="6" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1" opacity="0.5" />
      <circle cx="30" cy="62" r="5" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1" opacity="0.4" />
      <circle cx="90" cy="62" r="5" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1" opacity="0.4" />
      <circle cx="60" cy="78" r="4" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1" opacity="0.3" />
      {/* Connections */}
      <line x1="36" y1="30" x2="48" y2="38" className="stroke-preik-accent" strokeWidth="1" opacity="0.25" />
      <line x1="84" y1="30" x2="72" y2="38" className="stroke-preik-accent" strokeWidth="1" opacity="0.25" />
      <line x1="34" y1="60" x2="48" y2="50" className="stroke-preik-accent" strokeWidth="1" opacity="0.2" />
      <line x1="86" y1="60" x2="72" y2="50" className="stroke-preik-accent" strokeWidth="1" opacity="0.2" />
      <line x1="60" y1="74" x2="60" y2="58" className="stroke-preik-accent" strokeWidth="1" opacity="0.2" />
      {/* Small sparkles */}
      <circle cx="44" cy="20" r="1.5" className="fill-preik-accent" opacity="0.2" />
      <circle cx="78" cy="18" r="1" className="fill-preik-accent" opacity="0.15" />
      <circle cx="104" cy="46" r="1.5" className="fill-preik-accent" opacity="0.12" />
      <circle cx="16" cy="48" r="1" className="fill-preik-accent" opacity="0.1" />
    </svg>
  );
}

function InstallIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-full h-auto">
      {/* Code editor window */}
      <rect x="14" y="14" width="68" height="52" rx="4" className="stroke-preik-accent fill-preik-accent/5" strokeWidth="1.5" opacity="0.6" />
      <line x1="14" y1="24" x2="82" y2="24" className="stroke-preik-accent" strokeWidth="1" opacity="0.3" />
      <circle cx="21" cy="19" r="1.5" className="fill-preik-accent" opacity="0.4" />
      <circle cx="27" cy="19" r="1.5" className="fill-preik-accent" opacity="0.4" />
      <circle cx="33" cy="19" r="1.5" className="fill-preik-accent" opacity="0.4" />
      {/* Code lines */}
      <text x="20" y="35" className="fill-preik-accent" fontSize="5" fontFamily="monospace" opacity="0.5">&lt;script</text>
      <text x="24" y="42" className="fill-preik-accent" fontSize="4.5" fontFamily="monospace" opacity="0.35">src=&quot;preik.ai/w..&quot;</text>
      <text x="20" y="49" className="fill-preik-accent" fontSize="5" fontFamily="monospace" opacity="0.5">/&gt;</text>
      {/* Arrow to website */}
      <path d="M84 40 L96 40" className="stroke-preik-accent" strokeWidth="1.5" opacity="0.5" />
      <path d="M93 37 L96 40 L93 43" className="stroke-preik-accent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* Website with chat bubble */}
      <rect x="98" y="24" width="14" height="20" rx="2" className="stroke-preik-accent" strokeWidth="1" opacity="0.4" />
      <rect x="100" y="28" width="10" height="1" rx="0.5" className="fill-preik-accent" opacity="0.2" />
      <rect x="100" y="31" width="7" height="1" rx="0.5" className="fill-preik-accent" opacity="0.15" />
      {/* Chat bubble popping out */}
      <rect x="96" y="46" width="18" height="12" rx="3" className="stroke-preik-accent fill-preik-accent/10" strokeWidth="1" opacity="0.6" />
      <rect x="99" y="50" width="8" height="1" rx="0.5" className="fill-preik-accent" opacity="0.3" />
      <rect x="99" y="53" width="12" height="1" rx="0.5" className="fill-preik-accent" opacity="0.2" />
      {/* Checkmark */}
      <circle cx="48" cy="74" r="10" className="stroke-preik-accent fill-preik-accent/10" strokeWidth="1.5" opacity="0.5" />
      <path d="M43 74 L46 77 L53 70" className="stroke-preik-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* Decorative */}
      <circle cx="8" cy="40" r="1.5" className="fill-preik-accent" opacity="0.1" />
      <circle cx="112" cy="70" r="2" className="fill-preik-accent" opacity="0.08" />
    </svg>
  );
}

const steps = [
  {
    number: "01",
    title: "Vi henter innholdet ditt",
    description: "Vi samler inn innhold fra nettsiden din — produkter, FAQ og dokumentasjon.",
    illustration: <CrawlIllustration />,
  },
  {
    number: "02",
    title: "AI-en settes opp",
    description: "Innholdet blir prosessert slik at AI-en forstår bedriften din og kan svare kundene dine.",
    illustration: <AISetupIllustration />,
  },
  {
    number: "03",
    title: "Legg til på din side",
    description: "Du får en enkel kode-snippet som legges inn på nettsiden. Ferdig på minutter.",
    illustration: <InstallIllustration />,
  },
];

export function ProcessSection() {
  return (
    <section id="losninger" className="relative py-32 px-6 bg-preik-surface transition-colors duration-200 overflow-hidden">
      {/* Decorative floating shapes */}
      <div className="absolute top-20 left-[10%] w-24 h-24 rounded-full bg-preik-accent/[0.04] blur-2xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-32 right-[8%] w-32 h-32 rounded-full bg-preik-accent/[0.03] blur-3xl animate-float-medium pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
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

                {/* Step number badge */}
                <div className="absolute -top-3 left-8 md:left-8 z-10">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-preik-accent text-xs font-semibold text-white tracking-wider">
                    STEG {step.number}
                  </span>
                </div>

                {/* Glass Card */}
                <GlassCard className="p-8 h-full">
                  {/* Illustration */}
                  <div className="w-full max-w-[180px] mx-auto mb-4 mt-2">
                    {step.illustration}
                  </div>

                  <h3 className="text-xl font-medium text-preik-text mb-3">{step.title}</h3>
                  <p className="text-preik-text-muted leading-relaxed">{step.description}</p>
                </GlassCard>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
