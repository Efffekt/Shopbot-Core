"use client";

import { useState, useEffect } from "react";

interface ContentSource {
  source: string;
  title: string;
  chunkCount: number;
  preview: string;
  isManual: boolean;
  createdAt: string;
}

interface AdminContentBrowserProps {
  tenantId: string;
}

export default function AdminContentBrowser({ tenantId }: AdminContentBrowserProps) {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [tenantId]);

  async function fetchContent() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/content?grouped=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSources(data.sources || []);
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(source: string) {
    if (!confirm(`Slett alt innhold fra "${source}"? Dette kan ikke angres.`)) return;
    setDeleting(source);
    try {
      const res = await fetch(
        `/api/admin/tenants/${tenantId}/content?source=${encodeURIComponent(source)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setSources(prev => prev.filter(s => s.source !== source));
    } catch (error) {
      console.error("Failed to delete content:", error);
    } finally {
      setDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-preik-accent"></div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <p className="text-preik-text-muted text-sm py-4">Ingen indeksert innhold for denne kunden.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-preik-text-muted">{sources.length} kilder indeksert</p>
      {sources.map((src) => (
        <div
          key={src.source}
          className="p-3 bg-preik-bg rounded-xl border border-preik-border"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-preik-text truncate">{src.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-preik-surface text-preik-text-muted">
                  {src.chunkCount} deler
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  src.isManual
                    ? "bg-purple-500/10 text-purple-600"
                    : "bg-green-500/10 text-green-600"
                }`}>
                  {src.isManual ? "Manuell" : "Skrapet"}
                </span>
              </div>
              <p className="text-xs text-preik-text-muted mt-1.5 line-clamp-2">{src.preview}</p>
              {src.source.startsWith("http") && (
                <p className="text-xs text-preik-accent mt-1 truncate">{src.source}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(src.source)}
              disabled={deleting === src.source}
              className="px-2 py-1 bg-red-500/10 text-red-600 text-xs rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40 shrink-0"
            >
              {deleting === src.source ? "..." : "Slett"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
