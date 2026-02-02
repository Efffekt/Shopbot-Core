"use client";

import { useRef } from "react";
import { ChatWidget, ChatWidgetRef } from "./ChatWidget";

const sampleQuestions = [
  "Hva er Preik?",
  "Hvordan fungerer AI-assistenten?",
  "Hva koster det?",
];

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lynraske svar",
    description: "Kundene får svar på sekunder, ikke timer. Tilgjengelig 24/7.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Alltid på merkevaren",
    description: "Svarene høres ut som deg, ikke en robot. Tilpasset din tone og stil.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    title: "Trent på dine data",
    description: "Vi lærer opp AI-en på nettsiden din, produkter og FAQ. Oppdateres automatisk.",
  },
];

export function DemoSection() {
  const chatRef = useRef<ChatWidgetRef>(null);

  const handleQuestionClick = (question: string) => {
    chatRef.current?.sendMessage(question);
  };

  return (
    <section id="hvordan" className="py-32 px-6 bg-preik-bg transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
            Prøv selv
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-preik-text mb-6">
            Se hvordan det fungerer
          </h2>
          <p className="text-lg text-preik-text-muted max-w-2xl mx-auto">
            En AI-assistent som faktisk forstår bedriften din. Trent på ditt innhold, tilpasset din tone.
          </p>
        </div>

        {/* Demo container */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left - Features */}
          <div className="space-y-10">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center text-preik-accent">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-preik-text mb-2">{feature.title}</h3>
                    <p className="text-preik-text-muted leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestion prompts */}
            <div className="pt-6 border-t border-preik-border">
              <p className="text-sm font-medium text-preik-text mb-4">Prøv å spørre:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="px-4 py-2 text-sm rounded-full border border-preik-border text-preik-text-muted hover:border-preik-accent hover:text-preik-accent transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Chat Widget */}
          <div className="lg:sticky lg:top-24">
            <ChatWidget
              ref={chatRef}
              storeId="preik-demo"
              placeholder="Spør om Preik..."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
