"use client";

import { AnimatedDashboard } from "./AnimatedDashboard";
import { ScrollReveal } from "./ScrollReveal";

export function DashboardShowcaseSection() {
  return (
    <section className="py-32 px-6 bg-preik-accent transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal animation="up">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-sm font-medium text-white/70 tracking-wide uppercase mb-4">
              Dashboardet
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-white mb-6">
              Full kontroll over din AI-assistent
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Statistikk, samtaler, analyse og integrasjon — alt på ett sted.
            </p>
          </div>
        </ScrollReveal>

        {/* Scale the dashboard down on smaller screens to keep it readable */}
        <ScrollReveal animation="up" delay={200}>
          <div className="origin-top scale-[0.42] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 -mb-[278px] sm:-mb-[144px] md:-mb-[72px] lg:mb-0">
            <AnimatedDashboard />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
