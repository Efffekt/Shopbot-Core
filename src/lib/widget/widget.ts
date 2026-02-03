// Preik Chat Widget - Lightweight embeddable chat
import type { WidgetConfig, Message, ChatState, ThemeColors } from "./types";
import { ICONS } from "./icons";
import { getStyles, LIGHT_THEME, DARK_THEME } from "./styles";

// Default configuration
const DEFAULT_CONFIG: WidgetConfig = {
  storeId: "",
  accentColor: "#F97316",
  textColor: "#111827",
  fontBody: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontBrand: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  brandStyle: "normal",
  position: "bottom-right",
  greeting: "Hei! Hvordan kan jeg hjelpe deg i dag?",
  placeholder: "Skriv en melding...",
  brandName: "Preik",
  theme: "auto",
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

// Get API URL from script src
function getApiUrl(): string {
  const script =
    (document.currentScript as HTMLScriptElement) ||
    document.querySelector("script[data-store-id]");

  if (script?.src) {
    try {
      const url = new URL(script.src);
      return `${url.origin}/api/chat`;
    } catch {
      // Invalid URL, fall back
    }
  }
  return `${window.location.origin}/api/chat`;
}

// Parse config from script data attributes
function parseConfig(): WidgetConfig {
  const script =
    (document.currentScript as HTMLScriptElement) ||
    document.querySelector("script[data-store-id]");

  if (!script) {
    console.warn("[Preik] No script element found with data-store-id");
    return DEFAULT_CONFIG;
  }

  return {
    storeId: script.dataset.storeId || DEFAULT_CONFIG.storeId,
    accentColor: script.dataset.accentColor || DEFAULT_CONFIG.accentColor,
    textColor: script.dataset.textColor || DEFAULT_CONFIG.textColor,
    fontBody: script.dataset.fontBody || DEFAULT_CONFIG.fontBody,
    fontBrand: script.dataset.fontBrand || DEFAULT_CONFIG.fontBrand,
    brandStyle: (script.dataset.brandStyle as "normal" | "italic") || DEFAULT_CONFIG.brandStyle,
    position: (script.dataset.position as "bottom-right" | "bottom-left") || DEFAULT_CONFIG.position,
    greeting: script.dataset.greeting || DEFAULT_CONFIG.greeting,
    placeholder: script.dataset.placeholder || DEFAULT_CONFIG.placeholder,
    brandName: script.dataset.brandName || DEFAULT_CONFIG.brandName,
    theme: (script.dataset.theme as "auto" | "light" | "dark") || DEFAULT_CONFIG.theme,
  };
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
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    config.theme === "dark" || (config.theme === "auto" && prefersDark);

  const base = isDark ? { ...DARK_THEME } : { ...LIGHT_THEME };

  // Override accent color if provided
  if (config.accentColor && config.accentColor !== DEFAULT_CONFIG.accentColor) {
    base.accent = config.accentColor;
    base.accentHover = darkenColor(config.accentColor, 10);
  }

  // Override text color if provided
  if (config.textColor && config.textColor !== DEFAULT_CONFIG.textColor) {
    base.text = config.textColor;
  }

  return base;
}

// Simple markdown-ish parser
function parseMarkdown(text: string): string {
  return (
    text
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
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
  private state: ChatState;
  private apiUrl: string;
  private abortController: AbortController | null = null;

  // DOM references
  private trigger: HTMLButtonElement | null = null;
  private chatWindow: HTMLDivElement | null = null;
  private messagesContainer: HTMLDivElement | null = null;
  private inputField: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "closed" });
    this.config = parseConfig();
    this.apiUrl = getApiUrl();
    this.state = {
      isOpen: false,
      messages: [],
      isLoading: false,
      error: null,
      sessionId: "",
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
  }

  disconnectedCallback() {
    this.abortController?.abort();
  }

  private render() {
    const colors = getThemeColors(this.config);
    const positionClass = this.config.position === "bottom-left" ? "left" : "right";

    this.shadow.innerHTML = `
      <style>${getStyles(colors, this.config.fontBody, this.config.fontBrand, this.config.brandStyle)}</style>

      <button class="trigger ${positionClass}" aria-label="Open chat">
        ${ICONS.chat}
        <span class="trigger-text">Chat</span>
      </button>

      <div class="chat-window ${positionClass}" role="dialog" aria-label="Chat window">
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
      </div>
    `;

    // Get DOM references
    this.trigger = this.shadow.querySelector(".trigger");
    this.chatWindow = this.shadow.querySelector(".chat-window");
    this.messagesContainer = this.shadow.querySelector(".messages");
    this.inputField = this.shadow.querySelector(".input-field");
    this.sendButton = this.shadow.querySelector(".send-btn");
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

  private updateMessages() {
    if (this.messagesContainer) {
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
      styleEl.textContent = getStyles(colors, this.config.fontBody, this.config.fontBrand, this.config.brandStyle);
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

    // Click outside to close (optional - commenting out for now as it can be annoying)
    // document.addEventListener("click", (e) => {
    //   if (this.state.isOpen && !this.contains(e.target as Node)) {
    //     this.closeChat();
    //   }
    // });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.state.isOpen) {
        this.closeChat();
      }
    });
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

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
      let assistantContent = "";

      // Add empty assistant message that we'll update
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      this.state.messages.push(assistantMessage);
      this.state.isLoading = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        assistantMessage.content = assistantContent;
        this.updateMessages();
      }

      this.saveMessages();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return; // Request was cancelled
      }

      console.error("[Preik] Chat error:", error);
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
  if (document.querySelector("preik-chat-widget")) {
    return; // Already initialized
  }

  const widget = document.createElement("preik-chat-widget");
  document.body.appendChild(widget);
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidget);
} else {
  initWidget();
}
