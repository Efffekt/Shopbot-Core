"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutProvider,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const startFeatures = [
  "Skreddersydd widget i din merkevare",
  "Opplæring på innholdet ditt",
  "Nettside-skraping av opptil 500 sider",
  "Avansert innsikt og statistikk",
  "Flerspråklig støtte (norsk + engelsk)",
  "Norsk support",
  "GDPR-compliant",
];

const vekstFeatures = [
  { text: "Alt i Start", bold: true },
  { text: "5x meldingsvolum", bold: false },
  { text: "Nettside-skraping av opptil 1500 sider", bold: false },
  { text: "Prioritert support", bold: false },
];

const proffFeatures = [
  { text: "Alt i Vekst", bold: true },
  { text: "Tilpasset meldingsvolum", bold: false },
  { text: "Nettside-skraping og opplæring tilpasset behov", bold: false },
  { text: "Tilpasset antall sider og kilder", bold: false },
  { text: "Dedikert kontaktperson", bold: false },
];

// Stripe appearance matching preik theme — light with dark text
const stripeAppearance = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "#2D6A4F",
    colorBackground: "#FFFFFF",
    colorText: "#0B1F17",
    colorTextSecondary: "#405249",
    colorTextPlaceholder: "#7A8F84",
    colorDanger: "#ef4444",
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    borderRadius: "12px",
    spacingUnit: "4px",
    fontSizeBase: "15px",
  },
  rules: {
    ".Input": {
      border: "1px solid #D1DBD6",
      boxShadow: "none",
      padding: "12px 16px",
      backgroundColor: "#FFFFFF",
      color: "#0B1F17",
    },
    ".Input:focus": {
      border: "1px solid #2D6A4F",
      boxShadow: "0 0 0 2px rgba(45, 106, 79, 0.2)",
    },
    ".Label": {
      fontSize: "14px",
      fontWeight: "500",
      color: "#0B1F17",
      marginBottom: "8px",
    },
    ".Tab": {
      border: "1px solid #D1DBD6",
      boxShadow: "none",
      backgroundColor: "#FFFFFF",
      color: "#0B1F17",
    },
    ".Tab:hover": {
      backgroundColor: "#F5F8F6",
    },
    ".Tab--selected": {
      border: "1px solid #2D6A4F",
      backgroundColor: "#F5F8F6",
      color: "#0B1F17",
    },
    ".Tab--selected:hover": {
      backgroundColor: "#F5F8F6",
      color: "#0B1F17",
    },
    ".TabIcon--selected": {
      color: "#0B1F17",
      fill: "#0B1F17",
    },
    ".TabLabel--selected": {
      color: "#0B1F17",
    },
  },
};

interface PricingCardsProps {
  userEmail?: string;
  initialPlan?: string;
  initialCompanyName?: string;
}

