"use client";

import { useState, useEffect } from "react";
import ScraperControl from "@/components/ScraperControl";
import AdminContentBrowser from "@/components/AdminContentBrowser";
import { createLogger } from "@/lib/logger";

const log = createLogger("ContentIngestion");

interface Tenant {
  id: string;
  name: string;
}

interface ContentIngestionProps {
  selectedTenantId?: string | null;
  selectedTenantName?: string | null;
}

export default function ContentIngestion({ selectedTenantId, selectedTenantName }: ContentIngestionProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState(selectedTenantId || "");
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      setCurrentTenantId(selectedTenantId);
    }
  }, [selectedTenantId]);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      log.error("Failed to fetch tenants:", error);
    } finally {
      setIsLoadingTenants(false);
    }
  }

  const currentTenantName = selectedTenantName || tenants.find(t => t.id === currentTenantId)?.name || currentTenantId;

  return (
    <div className="space-y-6">
      {/* Tenant Selector */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-preik-text whitespace-nowrap">Kunde:</label>
          {isLoadingTenants ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-preik-accent"></div>
          ) : (
            <select
              value={currentTenantId}
              onChange={(e) => setCurrentTenantId(e.target.value)}
              className="flex-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text focus:ring-preik-accent focus:border-preik-accent"
            >
              <option value="">Velg kunde...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.id})
                </option>
              ))}
            </select>
          )}
        </div>
        {currentTenantId && (
          <p className="text-xs text-preik-text-muted mt-2">
            Innhold legges til for: <span className="font-medium text-preik-text">{currentTenantName}</span>
          </p>
        )}
      </div>

      {!currentTenantId ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 text-center">
          <p className="text-preik-text-muted">Velg en kunde ovenfor for å administrere innhold.</p>
        </div>
      ) : (
        <>
          {/* Nettskraper */}
          <details className="bg-preik-surface rounded-2xl border border-preik-border" open>
            <summary className="p-6 cursor-pointer select-none flex items-center justify-between">
              <h3 className="text-lg font-medium text-preik-text">Nettskraper</h3>
              <svg className="h-5 w-5 text-preik-text-muted transition-transform details-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6">
              <ScraperControl storeId={currentTenantId} />
            </div>
          </details>

          {/* Hurtiginntasting */}
          <details className="bg-preik-surface rounded-2xl border border-preik-border">
            <summary className="p-6 cursor-pointer select-none flex items-center justify-between">
              <h3 className="text-lg font-medium text-preik-text">Hurtiginntasting</h3>
              <svg className="h-5 w-5 text-preik-text-muted transition-transform details-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6">
              <QuickIngest storeId={currentTenantId} />
            </div>
          </details>

          {/* Manuell inntasting */}
          <details className="bg-preik-surface rounded-2xl border border-preik-border">
            <summary className="p-6 cursor-pointer select-none flex items-center justify-between">
              <h3 className="text-lg font-medium text-preik-text">Manuell inntasting</h3>
              <svg className="h-5 w-5 text-preik-text-muted transition-transform details-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6">
              <ManualIngest storeId={currentTenantId} />
            </div>
          </details>

          {/* Innholdsoversikt */}
          <details className="bg-preik-surface rounded-2xl border border-preik-border">
            <summary className="p-6 cursor-pointer select-none flex items-center justify-between">
              <h3 className="text-lg font-medium text-preik-text">Innholdsoversikt</h3>
              <svg className="h-5 w-5 text-preik-text-muted transition-transform details-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6">
              <AdminContentBrowser tenantId={currentTenantId} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function QuickIngest({ storeId }: { storeId: string }) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, url: websiteUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke ta inn innhold");
      }

      setStatus({
        type: "success",
        message: data.message || "Innhold lagt til!",
      });
      setWebsiteUrl("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "En feil oppstod",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-preik-text-muted mb-4">
        Rask helsideskraping. For mer kontroll, bruk nettskraperen ovenfor.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quickWebsiteUrl" className="block text-sm font-medium text-preik-text mb-1">
            Nettside-URL
          </label>
          <input
            type="url"
            id="quickWebsiteUrl"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            required
            disabled={isLoading}
            placeholder="https://example.com"
            className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-2 px-4 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Skraper...
            </>
          ) : (
            "Legg til innhold"
          )}
        </button>
      </form>

      {status.type && (
        <div
          className={`mt-4 p-4 rounded-xl ${
            status.type === "success"
              ? "bg-green-500/10 text-green-600 border border-green-500/20"
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          }`}
        >
          <p className="text-sm">{status.message}</p>
        </div>
      )}
    </div>
  );
}

function ManualIngest({ storeId }: { storeId: string }) {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/admin/manual-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          storeId,
          url: sourceUrl || undefined,
          title: title || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke lagre innhold");
      }

      setStatus({
        type: "success",
        message: data.message,
      });
      setText("");
      setTitle("");
      setSourceUrl("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "En feil oppstod",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = text.length;
  const estimatedChunks = Math.ceil(charCount / 1000);

  return (
    <div>
      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <p className="text-yellow-700 text-sm">
          <strong>Manuell inntasting:</strong> Bruk dette når skraperen ikke fungerer på komplekse sider (SPA, React, etc.). Kopier og lim inn teksten manuelt.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="manualTitle" className="block text-sm font-medium text-preik-text mb-1">
            Tittel / Sidenavn
          </label>
          <input
            type="text"
            id="manualTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="f.eks. Button Component"
            className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="manualSourceUrl" className="block text-sm font-medium text-preik-text mb-1">
            Kilde-URL
          </label>
          <input
            type="url"
            id="manualSourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            disabled={isLoading}
            placeholder="https://example.com/side"
            className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="manualText" className="block text-sm font-medium text-preik-text mb-1">
            Innhold *
          </label>
          <textarea
            id="manualText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            disabled={isLoading}
            rows={12}
            placeholder="Lim inn dokumentasjonsteksten her..."
            className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted font-mono text-sm focus:ring-preik-accent focus:border-preik-accent disabled:opacity-50"
          />
          <div className="mt-1 flex justify-between text-xs text-preik-text-muted">
            <span>{charCount.toLocaleString()} tegn</span>
            <span>~{estimatedChunks} chunks</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="w-full flex justify-center items-center py-2 px-4 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Lagrer...
            </>
          ) : (
            "Lagre innhold"
          )}
        </button>
      </form>

      {status.type && (
        <div
          className={`mt-4 p-4 rounded-xl ${
            status.type === "success"
              ? "bg-green-500/10 text-green-600 border border-green-500/20"
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          }`}
        >
          <p className="text-sm">{status.message}</p>
        </div>
      )}
    </div>
  );
}
