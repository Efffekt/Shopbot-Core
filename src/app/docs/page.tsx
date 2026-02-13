"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navItems = [
  { id: "kom-i-gang", label: "Kom i gang" },
  { id: "embed-kode", label: "Embed-kode" },
  { id: "tilpasning", label: "Widget-tilpasning" },
  { id: "farger-og-tema", label: "Farger og tema" },
  { id: "fonter", label: "Fonter" },
  { id: "posisjon", label: "Posisjon og layout" },
  { id: "tekst", label: "Tekst og meldinger" },
  { id: "system-prompt", label: "System-prompt" },
  { id: "innhold", label: "Innhold og kunnskapsbase" },
  { id: "api", label: "API-referanse" },
  { id: "plattformer", label: "Plattform-guider" },
  { id: "feilsoking", label: "Feilsøking" },
  { id: "faq", label: "FAQ" },
];

const faqs = [
  {
    question: "Hvor raskt kan jeg komme i gang?",
    answer: "De fleste kunder er oppe og kjører innen 24-48 timer. Når du har fått tilgang, tar det bare noen minutter å legge til embed-koden på nettsiden din.",
  },
  {
    question: "Trenger jeg teknisk kompetanse?",
    answer: "Nei, det holder å kunne lime inn en kodesnutt på nettsiden din. Vi har guider for alle populære plattformer som WordPress, Shopify, Wix og flere.",
  },
  {
    question: "Kan jeg teste chatboten før den går live?",
    answer: "Ja! I dashbordet kan du teste chatboten i sanntid før du publiserer den på nettsiden din. Du kan også bruke demoen på forsiden vår.",
  },
  {
    question: "Hva skjer når innholdet på nettsiden endres?",
    answer: "Vi kjører en månedlig oppdatering basert på innholdsendringer på nettsiden din. Trenger du å legge til noe kritisk mellom oppdateringene? Ta kontakt, så ordner vi det raskt.",
  },
  {
    question: "Støtter widgeten flere språk?",
    answer: "Ja, chatboten forstår og svarer på norsk som standard, men kan også håndtere andre språk. Kontakt oss for flerspråklig konfigurasjon.",
  },
  {
    question: "Kan jeg tilpasse utseendet til min merkevare?",
    answer: "Absolutt. Farger, fonter, tekster og posisjon kan tilpasses via data-attributter. Se dokumentasjonen for alle tilgjengelige alternativer.",
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("kom-i-gang");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-6 border-b border-preik-border sticky top-0 bg-preik-bg/80 backdrop-blur-sm z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="preik-wordmark text-2xl">
            preik
          </Link>
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-preik-text-muted hover:text-preik-text transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <Link
              href="/login"
              className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
            >
              Logg inn
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[73px] bg-preik-bg z-20 overflow-y-auto">
          <nav className="p-6">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      activeSection === item.id
                        ? "bg-preik-accent/10 text-preik-accent font-medium"
                        : "text-preik-text-muted hover:text-preik-text hover:bg-preik-surface"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Sidebar - Fixed to viewport on desktop */}
      <aside className="hidden lg:block fixed left-0 top-[73px] w-64 h-[calc(100vh-73px)] bg-preik-bg border-r border-preik-border z-20">
        <nav className="h-full overflow-y-auto py-8 pr-4 pl-6">
            <p className="text-xs font-semibold text-preik-text uppercase tracking-wider mb-4 px-4">
              Dokumentasjon
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSection === item.id
                        ? "bg-preik-accent/10 text-preik-accent font-medium border-l-2 border-preik-accent"
                        : "text-preik-text-muted hover:text-preik-text hover:bg-preik-surface"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Support box in sidebar */}
            <div className="mt-8 mx-4 p-4 bg-preik-surface rounded-xl border border-preik-border">
              <p className="text-sm text-preik-text mb-2">Trenger du hjelp?</p>
              <a
                href="mailto:hei@preik.ai"
                className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
              >
                hei@preik.ai
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content - Scrollable, centered with left margin for fixed sidebar */}
        <main className="min-w-0 px-6 py-8 lg:py-12 lg:ml-64">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-brand font-light text-preik-text mb-4">
              Dokumentasjon
            </h1>
            <p className="text-lg text-preik-text-muted mb-12">
              Alt du trenger for å integrere Preik på din nettside.
            </p>

            {/* Quick start */}
            <section id="kom-i-gang" className="mb-16 scroll-mt-28">
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
                        Gå til &quot;Integrasjon&quot;-fanen for å finne din unike embed-kode. Her kan du også tilpasse
                        utseendet visuelt.
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
            <section id="embed-kode" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Embed-kode
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                <p className="text-preik-text-muted mb-6">
                  Grunnleggende embed-kode med kun påkrevde attributter:
                </p>
                <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-preik-text-muted">
{`<script
  src="https://preik.ai/widget.js"
  data-store-id="din-butikk-id"
  async
></script>`}
                  </pre>
                </div>

                <p className="text-preik-text-muted mt-8 mb-6">
                  Fullstendig eksempel med alle tilpasninger:
                </p>
                <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-preik-text-muted">
{`<script
  src="https://preik.ai/widget.js"
  data-store-id="din-butikk-id"
  data-accent-color="#F97316"
  data-text-color="#111827"
  data-bg-color="#111827"
  data-surface-color="#1F2937"
  data-theme="dark"
  data-position="bottom-right"
  data-greeting="Hei! Hvordan kan jeg hjelpe deg?"
  data-placeholder="Skriv en melding..."
  data-brand-name="Min Bedrift"
  data-font-body="Inter, sans-serif"
  data-font-brand="Georgia, serif"
  data-brand-style="normal"
  async
></script>`}
                  </pre>
                </div>
              </div>
            </section>

            {/* All attributes reference */}
            <section id="tilpasning" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Widget-tilpasning
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-preik-bg">
                      <tr>
                        <th className="text-left px-6 py-4 font-semibold text-preik-text">Attributt</th>
                        <th className="text-left px-6 py-4 font-semibold text-preik-text">Beskrivelse</th>
                        <th className="text-left px-6 py-4 font-semibold text-preik-text">Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-preik-border">
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-store-id</td>
                        <td className="px-6 py-4 text-preik-text-muted">Din unike butikk-ID (påkrevd)</td>
                        <td className="px-6 py-4 text-preik-text-muted">—</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-accent-color</td>
                        <td className="px-6 py-4 text-preik-text-muted">Hovedfarge for knapper og bruker-meldinger</td>
                        <td className="px-6 py-4 text-preik-text-muted">#F97316</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-text-color</td>
                        <td className="px-6 py-4 text-preik-text-muted">Tekstfarge (overstyrer tema)</td>
                        <td className="px-6 py-4 text-preik-text-muted">Basert på tema</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-bg-color</td>
                        <td className="px-6 py-4 text-preik-text-muted">Bakgrunnsfarge for widget</td>
                        <td className="px-6 py-4 text-preik-text-muted">Basert på tema</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-surface-color</td>
                        <td className="px-6 py-4 text-preik-text-muted">Farge for header, input-område og meldingsbobler</td>
                        <td className="px-6 py-4 text-preik-text-muted">Basert på tema</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-theme</td>
                        <td className="px-6 py-4 text-preik-text-muted">Fargetema: auto, light, eller dark</td>
                        <td className="px-6 py-4 text-preik-text-muted">auto</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-position</td>
                        <td className="px-6 py-4 text-preik-text-muted">Plassering: bottom-right eller bottom-left</td>
                        <td className="px-6 py-4 text-preik-text-muted">bottom-right</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-greeting</td>
                        <td className="px-6 py-4 text-preik-text-muted">Velkomstmelding som vises når chatten er tom</td>
                        <td className="px-6 py-4 text-preik-text-muted">Hei! Hvordan kan jeg hjelpe deg i dag?</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-placeholder</td>
                        <td className="px-6 py-4 text-preik-text-muted">Plassholder-tekst i input-feltet</td>
                        <td className="px-6 py-4 text-preik-text-muted">Skriv en melding...</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-brand-name</td>
                        <td className="px-6 py-4 text-preik-text-muted">Navn som vises i header</td>
                        <td className="px-6 py-4 text-preik-text-muted">Assistent</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-font-body</td>
                        <td className="px-6 py-4 text-preik-text-muted">Font for brødtekst</td>
                        <td className="px-6 py-4 text-preik-text-muted">System font stack</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-font-brand</td>
                        <td className="px-6 py-4 text-preik-text-muted">Font for merkenavn i header</td>
                        <td className="px-6 py-4 text-preik-text-muted">System font stack</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono text-preik-accent">data-brand-style</td>
                        <td className="px-6 py-4 text-preik-text-muted">Stil for merkenavn: normal eller italic</td>
                        <td className="px-6 py-4 text-preik-text-muted">normal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Colors and theme */}
            <section id="farger-og-tema" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Farger og tema
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-8">
                <div>
                  <h3 className="font-medium text-preik-text mb-3">Aksentfarge</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Aksentfargen brukes for send-knappen, brukerens chat-bobler, og fokus-effekter.
                    Bruk en farge som matcher merkevaren din.
                  </p>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm">
                    <code className="text-preik-text-muted">data-accent-color=&quot;#3B82F6&quot;</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Tema</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Widgeten støtter lys og mørk modus. Med <code className="bg-preik-bg px-2 py-0.5 rounded">auto</code> følger
                    den brukerens systeminnstillinger.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-mono text-sm text-preik-accent mb-2">auto</p>
                      <p className="text-xs text-preik-text-muted">Følger system-preferanse</p>
                    </div>
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-mono text-sm text-preik-accent mb-2">light</p>
                      <p className="text-xs text-preik-text-muted">Alltid lys bakgrunn</p>
                    </div>
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-mono text-sm text-preik-accent mb-2">dark</p>
                      <p className="text-xs text-preik-text-muted">Alltid mørk bakgrunn</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Tekstfarge</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Normalt settes tekstfargen automatisk basert på tema. Bruk <code className="bg-preik-bg px-2 py-0.5 rounded">data-text-color</code> for
                    å overstyre dette.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Bakgrunnsfarger (for mørk modus)</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    For mørk modus kan du tilpasse bakgrunns- og overflatefargene for å matche merkevaren din bedre.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-mono text-sm text-preik-accent mb-2">data-bg-color</p>
                      <p className="text-xs text-preik-text-muted">Hovedbakgrunn for widgeten</p>
                      <div className="mt-2 h-6 rounded" style={{ backgroundColor: "#111827" }}></div>
                    </div>
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-mono text-sm text-preik-accent mb-2">data-surface-color</p>
                      <p className="text-xs text-preik-text-muted">Header, input og meldingsbobler</p>
                      <div className="mt-2 h-6 rounded" style={{ backgroundColor: "#1F2937" }}></div>
                    </div>
                  </div>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm mt-4">
                    <pre className="text-preik-text-muted">
{`data-bg-color="#0A0F1A"
data-surface-color="#151B28"`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Fonts */}
            <section id="fonter" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Fonter
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-6">
                <p className="text-preik-text-muted">
                  Widgeten bruker systemfonter som standard for optimal ytelse. Du kan overstyre dette
                  med egne fonter, men husk at du må laste inn fontene selv.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-sm text-preik-text">
                    <strong>Viktig:</strong> Widgeten laster ikke inn fonter automatisk. Du må inkludere
                    font-filene eller lenke til Google Fonts på nettsiden din.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Eksempel med Google Fonts</h3>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-preik-text-muted">
{`<!-- Last inn fonter i <head> -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">

<!-- Bruk fontene i widgeten -->
<script
  src="https://preik.ai/widget.js"
  data-store-id="din-butikk-id"
  data-font-body="Inter, sans-serif"
  data-font-brand="Playfair Display, serif"
  data-brand-style="italic"
  async
></script>`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Position */}
            <section id="posisjon" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Posisjon og layout
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-6">
                <p className="text-preik-text-muted">
                  Widgeten vises som en flytende knapp i hjørnet av skjermen. På mobil åpnes chatten
                  i fullskjerm for bedre brukeropplevelse.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-preik-bg rounded-xl p-6">
                    <div className="h-32 border-2 border-dashed border-preik-border rounded-lg relative mb-4">
                      <div className="absolute bottom-2 right-2 w-8 h-8 bg-preik-accent rounded-full"></div>
                    </div>
                    <p className="font-mono text-sm text-preik-accent mb-1">bottom-right</p>
                    <p className="text-xs text-preik-text-muted">Standard plassering</p>
                  </div>
                  <div className="bg-preik-bg rounded-xl p-6">
                    <div className="h-32 border-2 border-dashed border-preik-border rounded-lg relative mb-4">
                      <div className="absolute bottom-2 left-2 w-8 h-8 bg-preik-accent rounded-full"></div>
                    </div>
                    <p className="font-mono text-sm text-preik-accent mb-1">bottom-left</p>
                    <p className="text-xs text-preik-text-muted">Alternativ plassering</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Dimensjoner</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• <strong>Desktop:</strong> 400px bredde, 500px høyde</li>
                    <li>• <strong>Mobil:</strong> Fullskjerm med 16px margin</li>
                    <li>• <strong>Trigger-knapp:</strong> 56px diameter</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Text customization */}
            <section id="tekst" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Tekst og meldinger
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-6">
                <div>
                  <h3 className="font-medium text-preik-text mb-3">Velkomstmelding</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Velkomstmeldingen vises når brukeren åpner chatten for første gang. Bruk den til å
                    forklare hva chatboten kan hjelpe med.
                  </p>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm">
                    <code className="text-preik-text-muted">data-greeting=&quot;Hei! Jeg kan hjelpe deg med spørsmål om våre produkter, priser og leveringstider.&quot;</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Plassholder-tekst</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Teksten som vises i input-feltet før brukeren skriver.
                  </p>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm">
                    <code className="text-preik-text-muted">data-placeholder=&quot;Still et spørsmål...&quot;</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Merkenavn</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Navnet som vises i header sammen med &quot;Online&quot;-indikatoren.
                  </p>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm">
                    <code className="text-preik-text-muted">data-brand-name=&quot;Kundeservice&quot;</code>
                  </div>
                </div>
              </div>
            </section>

            {/* System prompt */}
            <section id="system-prompt" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                System-prompt
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-6">
                <p className="text-preik-text-muted">
                  System-prompten definerer chatbotens personlighet, oppførsel og begrensninger.
                  Den redigeres i dashbordet under &quot;Prompt&quot;-fanen.
                </p>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Beste praksis</h3>
                  <ul className="text-sm text-preik-text-muted space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-preik-accent">•</span>
                      <span><strong>Definer rollen:</strong> Start med å fortelle AI-en hvem den er, f.eks. &quot;Du er en kundeserviceassistent for [Bedriftsnavn].&quot;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-preik-accent">•</span>
                      <span><strong>Sett tone:</strong> Beskriv hvordan den skal kommunisere - vennlig, profesjonell, uformell, etc.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-preik-accent">•</span>
                      <span><strong>Definer begrensninger:</strong> Fortell hva den IKKE skal svare på eller diskutere.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-preik-accent">•</span>
                      <span><strong>Gi eksempler:</strong> Inkluder eksempel-dialoger for vanlige spørsmål.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-preik-accent">•</span>
                      <span><strong>Håndter ukjente spørsmål:</strong> Instruer hvordan den skal svare når den ikke vet svaret.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Eksempel på system-prompt</h3>
                  <div className="bg-preik-bg rounded-xl p-4 text-sm overflow-x-auto">
                    <pre className="text-preik-text-muted whitespace-pre-wrap">
{`Du er en hjelpsom kundeserviceassistent for Båtbutikken AS.

Din rolle:
- Hjelpe kunder med spørsmål om båtutstyr, produkter og priser
- Gi råd om vedlikehold og bruk av båtutstyr
- Svare på norsk med en vennlig og profesjonell tone

Retningslinjer:
- Hold svarene korte og konsise
- Hvis du ikke vet svaret, si det ærlig og henvis til kundeservice
- Ikke diskuter konkurrenter eller gi juridiske/medisinske råd
- Ved komplekse henvendelser, foreslå å kontakte oss på hei@batbutikken.no

Vanlige spørsmål:
- Åpningstider: Man-fre 09-17, lør 10-15
- Leveringstid: 1-3 virkedager
- Retur: 30 dagers åpent kjøp`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Content/Knowledge base */}
            <section id="innhold" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Innhold og kunnskapsbase
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-6">
                <p className="text-preik-text-muted">
                  Chatboten kan læres opp på bedriftens innhold for å gi mer presise og relevante svar.
                  Dette konfigureres i dashbordet under &quot;Innhold&quot;-fanen.
                </p>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Støttede innholdstyper</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-medium text-preik-text mb-1">Nettside-crawling</p>
                      <p className="text-xs text-preik-text-muted">Vi crawler nettsiden din automatisk</p>
                    </div>
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-medium text-preik-text mb-1">PDF-dokumenter</p>
                      <p className="text-xs text-preik-text-muted">Last opp manualer, kataloger, etc.</p>
                    </div>
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-medium text-preik-text mb-1">Tekstfiler</p>
                      <p className="text-xs text-preik-text-muted">FAQ, produktinfo, retningslinjer</p>
                    </div>
                    <div className="bg-preik-bg rounded-xl p-4">
                      <p className="font-medium text-preik-text mb-1">Manuell input</p>
                      <p className="text-xs text-preik-text-muted">Skriv inn informasjon direkte</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Tips for godt innhold</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• Inkluder ofte stilte spørsmål (FAQ)</li>
                    <li>• Legg til produktbeskrivelser og spesifikasjoner</li>
                    <li>• Oppdater innholdet regelmessig</li>
                    <li>• Strukturer informasjonen tydelig med overskrifter</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                API-referanse
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-8">
                <p className="text-preik-text-muted">
                  For avanserte integrasjoner kan du kommunisere direkte med chat-API-et.
                </p>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Endepunkt</h3>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm">
                    <code className="text-preik-accent">POST</code>
                    <code className="text-preik-text-muted ml-2">https://preik.ai/api/chat</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Request body</h3>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-preik-text-muted">
{`{
  "messages": [
    { "role": "user", "content": "Hva er åpningstidene?" }
  ],
  "storeId": "din-butikk-id",
  "noStream": false
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Parametere</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li><code className="bg-preik-bg px-2 py-0.5 rounded">messages</code> - Array med samtalehistorikk</li>
                    <li><code className="bg-preik-bg px-2 py-0.5 rounded">storeId</code> - Din butikk-ID</li>
                    <li><code className="bg-preik-bg px-2 py-0.5 rounded">noStream</code> - Sett til true for å få hele svaret på en gang (standard: false for streaming)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Response (noStream: true)</h3>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-preik-text-muted">
{`{
  "content": "Vi har åpent mandag til fredag 09-17, og lørdag 10-15."
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Streaming response</h3>
                  <p className="text-sm text-preik-text-muted">
                    Med <code className="bg-preik-bg px-2 py-0.5 rounded">noStream: false</code> returneres
                    svaret som en text/plain stream der teksten kommer inkrementelt.
                  </p>
                </div>
              </div>
            </section>

            {/* Platform guides */}
            <section id="plattformer" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Plattform-guider
              </h2>
              <div className="space-y-6">
                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">WordPress</h3>
                  <div className="space-y-4 text-sm text-preik-text-muted">
                    <p><strong>Alternativ 1: Plugin</strong></p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Installer &quot;Insert Headers and Footers&quot; eller &quot;WPCode&quot; plugin</li>
                      <li>Gå til plugin-innstillingene</li>
                      <li>Lim inn embed-koden i &quot;Footer&quot;-seksjonen</li>
                      <li>Lagre endringene</li>
                    </ol>
                    <p className="mt-4"><strong>Alternativ 2: Tema-fil</strong></p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Gå til Utseende → Tema-filredigerer</li>
                      <li>Åpne <code className="bg-preik-bg px-2 py-0.5 rounded">footer.php</code></li>
                      <li>Lim inn koden rett før <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code></li>
                      <li>Lagre filen</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">Shopify</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-preik-text-muted ml-4">
                    <li>Gå til Online Store → Themes</li>
                    <li>Klikk &quot;Actions&quot; → &quot;Edit code&quot;</li>
                    <li>Finn <code className="bg-preik-bg px-2 py-0.5 rounded">theme.liquid</code> under Layout</li>
                    <li>Finn <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code> taggen (vanligvis nederst)</li>
                    <li>Lim inn embed-koden rett før denne taggen</li>
                    <li>Klikk &quot;Save&quot;</li>
                  </ol>
                </div>

                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">Wix</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-preik-text-muted ml-4">
                    <li>Gå til Settings i Wix-dashbordet</li>
                    <li>Velg &quot;Custom Code&quot; under Advanced</li>
                    <li>Klikk &quot;+ Add Code&quot;</li>
                    <li>Lim inn embed-koden</li>
                    <li>Velg &quot;Body - end&quot; som plassering</li>
                    <li>Velg hvilke sider koden skal vises på</li>
                    <li>Klikk &quot;Apply&quot;</li>
                  </ol>
                </div>

                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">Squarespace</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-preik-text-muted ml-4">
                    <li>Gå til Settings → Advanced → Code Injection</li>
                    <li>Lim inn embed-koden i &quot;Footer&quot;-feltet</li>
                    <li>Klikk &quot;Save&quot;</li>
                  </ol>
                </div>

                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">Webflow</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-preik-text-muted ml-4">
                    <li>Gå til Project Settings</li>
                    <li>Velg &quot;Custom Code&quot;-fanen</li>
                    <li>Lim inn embed-koden i &quot;Footer Code&quot;-feltet</li>
                    <li>Publiser nettsiden på nytt</li>
                  </ol>
                </div>

                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">React / Next.js</h3>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-preik-text-muted">
{`// I _app.tsx eller layout.tsx
import Script from 'next/script'

export default function App() {
  return (
    <>
      {/* ... din app ... */}
      <Script
        src="https://preik.ai/widget.js"
        data-store-id="din-butikk-id"
        strategy="lazyOnload"
      />
    </>
  )
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
                  <h3 className="font-medium text-preik-text mb-4 text-lg">HTML / Vanilla JS</h3>
                  <p className="text-sm text-preik-text-muted mb-4">
                    Lim inn embed-koden rett før <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code> i
                    HTML-filen din:
                  </p>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-preik-text-muted">
{`<!DOCTYPE html>
<html>
<head>
  <title>Min nettside</title>
</head>
<body>
  <!-- Nettsidens innhold -->

  <script
    src="https://preik.ai/widget.js"
    data-store-id="din-butikk-id"
    async
  ></script>
</body>
</html>`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="feilsoking" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Feilsøking
              </h2>
              <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 space-y-8">
                <div>
                  <h3 className="font-medium text-preik-text mb-3">Widgeten vises ikke</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• Sjekk at script-taggen er plassert før <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code></li>
                    <li>• Verifiser at <code className="bg-preik-bg px-2 py-0.5 rounded">data-store-id</code> er riktig</li>
                    <li>• Åpne nettleserens Developer Tools (F12) og sjekk Console for feilmeldinger</li>
                    <li>• Sjekk Network-fanen for å se om widget.js lastes inn</li>
                    <li>• Tøm nettleserens cache og prøv igjen</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Chatboten svarer ikke</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• Sjekk at butikk-ID-en er korrekt og aktiv</li>
                    <li>• Verifiser at du har en gyldig abonnementsplan</li>
                    <li>• Sjekk Network-fanen for API-feil (4xx/5xx responser)</li>
                    <li>• Kontakt support hvis problemet vedvarer</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Styling/utseende-problemer</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• Widgeten bruker Shadow DOM og bør ikke påvirkes av nettsiden din</li>
                    <li>• Hvis du bruker egne fonter, sjekk at de er lastet inn på siden</li>
                    <li>• Prøv å sette tema eksplisitt med <code className="bg-preik-bg px-2 py-0.5 rounded">data-theme=&quot;light&quot;</code></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Cache-problemer</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• Legg til en versjon-parameter for å tvinge oppdatering:</li>
                  </ul>
                  <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm mt-2">
                    <code className="text-preik-text-muted">src=&quot;https://preik.ai/widget.js?v=2&quot;</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-preik-text mb-3">Mobil-spesifikke problemer</h3>
                  <ul className="text-sm text-preik-text-muted space-y-2">
                    <li>• Widgeten åpnes i fullskjerm på mobil - dette er tilsiktet oppførsel</li>
                    <li>• Hvis tastaturet dekker input-feltet, scroll ned i chatten</li>
                    <li>• Enkelte WebViews (f.eks. Instagram-nettleseren) kan ha begrensninger</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-preik-text mb-6">
                Ofte stilte spørsmål
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-preik-border rounded-2xl overflow-hidden bg-preik-surface transition-all duration-200 hover:border-preik-text-muted/30"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                    >
                      <span className="font-medium text-preik-text">{faq.question}</span>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openFaqIndex === index ? "bg-preik-accent text-white" : "bg-preik-bg text-preik-text-muted"}`}>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            openFaqIndex === index ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        openFaqIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-5">
                          <p className="text-preik-text-muted leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Support */}
            <section className="mb-16">
              <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-preik-text mb-4">
                  Trenger du hjelp?
                </h2>
                <p className="text-preik-text-muted mb-4">
                  Sliter du med integrasjonen eller har spørsmål? Vi hjelper deg gjerne!
                </p>
                <a
                  href="mailto:hei@preik.ai"
                  className="inline-flex items-center gap-2 text-preik-accent hover:text-preik-accent-hover font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  hei@preik.ai
                </a>
              </div>
            </section>

            <div className="pt-8 border-t border-preik-border">
              <Link
                href="/"
                className="text-preik-accent hover:text-preik-accent-hover transition-colors"
              >
                ← Tilbake til forsiden
              </Link>
            </div>
          </div>
        </main>
    </div>
  );
}
