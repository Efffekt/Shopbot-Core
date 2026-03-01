"use client";

import { useState, useEffect, useCallback } from "react";
import type { FeedbackTicket, FeedbackCategory, FeedbackStatus } from "@/types/admin";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feil_svar: "Feil svar",
  manglende_info: "Manglende info",
  feil_lenke: "Feil lenke",
  annet: "Annet",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Alle" },
  { value: "new", label: "Nye" },
  { value: "reviewed", label: "Under behandling" },
  { value: "resolved", label: "Loste" },
];

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Alle kategorier" },
  { value: "feil_svar", label: "Feil svar" },
  { value: "manglende_info", label: "Manglende info" },
  { value: "feil_lenke", label: "Feil lenke" },
  { value: "annet", label: "Annet" },
];

export default function FeedbackBrowser() {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Admin note editing
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/admin/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTickets(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchTickets]);

  async function handleUpdateStatus(ticketId: string, status: FeedbackStatus, note?: string) {
    setUpdating(true);
    try {
      const body: Record<string, unknown> = { id: ticketId, status };
      if (note !== undefined) body.adminNote = note;

      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: data.ticket.status, admin_note: data.ticket.admin_note, updated_at: data.ticket.updated_at }
              : t
          )
        );
        setEditingNote(null);
      }
    } catch {
      // ignore
    }
    setUpdating(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusBadge(status: FeedbackStatus) {
    const styles: Record<FeedbackStatus, string> = {
      new: "bg-blue-500/10 text-blue-600",
      reviewed: "bg-yellow-500/10 text-yellow-600",
      resolved: "bg-green-500/10 text-green-600",
    };
    const labels: Record<FeedbackStatus, string> = {
      new: "Ny",
      reviewed: "Under behandling",
      resolved: "Lost",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }

  function categoryBadge(category: FeedbackCategory) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
        {CATEGORY_LABELS[category]}
      </span>
    );
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-preik-text">
          Tilbakemeldinger ({total})
        </h2>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.value}
              onClick={() => { setStatusFilter(sf.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === sf.value
                  ? "bg-preik-accent text-white"
                  : "bg-preik-surface border border-preik-border text-preik-text-muted hover:text-preik-text"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
        >
          {CATEGORY_FILTERS.map((cf) => (
            <option key={cf.value} value={cf.value}>{cf.label}</option>
          ))}
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-12 text-center">
          <p className="text-preik-text-muted">Ingen tilbakemeldinger funnet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-preik-surface rounded-2xl border border-preik-border overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-preik-bg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.tenant_name && (
                      <span className="text-xs font-medium text-preik-accent">
                        {ticket.tenant_name}
                      </span>
                    )}
                    {categoryBadge(ticket.category)}
                    {statusBadge(ticket.status)}
                  </div>
                  <p className="text-sm text-preik-text truncate">
                    {ticket.conversation?.user_query
                      ? `"${ticket.conversation.user_query}"`
                      : "Samtale slettet"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-preik-text-muted">{formatDate(ticket.created_at)}</span>
                  <svg
                    className={`w-4 h-4 text-preik-text-muted transition-transform ${expanded === ticket.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expanded === ticket.id && (
                <div className="px-6 pb-4 border-t border-preik-border pt-4 space-y-4">
                  {/* Conversation details */}
                  {ticket.conversation && (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-preik-text-muted mb-1">Brukerens sporsmal:</p>
                        <p className="text-sm text-preik-text">{ticket.conversation.user_query}</p>
                      </div>
                      {ticket.conversation.ai_response && (
                        <div>
                          <p className="text-xs font-medium text-preik-text-muted mb-1">AI-svar:</p>
                          <p className="text-sm text-preik-text whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {ticket.conversation.ai_response}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback comment */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-xs font-medium text-preik-text-muted mb-1">Tilbakemelding fra {ticket.created_by_email}:</p>
                    <p className="text-sm text-preik-text">{ticket.comment}</p>
                  </div>

                  {/* Admin note */}
                  <div>
                    <p className="text-xs font-medium text-preik-text-muted mb-1">Admin-notat:</p>
                    {editingNote === ticket.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Skriv et notat..."
                          rows={3}
                          className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, ticket.status, adminNote)}
                            disabled={updating}
                            className="px-3 py-1.5 text-xs bg-preik-accent text-white rounded-lg hover:bg-preik-accent-hover transition-colors disabled:opacity-40"
                          >
                            Lagre notat
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="px-3 py-1.5 text-xs bg-preik-surface border border-preik-border rounded-lg text-preik-text hover:bg-preik-bg transition-colors"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-preik-text-muted flex-1">
                          {ticket.admin_note || "Ingen notat enna."}
                        </p>
                        <button
                          onClick={() => {
                            setEditingNote(ticket.id);
                            setAdminNote(ticket.admin_note || "");
                          }}
                          className="text-xs text-preik-accent hover:text-preik-accent-hover transition-colors flex-shrink-0"
                        >
                          Rediger
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-preik-border">
                    {ticket.status === "new" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "reviewed")}
                        disabled={updating}
                        className="px-4 py-2 text-sm bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-colors disabled:opacity-40"
                      >
                        Marker som gjennomgatt
                      </button>
                    )}
                    {(ticket.status === "new" || ticket.status === "reviewed") && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "resolved")}
                        disabled={updating}
                        className="px-4 py-2 text-sm bg-green-500/10 text-green-700 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors disabled:opacity-40"
                      >
                        Marker som lost
                      </button>
                    )}
                    {ticket.status === "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "new")}
                        disabled={updating}
                        className="px-4 py-2 text-sm bg-preik-surface border border-preik-border rounded-xl text-preik-text-muted hover:bg-preik-bg transition-colors disabled:opacity-40"
                      >
                        Gjenåpne
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-preik-surface border border-preik-border text-preik-text disabled:opacity-50"
          >
            Forrige
          </button>
          <span className="text-sm text-preik-text-muted">
            Side {page} av {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-preik-surface border border-preik-border text-preik-text disabled:opacity-50"
          >
            Neste
          </button>
        </div>
      )}
    </div>
  );
}
