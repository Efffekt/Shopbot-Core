"use client";

import { useState, useRef } from "react";
import { ScrollReveal } from "./ScrollReveal";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check — bots fill hidden fields, humans don't
    if (honeypotRef.current?.value) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to send");

      setStatus("success");
      setFormData({ name: "", email: "", company: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="kontakt" className="py-32 px-6 bg-preik-surface transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left - Info */}
          <ScrollReveal animation="left">
            <div>
              <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
                Kontakt
              </p>
              <h2 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-6">
                La oss ta en prat
              </h2>
              <p className="text-lg text-preik-text-muted mb-8">
                Interessert i å se hvordan Preik kan hjelpe bedriften din? Fyll ut skjemaet
                så tar vi kontakt innen 24 timer.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-preik-text-muted">
                  <div className="w-10 h-10 rounded-xl bg-preik-accent/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <a href="mailto:hei@preik.ai" className="hover:text-preik-text transition-colors">
                    hei@preik.ai
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right - Form */}
          <ScrollReveal animation="right" delay={150}>
            <div className="bg-preik-bg rounded-2xl border border-preik-border p-8">
              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-preik-text mb-2">Takk for din henvendelse!</h3>
                  <p className="text-preik-text-muted">Vi tar kontakt innen 24 timer.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot — hidden from users, bots fill it */}
                  <input
                    ref={honeypotRef}
                    type="text"
                    name="website"
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-preik-text mb-2">
                        Navn
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-preik-surface border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                        placeholder="Ditt navn"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-preik-text mb-2">
                        E-post
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-preik-surface border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                        placeholder="din@epost.no"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-preik-text mb-2">
                      Bedrift
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 bg-preik-surface border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                      placeholder="Bedriftsnavn (valgfritt)"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-preik-text mb-2">
                      Melding
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-preik-surface border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all resize-none"
                      placeholder="Fortell oss om bedriften din og hva du trenger hjelp med..."
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-red-500 text-sm">Noe gikk galt. Prøv igjen eller send e-post direkte.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-3 px-4 bg-preik-accent text-white font-semibold rounded-xl hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {status === "loading" ? "Sender..." : "Send melding"}
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
