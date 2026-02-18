import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { ScrollReveal } from "./ScrollReveal";

export function Footer() {
  return (
    <footer className="bg-preik-bg border-t border-preik-border transition-colors duration-200">
      <div className="max-w-6xl mx-auto border-l border-r border-preik-border">
        {/* Main footer content */}
        <div className="px-8 py-20">
          <ScrollReveal animation="up">
            <div className="grid md:grid-cols-12 gap-12">
              {/* Branding - takes more space */}
              <div className="md:col-span-5">
                <p className="preik-wordmark text-4xl md:text-5xl mb-4">preik</p>
                <p className="text-preik-text-muted leading-relaxed max-w-sm mb-6">
                  AI som snakker ditt språk. Skreddersydde assistenter for norske bedrifter.
                </p>
                <a
                  href="mailto:hei@preik.ai"
                  className="inline-flex items-center gap-2 text-preik-accent hover:text-preik-accent-hover transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  hei@preik.ai
                </a>
              </div>

              {/* Navigation */}
              <div className="md:col-span-3 md:col-start-8">
                <p className="text-sm font-medium text-preik-text uppercase tracking-wide mb-5">Navigasjon</p>
                <ul className="space-y-3 text-preik-text-muted">
                  <li><Link href="/#losninger" className="hover:text-preik-text transition-colors">Slik fungerer det</Link></li>
                  <li><Link href="/#hvordan" className="hover:text-preik-text transition-colors">Demo</Link></li>
                  <li><Link href="/#priser" className="hover:text-preik-text transition-colors">Priser</Link></li>
                  <li><Link href="/#faq" className="hover:text-preik-text transition-colors">FAQ</Link></li>
                  <li><Link href="/#kontakt" className="hover:text-preik-text transition-colors">Kontakt</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-preik-text uppercase tracking-wide mb-5">Ressurser</p>
                <ul className="space-y-3 text-preik-text-muted">
                  <li><Link href="/articles" className="hover:text-preik-text transition-colors">Articles</Link></li>
                  <li><Link href="/docs" className="hover:text-preik-text transition-colors">Dokumentasjon</Link></li>
                  <li><Link href="/personvern" className="hover:text-preik-text transition-colors">Personvern</Link></li>
                  <li><Link href="/cookies" className="hover:text-preik-text transition-colors">Cookies</Link></li>
                  <li><Link href="/vilkar" className="hover:text-preik-text transition-colors">Vilkår</Link></li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom bar */}
        <div className="px-8 py-6 border-t border-preik-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-preik-text-muted">
              © {new Date().getFullYear()} Preik. Laget i Norge.
            </p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <p className="text-sm text-preik-text-muted">
                Norsk AI for norske bedrifter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
