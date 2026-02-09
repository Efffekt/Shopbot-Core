"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("AdminPromptEditor");

interface AdminPromptEditorProps {
  tenantId: string;
}

export default function AdminPromptEditor({ tenantId }: AdminPromptEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [savedPrompt, setSavedPrompt] = useState("");
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchPrompt();
  }, [tenantId]);

  async function fetchPrompt() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/prompt`);
      const data = await res.json();
      if (data.prompt) {
        setPrompt(data.prompt.system_prompt || "");
        setSavedPrompt(data.prompt.system_prompt || "");
        setVersion(data.prompt.version || 0);
      } else {
        setPrompt("");
        setSavedPrompt("");
        setVersion(0);
      }
    } catch (error) {
      log.error("Failed to fetch prompt:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const savePrompt = useCallback(async (text: string) => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedPrompt(text);
      setVersion(data.prompt?.version || version + 1);
      setSaveStatus("saved");
    } catch (error) {
      log.error("Failed to save prompt:", error);
      setSaveStatus("unsaved");
    }
  }, [tenantId, version]);

  function handleChange(value: string) {
    setPrompt(value);
    setSaveStatus("unsaved");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        savePrompt(value);
      }
    }, 2000);
  }

  function handleSaveNow() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (prompt.trim()) {
      savePrompt(prompt);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-preik-accent"></div>
      </div>
    );
  }

  const hasChanges = prompt !== savedPrompt;

  return (
    <div className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => handleChange(e.target.value)}
        rows={16}
        placeholder="Skriv systemprompt her..."
        className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text font-mono placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-preik-text-muted">
            {prompt.length.toLocaleString("nb-NO")} tegn
          </span>
          {version > 0 && (
            <span className="text-xs text-preik-text-muted">v{version}</span>
          )}
          <span className={`text-xs ${
            saveStatus === "saving" ? "text-yellow-600" :
            saveStatus === "saved" ? "text-green-600" :
            saveStatus === "unsaved" ? "text-orange-600" :
            "text-preik-text-muted"
          }`}>
            {saveStatus === "saving" && "Lagrer..."}
            {saveStatus === "saved" && "Lagret"}
            {saveStatus === "unsaved" && "Ulagrede endringer"}
            {saveStatus === "idle" && "Auto-lagring aktiv"}
          </span>
        </div>
        <button
          onClick={handleSaveNow}
          disabled={!hasChanges || saveStatus === "saving"}
          className="px-3 py-1.5 bg-preik-accent text-white text-sm rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Lagre nå
        </button>
      </div>
    </div>
  );
}
