"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("ChatWidget");

// Escape HTML for safe insertion
function escapeHtmlReact(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Inline formatting: bold, italic, code, links → returns HTML string
function renderInline(text: string): string {
  return escapeHtmlReact(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='inline-code'>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m, label, url) => {
      // Decode entities back for URL validation, then re-escape for attribute
      const rawUrl = url.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      if (!/^(https?:|mailto:|tel:|\/|\.\/|#)/i.test(rawUrl)) return label;
      const safeUrl = escapeHtmlReact(rawUrl);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

// Line-by-line block markdown parser → returns JSX elements
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line — skip
    if (line.trim() === "") { i++; continue; }

    // Headings: # through ###### → h3-h6 (offset to avoid oversized in chat)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(Math.max(headingMatch[1].length + 2, 3), 6);
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      elements.push(
        <Tag key={key++} className="font-semibold" style={{
          fontSize: level === 3 ? "1.05em" : level === 4 ? "1em" : "0.95em",
          margin: "0.75em 0 0.25em 0",
        }} dangerouslySetInnerHTML={{ __html: renderInline(headingMatch[2].trim()) }} />
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[\-\*]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
        items.push(<li key={key++} dangerouslySetInnerHTML={{ __html: renderInline(lines[i].replace(/^[\-\*]\s+/, "")) }} />);
        i++;
      }
      elements.push(<ul key={key++} className="list-disc pl-6 my-2 space-y-1">{items}</ul>);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={key++} dangerouslySetInnerHTML={{ __html: renderInline(lines[i].replace(/^\d+\.\s+/, "")) }} />);
        i++;
      }
      elements.push(<ol key={key++} className="list-decimal pl-6 my-2 space-y-1">{items}</ol>);
      continue;
    }

    // Paragraph: consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^[\-\*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(renderInline(lines[i]));
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(<p key={key++} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: paraLines.join("<br>") }} />);
    }
  }

  return <>{elements}</>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  storeId?: string;
  placeholder?: string;
  brandName?: string;
  greeting?: string;
}

export interface ChatWidgetRef {
  sendMessage: (message: string) => void;
}

