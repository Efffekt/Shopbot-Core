import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PricingSection } from "@/components/PricingSection";
import { FinalCTASection } from "@/components/FinalCTASection";
import { Footer } from "@/components/Footer";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Priser",
  description: "Enkle og transparente priser for Preik AI-chatbot. Fra 299 kr/mnd. Ingen bindingstid.",
  alternates: { canonical: "https://preik.ai/priser" },
  openGraph: {
    title: "Priser | Preik",
    description: "Enkle og transparente priser for Preik AI-chatbot. Fra 299 kr/mnd. Ingen bindingstid.",
    url: "https://preik.ai/priser",
  },
};

export default async function PriserPage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.includes("auth-token"));

  return (
    <>
      <Header isLoggedIn={hasSession} />
      <main id="main-content" className="pt-20">
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}
