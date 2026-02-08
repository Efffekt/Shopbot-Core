import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DemoSection } from "@/components/DemoSection";
import { ProcessSection } from "@/components/ProcessSection";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Preik",
  url: "https://preik.no",
  description: "Skreddersydde AI-assistenter for norske bedrifter. Ikke mer leting. Bare gode svar.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hei@preik.no",
    contactType: "customer service",
    availableLanguage: ["Norwegian", "English"],
  },
  sameAs: [],
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
        text: "Vi oppdaterer AI-en automatisk når innholdet ditt endres. Du trenger ikke gjøre noe manuelt.",
      },
    },
    {
      "@type": "Question",
      name: "Er dataene mine trygge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Vi er GDPR-compliant og lagrer kun data som er nødvendig for å gi gode svar. Ingen data deles med tredjeparter.",
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Header />
      <main>
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
