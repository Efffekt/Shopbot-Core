import Stripe from "stripe";

// Lazy init — won't crash at build time if key is missing
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  stripeClient = new Stripe(key, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
  return stripeClient;
}

export interface PlanConfig {
  name: string;
  credits: number;
  priceKr: number;
  priceId: string;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: "Start",
    credits: 1000,
    priceKr: 299,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    features: [
      "Skreddersydd widget i din merkevare",
      "Opplæring på innholdet ditt",
      "Nettside-skraping av opptil 500 sider",
      "Avansert innsikt og statistikk",
      "Flerspråklig støtte (norsk + engelsk)",
      "Norsk support",
      "GDPR-compliant",
    ],
  },
  pro: {
    name: "Vekst",
    credits: 5000,
    priceKr: 899,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Alt i Start",
      "5x meldingsvolum",
      "Nettside-skraping av opptil 1500 sider",
      "Prioritert support",
    ],
  },
  business: {
    name: "Proff",
    credits: 20000,
    priceKr: 0,
    priceId: "", // Contact-only — no Stripe price
    features: [
      "Alt i Vekst",
      "Tilpasset meldingsvolum",
      "Nettside-skraping og opplæring tilpasset behov",
      "Tilpasset antall sider og kilder",
      "Dedikert kontaktperson",
    ],
  },
};

export function getPlanByPriceId(priceId: string): { key: string; plan: PlanConfig } | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return { key, plan };
    }
  }
  return null;
}
