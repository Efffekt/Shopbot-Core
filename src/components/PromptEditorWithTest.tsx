"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PromptEditorWithTestProps {
  tenantId: string;
  initialPrompt: string;
  isAdmin: boolean;
  storeName: string;
}

export default function PromptEditorWithTest({
  tenantId,
  initialPrompt,
  isAdmin,
  storeName,
}: PromptEditorWithTestProps) {
  // Editor state
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Widget state
  const [widgetKey, setWidgetKey] = useState(0);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const savePrompt = useCallback(
    async (promptToSave: string) => {
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
    },
    [tenantId, isAdmin]
  );

  // Auto-save with debounce
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

  async function handleSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await savePrompt(prompt);
  }

  // Load the actual widget
  useEffect(() => {
    if (!widgetContainerRef.current) return;

    // Clear the container
    widgetContainerRef.current.innerHTML = "";

    // Create and load the widget script
    const script = document.createElement("script");
    script.src = `/widget.js?v=${Date.now()}`; // Cache bust
    script.async = true;
    script.setAttribute("data-store-id", tenantId);
    script.setAttribute("data-brand-name", storeName);
    script.setAttribute("data-contained", "true"); // Render inside container
    script.setAttribute("data-theme", "light"); // Force light theme for dashboard
    script.setAttribute("data-preik-widget", "true");

    // Add script to the container div so widget renders inside it
    widgetContainerRef.current.appendChild(script);

    return () => {
      // Cleanup on unmount or when toggled off
      if (widgetContainerRef.current) {
        const widget = widgetContainerRef.current.querySelector("preik-chat-widget");
        if (widget) {
          widget.remove();
        }
      }
      script.remove();
    };
  }, [tenantId, storeName, widgetKey]);

  // Function to reload widget (e.g., after saving prompt)
  const reloadWidget = () => {
    setWidgetKey((prev) => prev + 1);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left - Prompt Editor */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
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
              className="w-full px-4 py-3 bg-preik-bg border border-preik-border rounded-xl text-preik-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-preik-text-muted">{prompt.length} tegn</p>
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
                Du trenger admin-tilgang for å redigere
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right - Test Chat using actual widget */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-preik-text">
            Test chatboten
          </h2>
          <button
            onClick={reloadWidget}
            className="text-sm text-preik-text-muted hover:text-preik-text transition-colors flex items-center gap-1"
            title="Last widget på nytt"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Last på nytt
          </button>
        </div>

        <div
          ref={widgetContainerRef}
          className="h-[500px] rounded-xl overflow-hidden"
        />

        <p className="text-xs text-preik-text-muted mt-4">
          <strong>Tips:</strong> Lagre endringene i prompten først, så klikk
          &quot;Last på nytt&quot; for å teste med den nye prompten.
        </p>
      </div>
    </div>
  );
}
