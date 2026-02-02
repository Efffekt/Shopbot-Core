"use client";

import { useState } from "react";

interface PromptEditorProps {
  tenantId: string;
  initialPrompt: string;
  isAdmin: boolean;
}

export default function PromptEditor({
  tenantId,
  initialPrompt,
  isAdmin,
}: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!isAdmin) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: prompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-xl text-sm">
          Prompt lagret!
        </div>
      )}

      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-preik-text mb-2"
        >
          Systemprompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!isAdmin}
          rows={20}
          className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-preik-text-muted">
          {prompt.length} tegn
        </p>

        {isAdmin ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-preik-accent hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-preik-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Lagrer..." : "Lagre endringer"}
          </button>
        ) : (
          <p className="text-sm text-preik-accent">
            Du trenger admin-tilgang for å redigere denne prompten
          </p>
        )}
      </div>
    </div>
  );
}
