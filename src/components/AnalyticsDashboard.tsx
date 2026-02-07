"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  Mail,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Database,
  Building2,
} from "lucide-react";

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

interface Tenant {
  id: string;
  name: string;
}

interface AnalyticsData {
  stats: Stats;
  topSearchTerms: SearchTerm[];
  unansweredQueries: UnansweredQuery[];
  dailyVolume: DailyVolume[];
  documentCount: number;
  tenantName: string;
  availableTenants: Tenant[];
}

interface AnalyticsDashboardProps {
  selectedTenantId?: string | null;
  selectedTenantName?: string | null;
}

export default function AnalyticsDashboard({ selectedTenantId, selectedTenantName }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [selectedTenant, setSelectedTenant] = useState(selectedTenantId || "baatpleiebutikken");
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

  // Update when parent changes selection
  useEffect(() => {
    if (selectedTenantId) {
      setSelectedTenant(selectedTenantId);
    }
  }, [selectedTenantId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/stats?storeId=${selectedTenant}&days=${days}`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.details || json.error || "Kunne ikke hente analyse");
      }

      setData(json);

      if (json.availableTenants && json.availableTenants.length > 0) {
        setAvailableTenants(json.availableTenants);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Kunne ikke laste data";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, selectedTenant]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-preik-accent" />
        <p className="text-preik-text-muted text-sm">Laster analyse for {selectedTenantName || selectedTenant}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-600 font-medium">Feil ved lasting av analyse</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-2 bg-red-500/10 text-red-600 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, topSearchTerms, unansweredQueries, dailyVolume, documentCount, tenantName } = data;

  const chartData = dailyVolume.map((d) => ({
    date: new Date(d.date).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
    }),
    chats: d.count,
  }));

  const gapPercentage =
    stats.total_conversations > 0
      ? ((stats.unhandled_count / stats.total_conversations) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header with Tenant Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-preik-text">Chatbot-analyse</h2>
          <p className="text-sm text-preik-text-muted mt-1">
            Viser: <span className="font-medium text-preik-text">{tenantName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tenant Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-preik-text-muted" />
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="px-3 py-1.5 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text font-medium focus:ring-preik-accent focus:border-preik-accent"
            >
              {availableTenants.length > 0 ? (
                availableTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="baatpleiebutikken">Båtpleiebutikken</option>
                  <option value="docs-site">Docs Project</option>
                </>
              )}
            </select>
          </div>

          {/* Time Period Selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
          >
            <option value={7}>Siste 7 dager</option>
            <option value={30}>Siste 30 dager</option>
            <option value={90}>Siste 90 dager</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 text-preik-text-muted hover:text-preik-text transition-colors"
            title="Oppdater"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Totale samtaler"
          value={stats.total_conversations}
          color="orange"
        />
        <StatCard
          icon={<Database className="h-5 w-5" />}
          label="Dokumenter"
          value={documentCount}
          color="purple"
        />
        <StatCard
          icon={<Mail className="h-5 w-5" />}
          label="E-posthenvising"
          value={stats.email_referrals}
          color="indigo"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Kunnskapshull"
          value={`${gapPercentage}%`}
          subtext={`${stats.unhandled_count} henvendelser`}
          color="red"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Besvarsandel"
          value={`${stats.handled_rate || 0}%`}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat Volume Chart */}
        <div className="bg-preik-surface p-4 rounded-2xl border border-preik-border">
          <h3 className="font-medium text-preik-text mb-4">Samtalevolum</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="chats" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-preik-text-muted">
              Ingen data ennå
            </div>
          )}
        </div>

        {/* Top Search Terms */}
        <div className="bg-preik-surface p-4 rounded-2xl border border-preik-border">
          <h3 className="font-medium text-preik-text mb-4 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Populære søkeord
          </h3>
          {topSearchTerms.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {topSearchTerms.map((term, i) => (
                <div
                  key={term.term}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-preik-text">
                    <span className="text-preik-text-muted mr-2">{i + 1}.</span>
                    {term.term}
                  </span>
                  <span className="text-xs bg-preik-bg px-2 py-0.5 rounded-full text-preik-text-muted">
                    {term.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-preik-text-muted">
              Ingen søkedata ennå
            </div>
          )}
        </div>
      </div>

      {/* Unanswered Queries */}
      <div className="bg-preik-surface p-4 rounded-2xl border border-preik-border">
        <h3 className="font-medium text-preik-text mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Ubesvarte henvendelser
          <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
            {unansweredQueries.length}
          </span>
        </h3>
        {unansweredQueries.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {unansweredQueries.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-preik-text font-medium">
                    &ldquo;{q.user_query}&rdquo;
                  </p>
                  <span className="text-xs text-preik-text-muted whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString("nb-NO")}
                  </span>
                </div>
                <p className="text-xs text-preik-text-muted mt-1 line-clamp-2">
                  AI: {q.ai_response.slice(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-preik-text-muted">
            Ingen ubesvarte henvendelser - bra jobbet!
          </div>
        )}
      </div>

      {/* Intent Breakdown */}
      <div className="bg-preik-surface p-4 rounded-2xl border border-preik-border">
        <h3 className="font-medium text-preik-text mb-4">Henvendelsestyper</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-preik-accent/10 rounded-xl">
            <div className="text-2xl font-bold text-preik-accent">
              {stats.product_queries}
            </div>
            <div className="text-xs text-preik-accent">Produktspørsmål</div>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">
              {stats.support_queries}
            </div>
            <div className="text-xs text-purple-600">Supporthenvendelser</div>
          </div>
          <div className="p-3 bg-preik-bg rounded-xl">
            <div className="text-2xl font-bold text-preik-text-muted">
              {stats.total_conversations -
                stats.product_queries -
                stats.support_queries}
            </div>
            <div className="text-xs text-preik-text-muted">Generelt/Annet</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: "orange" | "purple" | "indigo" | "red" | "green";
}) {
  const colors = {
    orange: "bg-orange-500/10 text-orange-600",
    purple: "bg-purple-500/10 text-purple-600",
    indigo: "bg-indigo-500/10 text-indigo-600",
    red: "bg-red-500/10 text-red-600",
    green: "bg-green-500/10 text-green-600",
  };

  return (
    <div className="bg-preik-surface p-4 rounded-xl border border-preik-border">
      <div className={`inline-flex p-2 rounded-xl ${colors[color]} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-preik-text">{value}</div>
      <div className="text-sm text-preik-text-muted">{label}</div>
      {subtext && <div className="text-xs text-preik-text-muted mt-1">{subtext}</div>}
    </div>
  );
}
