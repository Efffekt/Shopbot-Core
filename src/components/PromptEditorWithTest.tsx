"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTest, setShowTest] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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

  // Chat functions
  const sendMessage = async () => {
    const messageToSend = input.trim();
    if (!messageToSend || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageToSend }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: messageToSend }],
          storeId: tenantId,
          noStream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Beklager, noe gikk galt. Prøv igjen senere.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
                Du trenger admin-tilgang for å redigere
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right - Test Chat */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-preik-text">Test chatboten</h2>
          <button
            onClick={() => setShowTest(!showTest)}
            className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
          >
            {showTest ? "Skjul" : "Vis"} test
          </button>
        </div>

        {showTest ? (
          <div className="bg-[#F9FAFB] rounded-2xl shadow-lg overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-preik-accent flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <circle cx="12" cy="5" r="2"/>
                    <path d="M12 7v4"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-[#111827]">{storeName}</p>
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Test-modus
                  </p>
                </div>
              </div>
              <button
                onClick={clearMessages}
                className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-red-500 transition-all opacity-70 hover:opacity-100"
                title="Tøm samtale"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-center px-4">
                  <div>
                    <p className="text-[14px] text-[#6B7280] mb-2">
                      Test chatboten din her
                    </p>
                    <p className="text-[12px] text-[#9CA3AF]">
                      Endringer i prompten krever lagring før de vises i testen
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] animate-fade-in ${
                    message.role === "user" ? "self-end" : "self-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-[14px] leading-relaxed ${
                      message.role === "user"
                        ? "bg-preik-accent text-white rounded-br-sm"
                        : "bg-white text-[#111827] border border-[#E5E7EB] rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="self-start">
                  <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm border border-[#E5E7EB] flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }} />
                    <span className="w-2 h-2 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: "160ms", animationDuration: "1.4s" }} />
                    <span className="w-2 h-2 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: "320ms", animationDuration: "1.4s" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-[#E5E7EB]">
              <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full pl-3 pr-1 py-1 focus-within:border-preik-accent focus-within:ring-[3px] focus-within:ring-preik-accent/10 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Skriv en testmelding..."
                  className="flex-1 bg-transparent text-[14px] text-[#111827] placeholder:text-[#6B7280] outline-none min-w-0"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 rounded-full bg-preik-accent flex items-center justify-center hover:bg-preik-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] bg-preik-bg rounded-xl border-2 border-dashed border-preik-border">
            <p className="text-preik-text-muted text-sm">
              Klikk &quot;Vis test&quot; for å teste chatboten
            </p>
          </div>
        )}

        <p className="text-xs text-preik-text-muted mt-4">
          <strong>Tips:</strong> Lagre endringene i prompten først, så test med nye meldinger for å se effekten.
        </p>
      </div>
    </div>
  );
}
