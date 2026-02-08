import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personvernerklæring – Preik",
  description: "Les om hvordan Preik behandler dine personopplysninger.",
  openGraph: {
    title: "Personvernerklæring – Preik",
    description: "Les om hvordan Preik behandler dine personopplysninger.",
    url: "https://preik.no/personvern",
  },
  alternates: { canonical: "https://preik.no/personvern" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-6 border-b border-preik-border">
        <Link href="/" className="preik-wordmark text-2xl">
          preik
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-brand font-light text-preik-text mb-8">
          Personvernerklæring
        </h1>

        <div className="prose prose-preik text-preik-text-muted space-y-6">
          <p className="text-lg">
            Sist oppdatert: 8. februar 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">1. Hvem er vi?</h2>
            <p>
              Preik er en norsk leverandør av AI-baserte chatbot-løsninger for bedrifter.
              Vi er behandlingsansvarlig for personopplysninger som samles inn gjennom våre tjenester.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">2. Hvilke opplysninger samler vi inn?</h2>
            <p>Vi samler inn følgende kategorier av personopplysninger:</p>
            <p>
              <strong className="text-preik-text">Kontaktinformasjon:</strong> Navn, e-postadresse og eventuelt telefonnummer når du kontakter oss eller oppretter en konto.
            </p>
            <p>
              <strong className="text-preik-text">Brukerdata:</strong> Informasjon om hvordan du bruker våre tjenester, inkludert chat-logger mellom sluttbrukere og AI-assistenten.
            </p>
            <p>
              <strong className="text-preik-text">Teknisk informasjon:</strong> IP-adresse, nettlesertype, og enhetsinformasjon for å sikre tjenestens funksjonalitet.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">3. Hvorfor behandler vi dine opplysninger?</h2>
            <p>Vi behandler personopplysninger for å:</p>
            <p>
              • Levere og forbedre våre AI-chatbot-tjenester<br />
              • Kommunisere med deg om din konto og våre tjenester<br />
              • Analysere bruksmønstre for å forbedre produktet<br />
              • Overholde juridiske forpliktelser
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">4. Rettslig grunnlag</h2>
            <p>
              Vår behandling av personopplysninger er basert på avtale (for å levere tjenesten),
              berettiget interesse (for produktforbedring og sikkerhet), og samtykke (for markedsføring).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">5. Deling av opplysninger</h2>
            <p>
              Vi deler ikke personopplysninger med tredjeparter, med unntak av:
            </p>
            <p>
              • Underleverandører som er nødvendige for å levere tjenesten (f.eks. hosting, AI-modeller)<br />
              • Når det er påkrevd ved lov
            </p>
            <p>
              Alle underleverandører er bundet av databehandleravtaler som sikrer dine rettigheter.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">6. Lagring og sikkerhet</h2>
            <p>
              Personopplysninger lagres så lenge det er nødvendig for formålet de ble samlet inn for,
              eller så lenge det er påkrevd ved lov. Vi bruker bransjestandard sikkerhetstiltak for å
              beskytte dine opplysninger.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">7. Dine rettigheter</h2>
            <p>
              Du har rett til innsyn, retting, sletting, og dataportabilitet. Du kan også protestere
              mot behandling og trekke tilbake samtykke. Kontakt oss på{" "}
              <a href="mailto:hei@preik.no" className="text-preik-accent hover:underline">
                hei@preik.no
              </a>{" "}
              for å utøve dine rettigheter.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">8. Kontakt</h2>
            <p>
              Har du spørsmål om vår behandling av personopplysninger? Kontakt oss på{" "}
              <a href="mailto:hei@preik.no" className="text-preik-accent hover:underline">
                hei@preik.no
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-preik-border">
          <Link
            href="/"
            className="text-preik-accent hover:text-preik-accent-hover transition-colors"
          >
            ← Tilbake til forsiden
          </Link>
        </div>
      </main>
    </div>
  );
}
