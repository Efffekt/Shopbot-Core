"use client";

import { useState, useRef } from "react";

type Phase = "input" | "manual" | "confirm" | "progress" | "complete";

interface Stats {
  errors: number;
  newPages: number;
  updatedPages: number;
  skippedPages: number;
  emptyPages: number;
}

interface LogEntry {
  url: string;
  status: string;
  chunks?: number;
  error?: string;
}

interface ScraperControlProps {
  storeId?: string;
}

export default function ScraperControl({ storeId: externalStoreId }: ScraperControlProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [baseUrl, setBaseUrl] = useState("");
  const [storeId, setStoreId] = useState(externalStoreId || "");
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualUrls, setManualUrls] = useState("");

  // Progress state
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({
    errors: 0,
    newPages: 0,
    updatedPages: 0,
    skippedPages: 0,
    emptyPages: 0,
  });
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const effectiveStoreId = externalStoreId || storeId;

  const handleManualSubmit = () => {
    if (!effectiveStoreId) {
      setError("Vennligst skriv inn Store ID");
      return;
    }

    const urls = manualUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

    if (urls.length === 0) {
      setError("Ingen gyldige URL-er funnet. Skriv inn én URL per linje.");
      return;
    }

    setError("");
    setDiscoveredUrls(urls);
    setPhase("confirm");
  };

  const handleDiscover = async () => {
    if (!baseUrl || !effectiveStoreId) {
      setError("Vennligst fyll inn både URL og Store ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/scrape/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Oppdaging feilet");
      }

      setDiscoveredUrls(data.urls);
      setPhase("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oppdaging feilet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    setPhase("progress");
    setCurrent(0);
    setTotal(discoveredUrls.length);
    setStats({ errors: 0, newPages: 0, updatedPages: 0, skippedPages: 0, emptyPages: 0 });
    setRecentLogs([]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/scrape/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: discoveredUrls, storeId: effectiveStoreId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Kunne ikke starte skraping");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "progress") {
                setCurrent(data.current);
                setStats(data.stats);
                setRecentLogs((prev) => {
                  const newLog: LogEntry = {
                    url: data.url,
                    status: data.status,
                    chunks: data.chunks,
                    error: data.error,
                  };
                  return [newLog, ...prev].slice(0, 5);
                });
              } else if (data.type === "complete") {
                setPhase("complete");
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setPhase("input");
    setDiscoveredUrls([]);
  };

  const handleReset = () => {
    setPhase("input");
    setBaseUrl("");
    if (!externalStoreId) setStoreId("");
    setDiscoveredUrls([]);
    setCurrent(0);
    setTotal(0);
    setStats({ errors: 0, newPages: 0, updatedPages: 0, skippedPages: 0, emptyPages: 0 });
    setRecentLogs([]);
    setError("");
    setManualUrls("");
  };

  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Phase 1: Input */}
      {phase === "input" && (
        <div className="space-y-4">
          {!externalStoreId && (
            <div>
              <label className="block text-sm font-medium text-preik-text mb-1">
                Store ID
              </label>
              <input
                type="text"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="f.eks. min-butikk"
                className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">
              Nettside-URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
            />
          </div>
          <button
            onClick={handleDiscover}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Skanner...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Skann nettside
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-preik-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-preik-surface text-preik-text-muted">eller</span>
            </div>
          </div>

          <button
            onClick={() => setPhase("manual")}
            className="w-full py-2 px-4 border border-preik-border text-preik-text-muted rounded-xl hover:bg-preik-bg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Manuelle URL-er
          </button>
        </div>
      )}

      {/* Phase: Manual URL Input */}
      {phase === "manual" && (
        <div className="space-y-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-700 text-sm">
              <strong>SPA/GitHub Pages:</strong> Automatisk oppdaging fungerer ikke alltid for enkeltsideapplikasjoner. Lim inn URL-er manuelt nedenfor.
            </p>
          </div>

          {!externalStoreId && (
            <div>
              <label className="block text-sm font-medium text-preik-text mb-1">
                Store ID
              </label>
              <input
                type="text"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="f.eks. min-butikk"
                className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">
              URL-er (én per linje)
            </label>
            <textarea
              value={manualUrls}
              onChange={(e) => setManualUrls(e.target.value)}
              placeholder={"https://example.com/side-1\nhttps://example.com/side-2\nhttps://example.com/side-3"}
              rows={8}
              className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text placeholder:text-preik-text-muted font-mono text-sm focus:ring-preik-accent focus:border-preik-accent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhase("input")}
              className="flex-1 py-2 px-4 border border-preik-border text-preik-text-muted rounded-xl hover:bg-preik-bg transition-colors"
            >
              Tilbake
            </button>
            <button
              onClick={handleManualSubmit}
              className="flex-1 py-2 px-4 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Bruk disse URL-ene
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: Confirmation */}
      {phase === "confirm" && (
        <div className="space-y-4">
          <div className="p-4 bg-preik-accent/10 border border-preik-accent/20 rounded-xl">
            <p className="text-preik-text font-medium">
              Fant {discoveredUrls.length} sider
            </p>
            <p className="text-preik-text-muted text-sm mt-1">
              Klar til å skrape og indeksere innhold for: {effectiveStoreId}
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto bg-preik-bg rounded-xl p-4 text-sm">
            {discoveredUrls.slice(0, 20).map((url, i) => (
              <div key={i} className="text-preik-text-muted truncate">
                {url}
              </div>
            ))}
            {discoveredUrls.length > 20 && (
              <div className="text-preik-text-muted mt-2">
                ...og {discoveredUrls.length - 20} til
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 px-4 border border-preik-border text-preik-text-muted rounded-xl hover:bg-preik-bg transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleExecute}
              className="flex-1 py-2 px-4 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Start skraping
            </button>
          </div>
        </div>
      )}

      {/* Phase 3: Progress */}
      {phase === "progress" && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-preik-text-muted mb-1">
              <span>Fremdrift</span>
              <span>{current} / {total} sider ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-preik-bg rounded-full h-4">
              <div
                className="bg-preik-accent h-4 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            <div className="bg-green-500/10 p-2 rounded-xl">
              <div className="font-bold text-green-600">{stats.newPages}</div>
              <div className="text-green-600 text-xs">Nye</div>
            </div>
            <div className="bg-preik-accent/10 p-2 rounded-xl">
              <div className="font-bold text-preik-accent">{stats.updatedPages}</div>
              <div className="text-preik-accent text-xs">Oppdatert</div>
            </div>
            <div className="bg-preik-bg p-2 rounded-xl">
              <div className="font-bold text-preik-text-muted">{stats.skippedPages}</div>
              <div className="text-preik-text-muted text-xs">Uendret</div>
            </div>
            <div className="bg-yellow-500/10 p-2 rounded-xl">
              <div className="font-bold text-yellow-600">{stats.emptyPages}</div>
              <div className="text-yellow-600 text-xs">Tomme</div>
            </div>
            <div className="bg-red-500/10 p-2 rounded-xl">
              <div className="font-bold text-red-600">{stats.errors}</div>
              <div className="text-red-600 text-xs">Feil</div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-3 text-sm font-mono max-h-40 overflow-y-auto">
            {recentLogs.map((log, i) => (
              <div key={i} className="text-gray-300 truncate">
                <span
                  className={
                    log.status === "error"
                      ? "text-red-400"
                      : log.status === "new"
                      ? "text-green-400"
                      : log.status === "updated"
                      ? "text-blue-400"
                      : "text-gray-500"
                  }
                >
                  [{log.status}]
                </span>{" "}
                {log.url}
                {log.chunks ? ` (${log.chunks} chunks)` : ""}
                {log.status === "error" && log.error && (
                  <span className="block text-red-400/80 text-xs truncate">{log.error}</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleCancel}
            className="w-full py-2 px-4 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            Avbryt
          </button>
        </div>
      )}

      {/* Phase 4: Complete */}
      {phase === "complete" && (
        <div className="space-y-4">
          {stats.newPages === 0 && stats.updatedPages === 0 ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
              <svg className="h-12 w-12 text-yellow-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-600 font-medium text-lg">Ingen innhold ble lagt til</p>
              <p className="text-yellow-600/80 text-sm mt-1">
                {stats.emptyPages > 0
                  ? `${stats.emptyPages} sider returnerte tomt innhold. Nettsiden kan blokkere skraperen eller kreve JavaScript-rendering.`
                  : "Ingen nye eller oppdaterte sider funnet."}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <svg className="h-12 w-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-600 font-medium text-lg">Skraping fullført!</p>
              {stats.emptyPages > 0 && (
                <p className="text-yellow-600 text-sm mt-1">
                  {stats.emptyPages} sider returnerte tomt innhold og ble hoppet over.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            <div className="bg-green-500/10 p-2 rounded-xl">
              <div className="font-bold text-green-600">{stats.newPages}</div>
              <div className="text-green-600 text-xs">Nye</div>
            </div>
            <div className="bg-preik-accent/10 p-2 rounded-xl">
              <div className="font-bold text-preik-accent">{stats.updatedPages}</div>
              <div className="text-preik-accent text-xs">Oppdatert</div>
            </div>
            <div className="bg-preik-bg p-2 rounded-xl">
              <div className="font-bold text-preik-text-muted">{stats.skippedPages}</div>
              <div className="text-preik-text-muted text-xs">Uendret</div>
            </div>
            <div className="bg-yellow-500/10 p-2 rounded-xl">
              <div className="font-bold text-yellow-600">{stats.emptyPages}</div>
              <div className="text-yellow-600 text-xs">Tomme</div>
            </div>
            <div className="bg-red-500/10 p-2 rounded-xl">
              <div className="font-bold text-red-600">{stats.errors}</div>
              <div className="text-red-600 text-xs">Feil</div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2 px-4 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors"
          >
            Skrap en ny side
          </button>
        </div>
      )}
    </div>
  );
}
