"use client";

import { useState, useEffect, useCallback } from "react";
import type { ConversationRecord } from "@/types/admin";
import { createLogger } from "@/lib/logger";

const log = createLogger("TenantConversationBrowser");

interface TenantConversationBrowserProps {
  tenantId: string;
}

export default function TenantConversationBrowser({ tenantId }: TenantConversationBrowserProps) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [intent, setIntent] = useState("all");
  const [handled, setHandled] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (intent !== "all") params.set("intent", intent);
      if (handled !== "all") params.set("wasHandled", handled);

      const res = await fetch(`/api/tenant/${tenantId}/conversations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConversations(data.conversations || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      log.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, page, search, intent, handled]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  function handleSearch() {
    setPage(1);
    fetchConversations();
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Søk i brukerhenvendelser..."
              className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
            />
          </div>
          <select
            value={intent}
            onChange={(e) => { setIntent(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
          >
            <option value="all">Alle typer</option>
            <option value="product_query">Produktspørsmål</option>
            <option value="support">Support</option>
            <option value="general">Generelt</option>
            <option value="unknown">Ukjent</option>
          </select>
          <select
            value={handled}
            onChange={(e) => { setHandled(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
          >
            <option value="all">Alle</option>
            <option value="true">Besvart</option>
            <option value="false">Ikke besvart</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-preik-accent text-white rounded-xl text-sm font-medium hover:bg-preik-accent-hover transition-colors"
          >
            Søk
          </button>
        </div>
        <p className="text-xs text-preik-text-muted mt-2">{total} samtaler funnet</p>
      </div>

      {/* Conversations List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 text-center">
          <p className="text-preik-text-muted">Ingen samtaler funnet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-preik-surface rounded-2xl border border-preik-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                className="w-full p-4 text-left hover:bg-preik-bg transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-preik-text truncate">
                      &ldquo;{conv.user_query}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conv.was_handled
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {conv.was_handled ? "Besvart" : "Ikke besvart"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-preik-bg text-preik-text-muted">
                        {conv.detected_intent}
                      </span>
                      {conv.referred_to_email && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                          E-post henvist
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-preik-text-muted whitespace-nowrap">
                    {new Date(conv.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              </button>

              {expandedId === conv.id && conv.ai_response && (
                <div className="px-4 pb-4 border-t border-preik-border pt-3">
                  <p className="text-xs font-medium text-preik-text-muted mb-1">AI-svar:</p>
                  <p className="text-sm text-preik-text whitespace-pre-wrap">{conv.ai_response}</p>
                  {conv.session_id && (
                    <p className="text-xs text-preik-text-muted mt-2">Session: {conv.session_id}</p>
                  )}

                  {conv.metadata && Object.keys(conv.metadata).length > 0 && (() => {
                    const meta = conv.metadata;
                    const timings = meta.timings as Record<string, number> | undefined;
                    const fmtMs = (ms: number) => ms >= 1000
                      ? `${(ms / 1000).toFixed(1).replace(".", ",")} s`
                      : `${Math.round(ms)} ms`;
                    return (
                      <div className="mt-3 pt-3 border-t border-preik-border">
                        <p className="text-xs font-medium text-preik-text-muted mb-2">Detaljer</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {meta.model != null && (
                            <div className="bg-preik-bg rounded-lg px-3 py-2">
                              <p className="text-[11px] text-preik-text-muted">Modell</p>
                              <p className="text-xs font-medium text-preik-text">{String(meta.model)}</p>
                            </div>
                          )}
                          {meta.docsFound != null && (
                            <div className="bg-preik-bg rounded-lg px-3 py-2">
                              <p className="text-[11px] text-preik-text-muted">Dokumenter funnet</p>
                              <p className="text-xs font-medium text-preik-text">{String(meta.docsFound)}</p>
                            </div>
                          )}
                          {meta.nonStreaming != null && (
                            <div className="bg-preik-bg rounded-lg px-3 py-2">
                              <p className="text-[11px] text-preik-text-muted">Modus</p>
                              <p className="text-xs font-medium text-preik-text">{meta.nonStreaming ? "Non-streaming" : "Streaming"}</p>
                            </div>
                          )}
                          {timings?.total != null && (
                            <div className="bg-preik-bg rounded-lg px-3 py-2">
                              <p className="text-[11px] text-preik-text-muted">Total responstid</p>
                              <p className="text-xs font-medium text-preik-text">{fmtMs(timings.total)}</p>
                            </div>
                          )}
                          {timings?.vectorSearch != null && (
                            <div className="bg-preik-bg rounded-lg px-3 py-2">
                              <p className="text-[11px] text-preik-text-muted">Vektorsøk</p>
                              <p className="text-xs font-medium text-preik-text">{fmtMs(timings.vectorSearch)}</p>
                            </div>
                          )}
                          {timings?.aiTotal != null && (
                            <div className="bg-preik-bg rounded-lg px-3 py-2">
                              <p className="text-[11px] text-preik-text-muted">AI-generering</p>
                              <p className="text-xs font-medium text-preik-text">{fmtMs(timings.aiTotal)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-preik-surface border border-preik-border rounded-xl text-sm text-preik-text hover:bg-preik-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Forrige
            </button>
            <span className="text-sm text-preik-text-muted">
              Side {page} av {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-preik-surface border border-preik-border rounded-xl text-sm text-preik-text hover:bg-preik-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Neste
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
