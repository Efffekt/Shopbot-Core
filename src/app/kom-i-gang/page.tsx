import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const metadata: Metadata = {
  title: "Kom i gang med Preik",
  description:
    "Fortell oss litt om bedriften din, så setter vi opp en skreddersydd AI-chatbot for deg. Vi tar kontakt innen 24 timer.",
  robots: { index: false, follow: false },
};

export default function KomIGangPage() {
  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      {/* Top bar */}
      <header className="px-6 py-5 border-b border-preik-border">
        <div className="max-w-lg mx-auto relative flex items-center justify-center">
          <Link
            href="/"
            className="absolute left-0 text-sm text-preik-text-muted hover:text-preik-text transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Tilbake
          </Link>
          <Link href="/" className="preik-wordmark text-3xl">
            preik
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-12 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Wizard */}
          <div className="bg-preik-surface rounded-3xl border border-preik-border p-8 sm:p-10">
            <OnboardingWizard />
          </div>
        </div>
      </main>
    </div>
  );
}
