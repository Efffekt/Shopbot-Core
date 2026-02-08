"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
}

export default function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchSubmissions(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact-submissions?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSubmissions(page);
  }, [page]);

  async function handleDelete(id: string) {
    if (!confirm("Er du sikker på at du vil slette denne henvendelsen?")) return;
    const res = await fetch("/api/admin/contact-submissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setTotal((prev) => prev - 1);
    }
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

  if (loading && submissions.length === 0) {
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
          Henvendelser ({total})
        </h2>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-12 text-center">
          <p className="text-preik-text-muted">Ingen henvendelser ennå.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-preik-surface rounded-2xl border border-preik-border overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-preik-text truncate">
                      {sub.name}
                      {sub.company && (
                        <span className="text-preik-text-muted font-normal"> — {sub.company}</span>
                      )}
                    </p>
                    <p className="text-sm text-preik-text-muted truncate">{sub.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-preik-text-muted">{formatDate(sub.created_at)}</span>
                  <svg
                    className={`w-4 h-4 text-preik-text-muted transition-transform ${expanded === sub.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expanded === sub.id && (
                <div className="px-6 pb-4 border-t border-preik-border pt-4">
                  <p className="text-sm text-preik-text whitespace-pre-wrap mb-4">{sub.message}</p>
                  <div className="flex items-center gap-3">
                    <a
                      href={`mailto:${sub.email}`}
                      className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
                    >
                      Svar via e-post
                    </a>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-sm text-red-500 hover:text-red-600 transition-colors"
                    >
                      Slett
                    </button>
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
