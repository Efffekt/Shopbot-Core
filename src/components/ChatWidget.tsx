"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  storeId?: string;
  placeholder?: string;
}

export interface ChatWidgetRef {
  sendMessage: (message: string) => void;
}

export const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>(function ChatWidget({
  storeId = "preik-demo",
  placeholder = "Spør om Preik...",
}, ref) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Only scroll within the container, not the whole page
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    // Only scroll to bottom when there are messages (not on initial mount)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => sendMessage(message),
  }));

  const sendMessage = async (externalMessage?: string) => {
    const messageToSend = externalMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = messageToSend;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          storeId,
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
    } catch (error) {
      console.error("Chat error:", error);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-preik-bg rounded-2xl border border-preik-border shadow-lg overflow-hidden transition-colors duration-200 flex flex-col h-[500px]">
      {/* Chat header - Preik branded */}
      <div className="px-5 py-4 border-b border-preik-border flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-preik-accent flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="preik-wordmark text-xl">preik</p>
          <p className="text-xs text-preik-text-muted">AI-assistent demo</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-preik-text-muted">Online</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-preik-accent/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <p className="text-preik-text font-medium mb-1">Hei! Jeg er Preik.</p>
            <p className="text-preik-text-muted text-sm">Spør meg om AI-assistenter, priser, eller hvordan vi kan hjelpe bedriften din.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                message.role === "user"
                  ? "bg-preik-accent text-white rounded-br-md"
                  : "bg-preik-surface border border-preik-border rounded-bl-md"
              }`}
            >
              <p className={`text-sm whitespace-pre-wrap ${message.role === "assistant" ? "text-preik-text" : ""}`}>
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-preik-surface px-4 py-3 rounded-2xl rounded-bl-md border border-preik-border">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="px-4 py-3 border-t border-preik-border flex-shrink-0">
        <div className="flex items-center gap-2 bg-preik-surface rounded-full px-4 py-2 border border-preik-border focus-within:border-preik-accent transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-preik-text placeholder:text-preik-text-muted outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-full bg-preik-accent flex items-center justify-center hover:bg-preik-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
