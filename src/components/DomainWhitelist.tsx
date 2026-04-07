"use client";

import { useState, useEffect } from "react";

export function DomainWhitelist({ tenantId }: { tenantId: string }) {
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tenant/${tenantId}/domains`)
      .then((r) => r.json())
      .then((data) => setDomains(data.domains || []))
      .catch(() => setError("Kunne ikke laste domener"));
  }, [tenantId]);

  const normalizeDomain = (input: string) =>
    input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const saveDomains = async (updated: string[]) => {
    setSaving(true);
    setError(null);
    const prev = domains;
    setDomains(updated); // optimistic

    try {
      const res = await fetch(`/api/tenant/${tenantId}/domains`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: updated }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Feil ved lagring");
      }
    } catch (err) {
      setDomains(prev); // rollback
      setError(err instanceof Error ? err.message : "Feil ved lagring");
    } finally {
      setSaving(false);
    }
  };

  const addDomain = () => {
    const domain = normalizeDomain(newDomain);
    if (!domain) return;
    if (domains.includes(domain)) {
      setError("Domenet er allerede lagt til");
      return;
    }
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?$/.test(domain)) {
      setError("Ugyldig domeneformat (f.eks. minbutikk.no)");
      return;
    }
    setNewDomain("");
    saveDomains([...domains, domain]);
  };

  const removeDomain = (domain: string) => {
    saveDomains(domains.filter((d) => d !== domain));
  };

  return (
    <div className="bg-preik-bg rounded-xl p-4">
      <h3 className="text-sm font-medium text-preik-text-muted mb-3">Tillatte domener</h3>

      {domains.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {domains.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-preik-surface border border-preik-border rounded-lg text-sm text-preik-text"
            >
              {d}
              <button
                onClick={() => removeDomain(d)}
                disabled={saving}
                className="text-preik-text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                title="Fjern"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-preik-text-muted mb-3">Ingen domener konfigurert enda.</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => { setNewDomain(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") addDomain(); }}
          placeholder="minbutikk.no"
          className="flex-1 bg-preik-surface border border-preik-border rounded-lg px-3 py-2 text-sm text-preik-text placeholder:text-preik-text-muted/50 outline-none focus:ring-2 focus:ring-preik-accent/40"
        />
        <button
          onClick={addDomain}
          disabled={saving || !newDomain.trim()}
          className="px-4 py-2 bg-preik-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Legg til
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
