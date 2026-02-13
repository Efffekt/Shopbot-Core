import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informasjonskapsler – Preik",
  description: "Les om hvordan Preik bruker informasjonskapsler (cookies).",
  openGraph: {
    title: "Informasjonskapsler – Preik",
    description: "Les om hvordan Preik bruker informasjonskapsler (cookies).",
    url: "https://preik.no/cookies",
  },
  alternates: { canonical: "https://preik.no/cookies" },
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
            Sist oppdatert: 13. februar 2026
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
              Preik bruker kun <strong className="text-preik-text">strengt nødvendige informasjonskapsler</strong>.
              Vi bruker ingen sporings-, analyse- eller markedsføringscookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Oversikt</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-preik-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-preik-surface">
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Navn</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Formål</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Type</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Varighet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-mono text-xs">sb-*-auth-token</td>
                    <td className="px-4 py-3 border-b border-preik-border">Autentisering av innloggede brukere i dashbordet</td>
                    <td className="px-4 py-3 border-b border-preik-border">Nødvendig</td>
                    <td className="px-4 py-3 border-b border-preik-border">Sesjon</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">sb-*-auth-token.0, .1</td>
                    <td className="px-4 py-3">Deler av autentiseringstoken (chunked for store tokens)</td>
                    <td className="px-4 py-3">Nødvendig</td>
                    <td className="px-4 py-3">Sesjon</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Disse informasjonskapslene settes kun når du logger inn i dashbordet.
              Vanlige besøkende på nettsiden og sluttbrukere av chat-widgeten får
              ingen informasjonskapsler.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Chat-widgeten</h2>
            <p>
              Preiks chat-widget som installeres på kundenes nettsider bruker ikke
              informasjonskapsler. Samtale-sesjoner håndteres via sesjons-ID i
              forespørselen, ikke via cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Tredjepartscookies</h2>
            <p>
              Vi bruker ingen tredjepartscookies. Vi har ingen sporings- eller
              analyseverktøy (som Google Analytics) på nettsiden vår.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Trenger vi cookie-samtykke?</h2>
            <p>
              Siden vi kun bruker strengt nødvendige informasjonskapsler for autentisering,
              er det ikke påkrevd med samtykke etter GDPR og ePrivacy-direktivet. Nødvendige
              cookies som kreves for at tjenesten skal fungere er unntatt fra samtykkekravet.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">Kontakt</h2>
            <p>
              Har du spørsmål om vår bruk av informasjonskapsler? Kontakt oss på{" "}
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
