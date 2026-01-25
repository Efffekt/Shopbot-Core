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

interface AnalyticsData {
  stats: Stats;
  topSearchTerms: SearchTerm[];
  unansweredQueries: UnansweredQuery[];
  dailyVolume: DailyVolume[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/stats?storeId=baatpleiebutikken&days=${days}`
      );
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm text-red-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, topSearchTerms, unansweredQueries, dailyVolume } = data;

  // Format daily volume for chart
  const chartData = dailyVolume.map((d) => ({
    date: new Date(d.date).toLocaleDateString("no-NO", {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Chatbot Analytics</h2>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Total Chats"
          value={stats.total_conversations}
          color="blue"
        />
        <StatCard
          icon={<Mail className="h-5 w-5" />}
          label="Email Referrals"
          value={stats.email_referrals}
          color="purple"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Knowledge Gaps"
          value={`${gapPercentage}%`}
          subtext={`${stats.unhandled_count} queries`}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Handled Rate"
          value={`${stats.handled_rate || 0}%`}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat Volume Chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Chat Volume</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="chats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No data yet
            </div>
          )}
        </div>

        {/* Top Search Terms */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Top Search Terms
          </h3>
          {topSearchTerms.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {topSearchTerms.map((term, i) => (
                <div
                  key={term.term}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">
                    <span className="text-gray-400 mr-2">{i + 1}.</span>
                    {term.term}
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {term.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No search data yet
            </div>
          )}
        </div>
      </div>

      {/* Unanswered Queries */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Unanswered Queries
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            {unansweredQueries.length}
          </span>
        </h3>
        {unansweredQueries.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {unansweredQueries.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-orange-50 border border-orange-100 rounded-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 font-medium">
                    &ldquo;{q.user_query}&rdquo;
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString("no-NO")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  AI: {q.ai_response.slice(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            No unanswered queries - great job!
          </div>
        )}
      </div>

      {/* Intent Breakdown */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Query Types</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {stats.product_queries}
            </div>
            <div className="text-xs text-blue-600">Product Queries</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {stats.support_queries}
            </div>
            <div className="text-xs text-purple-600">Support Requests</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {stats.total_conversations -
                stats.product_queries -
                stats.support_queries}
            </div>
            <div className="text-xs text-gray-600">General/Other</div>
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
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}
