"use client";

import { useState, useEffect, useCallback } from "react";

interface SourceGroup {
  source: string;
  title: string;
  chunkCount: number;
  preview: string;
  isManual: boolean;
  createdAt: string;
}

interface ContentManagerProps {
  tenantId: string;
  isAdmin: boolean;
}

export default function ContentManager({ tenantId, isAdmin }: ContentManagerProps) {
  const [sources, setSources] = useState<SourceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add content form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editSource, setEditSource] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/content?grouped=true`);
      if (!response.ok) throw new Error("Kunne ikke hente innhold");
      const result = await response.json();
      setSources(result.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke laste innhold");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Auto-clear success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  async function handleDelete(source: string) {
    if (!confirm("Er du sikker på at du vil slette alt innhold fra denne kilden?")) return;

    setDeleting(source);
    setError(null);

    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/content?source=${encodeURIComponent(source)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kunne ikke slette");
      }

      const result = await response.json();
      setSuccess(result.message);
      setSources((prev) => prev.filter((s) => s.source !== source));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke slette");
    } finally {
      setDeleting(null);
    }
  }

  async function openEditModal(source: string) {
    setEditSource(source);
    setEditLoading(true);
    setEditText("");
    setEditTitle("");

    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/content?source=${encodeURIComponent(source)}`
      );
      if (!response.ok) throw new Error("Kunne ikke hente innhold");
      const result = await response.json();
      setEditText(result.fullText || "");
      setEditTitle(result.title || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente innhold for redigering");
      setEditSource(null);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editSource || !editText.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: editSource,
          text: editText,
          title: editTitle || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kunne ikke oppdatere");
      }

      const result = await response.json();
      setSuccess(result.message);
      setEditSource(null);
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke oppdatere innhold");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContent(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newContent,
          title: newTitle || undefined,
          url: newUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kunne ikke legge til innhold");
      }

      const result = await response.json();
      setSuccess(result.message);
      setNewContent("");
      setNewTitle("");
      setNewUrl("");
      setShowAddForm(false);
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke legge til innhold");
    } finally {
      setAdding(false);
    }
  }

  if (loading && sources.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-preik-text-muted">Laster innhold...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-preik-text-muted">
          {sources.length} {sources.length === 1 ? "kilde" : "kilder"} indeksert
        </p>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-preik-accent hover:opacity-90 transition-opacity"
          >
            {showAddForm ? "Avbryt" : "Legg til innhold"}
          </button>
        )}
      </div>

      {/* Add content form */}
      {showAddForm && (
        <form onSubmit={handleAddContent} className="bg-preik-surface rounded-2xl border border-preik-border p-5 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-preik-text mb-1">
              Tittel (valgfritt)
            </label>
            <input
              id="title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="F.eks. Produktguide"
              className="w-full px-3 py-2 border border-preik-border rounded-xl bg-preik-bg text-preik-text text-sm"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-preik-text mb-1">
              Kilde-URL (valgfritt)
            </label>
            <input
              id="url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/side"
              className="w-full px-3 py-2 border border-preik-border rounded-xl bg-preik-bg text-preik-text text-sm"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-preik-text mb-1">
              Innhold
            </label>
            <textarea
              id="content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={10}
              required
              placeholder="Lim inn innholdet du vil legge til i kunnskapsbasen..."
              className="w-full px-3 py-2 border border-preik-border rounded-xl bg-preik-bg text-preik-text font-mono text-sm"
            />
            <p className="mt-1 text-xs text-preik-text-muted">
              {newContent.length} tegn
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding || !newContent.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? "Legger til..." : "Legg til i kunnskapsbasen"}
            </button>
          </div>
        </form>
      )}

      {/* Source list */}
      <div className="space-y-3">
        {sources.map((src) => (
          <div key={src.source} className="bg-preik-surface border border-preik-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-medium text-preik-text text-sm">{src.title}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-preik-bg text-preik-text-muted border border-preik-border">
                    {src.chunkCount} {src.chunkCount === 1 ? "del" : "deler"}
                  </span>
                  {src.isManual ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Manuell
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Skrapet
                    </span>
                  )}
                </div>
                <p className="text-sm text-preik-text-muted line-clamp-2 mb-2">{src.preview}</p>
                <div className="flex items-center gap-3 text-xs text-preik-text-muted">
                  {src.source !== "manual" && src.source.startsWith("http") && (
                    <a
                      href={src.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-preik-accent truncate max-w-xs transition-colors"
                    >
                      {src.source}
                    </a>
                  )}
                  <span>{new Date(src.createdAt).toLocaleDateString("nb-NO")}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(src.source)}
                    className="px-3 py-1.5 text-sm text-preik-text-muted hover:text-preik-text hover:bg-preik-bg rounded-lg transition-colors"
                  >
                    Rediger
                  </button>
                  <button
                    onClick={() => handleDelete(src.source)}
                    disabled={deleting === src.source}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {deleting === src.source ? "Sletter..." : "Slett"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {sources.length === 0 && (
          <div className="text-center py-12 text-preik-text-muted">
            Ingen innhold indeksert ennå
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-preik-surface rounded-2xl border border-preik-border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-preik-border">
              <h2 className="text-lg font-medium text-preik-text">Rediger innhold</h2>
              <p className="text-sm text-preik-text-muted mt-1 truncate">{editSource}</p>
            </div>

            {editLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-preik-text-muted">Laster innhold...</div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label htmlFor="editTitle" className="block text-sm font-medium text-preik-text mb-1">
                      Tittel
                    </label>
                    <input
                      id="editTitle"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-preik-border rounded-xl bg-preik-bg text-preik-text text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="editContent" className="block text-sm font-medium text-preik-text mb-1">
                      Innhold
                    </label>
                    <textarea
                      id="editContent"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={16}
                      required
                      className="w-full px-3 py-2 border border-preik-border rounded-xl bg-preik-bg text-preik-text font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-preik-text-muted">
                      {editText.length} tegn
                    </p>
                  </div>
                </div>
                <div className="p-5 border-t border-preik-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditSource(null)}
                    className="px-4 py-2 text-sm font-medium text-preik-text-muted hover:text-preik-text rounded-xl border border-preik-border hover:bg-preik-bg transition-colors"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !editText.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-preik-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {saving ? "Lagrer..." : "Lagre endringer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
