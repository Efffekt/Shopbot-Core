"use client";

import { useState, useEffect, useCallback } from "react";
import type { ConversationRecord } from "@/types/admin";

interface ConversationBrowserProps {
  selectedTenantId?: string | null;
  selectedTenantName?: string | null;
}

interface Tenant {
  id: string;
  name: string;
}

export default function ConversationBrowser({ selectedTenantId, selectedTenantName }: ConversationBrowserProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState(selectedTenantId || "");
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

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) setCurrentTenantId(selectedTenantId);
  }, [selectedTenantId]);

  const fetchConversations = useCallback(async () => {
    if (!currentTenantId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        storeId: currentTenantId,
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (intent !== "all") params.set("intent", intent);
      if (handled !== "all") params.set("wasHandled", handled);

      const res = await fetch(`/api/admin/conversations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConversations(data.conversations || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenantId, page, search, intent, handled]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    }
  }

  function handleSearch() {
    setPage(1);
    fetchConversations();
  }

  const currentTenantName = selectedTenantName || tenants.find(t => t.id === currentTenantId)?.name || currentTenantId;

  return (
    <div className="space-y-6">
      {/* Tenant Selector */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-preik-text whitespace-nowrap">Kunde:</label>
          <select
            value={currentTenantId}
            onChange={(e) => { setCurrentTenantId(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-preik-text focus:ring-preik-accent focus:border-preik-accent"
          >
            <option value="">Velg kunde...</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
            ))}
          </select>
        </div>
        {currentTenantId && (
          <p className="text-xs text-preik-text-muted mt-2">
            Viser samtaler for: <span className="font-medium text-preik-text">{currentTenantName}</span>
          </p>
        )}
      </div>

      {!currentTenantId ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 text-center">
          <p className="text-preik-text-muted">Velg en kunde for å se samtaler.</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
