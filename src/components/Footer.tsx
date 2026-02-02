"use client";

export function Footer() {
  return (
    <footer className="bg-preik-bg border-t border-preik-border transition-colors duration-200">
      <div className="max-w-6xl mx-auto border-l border-r border-preik-border">
        {/* Main footer content */}
        <div className="px-8 py-20">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Branding - takes more space */}
            <div className="md:col-span-5">
              <p className="preik-wordmark text-3xl mb-4">preik</p>
              <p className="text-preik-text-muted leading-relaxed max-w-sm mb-6">
                AI som snakker ditt språk. Skreddersydde assistenter for norske bedrifter.
              </p>
              <a
                href="mailto:hei@preik.no"
                className="inline-flex items-center gap-2 text-preik-accent hover:text-preik-accent-hover transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                hei@preik.no
              </a>
            </div>

            {/* Navigation */}
            <div className="md:col-span-3 md:col-start-8">
              <p className="text-sm font-medium text-preik-text uppercase tracking-wide mb-5">Navigasjon</p>
              <ul className="space-y-3 text-preik-text-muted">
                <li><a href="#losninger" className="hover:text-preik-text transition-colors">Slik fungerer det</a></li>
                <li><a href="#hvordan" className="hover:text-preik-text transition-colors">Demo</a></li>
                <li><a href="#priser" className="hover:text-preik-text transition-colors">Priser</a></li>
                <li><a href="#faq" className="hover:text-preik-text transition-colors">FAQ</a></li>
                <li><a href="#kontakt" className="hover:text-preik-text transition-colors">Kontakt</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-preik-text uppercase tracking-wide mb-5">Ressurser</p>
              <ul className="space-y-3 text-preik-text-muted">
                <li><a href="/docs" className="hover:text-preik-text transition-colors">Dokumentasjon</a></li>
                <li><a href="/personvern" className="hover:text-preik-text transition-colors">Personvern</a></li>
                <li><a href="/vilkar" className="hover:text-preik-text transition-colors">Vilkår</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-8 py-6 border-t border-preik-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-preik-text-muted">
              © {new Date().getFullYear()} Preik. Laget i Norge.
            </p>
            <p className="text-sm text-preik-text-muted">
              Norsk AI for norske bedrifter.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
