"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Industry = "ecommerce" | "service" | "restaurant" | "professional" | "other";
type UseCase = "customer_service" | "product_help" | "custom";
type BusinessSize = "solo" | "2-10" | "11-50" | "50+";
type TrafficRange = "<500" | "500-2000" | "2000-10000" | "10000+";

interface Answers {
  industry: Industry | null;
  useCase: UseCase | null;
  customChallenge: string;
  businessSize: BusinessSize | null;
  trafficRange: TrafficRange | null;
  name: string;
  email: string;
  company: string;
  websiteUrl: string;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "ecommerce", label: "Nettbutikk" },
  { value: "service", label: "Servicebedrift" },
  { value: "restaurant", label: "Restaurant / café" },
  { value: "professional", label: "Faglig tjeneste" },
  { value: "other", label: "Annet" },
];

const USE_CASES: { value: UseCase; label: string; sublabel: string }[] = [
  {
    value: "customer_service",
    label: "Kundeservice",
    sublabel: "La chatboten ta unna de vanlige spørsmålene",
  },
  {
    value: "product_help",
    label: "Produkthjelp",
    sublabel: "Hjelpe kunder å finne det de leter etter",
  },
  {
    value: "custom",
    label: "Noe annet",
    sublabel: "Jeg har et spesifikt behov jeg vil fortelle om",
  },
];

const BUSINESS_SIZES: { value: BusinessSize; label: string }[] = [
  { value: "solo", label: "Solo / enkeltperson" },
  { value: "2-10", label: "2–10 ansatte" },
  { value: "11-50", label: "11–50 ansatte" },
  { value: "50+", label: "Mer enn 50 ansatte" },
];

