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
    <div className="w-full max-w-[400px] bg-preik-bg rounded-2xl shadow-2xl overflow-hidden transition-colors duration-200">
      {/* Header - matches widget exactly */}
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
            <p className="font-brand font-semibold italic text-[17px] text-preik-text transition-colors">preik</p>
            <p className="text-[13px] text-preik-text-muted flex items-center gap-1.5 transition-colors">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-preik-text-muted opacity-70 transition-colors">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button className="p-2 rounded-lg text-preik-text-muted transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 h-[340px] overflow-hidden flex flex-col justify-end gap-4">
        {displayedMessages.map((message, index) => (
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
              <p>{message.content}</p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div className="self-start max-w-[85%] animate-fade-in">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-preik-surface border border-preik-border text-preik-text transition-colors">
              <p className="text-[15px] leading-relaxed">
                {streamedText}
                <span className="inline-block w-0.5 h-4 bg-preik-accent ml-0.5 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="self-start animate-fade-in">
            <div className="bg-preik-surface px-4 py-3 rounded-2xl rounded-bl-sm border border-preik-border flex items-center gap-1 transition-colors">
              <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }} />
              <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "160ms", animationDuration: "1.4s" }} />
              <span className="w-2 h-2 bg-preik-text-muted rounded-full animate-bounce" style={{ animationDelay: "320ms", animationDuration: "1.4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-5 py-4 bg-preik-surface border-t border-preik-border transition-colors">
        <div className={`flex items-center gap-3 bg-preik-bg border rounded-full pl-4 pr-1 py-1 transition-all duration-200 ${
          userTypingText
            ? "border-preik-accent ring-[3px] ring-preik-accent/10"
            : "border-preik-border"
        }`}>
          <span className="flex-1 text-[15px] min-w-0">
            {userTypingText ? (
              <span className="text-preik-text transition-colors">
                {userTypingText}
                <span className="inline-block w-0.5 h-4 bg-preik-accent ml-0.5 animate-pulse" />
              </span>
            ) : (
              <span className="text-preik-text-muted transition-colors">Skriv en melding...</span>
            )}
          </span>
          <div
            className={`w-10 h-10 rounded-full bg-preik-accent flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              isButtonPressed ? "scale-90 bg-preik-accent-hover" : "scale-100"
            }`}
          >
            <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
        </div>

        {/* Watermark */}
        <p className="text-center mt-2.5 text-[11px] text-preik-text-muted opacity-60 transition-colors">
          Levert av <span className="font-brand font-semibold italic">preik</span>
        </p>
      </div>
    </div>
  );
}
