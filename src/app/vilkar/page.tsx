import Link from "next/link";

export const metadata = {
  title: "Vilkår for bruk – Preik",
  description: "Les vilkårene for bruk av Preik sine tjenester.",
};

export default function TermsPage() {
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
          Vilkår for bruk
        </h1>

        <div className="prose prose-preik text-preik-text-muted space-y-6">
          <p className="text-lg">
            Sist oppdatert: {new Date().toLocaleDateString("no-NO", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">1. Aksept av vilkår</h2>
            <p>
              Ved å bruke Preik sine tjenester aksepterer du disse vilkårene. Hvis du ikke aksepterer
              vilkårene, må du ikke bruke tjenesten.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">2. Tjenestebeskrivelse</h2>
            <p>
              Preik tilbyr AI-baserte chatbot-løsninger som kan integreres på kundens nettsider.
              Tjenesten inkluderer opplæring av AI-modeller på kundens innhold, hosting av
              chat-widget, og tilgang til et administrasjonspanel.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">3. Brukerens ansvar</h2>
            <p>Som bruker av tjenesten er du ansvarlig for:</p>
            <p>
              • At innholdet AI-en trenes på ikke bryter lover eller tredjeparters rettigheter<br />
              • Å holde påloggingsinformasjon konfidensiell<br />
              • At bruken av tjenesten er i samsvar med gjeldende lover<br />
              • Å informere dine sluttbrukere om at de kommuniserer med en AI
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">4. Preiks ansvar</h2>
            <p>
              Vi forplikter oss til å levere en stabil og sikker tjeneste. Vi garanterer ikke at
              AI-assistenten alltid vil gi korrekte svar, og kunden er selv ansvarlig for å
              verifisere informasjonen som gis til sluttbrukere.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">5. Betaling</h2>
            <p>
              Priser og betalingsvilkår avtales separat for hver kunde. Fakturaer forfaller til
              betaling innen 14 dager med mindre annet er avtalt. Ved forsinket betaling kan
              tilgang til tjenesten bli suspendert.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">6. Immaterielle rettigheter</h2>
            <p>
              Preik beholder alle rettigheter til programvaren og teknologien bak tjenesten.
              Kunden beholder alle rettigheter til eget innhold som lastes opp til tjenesten.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">7. Ansvarsbegrensning</h2>
            <p>
              Preik er ikke ansvarlig for indirekte tap, følgeskader, eller tap som skyldes
              feil i AI-genererte svar. Vårt totale ansvar er begrenset til beløpet kunden
              har betalt for tjenesten de siste 12 måneder.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">8. Oppsigelse</h2>
            <p>
              Begge parter kan si opp avtalen med 30 dagers skriftlig varsel. Ved oppsigelse
              vil kundens data bli slettet innen 30 dager, med mindre kunden ber om eksport
              av data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">9. Endringer i vilkårene</h2>
            <p>
              Vi kan endre disse vilkårene med 30 dagers varsel. Fortsatt bruk av tjenesten
              etter endringene trer i kraft, anses som aksept av de nye vilkårene.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">10. Lovvalg og tvister</h2>
            <p>
              Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal søkes løst
              gjennom forhandlinger. Hvis dette ikke fører frem, skal tvisten avgjøres ved
              de alminnelige domstoler med Oslo tingrett som verneting.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-preik-text">11. Kontakt</h2>
            <p>
              For spørsmål om disse vilkårene, kontakt oss på{" "}
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
