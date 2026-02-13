"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("ChatWidget");

interface Message {
  role: "user" | "assistant";
  content: string;
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
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
          { role: "assistant", content: data.content || data.text || "" },
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
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
            updated[updated.length - 1] = { role: "assistant", content: fullContent };
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
            updated[updated.length - 1] = { role: "assistant", content: snapshot };
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
        updated[updated.length - 1] = { role: "assistant", content: fullContent };
        return updated;
      });
      setIsStreaming(false);
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        setIsLoading(false);
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Forespørselen tok for lang tid. Prøv igjen." },
        ]);
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

  return (
    <div className="bg-preik-bg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] w-full max-w-[400px] transition-colors">
      {/* Header */}
      <div className="px-5 py-4 bg-preik-surface border-b border-preik-border flex items-center justify-between transition-colors">
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
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-2 rounded-lg text-preik-text-muted hover:bg-preik-bg hover:text-red-500 transition-all opacity-70 hover:opacity-100"
            title="Slett samtale"
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

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[85%] animate-fade-in ${
              message.role === "user" ? "self-end" : "self-start"
            }`}
          >
            <div
              className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed transition-colors ${
                message.role === "user"
                  ? "bg-preik-accent text-white rounded-br-sm"
                  : "bg-preik-surface text-preik-text border border-preik-border rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="self-start">
            <div className="bg-preik-surface px-4 py-3 rounded-2xl rounded-bl-sm border border-preik-border flex items-center gap-1 transition-colors">
              <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }} />
              <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "160ms", animationDuration: "1.4s" }} />
              <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "320ms", animationDuration: "1.4s" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-5 py-4 bg-preik-surface border-t border-preik-border transition-colors">
        <div className="flex items-center gap-3 bg-preik-bg border border-preik-border rounded-full pl-4 pr-1 py-1 focus-within:border-preik-accent focus-within:ring-[3px] focus-within:ring-preik-accent/10 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[15px] text-preik-text placeholder:text-preik-text-muted outline-none min-w-0 transition-colors"
            disabled={isLoading || isStreaming}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || isStreaming || !input.trim()}
            className="w-10 h-10 rounded-full bg-preik-accent flex items-center justify-center hover:bg-preik-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        {/* Watermark */}
        <a
          href="https://preik.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-2.5 text-[11px] text-preik-text-muted no-underline opacity-60 hover:opacity-100 transition-opacity"
        >
          Levert av <span className="font-brand font-semibold italic">preik</span>
        </a>
      </div>
    </div>
  );
});
