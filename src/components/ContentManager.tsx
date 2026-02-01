"use client";

import { useState, useEffect } from "react";

interface Document {
  id: string;
  content: string;
  metadata: {
    source?: string;
    title?: string;
    manual?: boolean;
  };
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ContentManagerProps {
  tenantId: string;
  isAdmin: boolean;
}

export default function ContentManager({ tenantId, isAdmin }: ContentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Add content form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchContent() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/content?page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }
      const result = await response.json();
      setDocuments(result.documents);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();
  }, [tenantId, page]);

  async function handleDelete(documentId: string) {
    if (!confirm("Are you sure you want to delete this content?")) return;

    setDeleting(documentId);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/content?id=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function handleAddContent(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

    setAdding(true);
    setError(null);
    setAddSuccess(null);

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
        throw new Error(data.error || "Failed to add content");
      }

      const result = await response.json();
      setAddSuccess(result.message);
      setNewContent("");
      setNewTitle("");
      setNewUrl("");
      setShowAddForm(false);
      fetchContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add content");
    } finally {
      setAdding(false);
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {addSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {addSuccess}
        </div>
      )}

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {pagination?.total || 0} documents indexed
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "Add Content"}
          </button>
        )}
      </div>

      {/* Add content form */}
      {showAddForm && (
        <form onSubmit={handleAddContent} className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              id="title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="E.g., Product Guide"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Source URL (optional)
            </label>
            <input
              id="url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={10}
              required
              placeholder="Paste the content you want to add to the knowledge base..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              {newContent.length} characters
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding || !newContent.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding..." : "Add to Knowledge Base"}
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  {doc.metadata.title && (
                    <span className="font-medium text-gray-900">{doc.metadata.title}</span>
                  )}
                  {doc.metadata.manual && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Manual
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{doc.content}</p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                  {doc.metadata.source && doc.metadata.source !== "manual" && (
                    <a
                      href={doc.metadata.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 truncate max-w-xs"
                    >
                      {doc.metadata.source}
                    </a>
                  )}
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  {deleting === doc.id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No content indexed yet
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
