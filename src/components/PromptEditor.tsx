"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const savePrompt = useCallback(async (promptToSave: string) => {
    if (!isAdmin) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: promptToSave }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      setSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  }, [tenantId, isAdmin]);

  // Auto-save with debounce (2 seconds after typing stops)
  useEffect(() => {
    if (!isAdmin || prompt === initialPrompt) return;

    setHasChanges(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePrompt(prompt);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [prompt, initialPrompt, isAdmin, savePrompt]);

  // Manual save
  async function handleSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await savePrompt(prompt);
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
        <div className="flex items-center gap-4">
          <p className="text-sm text-preik-text-muted">
            {prompt.length} tegn
          </p>
          {isAdmin && (
            <span className="text-xs text-preik-text-muted">
              {saving ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-preik-accent rounded-full animate-pulse" />
                  Lagrer...
                </span>
              ) : hasChanges ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  Ulagrede endringer
                </span>
              ) : success ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Lagret
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-preik-text-muted/30 rounded-full" />
                  Auto-lagring aktiv
                </span>
              )}
            </span>
          )}
        </div>

        {isAdmin ? (
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-preik-accent hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-preik-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Lagrer..." : "Lagre nå"}
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
