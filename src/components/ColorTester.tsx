"use client";

import { useState, useMemo, useCallback } from "react";

// WCAG relative luminance from sRGB
function luminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  const [r, g, b] = [result[1], result[2], result[3]].map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function darken(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const [r, g, b] = [result[1], result[2], result[3]].map((c) =>
    Math.max(0, Math.round(parseInt(c, 16) * (1 - amount)))
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

// Background presets — from pure white to progressively darker/tinted
const BG_OPTIONS = [
  { value: "#FFFFFF", label: "White", surface: "#FFFFFF" },
  { value: "#F9FAFB", label: "Gray 50 (current)", surface: "#FFFFFF" },
  { value: "#F3F4F6", label: "Gray 100", surface: "#F9FAFB" },
  { value: "#E5E7EB", label: "Gray 200", surface: "#F3F4F6" },
  { value: "#D1D5DB", label: "Gray 300", surface: "#E5E7EB" },
  // Warm tints
  { value: "#FFF7ED", label: "Orange 50", surface: "#FFFFFF" },
  { value: "#FFEDD5", label: "Orange 100", surface: "#FFF7ED" },
  { value: "#FED7AA", label: "Orange 200", surface: "#FFEDD5" },
  { value: "#FFFBEB", label: "Amber 50", surface: "#FFFFFF" },
  { value: "#FEF3C7", label: "Amber 100", surface: "#FFFBEB" },
  // Cool tints
  { value: "#F0F9FF", label: "Sky 50", surface: "#FFFFFF" },
  { value: "#EFF6FF", label: "Blue 50", surface: "#FFFFFF" },
  { value: "#F5F3FF", label: "Violet 50", surface: "#FFFFFF" },
  { value: "#ECFDF5", label: "Emerald 50", surface: "#FFFFFF" },
  // Cream / warm neutrals
  { value: "#FEFAE0", label: "Cream (custom)", surface: "#FFFFFF" },
  { value: "#FAFAF9", label: "Stone 50", surface: "#FFFFFF" },
  { value: "#F5F5F4", label: "Stone 100", surface: "#FAFAF9" },
  { value: "#E7E5E4", label: "Stone 200", surface: "#F5F5F4" },
  { value: "#FAF5FF", label: "Purple 50", surface: "#FFFFFF" },
  { value: "#FDF2F8", label: "Pink 50", surface: "#FFFFFF" },
];

// Accent presets
const COLOR_OPTIONS: { accent: string; label: string; group: string }[] = [
  // Current & original
  { accent: "#C2410C", label: "Current (orange-700)", group: "Reference" },
  { accent: "#F97316", label: "Original (orange-500)", group: "Reference" },

  // Orange / amber
  { accent: "#EA580C", label: "Orange 600", group: "Orange" },
  { accent: "#D4540E", label: "Warm orange", group: "Orange" },
  { accent: "#CC4B0B", label: "Deep orange", group: "Orange" },
  { accent: "#D44A0C", label: "Vivid deep orange", group: "Orange" },
  { accent: "#C05621", label: "Rust", group: "Orange" },
  { accent: "#BF4A1A", label: "Burnt orange", group: "Orange" },
  { accent: "#B45309", label: "Amber 700", group: "Orange" },
  { accent: "#D97706", label: "Amber 600", group: "Orange" },
  { accent: "#92400E", label: "Amber 800", group: "Orange" },
  { accent: "#9A3412", label: "Orange 800", group: "Orange" },
  { accent: "#CB4E10", label: "Tangerine deep", group: "Orange" },
  { accent: "#B84C14", label: "Spice", group: "Orange" },
  { accent: "#A8480E", label: "Copper dark", group: "Orange" },
  { accent: "#C43D08", label: "Flame", group: "Orange" },
  { accent: "#AE4E17", label: "Clay", group: "Orange" },
  { accent: "#B5520A", label: "Pumpkin dark", group: "Orange" },

  // Red / rose / pink / coral
  { accent: "#DC2626", label: "Red 600", group: "Red / warm" },
  { accent: "#B91C1C", label: "Red 700", group: "Red / warm" },
  { accent: "#991B1B", label: "Red 800", group: "Red / warm" },
  { accent: "#E11D48", label: "Rose 600", group: "Red / warm" },
  { accent: "#BE123C", label: "Rose 700", group: "Red / warm" },
  { accent: "#9F1239", label: "Rose 800", group: "Red / warm" },
  { accent: "#DB2777", label: "Pink 600", group: "Red / warm" },
  { accent: "#BE185D", label: "Pink 700", group: "Red / warm" },
  { accent: "#C4343B", label: "Coral deep", group: "Red / warm" },
  { accent: "#B83B3B", label: "Terracotta", group: "Red / warm" },
  { accent: "#A63D2F", label: "Brick", group: "Red / warm" },
  { accent: "#D03030", label: "Poppy", group: "Red / warm" },

  // Warm earthy
  { accent: "#CA8A04", label: "Yellow 600", group: "Earth / warm" },
  { accent: "#A16207", label: "Yellow 700", group: "Earth / warm" },
  { accent: "#854D0E", label: "Yellow 800", group: "Earth / warm" },
  { accent: "#8B6914", label: "Gold dark", group: "Earth / warm" },
  { accent: "#7C5E10", label: "Bronze", group: "Earth / warm" },
  { accent: "#926C15", label: "Honey dark", group: "Earth / warm" },
  { accent: "#6D5417", label: "Olive gold", group: "Earth / warm" },

  // Purple / violet
  { accent: "#7C3AED", label: "Violet 600", group: "Purple" },
  { accent: "#6D28D9", label: "Violet 700", group: "Purple" },
  { accent: "#5B21B6", label: "Violet 800", group: "Purple" },
  { accent: "#9333EA", label: "Purple 600", group: "Purple" },
  { accent: "#7E22CE", label: "Purple 700", group: "Purple" },
  { accent: "#6B21A8", label: "Purple 800", group: "Purple" },
  { accent: "#A21CAF", label: "Fuchsia 700", group: "Purple" },
  { accent: "#86198F", label: "Fuchsia 800", group: "Purple" },
  { accent: "#7B2D8E", label: "Plum", group: "Purple" },
  { accent: "#6A3EA1", label: "Iris", group: "Purple" },

  // Blue family
  { accent: "#2563EB", label: "Blue 600", group: "Blue" },
  { accent: "#1D4ED8", label: "Blue 700", group: "Blue" },
  { accent: "#1E40AF", label: "Blue 800", group: "Blue" },
  { accent: "#0284C7", label: "Sky 600", group: "Blue" },
  { accent: "#0369A1", label: "Sky 700", group: "Blue" },
  { accent: "#4F46E5", label: "Indigo 600", group: "Blue" },
  { accent: "#4338CA", label: "Indigo 700", group: "Blue" },
  { accent: "#3730A3", label: "Indigo 800", group: "Blue" },
  { accent: "#2E6BB5", label: "Steel blue", group: "Blue" },
  { accent: "#1A5FB4", label: "Royal blue", group: "Blue" },
  { accent: "#185ABD", label: "Cobalt", group: "Blue" },

  // Green / teal
  { accent: "#059669", label: "Emerald 600", group: "Green / teal" },
  { accent: "#047857", label: "Emerald 700", group: "Green / teal" },
  { accent: "#065F46", label: "Emerald 800", group: "Green / teal" },
  { accent: "#0D9488", label: "Teal 600", group: "Green / teal" },
  { accent: "#0F766E", label: "Teal 700", group: "Green / teal" },
  { accent: "#115E59", label: "Teal 800", group: "Green / teal" },
  { accent: "#16A34A", label: "Green 600", group: "Green / teal" },
  { accent: "#15803D", label: "Green 700", group: "Green / teal" },
  { accent: "#166534", label: "Green 800", group: "Green / teal" },
  { accent: "#1B7A5A", label: "Jade", group: "Green / teal" },
  { accent: "#2D6A4F", label: "Forest", group: "Green / teal" },
  { accent: "#0E7C6B", label: "Ocean", group: "Green / teal" },
];

const DARK_BG = "#111827";

type Tab = "accent" | "background";

export function ColorTester() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAccent, setActiveAccent] = useState(0);
  const [activeBg, setActiveBg] = useState(1); // default: Gray 50
  const [tab, setTab] = useState<Tab>("accent");

  const currentBg = BG_OPTIONS[activeBg].value;
  const currentSurface = BG_OPTIONS[activeBg].surface;

  // Recompute ratios against the selected background
  const computed = useMemo(
    () =>
      COLOR_OPTIONS.map((opt) => ({
        ...opt,
        hover: darken(opt.accent, 0.15),
        whiteOnAccent: contrast("#FFFFFF", opt.accent),
        accentOnBg: contrast(opt.accent, currentBg),
        accentOnSurface: contrast(opt.accent, currentSurface),
        onDark: contrast(opt.accent, DARK_BG),
        textOnBg: contrast("#111827", currentBg),
      })),
    [currentBg, currentSurface]
  );

  const active = computed[activeAccent];

  const applyAccent = useCallback((index: number) => {
    setActiveAccent(index);
    const c = COLOR_OPTIONS[index];
    const hover = darken(c.accent, 0.15);
    const root = document.documentElement;
    root.style.setProperty("--preik-accent", c.accent);
    root.style.setProperty("--preik-accent-hover", hover);
    const { r, g, b } = hexToRgb(c.accent);
    root.style.setProperty("--preik-blob", `rgba(${r}, ${g}, ${b}, 0.1)`);
  }, []);

  const applyBg = useCallback((index: number) => {
    setActiveBg(index);
    const bg = BG_OPTIONS[index];
    const root = document.documentElement;
    root.style.setProperty("--preik-bg", bg.value);
    root.style.setProperty("--preik-surface", bg.surface);
    // Also update border to match the tone
    const bgLum = luminance(bg.value);
    if (bgLum > 0.85) {
      root.style.setProperty("--preik-border", "#E5E7EB");
    } else if (bgLum > 0.7) {
      root.style.setProperty("--preik-border", "#D1D5DB");
    } else {
      root.style.setProperty("--preik-border", "#9CA3AF");
    }
  }, []);

  const reset = useCallback(() => {
    const root = document.documentElement;
    root.style.removeProperty("--preik-accent");
    root.style.removeProperty("--preik-accent-hover");
    root.style.removeProperty("--preik-blob");
    root.style.removeProperty("--preik-bg");
    root.style.removeProperty("--preik-surface");
    root.style.removeProperty("--preik-border");
    setActiveAccent(0);
    setActiveBg(1);
  }, []);

  // Group accent options
  const groups = useMemo(() => {
    const map = new Map<string, typeof computed>();
    for (const c of computed) {
      const list = map.get(c.group) || [];
      list.push(c);
      map.set(c.group, list);
    }
    return map;
  }, [computed]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[9999] px-3 py-2 bg-gray-900 text-white text-xs font-mono rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        {isOpen ? "Close" : "Test Colors"}
      </button>

      {isOpen && (
        <div className="fixed bottom-14 left-4 z-[9999] w-[360px] max-h-[80vh] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col text-gray-900">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-semibold">WCAG Color Tester</span>
            <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-900 font-mono">Reset all</button>
          </div>

          {/* Live preview — always visible */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
            {/* Mini page preview */}
            <div className="rounded-lg p-3 border" style={{ backgroundColor: currentBg, borderColor: "#E5E7EB" }}>
              <div className="flex gap-2 mb-2">
                <button className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: active.accent }}>
                  Kom i gang
                </button>
                <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ color: active.accent, borderColor: active.accent, backgroundColor: currentSurface }}>
                  Les mer
                </button>
              </div>
              <p className="text-xs" style={{ color: "#111827" }}>
                Normal text &middot; <span style={{ color: active.accent }} className="font-semibold">Accent link</span> &middot; <span style={{ color: "#6B7280" }}>Muted text</span>
              </p>
            </div>

            {/* Contrast grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono">
              <RatioRow label="White on accent (btn)" ratio={active.whiteOnAccent} />
              <RatioRow label={`Accent on ${currentBg}`} ratio={active.accentOnBg} />
              <RatioRow label={`Accent on ${currentSurface}`} ratio={active.accentOnSurface} />
              <RatioRow label="Text on bg" ratio={active.textOnBg} />
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Accent {active.accent} &middot; Bg {currentBg}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab("accent")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "accent" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Accent color
            </button>
            <button
              onClick={() => setTab("background")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "background" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Background
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === "accent" ? (
              // Accent color list
              <>
                {Array.from(groups.entries()).map(([group, items]) => (
                  <div key={group}>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group}</p>
                    </div>
                    {items.map((opt) => {
                      const idx = computed.indexOf(opt);
                      const btnPass = opt.whiteOnAccent >= 4.5;
                      const linkPass = opt.accentOnBg >= 4.5;
                      const allPass = btnPass && linkPass;
                      return (
                        <button
                          key={idx}
                          onClick={() => applyAccent(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                            activeAccent === idx ? "bg-blue-50" : ""
                          }`}
                        >
                          <span className="w-7 h-7 rounded-md border border-gray-200 flex-shrink-0" style={{ backgroundColor: opt.accent }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{opt.label}</p>
                            <p className="text-[10px] font-mono text-gray-500">
                              btn {opt.whiteOnAccent.toFixed(1)} &middot; link {opt.accentOnBg.toFixed(1)}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded ${
                            allPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          }`}>
                            {allPass ? "AA" : "FAIL"}
                          </span>
                          {activeAccent === idx && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            ) : (
              // Background list
              <>
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] text-gray-500">
                    A darker/tinted bg lets brighter accents pass. Ratios update live.
                  </p>
                </div>
                {BG_OPTIONS.map((bg, i) => {
                  const accentOnThis = contrast(active.accent, bg.value);
                  const textOnThis = contrast("#111827", bg.value);
                  const mutedOnThis = contrast("#6B7280", bg.value);
                  const accentPass = accentOnThis >= 4.5;
                  const textPass = textOnThis >= 4.5;
                  const mutedPass = mutedOnThis >= 4.5;
                  const allPass = accentPass && textPass && mutedPass;
                  return (
                    <button
                      key={i}
                      onClick={() => applyBg(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        activeBg === i ? "bg-blue-50" : ""
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-md border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: bg.value }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{bg.label}</p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {bg.value} &middot; accent {accentOnThis.toFixed(1)} &middot; text {textOnThis.toFixed(1)} &middot; muted {mutedOnThis.toFixed(1)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          allPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {allPass ? "AA" : "FAIL"}
                        </span>
                        {!allPass && (
                          <span className="text-[9px] text-gray-400">
                            {!accentPass && "accent "}{!textPass && "text "}{!mutedPass && "muted"}
                          </span>
                        )}
                      </div>
                      {activeBg === i && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-500">
            WCAG AA: 4.5:1 normal text, 3:1 large text (18pt / 14pt bold)
          </div>
        </div>
      )}
    </>
  );
}

function RatioRow({ label, ratio }: { label: string; ratio: number }) {
  const pass45 = ratio >= 4.5;
  const pass3 = ratio >= 3;
  return (
    <>
      <span className="text-gray-600 truncate">{label}</span>
      <span className={pass45 ? "text-green-700" : pass3 ? "text-yellow-600" : "text-red-600"}>
        {ratio.toFixed(2)}:1 {pass45 ? "AA" : pass3 ? "AA18" : "FAIL"}
      </span>
    </>
  );
}
