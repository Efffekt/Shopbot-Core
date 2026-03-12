"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatedDashboard } from "./AnimatedDashboard";
import { ScrollReveal } from "./ScrollReveal";

const BASE_W = 840;
const BASE_H = 480;

export function DashboardShowcaseSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(entry.contentRect.width / BASE_W, 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-32 px-6 bg-preik-bg transition-colors duration-200 overflow-hidden">
      {/* Decorative gradient blob behind the dashboard */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] bg-preik-accent/[0.06] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal animation="up">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
              Dashboardet
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-preik-text mb-6">
              Full kontroll over din AI-assistent
            </h2>
            <p className="text-lg text-preik-text-muted max-w-xl mx-auto">
              Statistikk, samtaler, analyse og integrasjon — alt på ett sted.
            </p>
          </div>
        </ScrollReveal>

        {/* Scale the dashboard to always fit the container width */}
        <ScrollReveal animation="up" delay={200}>
          <div ref={containerRef} className="overflow-hidden rounded-2xl border border-preik-border shadow-lg shadow-preik-accent/[0.04]">
            <div
              className="min-w-[840px] origin-top-left"
              style={{
                transform: `scale(${scale})`,
                marginBottom: `-${BASE_H * (1 - scale)}px`,
              }}
            >
              <AnimatedDashboard />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
