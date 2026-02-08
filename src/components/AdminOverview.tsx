"use client";

import { useState, useEffect } from "react";
import type { AdminOverviewStats, ActiveTenant } from "@/types/admin";

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [activeTenants, setActiveTenants] = useState<ActiveTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunne ikke hente oversikt");
      setStats(data.stats);
      setActiveTenants(data.activeTenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke laste data");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-600 font-medium">Feil ved lasting</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-4 py-2 bg-red-500/10 text-red-600 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Totale kunder" value={stats.total_tenants} color="orange" />
        <StatCard label="Samtaler (all tid)" value={stats.total_conversations} color="purple" />
        <StatCard label="Samtaler (30d)" value={stats.conversations_30d} color="indigo" />
        <StatCard label="Totale dokumenter" value={stats.total_documents} color="green" />
      </div>

      {/* Warning: Tenants near limit */}
      {stats.tenants_near_limit > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-yellow-700 font-medium">
            {stats.tenants_near_limit} {stats.tenants_near_limit === 1 ? "kunde" : "kunder"} nærmer seg kredittgrensen
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            Over 80% av kredittgrensen er brukt opp.
          </p>
        </div>
      )}

      {/* Most Active Tenants */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <h3 className="text-lg font-medium text-preik-text mb-4">Mest aktive kunder (30 dager)</h3>
        {activeTenants.length === 0 ? (
          <p className="text-preik-text-muted text-sm">Ingen data ennå</p>
        ) : (
          <div className="space-y-3">
            {activeTenants.map((tenant, i) => (
              <div
                key={tenant.tenant_id}
                className="flex items-center justify-between py-2 px-3 bg-preik-bg rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-preik-text-muted w-6">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium text-preik-text">{tenant.tenant_name}</p>
                    <p className="text-xs text-preik-text-muted">{tenant.tenant_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-preik-text">{tenant.conversation_count}</p>
                    <p className="text-xs text-preik-text-muted">samtaler</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-preik-text">{tenant.credit_usage}</p>
                    <p className="text-xs text-preik-text-muted">kreditter brukt</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: {
  label: string;
  value: number;
  color: "orange" | "purple" | "indigo" | "green";
}) {
  const colors = {
    orange: "bg-orange-500/10 text-orange-600",
    purple: "bg-purple-500/10 text-purple-600",
    indigo: "bg-indigo-500/10 text-indigo-600",
    green: "bg-green-500/10 text-green-600",
  };

  return (
    <div className="bg-preik-surface p-4 rounded-2xl border border-preik-border">
      <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${colors[color]} mb-2`}>
        {label}
      </div>
      <div className="text-2xl font-bold text-preik-text">
        {value.toLocaleString("nb-NO")}
      </div>
    </div>
  );
}
