import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informasjonskapsler – Preik",
  description: "Les om hvordan Preik bruker informasjonskapsler (cookies).",
  openGraph: {
    title: "Informasjonskapsler – Preik",
    description: "Les om hvordan Preik bruker informasjonskapsler (cookies).",
    url: "https://preik.ai/cookies",
  },
  alternates: { canonical: "https://preik.ai/cookies" },
};

export default function CookiePolicyPage() {
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
          Informasjonskapsler (cookies)
        </h1>

        <div className="prose prose-preik text-preik-text-muted space-y-6">
          <p className="text-lg">
            Sist oppdatert: 1. mars 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Hva er informasjonskapsler?</h2>
            <p>
              Informasjonskapsler (cookies) er små tekstfiler som lagres på enheten din når du
              besøker en nettside. De brukes for å få nettsiden til å fungere riktig og for å
              huske innstillingene dine.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Hvilke informasjonskapsler bruker vi?</h2>
            <p>
              Preik bruker <strong className="text-preik-text">nødvendige informasjonskapsler</strong> for
              autentisering, samt <strong className="text-preik-text">markedsføringscookies</strong> fra
              Google Ads for å måle effekten av annonsekampanjer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Nødvendige informasjonskapsler</h2>
            <p>
              Disse informasjonskapslene er nødvendige for at tjenesten skal fungere og settes
              kun når du logger inn i dashbordet. De krever ikke samtykke.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-preik-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-preik-surface">
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Navn</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Formål</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Leverandør</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Varighet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-mono text-xs">sb-*-auth-token</td>
                    <td className="px-4 py-3 border-b border-preik-border">Autentisering av innloggede brukere i dashbordet</td>
                    <td className="px-4 py-3 border-b border-preik-border">Supabase</td>
                    <td className="px-4 py-3 border-b border-preik-border">Sesjon</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">sb-*-auth-token.0, .1</td>
                    <td className="px-4 py-3">Deler av autentiseringstoken (chunked for store tokens)</td>
                    <td className="px-4 py-3">Supabase</td>
                    <td className="px-4 py-3">Sesjon</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Markedsføringscookies (Google Ads)</h2>
            <p>
              Vi bruker Google Tag Manager med Google Ads-konverteringssporing for å måle
              effekten av annonsekampanjer. Dette setter følgende informasjonskapsler:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-preik-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-preik-surface">
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Navn</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Formål</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Leverandør</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Varighet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-mono text-xs">_gcl_au</td>
                    <td className="px-4 py-3 border-b border-preik-border">Google Ads konverteringssporing</td>
                    <td className="px-4 py-3 border-b border-preik-border">Google</td>
                    <td className="px-4 py-3 border-b border-preik-border">90 dager</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-mono text-xs">_gac_*</td>
                    <td className="px-4 py-3 border-b border-preik-border">Google Ads kampanjeattribusjon</td>
                    <td className="px-4 py-3 border-b border-preik-border">Google</td>
                    <td className="px-4 py-3 border-b border-preik-border">90 dager</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">_gcl_aw</td>
                    <td className="px-4 py-3">Google Ads klikk-ID for konverteringsmåling</td>
                    <td className="px-4 py-3">Google</td>
                    <td className="px-4 py-3">90 dager</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Disse informasjonskapslene brukes til å forstå hvilke annonser som fører til besøk
              og henvendelser. Dataene behandles av Google i henhold til{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-preik-accent hover:underline">
                Googles personvernerklæring
              </a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Chat-widgeten (localStorage)</h2>
            <p>
              Preiks chat-widget som installeres på kundenes nettsider bruker ikke
              informasjonskapsler, men benytter <strong className="text-preik-text">localStorage</strong> for
              å lagre sesjons-ID og samtalehistorikk lokalt i nettleseren din. Dette gjør at
              samtalen din kan gjenopptas om du navigerer mellom sider.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-preik-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-preik-surface">
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Nøkkel</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Formål</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Varighet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-mono text-xs">preik_session_id</td>
                    <td className="px-4 py-3 border-b border-preik-border">Unik sesjons-ID for å koble samtaler</td>
                    <td className="px-4 py-3 border-b border-preik-border">Permanent (til sletting)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-mono text-xs">preik_messages_*</td>
                    <td className="px-4 py-3 border-b border-preik-border">Lokal kopi av samtalehistorikk</td>
                    <td className="px-4 py-3 border-b border-preik-border">Permanent (til sletting)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">preik_onboarding_*</td>
                    <td className="px-4 py-3">Husker om onboarding-skjermen er vist</td>
                    <td className="px-4 py-3">Permanent (til sletting)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              localStorage-data lagres kun lokalt i din nettleser og sendes ikke til
              våre servere. Du kan slette disse dataene ved å tømme nettleserens lagring
              for den aktuelle nettsiden.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Samtykke</h2>
            <p>
              Nødvendige informasjonskapsler for autentisering krever ikke samtykke etter
              GDPR og ePrivacy-direktivet, da de er nødvendige for tjenestens funksjonalitet.
            </p>
            <p>
              Markedsføringscookies fra Google Ads settes via Google Tag Manager og brukes
              til konverteringssporing. Du kan administrere dine innstillinger for Google-annonser
              via{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-preik-accent hover:underline">
                Googles annonseinnstillinger
              </a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Kontakt</h2>
            <p>
              Har du spørsmål om vår bruk av informasjonskapsler? Kontakt oss på{" "}
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
