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

interface AnalyticsData {
  stats: Stats;
  topSearchTerms: SearchTerm[];
  unansweredQueries: UnansweredQuery[];
  dailyVolume: DailyVolume[];
  documentCount: number;
  period: string;
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
          throw new Error("Failed to fetch analytics");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [tenantId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const maxVolume = Math.max(...data.dailyVolume.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">Period:</span>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">
            {data.stats.total_conversations}
          </div>
          <div className="text-sm text-blue-700">Total Conversations</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {data.stats.handled_rate}%
          </div>
          <div className="text-sm text-green-700">Handled Rate</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-900">
            {data.stats.unhandled_count}
          </div>
          <div className="text-sm text-yellow-700">Unhandled Queries</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {data.documentCount}
          </div>
          <div className="text-sm text-purple-700">Indexed Documents</div>
        </div>
      </div>

      {/* Daily volume chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Conversation Volume
        </h3>
        <div className="flex items-end space-x-1 h-32">
          {data.dailyVolume.map((day, idx) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center"
              title={`${day.date}: ${day.count} conversations`}
            >
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{
                  height: `${(day.count / maxVolume) * 100}%`,
                  minHeight: day.count > 0 ? "4px" : "0",
                }}
              />
              {idx % 2 === 0 && (
                <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                  {day.date.slice(5)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intent breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Query Types
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Product queries</span>
              <span className="font-medium text-gray-900">{data.stats.product_queries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Support queries</span>
              <span className="font-medium text-gray-900">{data.stats.support_queries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email referrals</span>
              <span className="font-medium text-gray-900">{data.stats.email_referrals}</span>
            </div>
          </div>
        </div>

        {/* Top search terms */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Search Terms
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.topSearchTerms.slice(0, 10).map((term) => (
              <div key={term.term} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate">{term.term}</span>
                <span className="text-gray-900 font-medium ml-2">{term.count}</span>
              </div>
            ))}
            {data.topSearchTerms.length === 0 && (
              <div className="text-gray-500 text-sm">No search terms yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Unanswered queries */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Unanswered Queries
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.unansweredQueries.map((query) => (
            <div key={query.id} className="bg-white rounded p-3 border">
              <div className="text-sm text-gray-500 mb-1">
                {new Date(query.created_at).toLocaleString()}
              </div>
              <div className="text-gray-900 font-medium">{query.user_query}</div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                {query.ai_response.slice(0, 200)}...
              </div>
            </div>
          ))}
          {data.unansweredQueries.length === 0 && (
            <div className="text-gray-500 text-sm">
              No unanswered queries - great job!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
