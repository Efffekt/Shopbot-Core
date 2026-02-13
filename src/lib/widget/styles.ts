// CSS-in-JS styles for the widget

import type { ThemeColors } from "./types";

export const LIGHT_THEME: ThemeColors = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceHover: "#F3F4F6",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  accent: "#C2410C",
  accentHover: "#9A3412",
  accentText: "#FFFFFF",
};

export const DARK_THEME: ThemeColors = {
  bg: "#111827",
  surface: "#1F2937",
  surfaceHover: "#374151",
  text: "#F9FAFB",
  textMuted: "#9CA3AF",
  border: "#374151",
  accent: "#F97316",
  accentHover: "#EA580C",
  accentText: "#FFFFFF",
};

export function getStyles(colors: ThemeColors, fontBody: string, fontBrand: string, brandStyle: "normal" | "italic" = "normal", contained: boolean = false): string {
  const containedStyles = contained ? `
    /* Contained mode overrides */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .trigger {
      display: none !important;
    }

    .chat-window {
      position: relative !important;
      bottom: auto !important;
      right: auto !important;
      left: auto !important;
      width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      border-radius: 1rem;
      box-shadow: none;
      opacity: 1 !important;
      transform: none !important;
      pointer-events: auto !important;
    }
  ` : '';

  return `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,600&display=swap');

    :host {
      --widget-bg: ${colors.bg};
      --widget-surface: ${colors.surface};
      --widget-surface-hover: ${colors.surfaceHover};
      --widget-text: ${colors.text};
      --widget-text-muted: ${colors.textMuted};
      --widget-border: ${colors.border};
      --widget-accent: ${colors.accent};
      --widget-accent-hover: ${colors.accentHover};
      --widget-accent-text: ${colors.accentText};
      --widget-font-body: ${fontBody};
      --widget-font-brand: ${fontBrand};

      all: initial;
      font-family: var(--widget-font-body);
      font-size: 16px;
      line-height: 1.5;
      color: var(--widget-text);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Trigger Button */
    .trigger {
      position: fixed;
      bottom: 20px;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      background: var(--widget-accent);
      color: var(--widget-accent-text);
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      font-family: var(--widget-font-body);
      font-size: 15px;
      font-weight: 500;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .trigger:hover {
      background: var(--widget-accent-hover);
      transform: translateY(-2px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
    }

    .trigger.right {
      right: 20px;
    }

    .trigger.left {
      left: 20px;
    }

    .trigger svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .trigger-text {
      white-space: nowrap;
    }

    /* Chat Window */
    .chat-window {
      position: fixed;
      bottom: 100px;
      z-index: 2147483647;
      width: 400px;
      height: 550px;
      max-height: calc(100vh - 140px);
      background: var(--widget-bg);
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .chat-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .chat-window.right {
      right: 20px;
    }

    .chat-window.left {
      left: 20px;
    }

    /* Mobile fullscreen */
    @media (max-width: 480px) {
      .chat-window {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100dvh;
        height: 100%;
        max-height: 100dvh;
        max-height: 100%;
        border-radius: 0;
      }

      .trigger {
        bottom: 16px;
        right: 16px !important;
        left: auto !important;
        padding: 12px 20px;
      }
    }

    ${containedStyles}

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--widget-surface);
      border-bottom: 1px solid var(--widget-border);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--widget-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--widget-accent-text);
    }

    .avatar svg {
      width: 20px;
      height: 20px;
    }

    .header-info {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-family: var(--widget-font-brand);
      font-weight: 600;
      font-style: ${brandStyle};
      font-size: 17px;
      color: var(--widget-text);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .clear-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--widget-text-muted);
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .clear-btn:hover {
      background: var(--widget-surface-hover);
      color: #EF4444;
    }

    .clear-btn svg {
      width: 18px;
      height: 18px;
      display: block;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--widget-text-muted);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #22C55E;
      border-radius: 50%;
    }

    .close-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--widget-text-muted);
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: var(--widget-surface-hover);
      color: var(--widget-text);
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
      display: block;
    }

    /* Messages Area */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
    }

    .empty-text {
      font-size: 15px;
      max-width: 300px;
      line-height: 1.6;
      color: var(--widget-text-muted);
    }

    /* Message Bubbles */
    .message {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      align-self: flex-end;
    }

    .message.assistant {
      align-self: flex-start;
    }

    .bubble {
      padding: 12px 16px;
      border-radius: 1rem;
      font-size: 15px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .message.user .bubble {
      background: var(--widget-accent);
      color: var(--widget-accent-text);
      border-bottom-right-radius: 4px;
    }

    .message.assistant .bubble {
      background: var(--widget-surface);
      color: var(--widget-text);
      border: 1px solid var(--widget-border);
      border-bottom-left-radius: 4px;
    }

    /* Links in messages */
    .bubble a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .message.assistant .bubble a {
      color: var(--widget-accent);
    }

    /* Loading Dots */
    .loading {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
      background: var(--widget-surface);
      border: 1px solid var(--widget-border);
      border-radius: 1rem;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }

    .loading-dot {
      width: 8px;
      height: 8px;
      background: var(--widget-text-muted);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .loading-dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .loading-dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Input Area */
    .input-area {
      padding: 16px 20px;
      background: var(--widget-surface);
      border-top: 1px solid var(--widget-border);
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--widget-bg);
      border: 1px solid var(--widget-border);
      border-radius: 9999px;
      padding: 4px 4px 4px 16px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .input-wrapper:focus-within {
      border-color: var(--widget-accent);
      box-shadow: 0 0 0 3px rgba(194, 65, 12, 0.1);
    }

    .input-field {
      flex: 1;
      border: none;
      background: transparent;
      font-family: var(--widget-font-body);
      font-size: 15px;
      color: var(--widget-text);
      outline: none;
      min-width: 0;
    }

    .input-field::placeholder {
      color: var(--widget-text-muted);
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: var(--widget-accent);
      color: var(--widget-accent-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .send-btn:hover:not(:disabled) {
      background: var(--widget-accent-hover);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Watermark */
    .watermark {
      display: block;
      text-align: center;
      margin-top: 10px;
      font-size: 11px;
      color: var(--widget-text-muted);
      text-decoration: none;
      transition: opacity 0.15s ease;
    }

    .watermark:hover {
      opacity: 0.8;
    }

    .watermark-brand {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 600;
      font-style: italic;
    }

    /* Error State */
    .error {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 0.5rem;
      color: #991B1B;
      font-size: 14px;
    }

    .error-btn {
      padding: 6px 12px;
      background: #FEE2E2;
      border: 1px solid #FECACA;
      border-radius: 6px;
      color: #991B1B;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .error-btn:hover {
      background: #FECACA;
    }

    /* Scrollbar */
    .messages::-webkit-scrollbar {
      width: 6px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background: var(--widget-border);
      border-radius: 3px;
    }

    .messages::-webkit-scrollbar-thumb:hover {
      background: var(--widget-text-muted);
    }

    /* Markdown in messages */
    .bubble p {
      margin: 0 0 0.75em 0;
    }

    .bubble p:last-child {
      margin-bottom: 0;
    }

    .bubble ul, .bubble ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    .bubble li {
      margin: 0.25em 0;
    }

    .bubble strong {
      font-weight: 600;
    }

    .bubble em {
      font-style: italic;
    }

    .bubble code {
      background: rgba(0, 0, 0, 0.1);
      padding: 0.1em 0.3em;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }

    .message.user .bubble code {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Onboarding Screen */
    .onboarding {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .onboarding-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 20px;
      font-size: 14px;
      line-height: 1.7;
      color: var(--widget-text);
    }

    .onboarding-content p {
      margin: 0 0 0.75em 0;
    }

    .onboarding-content p:last-child {
      margin-bottom: 0;
    }

    .onboarding-content strong {
      font-weight: 600;
    }

    .onboarding-content em {
      font-style: italic;
    }

    .onboarding-content a {
      color: var(--widget-accent);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .onboarding-content a:hover {
      opacity: 0.8;
    }

    .onboarding-content::-webkit-scrollbar {
      width: 6px;
    }

    .onboarding-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .onboarding-content::-webkit-scrollbar-thumb {
      background: var(--widget-border);
      border-radius: 3px;
    }

    .onboarding-cta {
      margin: 0 20px 20px;
      padding: 14px 24px;
      background: var(--widget-accent);
      color: var(--widget-accent-text);
      border: none;
      border-radius: 9999px;
      font-family: var(--widget-font-body);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
      flex-shrink: 0;
    }

    .onboarding-cta:hover {
      background: var(--widget-accent-hover);
    }
  `;
}
