"use client";

import { useState, useEffect, useCallback } from "react";
import type { ConversationRecord, ConversationFeedback, FeedbackCategory } from "@/types/admin";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from "@/lib/logger";

const log = createLogger("TenantConversationBrowser");

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feil_svar: "Feil svar",
  manglende_info: "Manglende info",
  feil_lenke: "Feil lenke",
  annet: "Annet",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Ny",
  reviewed: "Under behandling",
  resolved: "Lost",
};

interface TenantConversationBrowserProps {
  tenantId: string;
  isAdmin?: boolean;
}

export default function TenantConversationBrowser({ tenantId, isAdmin = false }: TenantConversationBrowserProps) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, ConversationFeedback[]>>({});

  // Feedback form state
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>("feil_svar");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [intent, setIntent] = useState("all");
  const [handled, setHandled] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Delete state
  const [pendingDeleteSession, setPendingDeleteSession] = useState<string | null>(null);
  const [pendingDeleteBefore, setPendingDeleteBefore] = useState<string | null>(null);
  const [deleteBeforeDate, setDeleteBeforeDate] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchFeedback = useCallback(async (convIds: string[]) => {
    if (convIds.length === 0) return;
    try {
      const res = await fetch(
        `/api/tenant/${tenantId}/feedback?conversationIds=${convIds.join(",")}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, ConversationFeedback[]> = {};
      for (const fb of data.feedback || []) {
        if (!map[fb.conversation_id]) map[fb.conversation_id] = [];
        map[fb.conversation_id].push(fb);
      }
      setFeedbackMap(map);
    } catch (error) {
      log.error("Failed to fetch feedback:", error);
    }
  }, [tenantId]);

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

      const convs: ConversationRecord[] = data.conversations || [];
      setConversations(convs);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);

      // Batch-fetch feedback for displayed conversations
      const ids = convs.map((c) => c.id);
      await fetchFeedback(ids);
    } catch (error) {
      log.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, page, search, intent, handled, fetchFeedback]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  function handleSearch() {
    setPage(1);
    fetchConversations();
  }

  async function handleSubmitFeedback(conversationId: string) {
    if (!feedbackComment.trim()) return;
    setSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          category: feedbackCategory,
          comment: feedbackComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackError(data.error || "Kunne ikke sende tilbakemelding");
        return;
      }
      // Update local feedbackMap
      setFeedbackMap((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), data.feedback],
      }));
      setShowFeedbackForm(null);
      setFeedbackComment("");
      setFeedbackCategory("feil_svar");
    } catch {
      setFeedbackError("Noe gikk galt. Prov igjen.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleDeleteBySession(sessionId: string) {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/tenant/${tenantId}/conversations?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        log.error("Failed to delete session:", data.error);
        return;
      }
      // Remove deleted conversations from local state
      setConversations(prev => prev.filter(c => c.session_id !== sessionId));
      setExpandedId(null);
    } catch (error) {
      log.error("Failed to delete conversation:", error);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteBefore(dateStr: string) {
    setDeleting(true);
    try {
      const beforeDate = new Date(dateStr);
      const res = await fetch(
        `/api/tenant/${tenantId}/conversations?before=${beforeDate.toISOString()}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        log.error("Failed to delete conversations:", data.error);
        return;
      }
      const data = await res.json();
      log.info(`Deleted ${data.deleted} conversations before ${dateStr}`);
      setDeleteBeforeDate("");
      fetchConversations();
    } catch (error) {
      log.error("Failed to delete conversations:", error);
    } finally {
      setDeleting(false);
    }
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
              placeholder="Sok i brukerhenvendelser..."
              className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
            />
          </div>
          <select
            value={intent}
            onChange={(e) => { setIntent(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
          >
            <option value="all">Alle typer</option>
            <option value="product_query">Produktsporsmal</option>
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
            Sok
          </button>
        </div>
        <p className="text-xs text-preik-text-muted mt-2">{total} samtaler funnet</p>
        {isAdmin && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-preik-border">
            <input
              type="date"
              value={deleteBeforeDate}
              onChange={(e) => setDeleteBeforeDate(e.target.value)}
              className="px-3 py-1.5 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
            />
            <button
              onClick={() => {
                if (deleteBeforeDate) setPendingDeleteBefore(deleteBeforeDate);
              }}
              disabled={!deleteBeforeDate || deleting}
              className="px-3 py-1.5 bg-red-500/10 text-red-600 text-sm rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Slett samtaler for dato
            </button>
          </div>
        )}
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
          {conversations.map((conv) => {
            const convFeedback = feedbackMap[conv.id] || [];
            const hasFeedback = convFeedback.length > 0;

            return (
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
                        {hasFeedback && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                            Tilbakemelding sendt
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
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-preik-text-muted">Session: {conv.session_id}</p>
                        {isAdmin && (
                          <button
                            onClick={() => setPendingDeleteSession(conv.session_id)}
                            disabled={deleting}
                            className="px-2 py-1 bg-red-500/10 text-red-600 text-xs rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40"
                          >
                            Slett samtale
                          </button>
                        )}
                      </div>
                    )}

                    {conv.metadata && Object.keys(conv.metadata).length > 0 && (() => {
                      const meta = conv.metadata;
                      const metaSources = meta.sources as { url: string; snippet: string; similarity: number }[] | undefined;
                      const timings = meta.timings as Record<string, number> | undefined;
                      const fmtMs = (ms: number) => ms >= 1000
                        ? `${(ms / 1000).toFixed(1).replace(".", ",")} s`
                        : `${Math.round(ms)} ms`;
                      return (
                        <>
                          {/* Source Attribution */}
                          {metaSources && metaSources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-preik-border">
                              <p className="text-xs font-medium text-preik-text-muted mb-2">Kilder ({metaSources.length})</p>
                              <div className="space-y-2">
                                {metaSources.map((src, i) => (
                                  <div key={i} className="bg-preik-bg rounded-xl px-3 py-2.5 border border-preik-border">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        {src.url && src.url.startsWith("http") ? (
                                          <a
                                            href={src.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-medium text-preik-accent hover:text-preik-accent-hover transition-colors break-all"
                                          >
                                            {src.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80)}
                                            {src.url.replace(/^https?:\/\/(www\.)?/, "").length > 80 ? "..." : ""}
                                          </a>
                                        ) : (
                                          <span className="text-xs font-medium text-preik-text">
                                            {src.url || "Manuelt innhold"}
                                          </span>
                                        )}
                                        <p className="text-[11px] text-preik-text-muted mt-1 line-clamp-2">
                                          {src.snippet}...
                                        </p>
                                      </div>
                                      <span className="text-[10px] text-preik-text-muted whitespace-nowrap bg-preik-surface px-1.5 py-0.5 rounded">
                                        {Math.round(src.similarity * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Details */}
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
                                  <p className="text-[11px] text-preik-text-muted">Vektorsok</p>
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
                        </>
                      );
                    })()}

                    {/* Feedback Section */}
                    <div className="mt-3 pt-3 border-t border-preik-border">
                      {hasFeedback ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-preik-text-muted">Tilbakemelding</p>
                          {convFeedback.map((fb) => (
                            <div key={fb.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                  {CATEGORY_LABELS[fb.category]}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  fb.status === "new"
                                    ? "bg-blue-500/10 text-blue-600"
                                    : fb.status === "reviewed"
                                      ? "bg-yellow-500/10 text-yellow-600"
                                      : "bg-green-500/10 text-green-600"
                                }`}>
                                  {STATUS_LABELS[fb.status]}
                                </span>
                                <span className="text-[11px] text-preik-text-muted ml-auto">
                                  {new Date(fb.created_at).toLocaleDateString("nb-NO", {
                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-preik-text">{fb.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : showFeedbackForm === conv.id ? (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-preik-text-muted">Gi tilbakemelding</p>
                          <select
                            value={feedbackCategory}
                            onChange={(e) => setFeedbackCategory(e.target.value as FeedbackCategory)}
                            className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
                          >
                            <option value="feil_svar">Feil svar</option>
                            <option value="manglende_info">Manglende info</option>
                            <option value="feil_lenke">Feil lenke</option>
                            <option value="annet">Annet</option>
                          </select>
                          <textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="Beskriv hva som bor forbedres..."
                            rows={3}
                            className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent resize-none"
                          />
                          {feedbackError && (
                            <p className="text-xs text-red-500">{feedbackError}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSubmitFeedback(conv.id)}
                              disabled={submittingFeedback || !feedbackComment.trim()}
                              className="px-4 py-2 bg-preik-accent text-white rounded-xl text-sm font-medium hover:bg-preik-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {submittingFeedback ? "Sender..." : "Send"}
                            </button>
                            <button
                              onClick={() => {
                                setShowFeedbackForm(null);
                                setFeedbackComment("");
                                setFeedbackError(null);
                              }}
                              className="px-4 py-2 bg-preik-surface border border-preik-border rounded-xl text-sm text-preik-text hover:bg-preik-bg transition-colors"
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowFeedbackForm(conv.id)}
                          className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
                        >
                          Gi tilbakemelding
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

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
      {/* Delete confirmation dialogs */}
      <ConfirmDialog
        open={!!pendingDeleteSession}
        title="Slett samtale"
        description={`Slett alle meldinger i denne sesjonen? Dette kan ikke angres.`}
        confirmLabel="Slett"
        onConfirm={() => {
          if (pendingDeleteSession) handleDeleteBySession(pendingDeleteSession);
          setPendingDeleteSession(null);
        }}
        onCancel={() => setPendingDeleteSession(null)}
      />
      <ConfirmDialog
        open={!!pendingDeleteBefore}
        title="Slett samtaler for dato"
        description={`Slett alle samtaler for ${pendingDeleteBefore ? new Date(pendingDeleteBefore).toLocaleDateString("nb-NO") : ""}? Dette kan ikke angres.`}
        confirmLabel="Slett"
        onConfirm={() => {
          if (pendingDeleteBefore) handleDeleteBefore(pendingDeleteBefore);
          setPendingDeleteBefore(null);
        }}
        onCancel={() => setPendingDeleteBefore(null)}
      />
    </div>
  );
}
