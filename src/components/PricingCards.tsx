"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Plan {
  key: string;
  name: string;
  credits: number;
  priceKr: number;
  features: string[];
  popular?: boolean;
  contactOnly?: boolean;
}

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    credits: 1000,
    priceKr: 299,
    features: [
      "1 000 AI-kreditter/mnd",
      "1 chatbot",
      "E-poststøtte",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    credits: 5000,
    priceKr: 799,
    popular: true,
    features: [
      "5 000 AI-kreditter/mnd",
      "Ubegrensede chatbots",
      "Prioritert støtte",
      "Analyse-dashboard",
    ],
  },
  {
    key: "business",
    name: "Business",
    credits: 20000,
    priceKr: 1999,
    contactOnly: true,
    features: [
      "20 000 AI-kreditter/mnd",
      "Ubegrensede chatbots",
      "Dedikert støtte",
      "Analyse-dashboard",
      "Egendefinert persona",
    ],
  },
];

interface PricingCardsProps {
  userEmail?: string;
  initialPlan?: string;
}

export default function PricingCards({ userEmail, initialPlan }: PricingCardsProps) {
  const router = useRouter();
  const isLoggedIn = !!userEmail;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlan || null);
  const [companyName, setCompanyName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const selected = PLANS.find((p) => p.key === selectedPlan);

  const fetchClientSecret = useCallback(async () => {
    if (clientSecret) return clientSecret;
    throw new Error("No client secret available");
  }, [clientSecret]);

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
          message: contactMessage.trim() || `Interessert i Business-planen for ${companyName.trim()}`,
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

  // Embedded Stripe checkout view
  if (clientSecret && selectedPlan) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setClientSecret(null)}
          className="mb-6 text-sm text-preik-text-muted hover:text-preik-text transition-colors"
        >
          &larr; Tilbake til planoversikt
        </button>
        <div className="max-w-2xl mx-auto">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
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

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-brand font-light text-preik-text">
          Kom i gang med din AI-chatbot
        </h2>
        <p className="mt-3 text-preik-text-muted">
          Velg en plan som passer for din bedrift
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.key;
          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => {
                if (!isLoggedIn && !plan.contactOnly) {
                  router.push(`/registrer?plan=${plan.key}`);
                  return;
                }
                setSelectedPlan(plan.key);
              }}
              className={`relative text-left bg-preik-surface rounded-2xl border-2 p-6 transition-colors ${
                isSelected
                  ? "border-preik-accent shadow-lg"
                  : "border-preik-border hover:border-preik-accent/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-preik-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mest populær
                </span>
              )}

              <h3 className="text-xl font-semibold text-preik-text">{plan.name}</h3>

              <div className="mt-4">
                {plan.contactOnly ? (
                  <span className="text-lg font-medium text-preik-text-muted">Ta kontakt</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-preik-text">
                      {plan.priceKr.toLocaleString("nb-NO")}
                    </span>
                    <span className="text-preik-text-muted ml-1">kr/mnd</span>
                  </>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-preik-text-muted">
                    <svg className="w-4 h-4 text-preik-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="mt-4 text-center text-sm font-medium text-preik-accent">
                  Valgt
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedPlan && !selected?.contactOnly && (
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

      {selectedPlan && selected?.contactOnly && (
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
    </div>
  );
}
