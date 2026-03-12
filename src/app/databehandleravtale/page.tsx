import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Databehandleravtale (DPA) – Preik",
  description: "Databehandleravtale mellom Preik og kunder i henhold til GDPR art. 28.",
  openGraph: {
    title: "Databehandleravtale (DPA) – Preik",
    description: "Databehandleravtale mellom Preik og kunder i henhold til GDPR art. 28.",
    url: "https://preik.ai/databehandleravtale",
  },
  alternates: { canonical: "https://preik.ai/databehandleravtale" },
};

export default function DPAPage() {
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
          Databehandleravtale
        </h1>

        <div className="prose prose-preik text-preik-text-muted space-y-6">
          <p className="text-lg">
            Sist oppdatert: 12. mars 2026
          </p>

          <p>
            Denne databehandleravtalen (&quot;Avtalen&quot;) regulerer behandling av personopplysninger
            mellom kunden (&quot;Behandlingsansvarlig&quot;) og Preik (&quot;Databehandler&quot;) i henhold til
            GDPR art. 28. Avtalen utgjør en integrert del av{" "}
            <Link href="/vilkar" className="text-preik-accent hover:underline">
              vilkårene for bruk
            </Link>.
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">1. Formål og omfang</h2>
            <p>
              Databehandler behandler personopplysninger utelukkende for å levere
              AI-chatbot-tjenesten til Behandlingsansvarlig, herunder:
            </p>
            <p>
              &bull; Mottak og prosessering av chat-meldinger fra sluttbrukere<br />
              &bull; Generering av AI-svar basert på Behandlingsansvarligs innhold<br />
              &bull; Lagring av samtalehistorikk for tjenesteleveranse<br />
              &bull; Analytisk innsikt i samtalemønstre (anonymisert)
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">2. Kategorier av personopplysninger</h2>
            <p>Følgende personopplysninger behandles:</p>
            <p>
              &bull; <strong className="text-preik-text">Chat-meldinger:</strong> Tekstinnhold sendt av sluttbrukere<br />
              &bull; <strong className="text-preik-text">Sesjons-ID:</strong> Anonymisert identifikator for samtaleflyt<br />
              &bull; <strong className="text-preik-text">Teknisk data:</strong> IP-adresse og brukeragent (for sikkerhet og hastighetsbegrensning)<br />
              &bull; <strong className="text-preik-text">Tidsstempler:</strong> Tidspunkt for meldinger
            </p>
            <p>
              <strong className="text-preik-text">Kategorier av registrerte:</strong> Sluttbrukere som
              benytter chat-widgeten på Behandlingsansvarligs nettside.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">3. Databehandlers plikter</h2>
            <p>Databehandler forplikter seg til å:</p>
            <p>
              &bull; Kun behandle personopplysninger etter dokumentert instruks fra Behandlingsansvarlig (GDPR art. 28(3)(a))<br />
              &bull; Sikre at personer med tilgang til personopplysningene er underlagt taushetsplikt (art. 28(3)(b))<br />
              &bull; Iverksette nødvendige tekniske og organisatoriske sikkerhetstiltak (art. 28(3)(c), art. 32)<br />
              &bull; Ikke benytte underleverandører uten forhåndsgodkjenning fra Behandlingsansvarlig (art. 28(2))<br />
              &bull; Bistå Behandlingsansvarlig med å oppfylle registrertes rettigheter (art. 28(3)(e))<br />
              &bull; Bistå med etterlevelse av art. 32-36 (sikkerhet, konsekvensanalyse, forhåndsdrøfting) (art. 28(3)(f))<br />
              &bull; Slette eller returnere alle personopplysninger ved opphør av avtalen (art. 28(3)(g))<br />
              &bull; Gi Behandlingsansvarlig tilgang til nødvendig informasjon for å påvise etterlevelse (art. 28(3)(h))
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">4. Sikkerhetstiltak</h2>
            <p>Databehandler har implementert følgende sikkerhetstiltak:</p>
            <p>
              &bull; <strong className="text-preik-text">Kryptering:</strong> TLS 1.2+ for all data i transit, AES-256 for data i ro<br />
              &bull; <strong className="text-preik-text">Tilgangskontroll:</strong> Rollebasert tilgang med Row-Level Security (RLS) i databasen<br />
              &bull; <strong className="text-preik-text">Autentisering:</strong> Sikker sesjonshåndtering med Supabase Auth<br />
              &bull; <strong className="text-preik-text">Hastighetsbegrensning:</strong> Beskyttelse mot misbruk på alle endepunkter<br />
              &bull; <strong className="text-preik-text">Revisjonslogg:</strong> Logging av alle administrative handlinger<br />
              &bull; <strong className="text-preik-text">SSRF-beskyttelse:</strong> Validering av alle eksterne URL-er<br />
              &bull; <strong className="text-preik-text">Sikkerhetshoder:</strong> CSP, HSTS, X-Frame-Options på alle svar
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">5. Underleverandører</h2>
            <p>
              Behandlingsansvarlig godkjenner herved bruk av følgende underleverandører.
              Databehandler skal varsle Behandlingsansvarlig minst 30 dager før endringer
              i underleverandører.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-preik-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-preik-surface">
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Leverandør</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Formål</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Lokasjon</th>
                    <th className="text-left px-4 py-3 text-preik-text font-medium border-b border-preik-border">Overføringsmekanisme</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">OpenAI</td>
                    <td className="px-4 py-3 border-b border-preik-border">AI-modell (GPT-4o-mini)</td>
                    <td className="px-4 py-3 border-b border-preik-border">USA</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU-US DPF + SCCs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Google Cloud (Vertex AI)</td>
                    <td className="px-4 py-3 border-b border-preik-border">Reserve AI-modell (Gemini)</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU-basert</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Supabase</td>
                    <td className="px-4 py-3 border-b border-preik-border">Database og autentisering</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU (Frankfurt)</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU-basert</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Vercel</td>
                    <td className="px-4 py-3 border-b border-preik-border">Hosting og serverløs kjøring</td>
                    <td className="px-4 py-3 border-b border-preik-border">Global (edge)</td>
                    <td className="px-4 py-3 border-b border-preik-border">SCCs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Resend</td>
                    <td className="px-4 py-3 border-b border-preik-border">E-postutsending</td>
                    <td className="px-4 py-3 border-b border-preik-border">USA</td>
                    <td className="px-4 py-3 border-b border-preik-border">SCCs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-preik-border font-medium text-preik-text">Upstash</td>
                    <td className="px-4 py-3 border-b border-preik-border">Hastighetsbegrensning</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU (Frankfurt)</td>
                    <td className="px-4 py-3 border-b border-preik-border">EU-basert</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-preik-text">Firecrawl</td>
                    <td className="px-4 py-3">Nettskraping for innholdsimport</td>
                    <td className="px-4 py-3">USA</td>
                    <td className="px-4 py-3">SCCs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">6. Lagringstid og sletting</h2>
            <p>Personopplysninger slettes automatisk etter følgende perioder:</p>
            <p>
              &bull; <strong className="text-preik-text">Chat-samtaler:</strong> 90 dager<br />
              &bull; <strong className="text-preik-text">Kontakthenvendelser:</strong> 180 dager<br />
              &bull; <strong className="text-preik-text">Kredittlogg:</strong> 365 dager
            </p>
            <p>
              Ved opphør av avtalen slettes alle personopplysninger innen 30 dager, med mindre
              Behandlingsansvarlig ber om eksport av data. Sletting bekreftes skriftlig på forespørsel.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">7. Bistand ved registrertes rettigheter</h2>
            <p>
              Databehandler bistår Behandlingsansvarlig med å oppfylle forespørsler fra
              registrerte om innsyn, retting, sletting, dataportabilitet, begrensning og protest.
            </p>
            <p>
              Henvendelser fra registrerte som mottas direkte av Databehandler videresendes
              til Behandlingsansvarlig uten ugrunnet opphold.
            </p>
            <p>
              Behandlingsansvarlig kan slette samtaler via administrasjonspanelet eller ved å
              kontakte <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">hei@preik.ai</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">8. Sikkerhetsbrudd</h2>
            <p>
              Ved brudd på personopplysningssikkerheten skal Databehandler varsle
              Behandlingsansvarlig uten ugrunnet opphold, og senest innen 48 timer
              etter at bruddet ble oppdaget (GDPR art. 33).
            </p>
            <p>Varselet skal inneholde:</p>
            <p>
              &bull; Beskrivelse av bruddet og hvilke data som er berørt<br />
              &bull; Antall registrerte og dataposter som er berørt<br />
              &bull; Kontaktinformasjon for ansvarlig hos Databehandler<br />
              &bull; Sannsynlige konsekvenser av bruddet<br />
              &bull; Tiltak som er iverksatt eller planlagt for å håndtere bruddet
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">9. Overføring til tredjeland</h2>
            <p>
              Overføring av personopplysninger til land utenfor EU/EØS skjer kun til underleverandører
              oppført i punkt 5, og er beskyttet gjennom:
            </p>
            <p>
              &bull; EU-US Data Privacy Framework (DPF) for sertifiserte selskaper<br />
              &bull; EUs standardkontraktsklausuler (SCCs) der DPF ikke gjelder<br />
              &bull; Tilleggsgarantier (TIA) der påkrevd etter Schrems II
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">10. Varighet og opphør</h2>
            <p>
              Denne avtalen gjelder så lenge Databehandler behandler personopplysninger
              på vegne av Behandlingsansvarlig. Ved opphør gjelder punkt 6 om sletting.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">11. Kontakt</h2>
            <p>
              For spørsmål om denne avtalen, kontakt oss på{" "}
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
            &larr; Tilbake til forsiden
          </Link>
        </div>
      </main>
    </div>
  );
}
