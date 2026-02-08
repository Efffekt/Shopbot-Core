// Preik Chat Widget - Lightweight embeddable chat
import type { WidgetConfig, Message, ChatState, ThemeColors } from "./types";
import { ICONS } from "./icons";
import { getStyles, LIGHT_THEME, DARK_THEME } from "./styles";

// Default configuration
const DEFAULT_CONFIG: WidgetConfig = {
  storeId: "",
  accentColor: "#F97316",
  textColor: "",
  bgColor: "",
  surfaceColor: "",
  fontBody: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontBrand: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  brandStyle: "normal",
  position: "bottom-right",
  greeting: "Hei! Hvordan kan jeg hjelpe deg i dag?",
  placeholder: "Skriv en melding...",
  brandName: "Preik",
  theme: "auto",
  startOpen: false,
  contained: false,
  onboarding: "",
  onboardingCta: "Start chat",
};

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Get or create session ID
function getSessionId(): string {
  const key = "preik_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = generateId();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// Detect WebView/in-app browsers
function isWebView(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("fban") ||
    ua.includes("fbav") ||
    ua.includes("instagram") ||
    ua.includes("messenger") ||
    ua.includes("webview") ||
    ua.includes("wv)") ||
    (ua.includes("iphone") && !ua.includes("safari")) ||
    (ua.includes("ipad") && !ua.includes("safari"))
  );
}

// Get base URL from script src
function getBaseUrl(): string {
  const script =
    (document.currentScript as HTMLScriptElement) ||
    document.querySelector("script[data-store-id]");

  if (script?.src) {
    try {
      const url = new URL(script.src);
      return url.origin;
    } catch {
      // Invalid URL, fall back
    }
  }
  return window.location.origin;
}

// Parse ONLY explicitly set data-* attributes (returns partial config)
function parseScriptOverrides(): Partial<WidgetConfig> & { storeId: string; startOpen: boolean; contained: boolean } {
  const script =
    (document.currentScript as HTMLScriptElement) ||
    document.querySelector("script[data-store-id]");

  if (!script) {
    console.warn("[Preik] No script element found with data-store-id");
    return { storeId: "", startOpen: false, contained: false };
  }

  const overrides: Partial<WidgetConfig> = {};
  const d = script.dataset;

  // Always read these
  const storeId = d.storeId || "";
  const startOpen = d.startOpen === "true";
  const contained = d.contained === "true";

  // Only include if explicitly set on script tag
  if (d.accentColor !== undefined) overrides.accentColor = d.accentColor;
  if (d.textColor !== undefined) overrides.textColor = d.textColor;
  if (d.bgColor !== undefined) overrides.bgColor = d.bgColor;
  if (d.surfaceColor !== undefined) overrides.surfaceColor = d.surfaceColor;
  if (d.fontBody !== undefined) overrides.fontBody = d.fontBody;
  if (d.fontBrand !== undefined) overrides.fontBrand = d.fontBrand;
  if (d.brandStyle !== undefined) overrides.brandStyle = d.brandStyle as "normal" | "italic";
  if (d.position !== undefined) overrides.position = d.position as "bottom-right" | "bottom-left";
  if (d.greeting !== undefined) overrides.greeting = d.greeting;
  if (d.placeholder !== undefined) overrides.placeholder = d.placeholder;
  if (d.brandName !== undefined) overrides.brandName = d.brandName;
  if (d.theme !== undefined) overrides.theme = d.theme as "auto" | "light" | "dark";
  if (d.onboarding !== undefined) overrides.onboarding = d.onboarding.replace(/\\n/g, "\n");
  if (d.onboardingCta !== undefined) overrides.onboardingCta = d.onboardingCta;

  return { storeId, startOpen, contained, ...overrides };
}

// Build full config: DEFAULT < serverConfig < scriptOverrides
function buildConfig(
  serverConfig: Partial<WidgetConfig> | null,
  overrides: Partial<WidgetConfig> & { storeId: string; startOpen: boolean; contained: boolean }
): WidgetConfig {
  return {
    ...DEFAULT_CONFIG,
    ...(serverConfig || {}),
    ...overrides,
  };
}

