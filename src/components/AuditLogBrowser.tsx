"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ENTITY_TYPES = [
  { value: "", label: "Alle" },
  { value: "tenant", label: "Kunder" },
  { value: "user", label: "Brukere" },
  { value: "credits", label: "Kreditter" },
];

export default function AuditLogBrowser() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");

  async function fetchLog(p: number, et: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (et) params.set("entityType", et);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLog(page, entityType);
  }, [page, entityType]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function actionLabel(action: string): string {
    const labels: Record<string, string> = {
      "tenant.create": "Opprettet kunde",
      "tenant.delete": "Slettet kunde",
      "credits.reset": "Nullstilt kreditter",
      "user.invite": "Invitert bruker",
    };
    return labels[action] || action;
  }

  if (loading && entries.length === 0) {
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
          Aktivitetslogg ({total})
        </h2>
        <div className="flex gap-2">
          {ENTITY_TYPES.map((et) => (
            <button
              key={et.value}
              onClick={() => { setEntityType(et.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                entityType === et.value
                  ? "bg-preik-accent text-white"
                  : "bg-preik-surface border border-preik-border text-preik-text-muted hover:text-preik-text"
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-12 text-center">
          <p className="text-preik-text-muted">Ingen loggoppføringer funnet.</p>
        </div>
      ) : (
        <div className="bg-preik-surface rounded-2xl border border-preik-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-preik-border">
                <th className="text-left px-4 py-3 text-preik-text-muted font-medium">Tidspunkt</th>
                <th className="text-left px-4 py-3 text-preik-text-muted font-medium">Bruker</th>
                <th className="text-left px-4 py-3 text-preik-text-muted font-medium">Handling</th>
                <th className="text-left px-4 py-3 text-preik-text-muted font-medium">Detaljer</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-preik-border last:border-0">
                  <td className="px-4 py-3 text-preik-text-muted whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 text-preik-text truncate max-w-[200px]">
                    {entry.actor_email}
                  </td>
                  <td className="px-4 py-3 text-preik-text">
                    {actionLabel(entry.action)}
                  </td>
                  <td className="px-4 py-3 text-preik-text-muted text-xs">
                    {entry.entity_id && (
                      <span className="font-mono bg-preik-bg px-1.5 py-0.5 rounded">
                        {entry.entity_id}
                      </span>
                    )}
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <span className="ml-2">
                        {Object.entries(entry.details)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
