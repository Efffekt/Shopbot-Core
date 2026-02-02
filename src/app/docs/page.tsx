import Link from "next/link";

export const metadata = {
  title: "Dokumentasjon – Preik",
  description: "Lær hvordan du integrerer Preik sin AI-chatbot på din nettside.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-6 border-b border-preik-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="preik-wordmark text-2xl">
            preik
          </Link>
          <Link
            href="/login"
            className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
          >
            Logg inn
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-brand font-light text-preik-text mb-4">
          Dokumentasjon
        </h1>
        <p className="text-lg text-preik-text-muted mb-12">
          Alt du trenger for å integrere Preik på din nettside.
        </p>

        {/* Quick start */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-preik-text mb-6">
            Kom i gang
          </h2>
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
            <p className="text-preik-text-muted mb-6">
              Å legge til Preik på nettsiden din tar bare noen minutter. Du trenger kun å legge til
              en enkel script-tag i HTML-koden din.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-preik-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-preik-accent">1</span>
                </div>
                <div>
                  <p className="font-medium text-preik-text">Logg inn på dashbordet</p>
                  <p className="text-sm text-preik-text-muted mt-1">
                    Gå til <Link href="/login" className="text-preik-accent hover:underline">dashbordet</Link> og
                    logg inn med kontoen din.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-preik-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-preik-accent">2</span>
                </div>
                <div>
                  <p className="font-medium text-preik-text">Kopier embed-koden</p>
                  <p className="text-sm text-preik-text-muted mt-1">
                    Gå til &quot;Integrasjon&quot;-fanen for å finne din unike embed-kode.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-preik-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-preik-accent">3</span>
                </div>
                <div>
                  <p className="font-medium text-preik-text">Lim inn på nettsiden</p>
                  <p className="text-sm text-preik-text-muted mt-1">
                    Lim inn koden rett før <code className="bg-preik-bg px-2 py-0.5 rounded text-sm">&lt;/body&gt;</code> taggen
                    på alle sider der du vil vise chatboten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Embed code example */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-preik-text mb-6">
            Embed-kode
          </h2>
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
            <p className="text-preik-text-muted mb-6">
              Embed-koden din ser omtrent slik ut. Den faktiske koden med din unike ID finner du i dashbordet.
            </p>
            <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-preik-text-muted">
{`<script
  src="https://preik.no/widget.js"
  data-store-id="din-butikk-id"
  async
></script>`}
              </pre>
            </div>
            <p className="text-sm text-preik-text-muted mt-4">
              <strong className="text-preik-text">Merk:</strong> Bytt ut <code className="bg-preik-bg px-2 py-0.5 rounded">din-butikk-id</code> med
              din faktiske butikk-ID fra dashbordet.
            </p>
          </div>
        </section>

        {/* Customization */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-preik-text mb-6">
            Tilpasning
          </h2>
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
            <p className="text-preik-text-muted mb-6">
              Du kan tilpasse chatbotens oppførsel og personlighet via dashbordet.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-preik-text mb-2">System-prompt</h3>
                <p className="text-sm text-preik-text-muted">
                  Definer hvordan chatboten skal oppføre seg, hvilken tone den skal ha, og hva slags
                  informasjon den skal fokusere på. Dette gjøres i &quot;Prompt&quot;-fanen i dashbordet.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-preik-text mb-2">Innhold</h3>
                <p className="text-sm text-preik-text-muted">
                  Last opp dokumenter, produktinformasjon eller annet innhold som chatboten skal
                  kunne svare på. Dette gjøres i &quot;Innhold&quot;-fanen i dashbordet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform guides */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-preik-text mb-6">
            Plattform-guider
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
              <h3 className="font-medium text-preik-text mb-3">WordPress</h3>
              <p className="text-sm text-preik-text-muted mb-4">
                Bruk en plugin som &quot;Insert Headers and Footers&quot; eller legg koden direkte i
                tema-filen <code className="bg-preik-bg px-2 py-0.5 rounded">footer.php</code>.
              </p>
            </div>
            <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
              <h3 className="font-medium text-preik-text mb-3">Shopify</h3>
              <p className="text-sm text-preik-text-muted mb-4">
                Gå til Online Store → Themes → Edit code → Finn <code className="bg-preik-bg px-2 py-0.5 rounded">theme.liquid</code> og
                lim inn koden før <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code>.
              </p>
            </div>
            <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
              <h3 className="font-medium text-preik-text mb-3">Wix</h3>
              <p className="text-sm text-preik-text-muted mb-4">
                Gå til Settings → Custom Code → Add Code to Body - End.
              </p>
            </div>
            <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
              <h3 className="font-medium text-preik-text mb-3">Squarespace</h3>
              <p className="text-sm text-preik-text-muted mb-4">
                Gå til Settings → Advanced → Code Injection → Footer.
              </p>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-2xl font-semibold text-preik-text mb-6">
            Trenger du hjelp?
          </h2>
          <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-2xl p-8">
            <p className="text-preik-text mb-4">
              Sliter du med integrasjonen eller har spørsmål? Vi hjelper deg gjerne!
            </p>
            <a
              href="mailto:hei@preik.no"
              className="inline-flex items-center gap-2 text-preik-accent hover:text-preik-accent-hover font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              hei@preik.no
            </a>
          </div>
        </section>

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
