"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function IntegrationPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [copied, setCopied] = useState(false);

  const embedCode = `<script
  src="https://preik.no/widget.js"
  data-store-id="${tenantId}"
  async
></script>`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${tenantId}`}
          className="text-sm text-preik-text-muted hover:text-preik-text transition-colors mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tilbake
        </Link>
        <h1 className="text-3xl font-brand font-light text-preik-text">Integrasjon</h1>
        <p className="mt-2 text-preik-text-muted">
          Legg til Preik-chatboten på nettsiden din med embed-koden under.
        </p>
      </div>

      {/* Embed code section */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-preik-text">Din embed-kode</h2>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-preik-accent text-white text-sm font-medium rounded-xl hover:bg-preik-accent-hover transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Kopiert!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Kopier kode
              </>
            )}
          </button>
        </div>
        <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-preik-text whitespace-pre-wrap">{embedCode}</pre>
        </div>
        <p className="text-sm text-preik-text-muted mt-4">
          Lim inn denne koden rett før <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code> taggen på alle sider der du vil vise chatboten.
        </p>
      </div>

      {/* Your store ID */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 mb-8">
        <h2 className="text-lg font-semibold text-preik-text mb-4">Din butikk-ID</h2>
        <div className="bg-preik-bg rounded-xl p-4">
          <code className="text-preik-accent font-mono">{tenantId}</code>
        </div>
        <p className="text-sm text-preik-text-muted mt-4">
          Denne ID-en er unik for din butikk og brukes til å identifisere chatboten din.
        </p>
      </div>

      {/* Quick guides */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-8">
        <h2 className="text-lg font-semibold text-preik-text mb-6">Plattform-guider</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="font-medium text-preik-text mb-2">WordPress</h3>
            <p className="text-sm text-preik-text-muted">
              Bruk en plugin som &quot;Insert Headers and Footers&quot; eller legg koden i <code className="bg-preik-surface px-2 py-0.5 rounded">footer.php</code>.
            </p>
          </div>
          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="font-medium text-preik-text mb-2">Shopify</h3>
            <p className="text-sm text-preik-text-muted">
              Online Store → Themes → Edit code → <code className="bg-preik-surface px-2 py-0.5 rounded">theme.liquid</code> → før &lt;/body&gt;.
            </p>
          </div>
          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="font-medium text-preik-text mb-2">Wix</h3>
            <p className="text-sm text-preik-text-muted">
              Settings → Custom Code → Add Code to Body - End.
            </p>
          </div>
          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="font-medium text-preik-text mb-2">Squarespace</h3>
            <p className="text-sm text-preik-text-muted">
              Settings → Advanced → Code Injection → Footer.
            </p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-preik-border">
          <Link
            href="/docs"
            className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors inline-flex items-center gap-2"
          >
            Se full dokumentasjon
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
