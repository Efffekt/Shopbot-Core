"use client";

import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

const faqs = [
  {
    question: "Hvor lang tid tar det å sette opp?",
    answer: "De fleste kunder er oppe og kjører innen 24-48 timer. Vi henter innhold fra nettsiden din, setter opp AI-en, og gir deg en kode-snippet du legger inn på siden din.",
  },
  {
    question: "Fungerer det på norsk?",
    answer: "Ja! Preik er bygget for norske bedrifter. AI-en forstår og svarer på norsk, og tilpasses din tone og merkevare.",
  },
  {
    question: "Hva skjer når innholdet på nettsiden endres?",
    answer: "Vi kjører en månedlig oppdatering basert på innholdsendringer på nettsiden din. Trenger du å legge til noe kritisk mellom oppdateringene? Ta kontakt, så ordner vi det raskt.",
  },
  {
    question: "Er dataene mine trygge?",
    answer: "Ja. Vi er GDPR-compliant og lagrer kun data som er nødvendig for å gi gode svar. Data behandles av godkjente underleverandører (Google Cloud, OpenAI) under strenge databehandleravtaler.",
  },
  {
    question: "Kan jeg tilpasse utseendet på chatten?",
    answer: "Absolutt. Farger, fonter og tone tilpasses din merkevare så det ser ut som en naturlig del av nettsiden din.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-32 px-6 bg-preik-bg transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <ScrollReveal animation="up">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
              FAQ
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-brand font-light text-preik-text">
              Spørsmål og svar
            </h2>
          </div>
        </ScrollReveal>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} animation="up" stagger={index + 1}>
              <div
                className="border border-preik-border rounded-2xl overflow-hidden bg-preik-surface transition-all duration-200 hover:border-preik-text-muted/30"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-medium text-preik-text">{faq.question}</span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openIndex === index ? "bg-preik-accent text-white" : "bg-preik-bg text-preik-text-muted"}`}>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5">
                      <p className="text-preik-text-muted leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
