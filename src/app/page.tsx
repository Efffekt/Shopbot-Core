import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DemoSection } from "@/components/DemoSection";
import { ProcessSection } from "@/components/ProcessSection";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

import { cookies } from "next/headers";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Preik",
  url: "https://preik.ai",
  description: "Skreddersydde AI-assistenter for norske bedrifter. Ikke mer leting. Bare gode svar.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hei@preik.ai",
    contactType: "customer service",
    availableLanguage: ["Norwegian", "English"],
  },
  sameAs: [],
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Preik AI-chatbot",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Skreddersydd AI-chatbot trent på dine egne data. 24/7 kundeservice som svarer på sekunder, på norsk.",
  offers: {
    "@type": "Offer",
    priceCurrency: "NOK",
    availability: "https://schema.org/InStock",
  },
  provider: {
    "@type": "Organization",
    name: "Preik",
    url: "https://preik.ai",
  },
  featureList: [
    "AI trent på dine egne data",
    "Norsk språkstøtte",
    "24/7 automatisk kundeservice",
    "Enkel integrasjon via script-tag",
    "GDPR-compliant",
    "Tilpasset merkevare og tone",
  ],
  inLanguage: "nb",
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Hvor lang tid tar det å sette opp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "De fleste kunder er oppe og kjører innen 24-48 timer. Vi crawler nettsiden din, trener AI-en, og gir deg en kode-snippet du legger inn på siden din.",
      },
    },
    {
      "@type": "Question",
      name: "Fungerer det på norsk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja! Preik er bygget for norske bedrifter. AI-en forstår og svarer på norsk, og tilpasses din tone og merkevare.",
      },
    },
    {
      "@type": "Question",
      name: "Hva skjer når innholdet på nettsiden endres?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vi kjører en månedlig oppdatering basert på innholdsendringer på nettsiden din. Trenger du å legge til noe kritisk mellom oppdateringene? Ta kontakt, så ordner vi det raskt.",
      },
    },
    {
      "@type": "Question",
      name: "Er dataene mine trygge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Vi er GDPR-compliant og lagrer kun data som er nødvendig for å gi gode svar. Data behandles av godkjente underleverandører (Google Cloud, OpenAI) under strenge databehandleravtaler.",
      },
    },
    {
      "@type": "Question",
      name: "Kan jeg tilpasse utseendet på chatten?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutt. Farger, logo og tone tilpasses din merkevare så det ser ut som en naturlig del av nettsiden din.",
      },
    },
  ],
};

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.includes("auth-token"));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Header isLoggedIn={hasSession} />
      <main id="main-content">
        <HeroSection />
        <ProcessSection />
        <DemoSection />
        <PricingSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
