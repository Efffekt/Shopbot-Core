import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Status",
  description: "Driftsstatus for Preik sine tjenester.",
  alternates: { canonical: "https://preik.ai/status" },
};

const services = [
  { name: "Chatbot-widget", description: "Widget som vises på kundesider" },
  { name: "Chat API", description: "AI-svar og samtaleflyt" },
  { name: "Dashboard", description: "Administrasjon og statistikk" },
  { name: "Autentisering", description: "Innlogging og brukeradministrasjon" },
];

export const revalidate = 300; // Revalidate every 5 minutes

export default async function StatusPage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.includes("auth-token"));

  return (
    <>
      <Header isLoggedIn={hasSession} />
      <main id="main-content" className="pt-32 pb-24 px-6 bg-preik-bg min-h-screen transition-colors duration-200">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
            Driftsstatus
          </p>
          <h1 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-4">
            Systemstatus
          </h1>
          <p className="text-lg text-preik-text-muted mb-12">
            Gjeldende status for Preik sine tjenester.
          </p>

          {/* Overall status */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-lg font-medium text-preik-text">Alle systemer er operative</span>
            </div>
          </div>

          {/* Individual services */}
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="bg-preik-surface rounded-xl border border-preik-border px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-preik-text">{service.name}</p>
                  <p className="text-sm text-preik-text-muted">{service.description}</p>
                </div>
                <span className="text-sm font-medium text-green-600">Operativ</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-preik-text-muted mt-8">
            Opplever du problemer?{" "}
            <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
              Ta kontakt med oss.
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
