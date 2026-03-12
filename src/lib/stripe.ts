import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export interface PlanConfig {
  name: string;
  credits: number;
  priceKr: number;
  priceId: string;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: "Starter",
    credits: 1000,
    priceKr: 299,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    features: [
      "1 000 AI-kreditter/mnd",
      "1 chatbot",
      "E-poststøtte",
    ],
  },
  pro: {
    name: "Pro",
    credits: 5000,
    priceKr: 799,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "5 000 AI-kreditter/mnd",
      "Ubegrensede chatbots",
      "Prioritert støtte",
      "Analyse-dashboard",
    ],
  },
  business: {
    name: "Business",
    credits: 20000,
    priceKr: 1999,
    priceId: "", // Contact-only — no Stripe price
    features: [
      "20 000 AI-kreditter/mnd",
      "Ubegrensede chatbots",
      "Dedikert støtte",
      "Analyse-dashboard",
      "Egendefinert persona",
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
