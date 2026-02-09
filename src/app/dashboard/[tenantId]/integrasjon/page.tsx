"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface WidgetConfig {
  accentColor: string;
  textColor: string;
  bgColor: string;
  surfaceColor: string;
  fontBody: string;
  fontBrand: string;
  brandStyle: "normal" | "italic";
  brandName: string;
  greeting: string;
  placeholder: string;
  position: "bottom-right" | "bottom-left";
  theme: "auto" | "light" | "dark";
  onboarding: string;
  onboardingCta: string;
}

const defaultConfig: WidgetConfig = {
  accentColor: "#F97316",
  textColor: "",
  bgColor: "",
  surfaceColor: "",
  fontBody: "",
  fontBrand: "",
  brandStyle: "normal",
  brandName: "",
  greeting: "",
  placeholder: "",
  position: "bottom-right",
  theme: "auto",
  onboarding: "",
  onboardingCta: "",
};

const presetColors = [
  { name: "Orange", value: "#F97316" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" },
];

export default function IntegrationPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/tenant/${tenantId}/widget-config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig({ ...defaultConfig, ...data.config });
          }
        }
      } catch {
        // Use defaults on error
      }
      setLoaded(true);
    }
    loadConfig();
  }, [tenantId]);

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-preik-border rounded animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 bg-preik-surface border border-preik-border rounded-2xl animate-pulse" />
          <div className="h-96 bg-preik-surface border border-preik-border rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Save config
  const saveConfig = useCallback(async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/widget-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      setSaveStatus(res.ok ? "Lagret!" : "Feil ved lagring");
    } catch {
      setSaveStatus("Feil ved lagring");
    }
    setSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  }, [tenantId, config]);

  // Get widget URL - use current origin for the embed code
  const getWidgetUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/widget.js`;
    }
    return "https://preik.no/widget.js";
  };

  // Generate embed code based on config
  const generateEmbedCode = () => {
    const attrs: string[] = [
      `src="${getWidgetUrl()}"`,
      `data-store-id="${tenantId}"`,
    ];

    if (config.accentColor && config.accentColor !== defaultConfig.accentColor) {
      attrs.push(`data-accent-color="${config.accentColor}"`);
    }
    if (config.textColor) {
      attrs.push(`data-text-color="${config.textColor}"`);
    }
    if (config.bgColor) {
      attrs.push(`data-bg-color="${config.bgColor}"`);
    }
    if (config.surfaceColor) {
      attrs.push(`data-surface-color="${config.surfaceColor}"`);
    }
    if (config.fontBody) {
      attrs.push(`data-font-body="${config.fontBody}"`);
    }
    if (config.fontBrand) {
      attrs.push(`data-font-brand="${config.fontBrand}"`);
    }
    if (config.brandStyle !== "normal") {
      attrs.push(`data-brand-style="${config.brandStyle}"`);
    }
    if (config.brandName) {
      attrs.push(`data-brand-name="${config.brandName}"`);
    }
    if (config.greeting) {
      attrs.push(`data-greeting="${config.greeting}"`);
    }
    if (config.placeholder) {
      attrs.push(`data-placeholder="${config.placeholder}"`);
    }
    if (config.position !== "bottom-right") {
      attrs.push(`data-position="${config.position}"`);
    }
    if (config.theme !== "auto") {
      attrs.push(`data-theme="${config.theme}"`);
    }
    if (config.onboarding) {
      attrs.push(`data-onboarding="${config.onboarding.replace(/\n/g, "\\n")}"`);
    }
    if (config.onboardingCta) {
      attrs.push(`data-onboarding-cta="${config.onboardingCta}"`);
    }

    attrs.push("async");

    return `<script\n  ${attrs.join("\n  ")}\n></script>`;
  };

  const embedCode = generateEmbedCode();

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  const COLOR_KEYS = new Set(["accentColor", "textColor", "bgColor", "surfaceColor"]);
  const isValidHexColor = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v);

  const updateConfig = (key: keyof WidgetConfig, value: string) => {
    // For color fields: allow empty (reset) or partial typing, but only apply valid hex
    if (COLOR_KEYS.has(key)) {
      if (value === "" || isValidHexColor(value)) {
        setConfig((prev) => ({ ...prev, [key]: value }));
      } else if (value.startsWith("#") && value.length <= 7) {
        // Allow typing in progress (partial hex)
        setConfig((prev) => ({ ...prev, [key]: value }));
      }
      return;
    }
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Preview widget component
  const WidgetPreview = () => {
    const brandName = config.brandName || "Assistent";
    const greeting = config.greeting || "Hei! Hvordan kan jeg hjelpe deg i dag?";
    const placeholder = config.placeholder || "Skriv en melding...";
    const isDark = config.theme === "dark";
    const bgColor = config.bgColor || (isDark ? "#111827" : "#F9FAFB");
    const surfaceColor = config.surfaceColor || (isDark ? "#1F2937" : "#FFFFFF");
    const textColor = config.textColor || (isDark ? "#F9FAFB" : "#111827");
    const mutedColor = isDark ? "#9CA3AF" : "#6B7280";
    const borderColor = isDark ? "#374151" : "#E5E7EB";

    return (
      <div
        className="rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px] w-full max-w-[340px] text-sm"
        style={{ backgroundColor: bgColor }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ backgroundColor: surfaceColor, borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: config.accentColor }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v4"/>
              </svg>
            </div>
            <div>
              <p
                className="font-semibold text-[15px]"
                style={{
                  color: textColor,
                  fontFamily: config.fontBrand || "inherit",
                  fontStyle: config.brandStyle === "italic" ? "italic" : "normal",
                }}
              >
                {brandName}
              </p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: mutedColor }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button className="p-1.5 rounded-md opacity-60" style={{ color: mutedColor }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <button className="p-1.5 rounded-md" style={{ color: mutedColor }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages or Onboarding */}
        {config.onboarding ? (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ fontFamily: config.fontBody || "inherit" }}>
            <div
              className="flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed"
              style={{ color: textColor }}
              dangerouslySetInnerHTML={{
                __html: config.onboarding
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.+?)\*/g, "<em>$1</em>")
                  .replace(/\[(.+?)\]\((.+?)\)/g, (_m: string, label: string, url: string) => {
                    // Block dangerous protocols explicitly, then allowlist safe ones
                    const trimmed = url.trim().toLowerCase();
                    if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
                      return label;
                    }
                    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^\/[^/]/i.test(url)) {
                      return label;
                    }
                    const safeUrl = url.replace(/"/g, "&quot;");
                    const safeColor = /^#[0-9A-Fa-f]{6}$/.test(config.accentColor) ? config.accentColor : "#6366f1";
                    return `<a href="${safeUrl}" style="color:${safeColor};text-decoration:underline">${label}</a>`;
                  })
                  .split("\n\n")
                  .map((p: string) => `<p style="margin:0 0 0.75em">${p.replace(/\n/g, "<br>")}</p>`)
                  .join(""),
              }}
            />
            <div className="px-5 pb-4 flex-shrink-0">
              <div
                className="w-full py-3 rounded-full text-center text-[13px] font-semibold"
                style={{ backgroundColor: config.accentColor, color: "#fff" }}
              >
                {config.onboardingCta || "Start chat"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center" style={{ fontFamily: config.fontBody || "inherit" }}>
            <p className="text-[13px] max-w-[240px] leading-relaxed" style={{ color: mutedColor }}>
              {greeting}
            </p>
          </div>
        )}

        {/* Input - hidden when onboarding is shown */}
        {!config.onboarding && (
          <div className="px-4 py-3 border-t" style={{ backgroundColor: surfaceColor, borderColor }}>
            <div
              className="flex items-center gap-2 rounded-full pl-3 pr-1 py-1 border"
              style={{ backgroundColor: bgColor, borderColor }}
            >
              <span className="flex-1 text-[13px]" style={{ color: mutedColor, fontFamily: config.fontBody || "inherit" }}>
                {placeholder}
              </span>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.accentColor }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p className="text-center mt-2 text-[10px] opacity-60" style={{ color: mutedColor }}>
              Levert av <span className="font-semibold italic">preik</span>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-brand font-light text-preik-text">Integrasjon</h1>
            <p className="mt-2 text-preik-text-muted">
              Tilpass og legg til Preik-chatboten på nettsiden din.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className={`text-sm ${saveStatus === "Lagret!" ? "text-green-600" : "text-red-500"}`}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={saveConfig}
              disabled={saving || !loaded}
              className="px-5 py-2.5 bg-preik-accent text-white text-sm font-semibold rounded-xl hover:bg-preik-accent-hover disabled:opacity-50 transition-all"
            >
              {saving ? "Lagrer..." : "Lagre endringer"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column - Customization */}
        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <h2 className="text-lg font-semibold text-preik-text mb-6">Utseende</h2>

            {/* Accent Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-preik-text mb-2">
                Aksentfarge
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateConfig("accentColor", color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      config.accentColor === color.value
                        ? "border-preik-text scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => updateConfig("accentColor", e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-preik-border"
                />
                <input
                  type="text"
                  value={config.accentColor}
                  onChange={(e) => updateConfig("accentColor", e.target.value)}
                  className="flex-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text font-mono"
                  placeholder="#F97316"
                />
              </div>
            </div>

            {/* Theme */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-preik-text mb-2">
                Tema
              </label>
              <div className="flex gap-2">
                {(["auto", "light", "dark"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateConfig("theme", theme)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.theme === theme
                        ? "bg-preik-accent text-white"
                        : "bg-preik-bg text-preik-text-muted hover:text-preik-text border border-preik-border"
                    }`}
                  >
                    {theme === "auto" ? "Auto" : theme === "light" ? "Lys" : "Mørk"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark mode colors - only show when dark mode is selected */}
            {config.theme === "dark" && (
              <div className="mb-6 p-4 bg-preik-bg rounded-xl border border-preik-border space-y-4">
                <p className="text-sm font-medium text-preik-text">Mørk modus-farger</p>

                {/* Background Color */}
                <div>
                  <label className="block text-xs text-preik-text-muted mb-2">
                    Bakgrunnsfarge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.bgColor || "#111827"}
                      onChange={(e) => updateConfig("bgColor", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-preik-border"
                    />
                    <input
                      type="text"
                      value={config.bgColor}
                      onChange={(e) => updateConfig("bgColor", e.target.value)}
                      className="flex-1 px-3 py-2 bg-preik-surface border border-preik-border rounded-lg text-sm text-preik-text font-mono"
                      placeholder="#111827"
                    />
                    {config.bgColor && (
                      <button
                        onClick={() => updateConfig("bgColor", "")}
                        className="p-2 text-preik-text-muted hover:text-red-500 transition-colors"
                        title="Tilbakestill"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Surface Color */}
                <div>
                  <label className="block text-xs text-preik-text-muted mb-2">
                    Overflate/kort-farge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.surfaceColor || "#1F2937"}
                      onChange={(e) => updateConfig("surfaceColor", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-preik-border"
                    />
                    <input
                      type="text"
                      value={config.surfaceColor}
                      onChange={(e) => updateConfig("surfaceColor", e.target.value)}
                      className="flex-1 px-3 py-2 bg-preik-surface border border-preik-border rounded-lg text-sm text-preik-text font-mono"
                      placeholder="#1F2937"
                    />
                    {config.surfaceColor && (
                      <button
                        onClick={() => updateConfig("surfaceColor", "")}
                        className="p-2 text-preik-text-muted hover:text-red-500 transition-colors"
                        title="Tilbakestill"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-preik-text mb-2">
                Posisjon
              </label>
              <div className="flex gap-2">
                {(["bottom-right", "bottom-left"] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateConfig("position", pos)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.position === pos
                        ? "bg-preik-accent text-white"
                        : "bg-preik-bg text-preik-text-muted hover:text-preik-text border border-preik-border"
                    }`}
                  >
                    {pos === "bottom-right" ? "Nederst høyre" : "Nederst venstre"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <h2 className="text-lg font-semibold text-preik-text mb-6">Merkevare</h2>

            {/* Brand Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-preik-text mb-2">
                Visningsnavn
              </label>
              <input
                type="text"
                value={config.brandName}
                onChange={(e) => updateConfig("brandName", e.target.value)}
                className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text"
                placeholder="Assistent"
              />
            </div>

            {/* Brand Style */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-preik-text mb-2">
                Navnestil
              </label>
              <div className="flex gap-2">
                {(["normal", "italic"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateConfig("brandStyle", style)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.brandStyle === style
                        ? "bg-preik-accent text-white"
                        : "bg-preik-bg text-preik-text-muted hover:text-preik-text border border-preik-border"
                    }`}
                    style={{ fontStyle: style }}
                  >
                    {style === "normal" ? "Normal" : "Kursiv"}
                  </button>
                ))}
              </div>
            </div>

            {/* Greeting */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-preik-text mb-2">
                Velkomstmelding
              </label>
              <textarea
                value={config.greeting}
                onChange={(e) => updateConfig("greeting", e.target.value)}
                className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text resize-none"
                rows={2}
                placeholder="Hei! Hvordan kan jeg hjelpe deg i dag?"
              />
            </div>

            {/* Placeholder */}
            <div>
              <label className="block text-sm font-medium text-preik-text mb-2">
                Plassholdertekst
              </label>
              <input
                type="text"
                value={config.placeholder}
                onChange={(e) => updateConfig("placeholder", e.target.value)}
                className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text"
                placeholder="Skriv en melding..."
              />
            </div>
          </div>

          {/* Onboarding */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <h2 className="text-lg font-semibold text-preik-text mb-6">Onboarding</h2>

            {/* Enable toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!config.onboarding}
                  onClick={() => updateConfig("onboarding", config.onboarding ? "" : "Hei! \n\nJeg kan hjelpe deg med:\n\n**Produkter** - finn det du leter etter\n**Bestilling** - spørsmål om ordre og levering\n**Kontakt** - koble deg med teamet vårt")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.onboarding ? "bg-preik-accent" : "bg-preik-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.onboarding ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-preik-text">
                  Vis introduksjonsskjerm
                </span>
              </label>
              <p className="text-xs text-preik-text-muted mt-1 ml-14">
                Vises kun ved første besøk, før chatten åpnes.
              </p>
            </div>

            {config.onboarding && (
              <>
                {/* Onboarding text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-preik-text mb-2">
                    Introduksjonstekst
                  </label>
                  <textarea
                    value={config.onboarding}
                    onChange={(e) => updateConfig("onboarding", e.target.value)}
                    className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text resize-none"
                    rows={7}
                    placeholder="Beskriv hva chatboten kan hjelpe med..."
                  />
                  <p className="text-xs text-preik-text-muted mt-1">
                    Støtter enkel formatering: **fet tekst**, [lenke](url)
                  </p>
                </div>

                {/* CTA button text */}
                <div>
                  <label className="block text-sm font-medium text-preik-text mb-2">
                    Knappetekst
                  </label>
                  <input
                    type="text"
                    value={config.onboardingCta}
                    onChange={(e) => updateConfig("onboardingCta", e.target.value)}
                    className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text"
                    placeholder="Start chat"
                  />
                </div>
              </>
            )}
          </div>

          {/* Typography (Advanced) */}
          <details className="bg-preik-surface rounded-2xl border border-preik-border">
            <summary className="p-6 cursor-pointer text-lg font-semibold text-preik-text flex items-center justify-between">
              Avansert: Typografi
              <svg className="w-5 h-5 text-preik-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6 pt-2 space-y-4 border-t border-preik-border">
              <p className="text-sm text-preik-text-muted">
                Merk: Du må selv laste inn egne fonter på nettsiden din (f.eks. via Google Fonts).
              </p>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-2">
                  Brødtekst-font
                </label>
                <input
                  type="text"
                  value={config.fontBody}
                  onChange={(e) => updateConfig("fontBody", e.target.value)}
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text"
                  placeholder="Inter, sans-serif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-2">
                  Tittel-font
                </label>
                <input
                  type="text"
                  value={config.fontBrand}
                  onChange={(e) => updateConfig("fontBrand", e.target.value)}
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text"
                  placeholder="Montserrat, sans-serif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-2">
                  Tekstfarge
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.textColor || "#111827"}
                    onChange={(e) => updateConfig("textColor", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-preik-border"
                  />
                  <input
                    type="text"
                    value={config.textColor}
                    onChange={(e) => updateConfig("textColor", e.target.value)}
                    className="flex-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-lg text-sm text-preik-text font-mono"
                    placeholder="#111827"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Right column - Preview & Code */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Preview */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-preik-text">Forhåndsvisning</h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
              >
                {showPreview ? "Skjul" : "Vis"} forhåndsvisning
              </button>
            </div>

            <div className={`flex justify-center ${showPreview ? "" : "hidden"}`}>
              <WidgetPreview />
            </div>

            {!showPreview && (
              <div className="flex items-center justify-center h-[200px] bg-preik-bg rounded-xl border-2 border-dashed border-preik-border">
                <p className="text-preik-text-muted text-sm">
                  Klikk &quot;Vis forhåndsvisning&quot; for å se widgeten
                </p>
              </div>
            )}
          </div>

          {/* Embed code */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-preik-text">Din embed-kode</h2>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-preik-accent text-white text-sm font-medium rounded-xl hover:bg-preik-accent-hover transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Kopiert!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopier kode
                  </>
                )}
              </button>
            </div>
            <div className="bg-preik-bg rounded-xl p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-preik-text whitespace-pre-wrap">{embedCode}</pre>
            </div>
            <p className="text-sm text-preik-text-muted mt-4">
              Lim inn denne koden rett før <code className="bg-preik-bg px-2 py-0.5 rounded">&lt;/body&gt;</code> taggen på nettsiden din.
            </p>
          </div>

          {/* Quick guides */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <h2 className="text-lg font-semibold text-preik-text mb-4">Plattform-guider</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "WordPress", desc: "Insert Headers and Footers plugin" },
                { name: "Shopify", desc: "theme.liquid → før </body>" },
                { name: "Wix", desc: "Settings → Custom Code" },
                { name: "Squarespace", desc: "Code Injection → Footer" },
              ].map((platform) => (
                <div key={platform.name} className="bg-preik-bg rounded-lg p-3">
                  <h3 className="font-medium text-preik-text text-sm">{platform.name}</h3>
                  <p className="text-xs text-preik-text-muted mt-0.5">{platform.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-preik-border">
              <Link
                href="/docs"
                className="text-preik-accent hover:text-preik-accent-hover font-medium transition-colors inline-flex items-center gap-2 text-sm"
              >
                Se full dokumentasjon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
