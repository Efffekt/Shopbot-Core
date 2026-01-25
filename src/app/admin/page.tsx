"use client";

import { useState } from "react";
import ScraperControl from "@/components/ScraperControl";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "scraper" | "quick">("analytics");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`mx-auto ${activeTab === "analytics" ? "max-w-4xl" : "max-w-2xl"}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ShopBot Admin</h1>
          <p className="mt-2 text-gray-600">
            Manage your store&apos;s knowledge base
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "analytics"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("scraper")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "scraper"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Scraper
          </button>
          <button
            onClick={() => setActiveTab("quick")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "quick"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Quick Ingest
          </button>
        </div>

        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "scraper" && <ScraperControl />}
        {activeTab === "quick" && <QuickIngest />}
      </div>
    </div>
  );
}

function QuickIngest() {
  const [storeId, setStoreId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, url: websiteUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to ingest content");
      }

      setStatus({
        type: "success",
        message: data.message || "Content ingested successfully!",
      });
      setStoreId("");
      setWebsiteUrl("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <p className="text-sm text-gray-500 mb-4">
        Quick full-site crawl. For more control, use the Advanced Scraper.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="storeId"
            className="block text-sm font-medium text-gray-700"
          >
            Store ID
          </label>
          <input
            type="text"
            id="storeId"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
            disabled={isLoading}
            placeholder="e.g., my-store-123"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="websiteUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Website URL
          </label>
          <input
            type="url"
            id="websiteUrl"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            required
            disabled={isLoading}
            placeholder="https://example.com"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Scraping...
            </>
          ) : (
            "Ingest Content"
          )}
        </button>
      </form>

      {status.type && (
        <div
          className={`mt-6 p-4 rounded-md ${
            status.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <p className="text-sm">{status.message}</p>
        </div>
      )}
    </div>
  );
}