function PaymentForm({ onBack }: { onBack: () => void }) {
  const checkoutResult = useCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = checkoutResult.type === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkoutResult.type !== "success") return;

    setLoading(true);
    setError(null);

    const result = await checkoutResult.checkout.confirm();

    // Only reaches here if there's an error (otherwise redirects)
    if (result.type === "error") {
      setError(result.error.message || "Betalingen feilet. Prøv igjen.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm text-preik-text-muted hover:text-preik-text transition-colors"
      >
        &larr; Tilbake til planoversikt
      </button>
      <div className="max-w-md mx-auto">
        <div className="bg-preik-surface rounded-3xl border border-preik-border p-8">
          <h3 className="text-lg font-semibold text-preik-text mb-6">Betalingsinformasjon</h3>
          <form onSubmit={handleSubmit}>
            <PaymentElement
              options={{
                layout: "tabs",
              }}
            />

            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={!isReady || loading}
              className="mt-6 w-full py-3.5 px-6 rounded-xl bg-preik-accent text-white font-semibold hover:bg-preik-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Behandler..." : "Betal og start"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PricingCards({ userEmail, initialPlan, initialCompanyName }: PricingCardsProps) {
  const router = useRouter();
  const isLoggedIn = !!userEmail;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlan || null);
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [contactMessage, setContactMessage] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const autoCheckoutAttempted = useRef(false);

  function handlePlanClick(planKey: string) {
    if (!isLoggedIn) {
      router.push(`/registrer?plan=${planKey}`);
      return;
    }
    setSelectedPlan(planKey);
  }

  // Auto-initiate Stripe checkout when user arrives with a pending plan +
  // company name stored from signup (post-login redirect flow)
  useEffect(() => {
    if (
      !autoCheckoutAttempted.current &&
      isLoggedIn &&
      initialPlan &&
      initialCompanyName &&
      (initialPlan === "starter" || initialPlan === "pro") &&
      !clientSecret
    ) {
      autoCheckoutAttempted.current = true;
      (async () => {
        setValidating(true);
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: initialPlan, companyName: initialCompanyName.trim() }),
          });
          const data = await res.json();
          if (res.ok) {
            setClientSecret(data.clientSecret);
          } else {
            setError(data.error || "Noe gikk galt");
          }
        } catch {
          setError("Kunne ikke koble til betalingstjenesten");
        } finally {
          setValidating(false);
        }
      })();
    }
  }, [isLoggedIn, initialPlan, initialCompanyName, clientSecret]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !companyName.trim()) return;

    setValidating(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, companyName: companyName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Noe gikk galt");
        return;
      }

      setClientSecret(data.clientSecret);
    } catch {
      setError("Kunne ikke koble til betalingstjenesten");
    } finally {
      setValidating(false);
    }
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setValidating(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          email: userEmail,
          company: companyName.trim(),
          message: contactMessage.trim() || `Interessert i Proff-planen for ${companyName.trim()}`,
          source: "pricing_business",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Noe gikk galt");
        return;
      }

      setContactSent(true);
    } catch {
      setError("Kunne ikke sende forespørselen");
    } finally {
      setValidating(false);
    }
  }

  // Payment Element view
  if (clientSecret && selectedPlan) {
    return (
      <CheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret,
          elementsOptions: {
            appearance: stripeAppearance,
          },
        }}
      >
        <PaymentForm onBack={() => setClientSecret(null)} />
      </CheckoutProvider>
    );
  }

  // Business contact sent confirmation
  if (contactSent) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-brand font-light text-preik-text">
            Takk for din interesse!
          </h2>
          <p className="mt-4 text-preik-text-muted">
            Vi har mottatt forespørselen din og tar kontakt innen kort tid for å starte onboarding.
          </p>
          <p className="mt-2 text-sm text-preik-text-muted">
            Du kan også nå oss direkte på{" "}
            <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
              hei@preik.ai
            </a>
          </p>
        </div>
      </div>
    );
  }

  const isStartSelected = selectedPlan === "starter";
  const isVekstSelected = selectedPlan === "pro";
  const isProffSelected = selectedPlan === "business";

  return (
    <div>
      <div className="text-center mb-16">
        <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
          Prising
        </p>
        <h2 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-6">
          Enkel og transparent
        </h2>
        <p className="text-lg text-preik-text-muted max-w-xl mx-auto">
          Velg pakken som passer din bedrift — kom raskt i gang.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Start */}
        <button
          type="button"
          onClick={() => handlePlanClick("starter")}
          className={`text-left bg-preik-bg rounded-3xl border ${
            isStartSelected ? "border-preik-accent ring-2 ring-preik-accent" : "border-preik-border"
          } p-8 relative overflow-hidden flex flex-col h-full transition-all`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-preik-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex flex-col flex-1">
            <div className="mb-6 h-7">
              <span className="inline-block px-4 py-1 rounded-full bg-preik-accent text-sm font-medium text-white">
                Anbefalt
              </span>
            </div>

            <h3 className="text-xl font-semibold text-preik-text mb-2">Start</h3>

            <div className="mb-1">
              <span className="text-sm text-preik-text-muted">Fra </span>
              <span className="text-4xl font-brand font-light text-preik-text">299</span>
              <span className="text-sm text-preik-text-muted"> kr/mnd</span>
            </div>

            <p className="text-sm font-medium text-preik-text mb-4">1 000 meldinger per måned</p>
            <p className="text-preik-text-muted text-sm mb-8">For bedrifter som vil komme raskt i gang med AI-kundeservice på egne nettsider.</p>

            <ul className="space-y-3 mb-8 flex-1">
              {startFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-preik-text text-sm">
                  <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <p className="text-xs text-preik-text-muted mb-4 text-center font-medium">
                Ingen skjulte kostnader
              </p>
              <span className={`inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all ${
                isStartSelected
                  ? "bg-preik-accent text-white"
                  : "bg-preik-accent text-white hover:bg-preik-accent-hover"
              }`}>
                {isStartSelected ? "Valgt" : "Kom i gang"}
              </span>
            </div>
          </div>
        </button>

        {/* Vekst */}
        <button
          type="button"
          onClick={() => handlePlanClick("pro")}
          className={`text-left bg-preik-bg rounded-3xl border ${
            isVekstSelected ? "border-preik-accent ring-2 ring-preik-accent" : "border-preik-border"
          } p-8 relative overflow-hidden flex flex-col h-full transition-all`}
        >
          <div className="relative flex flex-col flex-1">
            <div className="mb-6 h-7" />

            <h3 className="text-xl font-semibold text-preik-text mb-2">Vekst</h3>

            <div className="mb-1">
              <span className="text-sm text-preik-text-muted">Fra </span>
              <span className="text-4xl font-brand font-light text-preik-text">899</span>
              <span className="text-sm text-preik-text-muted"> kr/mnd</span>
            </div>

            <p className="text-sm font-medium text-preik-text mb-4">5 000 meldinger per måned</p>
            <p className="text-preik-text-muted text-sm mb-8">For bedrifter med mer trafikk, flere henvendelser og behov for høyere kapasitet.</p>

            <ul className="space-y-3 mb-8 flex-1">
              {vekstFeatures.map((feature, index) => (
                <li key={index} className={`flex items-center gap-3 text-preik-text text-sm ${feature.bold ? "font-medium" : ""}`}>
                  <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <p className="text-xs text-preik-text-muted mb-4 text-center font-medium">
                Ingen skjulte kostnader
              </p>
              <span className={`inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all border border-preik-accent ${
                isVekstSelected
                  ? "bg-preik-accent text-white"
                  : "text-preik-text hover:bg-preik-accent hover:text-white"
              }`}>
                {isVekstSelected ? "Valgt" : "Kom i gang"}
              </span>
            </div>
          </div>
        </button>

        {/* Proff */}
        <button
          type="button"
          onClick={() => handlePlanClick("business")}
          className={`text-left bg-preik-bg rounded-3xl border ${
            isProffSelected ? "border-preik-accent ring-2 ring-preik-accent" : "border-preik-border"
          } p-8 relative overflow-hidden flex flex-col h-full transition-all`}
        >
          <div className="relative flex flex-col flex-1">
            <div className="mb-6 h-7" />

            <h3 className="text-xl font-semibold text-preik-text mb-2">Proff</h3>

            <div className="mb-1">
              <span className="text-4xl font-brand font-light text-preik-text">Tilpasset</span>
              <span className="text-sm text-preik-text-muted"> pris</span>
            </div>

            <p className="text-sm font-medium text-preik-text mb-4">Volum og behov tilpasset deg</p>
            <p className="text-preik-text-muted text-sm mb-8">For bedrifter som trenger mer kapasitet, flere kilder og tettere oppfølging.</p>

            <ul className="space-y-3 mb-8 flex-1">
              {proffFeatures.map((feature, index) => (
                <li key={index} className={`flex items-center gap-3 text-preik-text text-sm ${feature.bold ? "font-medium" : ""}`}>
                  <svg className="w-4 h-4 text-preik-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <p className="text-xs text-preik-text-muted mb-4 text-center font-medium">
                Ingen skjulte kostnader
              </p>
              <span className={`inline-flex items-center justify-center w-full rounded-full px-8 py-3.5 text-sm font-semibold transition-all border border-preik-accent ${
                isProffSelected
                  ? "bg-preik-accent text-white"
                  : "text-preik-text hover:bg-preik-accent hover:text-white"
              }`}>
                {isProffSelected ? "Valgt" : "Kontakt oss for tilbud"}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Company name + checkout form for Starter/Vekst */}
      {(isStartSelected || isVekstSelected) && (
        <form onSubmit={handleContinue} className="mt-8 max-w-md mx-auto">
          <label htmlFor="companyName" className="block text-sm font-medium text-preik-text mb-2">
            Bedriftsnavn
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="F.eks. Min Bedrift AS"
            required
            minLength={2}
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border border-preik-border bg-preik-surface text-preik-text placeholder:text-preik-text-muted/50 focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={validating || !companyName.trim()}
            className="mt-4 w-full py-3 px-6 rounded-xl bg-preik-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? "Validerer..." : "Gå til betaling"}
          </button>
        </form>
      )}

      {/* Contact form for Proff */}
      {isProffSelected && (
        <form onSubmit={handleContactSubmit} className="mt-8 max-w-md mx-auto">
          <label htmlFor="companyNameBiz" className="block text-sm font-medium text-preik-text mb-2">
            Bedriftsnavn
          </label>
          <input
            id="companyNameBiz"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="F.eks. Min Bedrift AS"
            required
            minLength={2}
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border border-preik-border bg-preik-surface text-preik-text placeholder:text-preik-text-muted/50 focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent"
          />

          <label htmlFor="contactMessage" className="block text-sm font-medium text-preik-text mb-2 mt-4">
            Melding (valgfritt)
          </label>
          <textarea
            id="contactMessage"
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Fortell oss litt om behovene deres..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-xl border border-preik-border bg-preik-surface text-preik-text placeholder:text-preik-text-muted/50 focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent resize-none"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={validating || !companyName.trim()}
            className="mt-4 w-full py-3 px-6 rounded-xl bg-preik-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? "Sender..." : "Kontakt oss"}
          </button>
        </form>
      )}

      <p className="text-center text-preik-text-muted text-sm mt-10">
        Trenger du noe tilpasset?{" "}
        <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
          Vi skreddersyr en pakke for din bedrift.
        </a>
      </p>
    </div>
  );
}
