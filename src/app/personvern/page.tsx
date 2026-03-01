import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personvernerklæring – Preik",
  description: "Les om hvordan Preik behandler dine personopplysninger.",
  openGraph: {
    title: "Personvernerklæring – Preik",
    description: "Les om hvordan Preik behandler dine personopplysninger.",
    url: "https://preik.ai/personvern",
  },
  alternates: { canonical: "https://preik.ai/personvern" },
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
            Sist oppdatert: 1. mars 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">1. Hvem er vi?</h2>
            <p>
              Preik er en norsk leverandør av AI-baserte chatbot-løsninger for bedrifter.
              Vi er behandlingsansvarlig for personopplysninger som samles inn gjennom
              preik.ai og våre tjenester.
            </p>
            <p>
              Kontakt: <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">hei@preik.ai</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">2. Hvilke opplysninger samler vi inn?</h2>
            <p>Vi samler inn følgende kategorier av personopplysninger:</p>
            <p>
              <strong className="text-preik-text">Kontaktinformasjon:</strong> Navn, e-postadresse og eventuelt
              telefonnummer når du kontakter oss eller oppretter en konto.
            </p>
            <p>
              <strong className="text-preik-text">Chat-samtaler:</strong> Meldinger sendt til og fra
              AI-assistenten lagres på våre servere for å levere tjenesten og forbedre kvaliteten.
              Samtaler knyttes til en anonym sesjons-ID, ikke til din identitet.
            </p>
            <p>
              <strong className="text-preik-text">Teknisk informasjon:</strong> IP-adresse, nettlesertype
              og enhetsinformasjon for å sikre tjenestens funksjonalitet og sikkerhet.
            </p>
            <p>
              <strong className="text-preik-text">Annonsemåling:</strong> Vi bruker Google Ads
              konverteringssporing via Google Tag Manager for å måle effekten av annonsekampanjer
              på preik.ai. Se vår{" "}
              <Link href="/cookies" className="text-preik-accent hover:underline">
                cookiepolicy
              </Link>{" "}
              for detaljer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">3. Hvorfor behandler vi dine opplysninger?</h2>
            <p>Vi behandler personopplysninger for å:</p>
            <p>
              • Levere og forbedre våre AI-chatbot-tjenester<br />
              • Kommunisere med deg om din konto og våre tjenester<br />
              • Analysere bruksmønstre for å forbedre produktet<br />
              • Måle effekten av markedsføringskampanjer<br />
              • Overholde juridiske forpliktelser
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">4. Rettslig grunnlag</h2>
            <p>
              <strong className="text-preik-text">Avtale (GDPR art. 6(1)(b)):</strong> For å levere
              chatbot-tjenesten til våre kunder og behandle kontakthenvendelser.
            </p>
            <p>
              <strong className="text-preik-text">Berettiget interesse (GDPR art. 6(1)(f)):</strong> For
              produktforbedring, sikkerhet, og behandling av chat-samtaler fra sluttbrukere.
              Vår vurdering er at tjenestens funksjon (å gi sluttbrukere raske svar) veier
              tyngre enn personvernulempene, ettersom samtaler er anonyme og innholdet er begrenset
              til kundestøtte.
            </p>
            <p>
              <strong className="text-preik-text">Samtykke (GDPR art. 6(1)(a)):</strong> For
              markedsføringscookies fra Google Ads.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">5. Underleverandører og deling</h2>
            <p>
              Vi deler personopplysninger med følgende underleverandører som er nødvendige
              for å levere tjenesten:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-preik-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-preik-surface">
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Leverandør</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Formål</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Data</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Lokasjon</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">OpenAI</td>
                    <td className="px-4 py-3 border-b border-preik-border">AI-modell for generering av svar (GPT-4o-mini)</td>
                    <td className="px-4 py-3 border-b border-preik-border">Chat-meldinger</td>
                    <td className="px-4 py-3 border-b border-preik-border">USA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Google Cloud (Vertex AI)</td>
                    <td className="px-4 py-3 border-b border-preik-border">Reserve AI-modell (Gemini Flash)</td>
                    <td className="px-4 py-3 border-b border-preik-border">Chat-meldinger</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Supabase</td>
                    <td className="px-4 py-3 border-b border-preik-border">Database og autentisering</td>
                    <td className="px-4 py-3 border-b border-preik-border">Alle lagrede data</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU (Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Vercel</td>
                    <td className="px-4 py-3 border-b border-preik-border">Hosting og serverløs kjøring</td>
                    <td className="px-4 py-3 border-b border-preik-border">Forespørselsdata</td>
                    <td className="px-4 py-3 border-b border-preik-border">Global (edge)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-preik-text">Google Ads</td>
                    <td className="px-4 py-3">Konverteringssporing for annonsering</td>
                    <td className="px-4 py-3">Cookies, sidevisninger</td>
                    <td className="px-4 py-3">USA/EU</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Alle underleverandører er bundet av databehandleravtaler (DPA) som sikrer dine
              rettigheter. For overføring til USA brukes EU-godkjente mekanismer
              (EU-US Data Privacy Framework og/eller standardkontrakter).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">6. Lagring og sletting</h2>
            <p>Vi oppbevarer personopplysninger i følgende perioder:</p>
            <p>
              • <strong className="text-preik-text">Chat-samtaler:</strong> Slettes automatisk etter 90 dager<br />
              • <strong className="text-preik-text">Kontakthenvendelser:</strong> Slettes automatisk etter 180 dager<br />
              • <strong className="text-preik-text">Kontoinformasjon:</strong> Lagres så lenge kontoen er aktiv, slettes ved oppsigelse<br />
              • <strong className="text-preik-text">Brukslogger:</strong> Anonymisert statistikk beholdes, identifiserbar data slettes etter 365 dager
            </p>
            <p>
              Vi bruker bransjestandard sikkerhetstiltak for å beskytte dine opplysninger,
              inkludert kryptering i transit (TLS) og i ro, tilgangskontroll med rollebasert
              tilgang, og regelmessig sikkerhetsgjennomgang.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">7. Dine rettigheter</h2>
            <p>
              Etter GDPR har du følgende rettigheter:
            </p>
            <p>
              • <strong className="text-preik-text">Innsyn:</strong> Du kan be om å se hvilke opplysninger vi har om deg<br />
              • <strong className="text-preik-text">Retting:</strong> Du kan be om at feilaktige opplysninger rettes<br />
              • <strong className="text-preik-text">Sletting:</strong> Du kan be om at dine opplysninger slettes<br />
              • <strong className="text-preik-text">Dataportabilitet:</strong> Du kan be om å motta dine data i et maskinlesbart format<br />
              • <strong className="text-preik-text">Protest:</strong> Du kan protestere mot behandling basert på berettiget interesse<br />
              • <strong className="text-preik-text">Tilbaketrekking av samtykke:</strong> Du kan trekke tilbake samtykke når som helst
            </p>
            <p>
              Kontakt oss på{" "}
              <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
                hei@preik.ai
              </a>{" "}
              for å utøve dine rettigheter. Vi svarer innen 30 dager.
            </p>
            <p>
              Du har også rett til å klage til Datatilsynet ({" "}
              <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="text-preik-accent hover:underline">
                datatilsynet.no
              </a>
              ) dersom du mener at vi behandler dine personopplysninger i strid med regelverket.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">8. Kontakt</h2>
            <p>
              Har du spørsmål om vår behandling av personopplysninger? Kontakt oss på{" "}
              <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
                hei@preik.ai
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
