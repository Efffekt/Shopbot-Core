"use client";

import { useState, useEffect, useRef } from "react";

const conversation = [
  { role: "user", content: "Hei! Hva er Preik?" },
  { role: "assistant", content: "Hei! Preik er en norsk AI-assistent som læres opp på bedriftens innhold. Vi hjelper kundene dine med å finne svar – raskt og på ordentlig norsk." },
  { role: "user", content: "Hvordan kommer jeg i gang?" },
  { role: "assistant", content: "Det er enkelt! Vi crawler nettsiden din, trener AI-en på innholdet, og gir deg en kode-snippet. På plass i løpet av 24-48 timer." },
];

export function AnimatedChat() {
  const [displayedMessages, setDisplayedMessages] = useState<typeof conversation>([]);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userTypingText, setUserTypingText] = useState("");
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const messageIndexRef = useRef(0);

  useEffect(() => {
    const runConversation = () => {
      if (messageIndexRef.current >= conversation.length) {
        // Reset after a pause
        setTimeout(() => {
          setDisplayedMessages([]);
          setStreamedText("");
          setUserTypingText("");
          messageIndexRef.current = 0;
          runConversation();
        }, 5000);
        return;
      }

      const currentMessage = conversation[messageIndexRef.current];

      if (currentMessage.role === "assistant") {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setIsStreaming(true);
          setStreamedText("");

          let charIndex = 0;
          const streamInterval = setInterval(() => {
            if (charIndex < currentMessage.content.length) {
              setStreamedText(currentMessage.content.slice(0, charIndex + 1));
              charIndex++;
            } else {
              clearInterval(streamInterval);
              setDisplayedMessages((prev) => [...prev, currentMessage]);
              setIsStreaming(false);
              setStreamedText("");
              messageIndexRef.current++;
              setTimeout(runConversation, 1500);
            }
          }, 25);
        }, 800);
      } else {
        // User message - animate typing in input
        setUserTypingText("");
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < currentMessage.content.length) {
            setUserTypingText(currentMessage.content.slice(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typeInterval);
            // Animate button press
            setTimeout(() => {
              setIsButtonPressed(true);
              setTimeout(() => {
                setIsButtonPressed(false);
                setUserTypingText("");
                setDisplayedMessages((prev) => [...prev, currentMessage]);
                messageIndexRef.current++;
                setTimeout(runConversation, 800);
              }, 150);
            }, 300);
          }
        }, 50);
      }
    };

    runConversation();
  }, []);

  return (
    <div className="w-full max-w-md bg-preik-bg rounded-3xl border border-preik-border shadow-2xl overflow-hidden transition-colors duration-200">
      {/* Chat header - Preik branded */}
      <div className="px-6 py-5 border-b border-preik-border flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-preik-accent flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="preik-wordmark text-xl">preik</p>
          <p className="text-xs text-preik-text-muted">AI-assistent</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-preik-text-muted">Online</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-6 h-[360px] overflow-hidden flex flex-col justify-end gap-4">
        {displayedMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${
                message.role === "user"
                  ? "bg-preik-accent text-white rounded-br-md"
                  : "bg-preik-surface border border-preik-border rounded-bl-md text-preik-text"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div className="flex justify-start animate-fade-in">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[85%] bg-preik-surface border border-preik-border text-preik-text">
              <p className="text-sm leading-relaxed">
                {streamedText}
                <span className="inline-block w-0.5 h-4 bg-preik-accent ml-0.5 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-preik-surface px-4 py-3 rounded-2xl rounded-bl-md border border-preik-border">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated input */}
      <div className="px-6 py-5 border-t border-preik-border">
        <div className={`flex items-center gap-3 bg-preik-surface rounded-full px-5 py-3.5 border transition-all duration-200 ${userTypingText ? "border-preik-accent shadow-sm shadow-preik-accent/20" : "border-preik-border"}`}>
          <span className="flex-1 text-sm">
            {userTypingText ? (
              <span className="text-preik-text">
                {userTypingText}
                <span className="inline-block w-0.5 h-4 bg-preik-accent ml-0.5 animate-pulse" />
              </span>
            ) : (
              <span className="text-preik-text-muted">Spør om noe...</span>
            )}
          </span>
          <div
            className={`w-10 h-10 rounded-full bg-preik-accent flex items-center justify-center transition-all duration-150 ${isButtonPressed ? "scale-90 bg-preik-accent-hover" : "scale-100"}`}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