// Fetch config from server (fire-and-forget, non-blocking)
async function fetchServerConfig(storeId: string, baseUrl: string): Promise<Partial<WidgetConfig> | null> {
  try {
    const res = await fetch(`${baseUrl}/api/widget-config/${encodeURIComponent(storeId)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch {
    return null;
  }
}

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Darken a color by a percentage
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Get theme colors based on config
function getThemeColors(config: WidgetConfig): ThemeColors {
  // Check host page's data-mode attribute first, then system preference
  const hostMode = document.documentElement.getAttribute("data-mode");
  const prefersDark = hostMode === "dark" ||
    (hostMode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDark =
    config.theme === "dark" || (config.theme === "auto" && prefersDark);

  const base = isDark ? { ...DARK_THEME } : { ...LIGHT_THEME };

  // Override accent color if provided
  if (config.accentColor) {
    base.accent = config.accentColor;
    base.accentHover = darkenColor(config.accentColor, 10);
  }

  // Override text color if provided
  if (config.textColor) {
    base.text = config.textColor;
  }

  // Override background color if provided
  if (config.bgColor) {
    base.bg = config.bgColor;
  }

  // Override surface color if provided
  if (config.surfaceColor) {
    base.surface = config.surfaceColor;
    // Also adjust surface hover to be slightly different
    base.surfaceHover = darkenColor(config.surfaceColor, isDark ? -10 : 5);
  }

  return base;
}

// Escape HTML special characters including quotes (for attribute safety)
function escapeHtmlAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Simple markdown-ish parser
function parseMarkdown(text: string): string {
  return (
    text
      // Escape HTML (including quotes for attribute injection prevention)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // Links (sanitize href to prevent javascript: XSS and attribute breakout)
      .replace(/\[(.+?)\]\((.+?)\)/g, (_match: string, label: string, url: string) => {
        // Decode entities back for URL validation, then re-escape for attribute
        const rawUrl = url.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        if (!/^(https?:|mailto:|tel:|\/|\.\/|#)/i.test(rawUrl)) return label;
        const safeUrl = escapeHtmlAttr(rawUrl);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      })
      // Line breaks to paragraphs
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("")
  );
}

// Chat Widget Web Component
class PreikChatWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfig;
  private scriptOverrides: Partial<WidgetConfig> & { storeId: string; startOpen: boolean; contained: boolean };
  private state: ChatState;
  private baseUrl: string;
  private apiUrl: string;
  private abortController: AbortController | null = null;
  private boundEscapeHandler: ((e: KeyboardEvent) => void) | null = null;

  // DOM references
  private trigger: HTMLButtonElement | null = null;
  private chatWindow: HTMLDivElement | null = null;
  private messagesContainer: HTMLDivElement | null = null;
  private inputField: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "closed" });
    this.scriptOverrides = parseScriptOverrides();
    this.config = buildConfig(null, this.scriptOverrides);
    this.baseUrl = getBaseUrl();
    this.apiUrl = `${this.baseUrl}/api/chat`;
    this.state = {
      isOpen: false,
      messages: [],
      isLoading: false,
      error: null,
      sessionId: "",
      showOnboarding: false,
    };
  }

  connectedCallback() {
    // Initialize session ID (needs localStorage access)
    try {
      this.state.sessionId = getSessionId();
    } catch {
      this.state.sessionId = generateId();
    }

    // Load persisted messages
    this.loadMessages();

    // Check if onboarding should be shown
    if (this.config.onboarding) {
      try {
        const onboardingKey = `preik_onboarding_${this.config.storeId}`;
        const seen = localStorage.getItem(onboardingKey);
        if (!seen && this.state.messages.length === 0) {
          this.state.showOnboarding = true;
        }
      } catch {
        // localStorage might be unavailable
      }
    }

    // Render the widget
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    // Listen for theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (this.config.theme === "auto") {
        this.updateStyles();
      }
    });

    // Open chat on init if startOpen is true or in contained mode
    if (this.config.startOpen || this.config.contained) {
      // Small delay to ensure rendering is complete
      setTimeout(() => this.openChat(), 100);
    }

    // Fetch server config in background and re-render if different
    if (this.config.storeId) {
      fetchServerConfig(this.config.storeId, this.baseUrl).then((serverConfig) => {
        if (!serverConfig) return;
        const updated = buildConfig(serverConfig, this.scriptOverrides);
        // Only re-render if something actually changed
        if (JSON.stringify(updated) !== JSON.stringify(this.config)) {
          this.config = updated;
          this.render();
          this.setupEventListeners();
        }
      });
    }
  }

  disconnectedCallback() {
    this.abortController?.abort();
    if (this.boundEscapeHandler) {
      document.removeEventListener("keydown", this.boundEscapeHandler);
      this.boundEscapeHandler = null;
    }
  }

  private render() {
    const colors = getThemeColors(this.config);
    const positionClass = this.config.position === "bottom-left" ? "left" : "right";

    this.shadow.innerHTML = `
      <style>${getStyles(colors, this.config.fontBody, this.config.fontBrand, this.config.brandStyle, this.config.contained)}</style>

      <button class="trigger ${positionClass}" aria-label="Open chat">
        ${ICONS.chat}
        <span class="trigger-text">Chat</span>
      </button>

      <div class="chat-window ${positionClass} ${this.state.isOpen ? 'open' : ''}" role="dialog" aria-modal="true" aria-label="Chat window">
        <div class="header">
          <div class="header-left">
            <div class="avatar">
              ${ICONS.bot}
            </div>
            <div class="header-info">
              <span class="brand-name">${this.escapeHtml(this.config.brandName)}</span>
              <span class="status">
                <span class="status-dot"></span>
                Online
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button class="clear-btn" aria-label="Clear conversation" title="Slett samtale">
              ${ICONS.trash}
            </button>
            <button class="close-btn" aria-label="Close chat">
              ${ICONS.close}
            </button>
          </div>
        </div>

        ${this.state.showOnboarding ? this.renderOnboarding() : `
        <div class="messages">
          ${this.renderMessages()}
        </div>

        <div class="input-area">
          <div class="input-wrapper">
            <input
              type="text"
              class="input-field"
              placeholder="${this.escapeHtml(this.config.placeholder)}"
              aria-label="Message input"
            />
            <button class="send-btn" aria-label="Send message" disabled>
              ${ICONS.send}
            </button>
          </div>
          <a href="https://preik.no" target="_blank" rel="noopener noreferrer" class="watermark">
            Levert av <span class="watermark-brand">preik</span>
          </a>
        </div>
        `}
      </div>
    `;

    // Get DOM references
    this.trigger = this.shadow.querySelector(".trigger");
    this.chatWindow = this.shadow.querySelector(".chat-window");
    this.messagesContainer = this.shadow.querySelector(".messages");
    this.inputField = this.shadow.querySelector(".input-field");
    this.sendButton = this.shadow.querySelector(".send-btn");
  }

  private renderOnboarding(): string {
    return `
      <div class="onboarding">
        <div class="onboarding-content">
          ${parseMarkdown(this.config.onboarding)}
        </div>
        <button class="onboarding-cta">${this.escapeHtml(this.config.onboardingCta)}</button>
      </div>
    `;
  }

  private dismissOnboarding() {
    this.state.showOnboarding = false;
    try {
      const onboardingKey = `preik_onboarding_${this.config.storeId}`;
      localStorage.setItem(onboardingKey, "1");
    } catch {
      // localStorage might be unavailable
    }
    this.render();
    this.setupEventListeners();
    // Focus input after re-render
    setTimeout(() => {
      this.inputField?.focus();
    }, 100);
  }

  private renderMessages(): string {
    if (this.state.messages.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-text">${this.escapeHtml(this.config.greeting)}</div>
        </div>
      `;
    }

    let html = this.state.messages
      .map(
        (msg) => `
        <div class="message ${msg.role}">
          <div class="bubble">${parseMarkdown(msg.content)}</div>
        </div>
      `
      )
      .join("");

    if (this.state.isLoading) {
      html += `
        <div class="loading">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      `;
    }

    if (this.state.error) {
      html += `
        <div class="error">
          <span>${this.escapeHtml(this.state.error)}</span>
          <button class="error-btn retry-btn">
            ${ICONS.refresh}
            Prøv igjen
          </button>
        </div>
      `;
    }

    return html;
  }

  private updateMessages(streamingUpdate: boolean = false) {
    if (this.messagesContainer) {
      const lastMsg = this.state.messages[this.state.messages.length - 1];

      // For streaming updates, only update the last bubble's text (no re-render, no markdown)
      if (streamingUpdate && lastMsg?.role === "assistant") {
        const bubbles = this.messagesContainer.querySelectorAll(".message.assistant .bubble");
        const lastBubble = bubbles[bubbles.length - 1] as HTMLElement;
        if (lastBubble) {
          // Use textContent during streaming to avoid flash (no HTML parsing)
          lastBubble.textContent = lastMsg.content;
          this.scrollToBottom();
          return;
        }
      }

      // Full re-render for non-streaming updates (with markdown parsing)
      this.messagesContainer.innerHTML = this.renderMessages();
      this.scrollToBottom();

      // Re-attach retry button listener if error
      const retryBtn = this.messagesContainer.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.retryLastMessage());
      }
    }
  }

  private updateStyles() {
    const colors = getThemeColors(this.config);
    const styleEl = this.shadow.querySelector("style");
    if (styleEl) {
      styleEl.textContent = getStyles(colors, this.config.fontBody, this.config.fontBrand, this.config.brandStyle, this.config.contained);
    }
  }

  private setupEventListeners() {
    // Trigger button
    this.trigger?.addEventListener("click", () => this.toggleChat());

    // Close button
    this.shadow.querySelector(".close-btn")?.addEventListener("click", () => this.closeChat());

    // Clear conversation button
    this.shadow.querySelector(".clear-btn")?.addEventListener("click", () => this.clearMessages());

    // Input field
    this.inputField?.addEventListener("input", () => {
      const hasText = (this.inputField?.value || "").trim().length > 0;
      if (this.sendButton) {
        this.sendButton.disabled = !hasText;
      }
    });

    this.inputField?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button
    this.sendButton?.addEventListener("click", () => this.sendMessage());

    // Onboarding CTA button
    this.shadow.querySelector(".onboarding-cta")?.addEventListener("click", () => this.dismissOnboarding());

    // Click outside to close (optional - commenting out for now as it can be annoying)
    // document.addEventListener("click", (e) => {
    //   if (this.state.isOpen && !this.contains(e.target as Node)) {
    //     this.closeChat();
    //   }
    // });

    // Escape key to close (store reference for cleanup in disconnectedCallback)
    this.boundEscapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.state.isOpen) {
        this.closeChat();
      }
    };
    document.addEventListener("keydown", this.boundEscapeHandler);
  }

  private toggleChat() {
    if (this.state.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  private openChat() {
    this.state.isOpen = true;
    this.chatWindow?.classList.add("open");
    this.trigger?.setAttribute("aria-expanded", "true");

    // Focus input after animation
    setTimeout(() => {
      this.inputField?.focus();
    }, 300);
  }

  private closeChat() {
    this.state.isOpen = false;
    this.chatWindow?.classList.remove("open");
    this.trigger?.setAttribute("aria-expanded", "false");
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private async sendMessage() {
    const text = (this.inputField?.value || "").trim();
    if (!text || this.state.isLoading) return;

    // Clear input
    if (this.inputField) {
      this.inputField.value = "";
    }
    if (this.sendButton) {
      this.sendButton.disabled = true;
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    this.state.messages.push(userMessage);
    this.state.isLoading = true;
    this.state.error = null;
    this.updateMessages();
    this.saveMessages();

    // Cancel any in-flight request
    this.abortController?.abort();
    this.abortController = new AbortController();

    // Add timeout to prevent hanging requests (30 seconds)
    const timeoutId = setTimeout(() => this.abortController?.abort(), 30000);

    try {
      const useNonStreaming = isWebView();

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: this.state.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          storeId: this.config.storeId,
          sessionId: this.state.sessionId,
          noStream: useNonStreaming,
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Non-streaming response (JSON)
      if (contentType.includes("application/json")) {
        const data = await response.json();

        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: data.content || data.text || "",
          timestamp: new Date(),
        };
        this.state.messages.push(assistantMessage);
        this.state.isLoading = false;
        this.updateMessages();
        this.saveMessages();
        return;
      }

      // Streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullContent = "";  // All received content
      let displayedContent = ""; // What's shown to user
      let streamingStarted = false;
      let streamDone = false;

      // Add empty assistant message that we'll update
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      this.state.messages.push(assistantMessage);
      this.state.isLoading = false;
      this.updateMessages();

      // Word-by-word reveal function
      const WORDS_PER_TICK = 2;
      const TICK_MS = 30;

      const revealWords = () => {
        if (displayedContent.length >= fullContent.length && streamDone) {
          // All done
          return;
        }

        // Find next words to reveal
        const remaining = fullContent.slice(displayedContent.length);
        const words = remaining.split(/(\s+)/); // Split keeping whitespace
        let toAdd = "";

        for (let i = 0; i < WORDS_PER_TICK * 2 && i < words.length; i++) {
          toAdd += words[i];
        }

        if (toAdd) {
          displayedContent += toAdd;
          assistantMessage.content = displayedContent;
          this.updateMessages(true);
        }

        // Continue revealing if there's more
        if (displayedContent.length < fullContent.length || !streamDone) {
          setTimeout(revealWords, TICK_MS);
        }
      };

      // Start the reveal loop
      setTimeout(revealWords, TICK_MS);

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          streamDone = true;
          break;
        }

        if (!streamingStarted) {
          streamingStarted = true;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
      }

      // Final decode to flush any remaining bytes
      const remaining = decoder.decode();
      if (remaining) {
        fullContent += remaining;
      }

      // Wait for reveal to catch up
      while (displayedContent.length < fullContent.length) {
        await new Promise(r => setTimeout(r, 50));
      }

      // Ensure final content is set with markdown parsing
      assistantMessage.content = fullContent;
      this.updateMessages(false); // Full re-render with markdown
      this.saveMessages();
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if it was an abort (user cancelled or timeout)
      if ((error as Error).name === "AbortError") {
        // Only show error if we haven't received any response yet
        if (this.state.isLoading) {
          this.state.isLoading = false;
          this.state.error = "Forespørselen tok for lang tid. Prøv igjen.";
          this.updateMessages();
        }
        return;
      }

      this.state.isLoading = false;
      this.state.error =
        error instanceof Error
          ? error.message
          : "Noe gikk galt. Prøv igjen.";
      this.updateMessages();
    }
  }

  private retryLastMessage() {
    // Remove the error
    this.state.error = null;

    // Find and remove the last user message to resend it
    const lastUserIndex = this.state.messages
      .map((m, i) => ({ msg: m, index: i }))
      .filter(({ msg }) => msg.role === "user")
      .pop();

    if (lastUserIndex) {
      const lastUserMessage = this.state.messages[lastUserIndex.index];
      // Remove messages from the last user message onwards
      this.state.messages = this.state.messages.slice(0, lastUserIndex.index);
      this.updateMessages();

      // Resend
      if (this.inputField) {
        this.inputField.value = lastUserMessage.content;
      }
      this.sendMessage();
    }
  }

  private saveMessages() {
    try {
      const key = `preik_messages_${this.config.storeId}`;
      const data = {
        messages: this.state.messages.slice(-50), // Keep last 50 messages
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // localStorage might be unavailable
    }
  }

  private clearMessages() {
    this.state.messages = [];
    this.state.error = null;
    this.updateMessages();
    try {
      const key = `preik_messages_${this.config.storeId}`;
      localStorage.removeItem(key);
      // Reset onboarding so it shows again after clearing
      if (this.config.onboarding) {
        const onboardingKey = `preik_onboarding_${this.config.storeId}`;
        localStorage.removeItem(onboardingKey);
        this.state.showOnboarding = true;
        this.render();
        this.setupEventListeners();
      }
    } catch {
      // localStorage might be unavailable
    }
  }

  private loadMessages() {
    try {
      const key = `preik_messages_${this.config.storeId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        // Only restore if less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          this.state.messages = data.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
        }
      }
    } catch {
      // localStorage might be unavailable
    }
  }
}

// Register the custom element
if (!customElements.get("preik-chat-widget")) {
  customElements.define("preik-chat-widget", PreikChatWidget);
}

// Auto-initialize widget when script loads
function initWidget() {
  const script =
    (document.currentScript as HTMLScriptElement) ||
    document.querySelector('script[data-store-id]');

  const isContained = script?.dataset.contained === "true";

  // In contained mode, check if widget already exists in parent container
  // In normal mode, check if widget exists anywhere
  if (isContained) {
    if (script?.parentElement?.querySelector("preik-chat-widget")) {
      return; // Already initialized in this container
    }
  } else {
    if (document.querySelector("preik-chat-widget")) {
      return; // Already initialized
    }
  }

  const widget = document.createElement("preik-chat-widget");

  // In contained mode, append to script's parent; otherwise append to body
  if (isContained && script?.parentElement) {
    script.parentElement.appendChild(widget);
  } else {
    document.body.appendChild(widget);
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidget);
} else {
  initWidget();
}
