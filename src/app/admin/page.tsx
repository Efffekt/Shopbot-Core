"use client";

import { useState } from "react";
import ScraperControl from "@/components/ScraperControl";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import CustomerManagement from "@/components/CustomerManagement";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "analytics" | "scraper" | "quick" | "manual">("customers");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`mx-auto ${activeTab === "analytics" || activeTab === "customers" ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ShopBot Admin</h1>
          <p className="mt-2 text-gray-600">
            Manage your store&apos;s knowledge base
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "customers"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Kunder
          </button>
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
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "manual"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Manual
          </button>
        </div>

        {activeTab === "customers" && <CustomerManagement />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "scraper" && <ScraperControl />}
        {activeTab === "quick" && <QuickIngest />}
        {activeTab === "manual" && <ManualIngest />}
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

function ManualIngest() {
  const [storeId, setStoreId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
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
      const response = await fetch("/api/admin/manual-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          storeId,
          url: sourceUrl || undefined,
          title: title || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save content");
      }

      setStatus({
        type: "success",
        message: data.message,
      });
      setText("");
      setTitle("");
      setSourceUrl("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = text.length;
  const estimatedChunks = Math.ceil(charCount / 1000);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-amber-800 text-sm">
          <strong>Manuell inntasting:</strong> Bruk dette når skraperen ikke fungerer på komplekse sider (SPA, React, etc.). Kopier og lim inn teksten manuelt.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="manualStoreId" className="block text-sm font-medium text-gray-700">
            Store ID *
          </label>
          <input
            type="text"
            id="manualStoreId"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
            disabled={isLoading}
            placeholder="e.g., rk-designsystem-docs"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="manualTitle" className="block text-sm font-medium text-gray-700">
            Tittel / Sidenavn
          </label>
          <input
            type="text"
            id="manualTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Button Component"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="manualSourceUrl" className="block text-sm font-medium text-gray-700">
            Kilde-URL
          </label>
          <input
            type="url"
            id="manualSourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            disabled={isLoading}
            placeholder="https://norwegianredcross.github.io/DesignSystem/button"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="manualText" className="block text-sm font-medium text-gray-700">
            Innhold *
          </label>
          <textarea
            id="manualText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            disabled={isLoading}
            rows={12}
            placeholder="Lim inn dokumentasjonsteksten her..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900 placeholder:text-gray-400 font-mono text-sm"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{charCount.toLocaleString()} tegn</span>
            <span>~{estimatedChunks} chunks</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !text.trim() || !storeId.trim()}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Lagrer...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Lagre innhold
            </>
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
