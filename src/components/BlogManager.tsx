"use client";

import { useState, useEffect, useRef } from "react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  cover_image_url: string | null;
}

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  meta_title: string;
  meta_description: string;
  published: boolean;
  cover_image_url: string;
}

const emptyForm: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author_name: "",
  meta_title: "",
  meta_description: "",
  published: false,
  cover_image_url: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [defaultAuthorName, setDefaultAuthorName] = useState("");

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/blog/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke laste opp bilde");
      return null;
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (data.settings?.blog_default_author_name) {
          setDefaultAuthorName(data.settings.blog_default_author_name);
        }
      } catch {
        // Silently fail — author name is optional
      }
    }
    fetchSettings();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente innlegg");
    } finally {
      setLoading(false);
    }
  }

  function openNewPost() {
    setEditingPost(null);
    setForm({ ...emptyForm, author_name: defaultAuthorName });
    setShowEditor(true);
    setError(null);
  }

  function openEditPost(post: BlogPost) {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      author_name: post.author_name,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      published: !!post.published_at,
      cover_image_url: post.cover_image_url || "",
    });
    setShowEditor(true);
    setError(null);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditingPost(null);
    setForm(emptyForm);
    setError(null);
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : slugify(title),
    }));
  }

  async function handleSave() {
    if (!form.title || !form.slug || !form.content || !form.author_name) {
      setError("Tittel, slug, innhold og forfatter er påkrevd");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        author_name: form.author_name,
        published_at: form.published ? new Date().toISOString() : null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        cover_image_url: form.cover_image_url || null,
      };

      let res: Response;
      if (editingPost) {
        // When editing, preserve existing published_at if still published
        const editPayload = {
          ...payload,
          published_at: form.published
            ? editingPost.published_at || new Date().toISOString()
            : null,
        };
        res = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editPayload),
        });
      } else {
        res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      closeEditor();
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre innlegg");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: string) {
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeleteConfirm(null);
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke slette innlegg");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent" />
      </div>
    );
  }

  if (showEditor) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-preik-text">
            {editingPost ? "Rediger innlegg" : "Nytt innlegg"}
          </h2>
          <button
            onClick={closeEditor}
            className="text-sm text-preik-text-muted hover:text-preik-text"
          >
            Avbryt
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">Tittel *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50"
              placeholder="Artikkelens tittel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50"
              placeholder="artikkelens-url-slug"
            />
            <p className="mt-1 text-xs text-preik-text-muted">
              URL: /articles/{form.slug || "..."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">Forfatter *</label>
            <input
              type="text"
              value={form.author_name}
              onChange={(e) => setForm((prev) => ({ ...prev, author_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50"
              placeholder="Navn på forfatter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">Utdrag</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50 resize-none"
              placeholder="Kort beskrivelse som vises i artikkellisten"
            />
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-sm font-medium text-preik-text mb-1">Coverbilde</label>
            {form.cover_image_url && (
              <div className="mb-2 relative inline-block">
                <img
                  src={form.cover_image_url}
                  alt={form.title || "Coverbilde"}
                  className="max-h-40 rounded-xl border border-preik-border"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, cover_image_url: "" }))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  &times;
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) setForm((prev) => ({ ...prev, cover_image_url: url }));
                e.target.value = "";
              }}
              disabled={uploading}
              className="text-sm text-preik-text-muted file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border file:border-preik-border file:bg-preik-surface file:text-preik-text file:text-sm file:cursor-pointer hover:file:bg-preik-bg"
            />
            {uploading && <p className="mt-1 text-xs text-preik-text-muted">Laster opp...</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-preik-text">Innhold (Markdown) *</label>
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/jpeg,image/png,image/gif,image/webp,image/avif";
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    const textarea = contentRef.current;
                    const markdown = `![${file.name}](${url})`;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = form.content;
                      const newContent = text.substring(0, start) + markdown + text.substring(end);
                      setForm((prev) => ({ ...prev, content: newContent }));
                      requestAnimationFrame(() => {
                        textarea.focus();
                        const pos = start + markdown.length;
                        textarea.setSelectionRange(pos, pos);
                      });
                    } else {
                      setForm((prev) => ({ ...prev, content: prev.content + "\n" + markdown }));
                    }
                  };
                  input.click();
                }}
                className="text-xs px-3 py-1.5 bg-preik-surface border border-preik-border text-preik-text rounded-lg hover:bg-preik-bg transition-colors disabled:opacity-50"
              >
                {uploading ? "Laster opp..." : "Sett inn bilde"}
              </button>
            </div>
            <textarea
              ref={contentRef}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={16}
              className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50 resize-y font-mono text-sm"
              placeholder="Skriv innholdet i Markdown-format..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-preik-text mb-1">Meta-tittel</label>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => setForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50"
                placeholder="SEO-tittel (valgfritt)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-preik-text mb-1">Meta-beskrivelse</label>
              <input
                type="text"
                value={form.meta_description}
                onChange={(e) => setForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-preik-surface border border-preik-border text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent/50"
                placeholder="SEO-beskrivelse (valgfritt)"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-preik-border rounded-full peer peer-checked:bg-preik-accent transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-preik-text">Publisert</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-preik-accent text-white rounded-xl text-sm font-medium hover:bg-preik-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Lagrer..." : editingPost ? "Oppdater" : "Opprett"}
            </button>
            <button
              onClick={closeEditor}
              className="px-6 py-2.5 bg-preik-surface border border-preik-border text-preik-text rounded-xl text-sm font-medium hover:bg-preik-bg transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-preik-text">Artikler</h2>
        <button
          onClick={openNewPost}
          className="px-5 py-2.5 bg-preik-accent text-white rounded-xl text-sm font-medium hover:bg-preik-accent-hover transition-colors"
        >
          Ny artikkel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-preik-surface rounded-2xl border border-preik-border">
          <p className="text-preik-text-muted mb-4">Ingen artikler ennå</p>
          <button
            onClick={openNewPost}
            className="px-5 py-2.5 bg-preik-accent text-white rounded-xl text-sm font-medium hover:bg-preik-accent-hover transition-colors"
          >
            Skriv ditt første innlegg
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-preik-surface rounded-2xl border border-preik-border p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-preik-text truncate">{post.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.published_at
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {post.published_at ? "Publisert" : "Utkast"}
                  </span>
                </div>
                <p className="text-sm text-preik-text-muted">
                  /articles/{post.slug} &middot; {post.author_name} &middot;{" "}
                  {new Date(post.created_at).toLocaleDateString("nb-NO")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditPost(post)}
                  className="px-4 py-2 text-sm bg-preik-bg border border-preik-border text-preik-text rounded-xl hover:bg-preik-surface transition-colors"
                >
                  Rediger
                </button>
                {deleteConfirm === post.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                      Bekreft
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-sm bg-preik-bg border border-preik-border text-preik-text rounded-xl hover:bg-preik-surface transition-colors"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(post.id)}
                    className="px-4 py-2 text-sm text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    Slett
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
