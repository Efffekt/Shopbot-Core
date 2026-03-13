import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Nyheter",
  description: "Siste nytt fra Preik — nye funksjoner, forbedringer og oppdateringer.",
  alternates: { canonical: "https://preik.ai/nyheter" },
  openGraph: {
    title: "Nyheter | Preik",
    description: "Siste nytt fra Preik — nye funksjoner, forbedringer og oppdateringer.",
    url: "https://preik.ai/nyheter",
  },
};

const updates = [
  {
    date: "2026-03-13",
    version: "1.0",
    title: "Lansering av Preik",
    changes: [
      "AI-chatbot trent på dine egne data",
      "Dashboard med statistikk, samtaler og analyse",
      "Widget som integreres med alle plattformer",
      "Flerspråklig støtte (norsk + engelsk)",
      "GDPR-compliant databehandling",
      "Stripe-basert betalingsløsning",
    ],
  },
];

export default async function NyheterPage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.includes("auth-token"));

  return (
    <>
      <Header isLoggedIn={hasSession} />
      <main id="main-content" className="pt-32 pb-24 px-6 bg-preik-bg min-h-screen transition-colors duration-200">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
            Changelog
          </p>
          <h1 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-4">
            Nyheter og oppdateringer
          </h1>
          <p className="text-lg text-preik-text-muted mb-16">
            Følg med på nye funksjoner, forbedringer og feilrettinger.
          </p>

          <div className="space-y-12">
            {updates.map((update) => (
              <article key={update.version} className="relative pl-8 border-l-2 border-preik-accent/20">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-preik-accent" />
                <time className="text-sm text-preik-text-muted">{update.date}</time>
                <h2 className="text-2xl font-medium text-preik-text mt-1 mb-1">
                  {update.title}
                </h2>
                <span className="inline-block px-2 py-0.5 rounded-full bg-preik-accent/10 text-xs font-medium text-preik-accent mb-4">
                  v{update.version}
                </span>
                <ul className="space-y-2">
                  {update.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3 text-preik-text-muted">
                      <svg className="w-4 h-4 text-preik-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
