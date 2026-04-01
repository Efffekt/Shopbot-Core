import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Installer for Shopify",
  description:
    "Installer Preik sin AI-chatbot direkte i Shopify-butikken din. Enkel oppsett, ingen koding.",
  robots: { index: true, follow: true },
};

export default function ShopifyInstallPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-preik-bg pt-32 pb-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-tight text-preik-text sm:text-5xl">
            Installer Preik for Shopify
          </h1>
          <p className="mt-6 text-lg text-preik-text-muted leading-relaxed">
            Legg til en AI-chatbot i Shopify-butikken din på under ett minutt.
            Ingen koding, ingen komplisert oppsett — bare skriv inn butikk-adressen
            din og klikk installer.
          </p>

          <form
            action="/api/shopify/install"
            method="GET"
            className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-center"
          >
            <div className="flex-1 text-left sm:max-w-sm">
              <label
                htmlFor="shop"
                className="block text-sm font-medium text-preik-text mb-2"
              >
                Din Shopify-adresse
              </label>
              <div className="flex items-center rounded-xl border border-preik-border bg-preik-surface overflow-hidden focus-within:ring-2 focus-within:ring-preik-accent/40">
                <input
                  type="text"
                  id="shop"
                  name="shop"
                  required
                  placeholder="min-butikk"
                  className="flex-1 bg-transparent px-4 py-3 text-preik-text placeholder:text-preik-text-muted/50 outline-none"
                />
                <span className="pr-4 text-sm text-preik-text-muted whitespace-nowrap">
                  .myshopify.com
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-preik-accent px-8 py-3 font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Installer
            </button>
          </form>

          {/* The form submits "min-butikk" but the API expects "min-butikk.myshopify.com" */}
          <ShopFieldFixer />

          <div className="mt-16 space-y-6 text-left">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-preik-text">
              Slik fungerer det
            </h2>
            <ol className="space-y-4 text-preik-text-muted">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-preik-accent/10 text-sm font-semibold text-preik-accent">
                  1
                </span>
                <span>Skriv inn Shopify-adressen din og klikk &laquo;Installer&raquo;.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-preik-accent/10 text-sm font-semibold text-preik-accent">
                  2
                </span>
                <span>Godkjenn installasjonen i Shopify-admin.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-preik-accent/10 text-sm font-semibold text-preik-accent">
                  3
                </span>
                <span>
                  Aktiver widgeten under <strong>Nettbutikk &rarr; Tilpass tema &rarr; App-innbygging</strong> i
                  Shopify-admin.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-preik-accent/10 text-sm font-semibold text-preik-accent">
                  4
                </span>
                <span>
                  Tilpass chatboten i{" "}
                  <Link href="/dashboard" className="text-preik-accent hover:underline">
                    Preik-dashboardet
                  </Link>
                  .
                </span>
              </li>
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Client component that appends .myshopify.com to the shop field on submit */
function ShopFieldFixer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          document.querySelector('form[action="/api/shopify/install"]')?.addEventListener('submit', function(e) {
            var input = this.querySelector('input[name="shop"]');
            var val = (input.value || '').trim().toLowerCase().replace(/\\.myshopify\\.com$/, '');
            input.value = val + '.myshopify.com';
          });
        `,
      }}
    />
  );
}
