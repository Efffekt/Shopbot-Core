"use client";

import { useState, useEffect } from "react";

interface Stats {
  total_conversations: number;
  handled_count: number;
  unhandled_count: number;
  email_referrals: number;
  product_queries: number;
  support_queries: number;
  handled_rate: number;
}

interface SearchTerm {
  term: string;
  count: number;
}

interface UnansweredQuery {
  id: string;
  created_at: string;
  user_query: string;
  ai_response: string;
}

interface DailyVolume {
  date: string;
  count: number;
}

interface CreditStatus {
  creditLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  percentUsed: number;
  billingCycleStart: string;
  billingCycleEnd: string;
}

interface AnalyticsData {
  stats: Stats;
  topSearchTerms: SearchTerm[];
  unansweredQueries: UnansweredQuery[];
  dailyVolume: DailyVolume[];
  documentCount: number;
  period: string;
  credits: CreditStatus | null;
}

interface TenantAnalyticsDashboardProps {
  tenantId: string;
}

export default function TenantAnalyticsDashboard({ tenantId }: TenantAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tenant/${tenantId}/stats?days=${days}`);
        if (!response.ok) {
          throw new Error("Kunne ikke hente analyse");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunne ikke laste analyse");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [tenantId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-preik-text-muted">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Laster analyse...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const maxVolume = Math.max(...data.dailyVolume.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-preik-text-muted">Periode:</span>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="bg-preik-bg border border-preik-border rounded-xl px-4 py-2 text-sm text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
        >
          <option value={7}>Siste 7 dager</option>
          <option value={30}>Siste 30 dager</option>
          <option value={90}>Siste 90 dager</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-preik-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-preik-text">
            {data.stats.total_conversations}
          </div>
          <div className="text-sm text-preik-text-muted">Totale samtaler</div>
        </div>

        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-preik-text">
            {data.stats.handled_rate}%
          </div>
          <div className="text-sm text-preik-text-muted">Besvart</div>
        </div>

        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-preik-text">
            {data.stats.unhandled_count}
          </div>
          <div className="text-sm text-preik-text-muted">Ubesvarte</div>
        </div>

        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-preik-text">
            {data.documentCount}
          </div>
          <div className="text-sm text-preik-text-muted">Dokumenter</div>
        </div>

        {data.credits && (
          <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                data.credits.percentUsed > 80
                  ? "bg-red-500/10"
                  : data.credits.percentUsed > 60
                    ? "bg-yellow-500/10"
                    : "bg-green-500/10"
              }`}>
                <svg className={`w-5 h-5 ${
                  data.credits.percentUsed > 80
                    ? "text-red-500"
                    : data.credits.percentUsed > 60
                      ? "text-yellow-500"
                      : "text-green-500"
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-preik-text">
              {data.credits.percentUsed}%
            </div>
            <div className="text-sm text-preik-text-muted">Kreditter brukt</div>
          </div>
        )}
      </div>

      {/* Daily volume chart */}
      <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
        <h3 className="text-base font-semibold text-preik-text mb-4">
          Daglig samtalevolum
        </h3>
        {data.dailyVolume.length > 0 ? (
          <div>
            <div className="flex items-end gap-[2px] h-32 overflow-hidden">
              {data.dailyVolume.map((day) => {
                const heightPx = maxVolume > 0
                  ? Math.max((day.count / maxVolume) * 128, day.count > 0 ? 10 : 3)
                  : 3;
                return (
                  <div
                    key={day.date}
                    className="flex-1 group relative"
                    title={`${day.date}: ${day.count} samtaler`}
                  >
                    <div
                      className="w-full bg-preik-accent rounded-sm transition-all group-hover:bg-preik-accent-hover"
                      style={{ height: `${heightPx}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-preik-surface border border-preik-border rounded text-xs text-preik-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {day.count} samtaler
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-preik-text-muted">
                {data.dailyVolume[0]?.date.slice(5)}
              </span>
              <span className="text-xs text-preik-text-muted">
                {data.dailyVolume[Math.floor(data.dailyVolume.length / 2)]?.date.slice(5)}
              </span>
              <span className="text-xs text-preik-text-muted">
                {data.dailyVolume[data.dailyVolume.length - 1]?.date.slice(5)}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-preik-text-muted text-sm">
            Ingen data ennå
          </div>
        )}
      </div>

      {/* Intent breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <h3 className="text-base font-semibold text-preik-text mb-4">
            Henvendelsestyper
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-preik-accent" />
                <span className="text-sm text-preik-text-muted">Produktspørsmål</span>
              </div>
              <span className="font-medium text-preik-text">{data.stats.product_queries}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-preik-text-muted">Support</span>
              </div>
              <span className="font-medium text-preik-text">{data.stats.support_queries}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-preik-text-muted">E-post henvisning</span>
              </div>
              <span className="font-medium text-preik-text">{data.stats.email_referrals}</span>
            </div>
          </div>
        </div>

        {/* Top search terms */}
        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <h3 className="text-base font-semibold text-preik-text mb-4">
            Populære søkeord
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.topSearchTerms.slice(0, 10).map((term, idx) => (
              <div key={term.term} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-preik-border text-preik-text-muted text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-preik-text truncate">{term.term}</span>
                </div>
                <span className="text-preik-text-muted ml-2">{term.count}</span>
              </div>
            ))}
            {data.topSearchTerms.length === 0 && (
              <div className="text-preik-text-muted text-sm">Ingen søkeord enda</div>
            )}
          </div>
        </div>
      </div>

      {/* Unanswered queries */}
      <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
        <h3 className="text-base font-semibold text-preik-text mb-4">
          Ubesvarte henvendelser
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.unansweredQueries.map((query) => (
            <div key={query.id} className="bg-preik-surface rounded-xl p-4 border border-preik-border">
              <div className="text-xs text-preik-text-muted mb-2">
                {new Date(query.created_at).toLocaleString("nb-NO")}
              </div>
              <div className="text-preik-text font-medium mb-2">{query.user_query}</div>
              <div className="text-sm text-preik-text-muted line-clamp-2">
                {query.ai_response.slice(0, 200)}...
              </div>
            </div>
          ))}
          {data.unansweredQueries.length === 0 && (
            <div className="text-preik-text-muted text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ingen ubesvarte henvendelser - bra jobba!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