export const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>(function ChatWidget({
  storeId = "preik-demo",
  placeholder = "Skriv en melding...",
  brandName = "preik",
  greeting = "Hei! Spør meg om AI-assistenter, priser, eller hvordan vi kan hjelpe bedriften din.",
}, ref) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => sendMessage(message),
  }));

  const sendMessage = async (externalMessage?: string) => {
    const messageToSend = externalMessage || input.trim();
    if (!messageToSend || isLoading || isStreaming) return;

    const userMessage = messageToSend;
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 30000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          storeId,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const contentType = response.headers.get("content-type") || "";

      // Non-streaming fallback (JSON response)
      if (contentType.includes("application/json")) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content || data.text || "", timestamp: new Date() },
        ]);
        setIsLoading(false);
        return;
      }

      // Streaming response — word-by-word reveal
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      setIsLoading(false);
      setIsStreaming(true);

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date() }]);

      const decoder = new TextDecoder();
      let fullContent = "";
      let displayedContent = "";
      let streamDone = false;

      const WORDS_PER_TICK = 2;
      const TICK_MS = 30;

      // Word-by-word reveal loop
      const revealWords = () => {
        if (displayedContent.length >= fullContent.length && streamDone) {
          // Final update
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
            return updated;
          });
          setIsStreaming(false);
          return;
        }

        const remaining = fullContent.slice(displayedContent.length);
        const words = remaining.split(/(\s+)/);
        let toAdd = "";
        for (let i = 0; i < WORDS_PER_TICK * 2 && i < words.length; i++) {
          toAdd += words[i];
        }

        if (toAdd) {
          displayedContent += toAdd;
          const snapshot = displayedContent;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: snapshot };
            return updated;
          });
        }

        if (displayedContent.length < fullContent.length || !streamDone) {
          setTimeout(revealWords, TICK_MS);
        }
      };

      setTimeout(revealWords, TICK_MS);

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          streamDone = true;
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
      }

      // Flush decoder
      const remaining = decoder.decode();
      if (remaining) fullContent += remaining;
      streamDone = true;

      // Wait for reveal to finish
      while (displayedContent.length < fullContent.length) {
        await new Promise((r) => setTimeout(r, 50));
      }

      // Ensure final content
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
        return updated;
      });
      setIsStreaming(false);
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        setIsLoading(false);
        setIsStreaming(false);
        // If streaming was in progress, keep partial content
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content) {
            return prev; // Keep partial response
          }
          return [
            ...prev,
            { role: "assistant", content: "Forespørselen tok for lang tid. Prøv igjen.", timestamp: new Date() },
          ];
        });
        return;
      }
      log.error("Chat error:", error);
      setIsLoading(false);
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Beklager, noe gikk galt. Prøv igjen senere.",
          timestamp: new Date(),
        },
      ]);
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

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-grow textarea
    const el = e.target;
    el.style.height = "auto";
    const sh = el.scrollHeight;
    el.style.height = `${Math.min(sh, 96)}px`;
    el.style.overflow = sh > 96 ? "auto" : "hidden";
  };

  return (
    <div className="bg-preik-bg border border-preik-border rounded-[1.25rem] shadow-[0_8px_16px_rgba(0,0,0,0.08),0_25px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-[500px] w-full max-w-[400px] transition-colors">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-br from-preik-surface to-preik-accent/[0.04] border-b border-preik-border flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-preik-accent flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="10" rx="2"/>
              <circle cx="12" cy="5" r="2"/>
              <path d="M12 7v4"/>
              <line x1="8" y1="16" x2="8" y2="16"/>
              <line x1="16" y1="16" x2="16" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="font-brand font-semibold italic text-[17px] text-preik-text transition-colors">{brandName}</p>
            <p className="text-[13px] text-preik-text-muted flex items-center gap-1.5 transition-colors">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-[statusPulse_2s_ease-in-out_infinite]" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-2 rounded-lg text-preik-text-muted hover:bg-preik-bg hover:text-red-500 transition-all"
            title="Slett samtale"
            aria-label="Slett samtale"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center px-5">
            <p className="text-[15px] text-preik-text-muted max-w-[300px] leading-relaxed transition-colors">
              {greeting}
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const prev = index > 0 ? messages[index - 1] : null;
          const gap = prev && message.timestamp && prev.timestamp
            ? message.timestamp.getTime() - prev.timestamp.getTime()
            : 0;
          const showTime = gap > 5 * 60 * 1000;

          return (
          <div key={index}>
            {showTime && (
              <div className="text-center text-[11px] text-preik-text-muted py-1 opacity-70">
                {message.timestamp.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            <div
              className={`flex flex-col animate-fade-in ${
                message.role === "user" ? "self-end ml-auto max-w-[85%]" : "self-start max-w-[90%]"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="flex items-end gap-2">
                  <div className="w-[26px] h-[26px] rounded-full bg-preik-accent/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="10" rx="2"/>
                      <circle cx="12" cy="5" r="2"/>
                      <path d="M12 7v4"/>
                    </svg>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-[15px] leading-relaxed bg-preik-surface text-preik-text border border-preik-border hover:shadow-sm transition-all">
                    {renderMarkdown(message.content)}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-2xl rounded-br-sm text-[15px] leading-relaxed bg-gradient-to-br from-preik-accent to-preik-accent-hover text-white hover:shadow-sm transition-all">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
            </div>
          </div>
          );
        })}

        {isLoading && (
          <div className="self-start animate-fade-in">
            <div className="flex items-end gap-2">
              <div className="w-[26px] h-[26px] rounded-full bg-preik-accent/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <path d="M12 7v4"/>
                </svg>
              </div>
              <div className="bg-preik-surface px-[18px] py-[14px] rounded-2xl rounded-bl-sm border border-preik-border flex items-center gap-1.5 transition-colors">
                <span className="w-1.5 h-1.5 bg-preik-text-muted rounded-full animate-[typingPulse_1.4s_ease-in-out_infinite_0s]" />
                <span className="w-1.5 h-1.5 bg-preik-text-muted rounded-full animate-[typingPulse_1.4s_ease-in-out_infinite_0.2s]" />
                <span className="w-1.5 h-1.5 bg-preik-text-muted rounded-full animate-[typingPulse_1.4s_ease-in-out_infinite_0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-5 py-4 bg-preik-surface border-t border-preik-border transition-colors">
        <div className="flex items-end gap-3 bg-preik-bg border border-preik-border rounded-2xl pl-4 pr-1 py-1 focus-within:border-preik-accent focus-within:ring-[3px] focus-within:ring-preik-accent/10 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[15px] text-preik-text placeholder:text-preik-text-muted outline-none min-w-0 resize-none overflow-hidden max-h-24 py-2 leading-relaxed transition-colors"
            spellCheck={false}
            autoComplete="off"
            disabled={isLoading}
          />
          <button
            onClick={() => {
              if (isStreaming) {
                abortControllerRef.current?.abort();
              } else {
                sendMessage();
              }
            }}
            disabled={isLoading || (!isStreaming && !input.trim())}
            aria-label={isStreaming ? "Stopp svar" : "Send melding"}
            className="w-10 h-10 rounded-full bg-preik-accent flex items-center justify-center hover:bg-preik-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isStreaming ? (
              <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>

        {/* Watermark */}
        <a
          href="https://preik.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-2.5 text-[11px] text-preik-text-muted no-underline hover:opacity-80 transition-opacity"
        >
          Levert av <span className="font-brand font-semibold italic">preik</span>
        </a>
      </div>
    </div>
  );
});