const TRAFFIC_RANGES: { value: TrafficRange; label: string; sublabel: string }[] = [
  { value: "<500", label: "Ganske stille", sublabel: "Under 500 besøkende i måneden" },
  { value: "500-2000", label: "Voksende", sublabel: "500–2 000 besøkende i måneden" },
  { value: "2000-10000", label: "Etablert", sublabel: "2 000–10 000 besøkende i måneden" },
  { value: "10000+", label: "Høy trafikk", sublabel: "Mer enn 10 000 besøkende i måneden" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTotalSteps(useCase: UseCase | null): number {
  return useCase === "custom" ? 6 : 5;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TileButton({
  selected,
  onClick,
  label,
  sublabel,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left px-5 py-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-bg",
        selected
          ? "border-preik-accent bg-preik-accent/10 text-preik-text"
          : "border-preik-border bg-preik-surface hover:border-preik-accent/50 text-preik-text",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium text-sm">{label}</p>
          {sublabel && <p className="text-xs text-preik-text-muted mt-0.5">{sublabel}</p>}
        </div>
        {selected && (
          <svg
            className="w-5 h-5 text-preik-accent flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-preik-text-muted">
          Steg {step} av {total}
        </span>
        <span className="text-xs text-preik-text-muted">
          {Math.round((step / total) * 100)}% fullført
        </span>
      </div>
      <div className="h-1.5 bg-preik-border rounded-full overflow-hidden">
        <div
          className="h-full bg-preik-accent rounded-full transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    industry: null,
    useCase: null,
    customChallenge: "",
    businessSize: null,
    trafficRange: null,
    name: "",
    email: "",
    company: "",
    websiteUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const totalSteps = getTotalSteps(answers.useCase);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Determine the effective step index (accounting for the conditional step 3)
  const getQualificationStep = () => {
    if (answers.useCase !== "custom") {
      // Steps: 1=industry, 2=useCase, 3=businessSize, 4=trafficRange, 5=contact
      if (step === 3) return "businessSize";
      if (step === 4) return "trafficRange";
      if (step === 5) return "contact";
    } else {
      // Steps: 1=industry, 2=useCase, 3=customChallenge, 4=businessSize, 5=trafficRange, 6=contact
      if (step === 3) return "customChallenge";
      if (step === 4) return "businessSize";
      if (step === 5) return "trafficRange";
      if (step === 6) return "contact";
    }
    return null;
  };

  const canAdvance = (): boolean => {
    if (step === 1) return answers.industry !== null;
    if (step === 2) return answers.useCase !== null;
    const qs = getQualificationStep();
    if (qs === "customChallenge") return answers.customChallenge.trim().length > 0;
    if (qs === "businessSize") return answers.businessSize !== null;
    if (qs === "trafficRange") return answers.trafficRange !== null;
    if (qs === "contact") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim());
      return answers.name.trim().length > 0 && emailOk;
    }
    return false;
  };

  const handleNext = () => {
    if (canAdvance() && step < totalSteps) {
      setStep((s) => s + 1);
      scrollToTop();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      scrollToTop();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        industry: answers.industry,
        useCase: answers.useCase,
        ...(answers.useCase === "custom" && answers.customChallenge
          ? { customChallenge: answers.customChallenge }
          : {}),
        businessSize: answers.businessSize,
        trafficRange: answers.trafficRange,
        name: answers.name.trim(),
        email: answers.email.trim(),
        ...(answers.company.trim() ? { company: answers.company.trim() } : {}),
        ...(answers.websiteUrl.trim() ? { websiteUrl: answers.websiteUrl.trim() } : {}),
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setIsComplete(true);
    } catch {
      setSubmitError("Noe gikk galt. Prøv igjen eller send oss en e-post på hei@preik.ai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-preik-text mb-3">Supert, {answers.name.split(" ")[0]}!</h2>
        <p className="text-preik-text-muted max-w-sm mx-auto">
          Vi har fått meldingen din og gleder oss til å ta en prat. Du hører fra oss innen 24 timer.
        </p>
        <p className="mt-6 text-sm text-preik-text-muted">
          Spørsmål i mellomtiden? Send oss en e-post på{" "}
          <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
            hei@preik.ai
          </a>
        </p>
      </div>
    );
  }

  const qs = getQualificationStep();
  const isLastStep = step === totalSteps;

  // ─── Render step content ────────────────────────────────────────────────────
  const renderStep = () => {
    // Step 1 — Industry
    if (step === 1) {
      return (
        <>
          <h2 className="text-2xl font-semibold text-preik-text mb-2">Hva slags bedrift driver du?</h2>
          <p className="text-preik-text-muted text-sm mb-6">Velg det alternativet som passer best.</p>
          <div className="space-y-3">
            {INDUSTRIES.map((opt) => (
              <TileButton
                key={opt.value}
                selected={answers.industry === opt.value}
                onClick={() => setAnswers({ ...answers, industry: opt.value })}
                label={opt.label}
              />
            ))}
          </div>
        </>
      );
    }

    // Step 2 — Use case
    if (step === 2) {
      return (
        <>
          <h2 className="text-2xl font-semibold text-preik-text mb-2">Hva vil du bruke chatboten til?</h2>
          <p className="text-preik-text-muted text-sm mb-6">Velg det som beskriver behovet ditt best.</p>
          <div className="space-y-3">
            {USE_CASES.map((opt) => (
              <TileButton
                key={opt.value}
                selected={answers.useCase === opt.value}
                onClick={() =>
                  setAnswers({
                    ...answers,
                    useCase: opt.value,
                    // Reset customChallenge if switching away from custom
                    customChallenge: opt.value !== "custom" ? "" : answers.customChallenge,
                  })
                }
                label={opt.label}
                sublabel={opt.sublabel}
              />
            ))}
          </div>
        </>
      );
    }

    // Step 3 (conditional) — Custom challenge
    if (qs === "customChallenge") {
      return (
        <>
          <h2 className="text-2xl font-semibold text-preik-text mb-2">Beskriv utfordringen din</h2>
          <p className="text-preik-text-muted text-sm mb-6">
            Beskriv med noen setninger hva du ønsker å oppnå.
          </p>
          <textarea
            rows={5}
            value={answers.customChallenge}
            onChange={(e) => setAnswers({ ...answers, customChallenge: e.target.value })}
            placeholder="F.eks. «Vi får mange spørsmål om leveringstider som tar tid å svare på. Hadde vært gull å automatisere det...»"
            className="w-full px-4 py-3 bg-preik-surface border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all resize-none"
          />
        </>
      );
    }

    // Business size
    if (qs === "businessSize") {
      return (
        <>
          <h2 className="text-2xl font-semibold text-preik-text mb-2">Hvor stor er bedriften?</h2>
          <p className="text-preik-text-muted text-sm mb-6">Velg det alternativet som passer best.</p>
          <div className="space-y-3">
            {BUSINESS_SIZES.map((opt) => (
              <TileButton
                key={opt.value}
                selected={answers.businessSize === opt.value}
                onClick={() => setAnswers({ ...answers, businessSize: opt.value })}
                label={opt.label}
              />
            ))}
          </div>
        </>
      );
    }

    // Traffic
    if (qs === "trafficRange") {
      return (
        <>
          <h2 className="text-2xl font-semibold text-preik-text mb-2">Hvor mye trafikk har nettsiden din?</h2>
          <p className="text-preik-text-muted text-sm mb-6">Omtrentlig antall er mer enn godt nok.</p>
          <div className="space-y-3">
            {TRAFFIC_RANGES.map((opt) => (
              <TileButton
                key={opt.value}
                selected={answers.trafficRange === opt.value}
                onClick={() => setAnswers({ ...answers, trafficRange: opt.value })}
                label={opt.label}
                sublabel={opt.sublabel}
              />
            ))}
          </div>
        </>
      );
    }

    // Contact info
    if (qs === "contact") {
      return (
        <>
          <h2 className="text-2xl font-semibold text-preik-text mb-2">Kontaktinformasjon</h2>
          <p className="text-preik-text-muted text-sm mb-6">
            Fyll inn kontaktinformasjonen din, så tar vi kontakt innen 24 timer.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="onb-name" className="block text-sm font-medium text-preik-text mb-1.5">
                Navn <span className="text-red-400">*</span>
              </label>
              <input
                id="onb-name"
                type="text"
                required
                autoComplete="name"
                value={answers.name}
                onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                placeholder="Ditt fulle navn"
                className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="onb-email" className="block text-sm font-medium text-preik-text mb-1.5">
                E-post <span className="text-red-400">*</span>
              </label>
              <input
                id="onb-email"
                type="email"
                required
                autoComplete="email"
                value={answers.email}
                onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                placeholder="din@epost.no"
                className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="onb-company" className="block text-sm font-medium text-preik-text mb-1.5">
                Bedriftsnavn{" "}
                <span className="text-preik-text-muted font-normal text-xs">(valgfritt)</span>
              </label>
              <input
                id="onb-company"
                type="text"
                autoComplete="organization"
                value={answers.company}
                onChange={(e) => setAnswers({ ...answers, company: e.target.value })}
                placeholder="Bedriftens navn"
                className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="onb-url" className="block text-sm font-medium text-preik-text mb-1.5">
                Nettside{" "}
                <span className="text-preik-text-muted font-normal text-xs">(valgfritt)</span>
              </label>
              <input
                id="onb-url"
                type="url"
                autoComplete="url"
                value={answers.websiteUrl}
                onChange={(e) => setAnswers({ ...answers, websiteUrl: e.target.value })}
                placeholder="https://dinbedrift.no"
                className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
              />
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div ref={topRef} className="w-full max-w-lg mx-auto">
      <ProgressBar step={step} total={totalSteps} />

      <div className="mb-2">
        {renderStep()}
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-red-500">{submitError}</p>
      )}

      {isLastStep && (
        <p className="mt-6 text-xs text-preik-text-muted">
          Ved å sende inn godtar du at vi lagrer og behandler informasjonen din i henhold til vår{" "}
          <a href="/personvern" className="underline hover:text-preik-text transition-colors">
            personvernpolicy
          </a>
          .
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 text-sm font-medium text-preik-text-muted border border-preik-border rounded-full hover:border-preik-text-muted hover:text-preik-text transition-all focus:outline-none focus:ring-2 focus:ring-preik-border focus:ring-offset-2 focus:ring-offset-preik-bg"
          >
            Tilbake
          </button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canAdvance() || isSubmitting}
            className="flex-1 sm:flex-none px-8 py-3 text-sm font-semibold bg-preik-accent text-white rounded-full hover:bg-preik-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-bg"
          >
            {isSubmitting ? "Sender..." : "Send inn"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance()}
            className="flex-1 sm:flex-none px-8 py-3 text-sm font-semibold bg-preik-accent text-white rounded-full hover:bg-preik-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-preik-accent focus:ring-offset-2 focus:ring-offset-preik-bg"
          >
            Neste
          </button>
        )}
      </div>
    </div>
  );
}
