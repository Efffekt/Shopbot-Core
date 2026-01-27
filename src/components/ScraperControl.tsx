"use client";

import { useState, useRef } from "react";

type Phase = "input" | "manual" | "confirm" | "progress" | "complete";

interface Stats {
  errors: number;
  newPages: number;
  updatedPages: number;
  skippedPages: number;
}

interface LogEntry {
  url: string;
  status: string;
  chunks?: number;
}

export default function ScraperControl() {
  const [phase, setPhase] = useState<Phase>("input");
  const [baseUrl, setBaseUrl] = useState("");
  const [storeId, setStoreId] = useState("");
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
  });
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const handleManualSubmit = () => {
    if (!storeId) {
      setError("Please enter Store ID");
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
      setError("No valid URLs found. Enter one URL per line.");
      return;
    }

    setError("");
    setDiscoveredUrls(urls);
    setPhase("confirm");
  };

  const handleDiscover = async () => {
    if (!baseUrl || !storeId) {
      setError("Please enter both URL and Store ID");
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
        throw new Error(data.error || "Discovery failed");
      }

      setDiscoveredUrls(data.urls);
      setPhase("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    setPhase("progress");
    setCurrent(0);
    setTotal(discoveredUrls.length);
    setStats({ errors: 0, newPages: 0, updatedPages: 0, skippedPages: 0 });
    setRecentLogs([]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/scrape/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: discoveredUrls, storeId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start scraping");
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
                  const newLog = {
                    url: data.url,
                    status: data.status,
                    chunks: data.chunks,
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
    setStoreId("");
    setDiscoveredUrls([]);
    setCurrent(0);
    setTotal(0);
    setStats({ errors: 0, newPages: 0, updatedPages: 0, skippedPages: 0 });
    setRecentLogs([]);
    setError("");
    setManualUrls("");
  };

  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Site Scraper</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Phase 1: Input */}
      {phase === "input" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store ID
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="e.g., my-store"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleDiscover}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
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
                Scanning...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan Site
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => setPhase("manual")}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Manual URL Input (for SPAs)
          </button>
        </div>
      )}

      {/* Phase: Manual URL Input */}
      {phase === "manual" && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm">
              <strong>SPA/GitHub Pages Mode:</strong> Auto-discovery may not work for single-page applications. Paste URLs manually below.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store ID
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="e.g., my-store"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URLs (one per line)
            </label>
            <textarea
              value={manualUrls}
              onChange={(e) => setManualUrls(e.target.value)}
              placeholder="https://example.github.io/docs/&#10;https://example.github.io/docs/getting-started&#10;https://example.github.io/docs/components"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhase("input")}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={handleManualSubmit}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Use These URLs
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: Confirmation */}
      {phase === "confirm" && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 font-medium">
              Discovered {discoveredUrls.length} pages
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Ready to scrape and index content for Store: {storeId}
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-md p-3 text-sm">
            {discoveredUrls.slice(0, 20).map((url, i) => (
              <div key={i} className="text-gray-600 truncate">
                {url}
              </div>
            ))}
            {discoveredUrls.length > 20 && (
              <div className="text-gray-400 mt-2">
                ...and {discoveredUrls.length - 20} more
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Start Scraping
            </button>
          </div>
        </div>
      )}

      {/* Phase 3: Progress */}
      {phase === "progress" && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{current} / {total} pages ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="bg-green-50 p-2 rounded">
              <div className="font-bold text-green-700">{stats.newPages}</div>
              <div className="text-green-600">New</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-bold text-blue-700">{stats.updatedPages}</div>
              <div className="text-blue-600">Updated</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-bold text-gray-700">{stats.skippedPages}</div>
              <div className="text-gray-600">Skipped</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="font-bold text-red-700">{stats.errors}</div>
              <div className="text-red-600">Errors</div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-md p-3 text-sm font-mono max-h-40 overflow-y-auto">
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
              </div>
            ))}
          </div>

          <button
            onClick={handleCancel}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Phase 4: Complete */}
      {phase === "complete" && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
            <svg className="h-12 w-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-medium text-lg">Scraping Complete!</p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="bg-green-50 p-2 rounded">
              <div className="font-bold text-green-700">{stats.newPages}</div>
              <div className="text-green-600">New</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-bold text-blue-700">{stats.updatedPages}</div>
              <div className="text-blue-600">Updated</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-bold text-gray-700">{stats.skippedPages}</div>
              <div className="text-gray-600">Skipped</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="font-bold text-red-700">{stats.errors}</div>
              <div className="text-red-600">Errors</div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Scrape Another Site
          </button>
        </div>
      )}
    </div>
  );
}
