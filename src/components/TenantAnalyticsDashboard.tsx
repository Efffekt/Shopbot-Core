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

interface ClickStats {
  totalClicks: number;
  uniqueSessions: number;
  uniqueUrls: number;
  clickThroughRate: number;
}

interface TopLink {
  url: string;
  label: string;
  clicks: number;
  uniqueSessions: number;
}

interface AnalyticsData {
  stats: Stats;
  topSearchTerms: SearchTerm[];
  unansweredQueries: UnansweredQuery[];
  dailyVolume: DailyVolume[];
  dailyClickVolume?: DailyVolume[];
  documentCount: number;
  period: string;
  credits: CreditStatus | null;
  clickStats?: ClickStats;
  topClickedLinks?: TopLink[];
}

interface TenantAnalyticsDashboardProps {
  tenantId: string;
}

// Extract a readable name from a product URL slug
function extractSlug(url: string): string {
  try {
    const path = new URL(url).pathname;
    const slug = path.split("/").filter(Boolean).pop() || path;
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}

const PERIOD_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
] as const;

export default function TenantAnalyticsDashboard({ tenantId }: TenantAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      if (data) {
        setSwitching(true);
      } else {
        setLoading(true);
      }
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
        setSwitching(false);
      }
    }

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const totalIntentQueries = data.stats.product_queries + data.stats.support_queries + data.stats.email_referrals;

  const intentRows = [
    { label: "Produktspørsmål", count: data.stats.product_queries, color: "bg-preik-accent" },
    { label: "Support", count: data.stats.support_queries, color: "bg-blue-500" },
    { label: "E-post henvisning", count: data.stats.email_referrals, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector — pill buttons */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-preik-text-muted">Periode:</span>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDays(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === option.value
                  ? "bg-preik-accent text-white"
                  : "bg-preik-bg text-preik-text-muted hover:text-preik-text border border-preik-border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {switching && (
          <svg className="w-4 h-4 animate-spin text-preik-text-muted" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </div>

      <div className={`space-y-6 transition-opacity ${switching ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

          <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-preik-text">
              {data.clickStats?.totalClicks ?? 0}
            </div>
            <div className="text-sm text-preik-text-muted">Lenkeklikk</div>
          </div>

          <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-preik-text">
              {data.clickStats?.clickThroughRate ?? 0}%
            </div>
            <div className="text-sm text-preik-text-muted">Klikkrate</div>
          </div>
        </div>

        {/* Daily volume chart */}
        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-preik-text">
              Daglig aktivitet
            </h3>
            <div className="flex items-center gap-4 text-xs text-preik-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-preik-accent" />
                <span>Samtaler</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span>Klikk</span>
              </div>
            </div>
          </div>
          {data.dailyVolume.length > 0 ? (
            <div>
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between pr-2 py-0">
                  <span className="text-[10px] text-preik-text-muted leading-none">{maxVolume}</span>
                  <span className="text-[10px] text-preik-text-muted leading-none">0</span>
                </div>
                {/* Bars */}
                <div className="flex items-end gap-[2px] h-32 flex-1">
                  {data.dailyVolume.map((day, idx) => {
                    const clickCount = data.dailyClickVolume?.[idx]?.count ?? 0;
                    const convHeight = maxVolume > 0
                      ? Math.max((day.count / maxVolume) * 100, day.count > 0 ? 8 : 2)
                      : 2;
                    const clickHeight = maxVolume > 0
                      ? Math.max((clickCount / maxVolume) * 100, clickCount > 0 ? 8 : 0)
                      : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 h-full flex items-end group relative gap-[1px]"
                      >
                        <div
                          className="flex-1 bg-preik-accent rounded-sm transition-all group-hover:bg-preik-accent-hover"
                          style={{ height: `${convHeight}%` }}
                        />
                        {clickHeight > 0 && (
                          <div
                            className="flex-1 bg-blue-500 rounded-sm transition-all group-hover:bg-blue-600"
                            style={{ height: `${clickHeight}%` }}
                          />
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-preik-surface border border-preik-border rounded text-xs text-preik-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {day.date.slice(5)}: {day.count} samtaler{clickCount > 0 ? `, ${clickCount} klikk` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between mt-2 ml-8">
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

        {/* Intent breakdown + Top search terms */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
            <h3 className="text-base font-semibold text-preik-text mb-4">
              Henvendelsestyper
            </h3>
            <div className="space-y-3">
              {intentRows.map((row) => {
                const proportion = totalIntentQueries > 0 ? (row.count / totalIntentQueries) * 100 : 0;
                return (
                  <div key={row.label} className="relative">
                    <div
                      className={`absolute inset-0 ${row.color} opacity-[0.07] rounded-lg`}
                      style={{ width: `${proportion}%` }}
                    />
                    <div className="relative flex items-center justify-between py-1 px-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-sm text-preik-text-muted">{row.label}</span>
                      </div>
                      <span className="font-medium text-preik-text">{row.count}</span>
                    </div>
                  </div>
                );
              })}
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

        {/* Link click analytics */}
        <div className="bg-preik-bg rounded-xl border border-preik-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-preik-text">
              Lenkeklikk fra chatbot
            </h3>
            {data.clickStats && data.clickStats.totalClicks > 0 && (
              <div className="flex gap-4 text-sm text-preik-text-muted">
                <span>{data.clickStats.totalClicks} klikk</span>
                <span>{data.clickStats.uniqueSessions} økter</span>
                <span>{data.clickStats.uniqueUrls} unike lenker</span>
              </div>
            )}
          </div>
          {data.topClickedLinks && data.topClickedLinks.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.topClickedLinks.map((link, idx) => {
                const maxClicks = data.topClickedLinks![0].clicks;
                const barWidth = maxClicks > 0 ? (link.clicks / maxClicks) * 100 : 0;
                return (
                  <div key={link.url} className="relative">
                    <div
                      className="absolute inset-0 bg-blue-500 opacity-[0.06] rounded-lg"
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="relative flex items-center justify-between py-2 px-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-preik-text truncate">
                            {link.label || extractSlug(link.url)}
                          </div>
                          <div className="text-xs text-preik-text-muted truncate">
                            {link.url.replace(/^https?:\/\/(www\.)?/, "").split("?")[0]}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-medium text-preik-text">{link.clicks}</div>
                          <div className="text-xs text-preik-text-muted">klikk</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-preik-text">{link.uniqueSessions}</div>
                          <div className="text-xs text-preik-text-muted">økter</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-preik-text-muted py-4 text-center">
              <p>Ingen lenkeklikk registrert ennå.</p>
              <p className="mt-1 text-xs">Klikk spores automatisk når besøkende trykker på lenker i chatboten.</p>
            </div>
          )}
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
                  {query.ai_response.length > 200 ? `${query.ai_response.slice(0, 200)}…` : query.ai_response}
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
    </div>
  );
}
