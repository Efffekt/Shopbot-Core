"use client";

import { useState, useEffect, useRef } from "react";

// ── Nav ──
const navItems = ["Oversikt", "Samtaler", "Analyse", "Innhold", "Integrasjon"];
const navBadges = [0, 0, 0, 0, 0];

const navIcons = [
  <svg key="n0" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  <svg key="n1" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  <svg key="n2" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  <svg key="n3" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  <svg key="n4" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
];

// ── Quick actions ──
const quickActions = [
  { icon: "code", title: "Integrasjon", sub: "Embed-kode og widget" },
  { icon: "chart", title: "Analyse", sub: "Statistikk og innsikt" },
  { icon: "chat", title: "Samtaler", sub: "Chat-logg og søk" },
  { icon: "prompt", title: "Systemprompt", sub: "Tilpass AI-oppførsel" },
  { icon: "file", title: "Innhold", sub: "Kunnskapsbase" },
  { icon: "settings", title: "Innstillinger", sub: "Konto og domener" },
];

// ── Sparkline (tiny SVG chart) ──
function Sparkline({ data, color = "currentColor", className = "" }: { data: number[]; color?: string; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48, h = 16;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} fill="none" width={w} height={h}>
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Mini icon helper ──
function I({ t: type, c = "w-3.5 h-3.5" }: { t: string; c?: string }) {
  const p = { className: c, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8 };
  switch (type) {
    case "code": return <svg {...p}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
    case "chart": return <svg {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    case "chat": return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "prompt": return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
    case "file": return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case "check": return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
    case "warning": return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case "zap": return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "up": return <svg {...p}><polyline points="18 15 12 9 6 15" /></svg>;
    case "down": return <svg {...p}><polyline points="6 9 12 15 18 9" /></svg>;
    case "thumb": return <svg {...p}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "globe": return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
    case "send": return <svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    default: return null;
  }
}

// ── Accent colors ──
const accentColors = [
  { hex: "#C2410C", label: "Orange" },
  { hex: "#3B82F6", label: "Blå" },
  { hex: "#2D6A4F", label: "Grønn" },
  { hex: "#8B5CF6", label: "Lilla" },
];

// ══════════════════════════════════════════════════════════════════
export function AnimatedDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  const [activeScreen, setActiveScreen] = useState(0);
  const [fading, setFading] = useState(false);

  // Screen 0: Oversikt
  const [s0Phase, setS0Phase] = useState(0);
  const [visibleActions, setVisibleActions] = useState(0);
  const [creditWidth, setCreditWidth] = useState(0);
  const [visibleActivity, setVisibleActivity] = useState(0);

  // Screen 1: Samtaler
  const [s1Phase, setS1Phase] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [visibleConvos, setVisibleConvos] = useState(0);
  const [expandedConvo, setExpandedConvo] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [showMeta, setShowMeta] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Screen 2: Analyse
  const [s2Phase, setS2Phase] = useState(0);
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);
  const [barHeights, setBarHeights] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [visibleIntents, setVisibleIntents] = useState(0);
  const [visibleTerms, setVisibleTerms] = useState(0);

  // Screen 3: Innhold
  const [s3Phase, setS3Phase] = useState(0);
  const [visibleSources, setVisibleSources] = useState(0);
  const [expandedSource, setExpandedSource] = useState(false);

  // Screen 4: Integrasjon
  const [s4Phase, setS4Phase] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [embedLines, setEmbedLines] = useState(0);
  const [showCopied, setShowCopied] = useState(false);
  const [widgetGreeting, setWidgetGreeting] = useState("");
  const [showWidgetMsgs, setShowWidgetMsgs] = useState(0);

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { isVisibleRef.current = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Animation engine ──
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    let cancelled = false;

    const t = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
    const iv = (fn: () => void, ms: number) => { const id = setInterval(fn, ms); intervals.push(id); return id; };
    const wait = (fn: () => void) => {
      if (isVisibleRef.current) { fn(); return; }
      const c = iv(() => { if (cancelled) { clearInterval(c); return; } if (isVisibleRef.current) { clearInterval(c); fn(); } }, 500);
    };

    const countUp = (targets: number[], setter: React.Dispatch<React.SetStateAction<number[]>>, ms: number, done: () => void) => {
      const steps = 28; const st = ms / steps; let s = 0;
      const i = iv(() => {
        if (cancelled) { clearInterval(i); return; }
        s++;
        // Ease-out curve
        const p = 1 - Math.pow(1 - s / steps, 3);
        setter(targets.map(v => Math.round(v * p)));
        if (s >= steps) { clearInterval(i); setter(targets); done(); }
      }, st);
    };

    // Crossfade transition helper
    const fadeToScreen = (screen: number, resetFn: () => void, then: () => void) => {
      setFading(true);
      t(() => {
        if (cancelled) return;
        resetFn();
        setActiveScreen(screen);
        setFading(false);
        t(() => { if (cancelled) return; then(); }, 150);
      }, 250);
    };

    const resetAll = () => {
      setS0Phase(0); setVisibleActions(0); setCreditWidth(0); setVisibleActivity(0);
      setS1Phase(0); setSearchText(""); setVisibleConvos(0); setExpandedConvo(false); setStreamedText(""); setShowMeta(false); setShowFeedback(false);
      setS2Phase(0); setStatValues([0, 0, 0, 0]); setBarHeights([0, 0, 0, 0, 0, 0, 0]); setVisibleIntents(0); setVisibleTerms(0);
      setS3Phase(0); setVisibleSources(0); setExpandedSource(false);
      setS4Phase(0); setActiveColor(0); setEmbedLines(0); setShowCopied(false); setWidgetGreeting(""); setShowWidgetMsgs(0);
    };

    // ═══ SCREEN 0: Oversikt ═══
    const run0 = () => {
      if (cancelled) return;
      setActiveScreen(0);
      setFading(false);

      t(() => { if (cancelled) return; setS0Phase(1);
        // Stagger cards
        let i = 0;
        const stagger = iv(() => {
          if (cancelled) { clearInterval(stagger); return; }
          i++; setVisibleActions(i);
          if (i >= 6) { clearInterval(stagger);
            // Credit bar
            t(() => { if (cancelled) return; setS0Phase(2); setCreditWidth(62);
              // Activity items
              t(() => { if (cancelled) return; setVisibleActivity(1);
                t(() => { if (cancelled) return; setVisibleActivity(2);
                  t(() => { if (cancelled) return; setVisibleActivity(3);
                    // Hold, then transition
                    t(() => { if (cancelled) return;
                      wait(() => fadeToScreen(1, () => {
                        setS0Phase(0); setVisibleActions(0); setCreditWidth(0); setVisibleActivity(0);
                      }, () => run1_animate()));
                    }, 1200);
                  }, 350);
                }, 350);
              }, 500);
            }, 400);
          }
        }, 130);
      }, 350);
    };

    // ═══ SCREEN 1: Samtaler ═══
    const run1_animate = () => {
      if (cancelled) return;
      setS1Phase(1);

      const target = "hudkrem tørr hud"; let ci = 0;
      t(() => { if (cancelled) return;
        const ti = iv(() => {
          if (cancelled) { clearInterval(ti); return; }
          ci++; setSearchText(target.slice(0, ci));
          if (ci >= target.length) { clearInterval(ti);
            t(() => { if (cancelled) return; setVisibleConvos(1);
              t(() => { if (cancelled) return; setVisibleConvos(2);
                t(() => { if (cancelled) return; setVisibleConvos(3);
                  t(() => { if (cancelled) return; setExpandedConvo(true);
                    const resp = "For tørr og sensitiv hud anbefaler vi CeraVe Moisturizing Cream. Den inneholder ceramider og hyaluronsyre som gjenoppbygger hudbarrieren.";
                    let ri = 0;
                    t(() => { if (cancelled) return;
                      const si = iv(() => {
                        if (cancelled) { clearInterval(si); return; }
                        ri++; setStreamedText(resp.slice(0, ri));
                        if (ri >= resp.length) { clearInterval(si);
                          t(() => { if (cancelled) return; setShowMeta(true);
                            t(() => { if (cancelled) return; setShowFeedback(true);
                              t(() => { if (cancelled) return;
                                wait(() => fadeToScreen(2, () => {
                                  setS1Phase(0); setSearchText(""); setVisibleConvos(0); setExpandedConvo(false);
                                  setStreamedText(""); setShowMeta(false); setShowFeedback(false);
                                }, () => run2_animate()));
                              }, 1200);
                            }, 500);
                          }, 400);
                        }
                      }, 20);
                    }, 250);
                  }, 500);
                }, 300);
              }, 300);
            }, 400);
          }
        }, 65);
      }, 300);
    };

    // ═══ SCREEN 2: Analyse ═══
    const run2_animate = () => {
      if (cancelled) return;
      setS2Phase(1);

      t(() => { if (cancelled) return; setS2Phase(2);
        countUp([847, 94, 12, 62], setStatValues, 1400, () => {
          if (cancelled) return; setS2Phase(3);
          const tgt = [65, 45, 80, 55, 90, 70, 40];
          tgt.forEach((h, i) => { t(() => { if (cancelled) return; setBarHeights(prev => { const n = [...prev]; n[i] = h; return n; }); }, i * 100); });

          t(() => { if (cancelled) return; setVisibleIntents(1);
            t(() => { if (cancelled) return; setVisibleIntents(2);
              t(() => { if (cancelled) return; setVisibleIntents(3);
                t(() => { if (cancelled) return; setVisibleTerms(1);
                  t(() => { if (cancelled) return; setVisibleTerms(2);
                    t(() => { if (cancelled) return; setVisibleTerms(3);
                      t(() => { if (cancelled) return;
                        wait(() => fadeToScreen(3, () => {
                          setS2Phase(0); setStatValues([0, 0, 0, 0]); setBarHeights([0, 0, 0, 0, 0, 0, 0]);
                          setVisibleIntents(0); setVisibleTerms(0);
                        }, () => run3_animate()));
                      }, 1200);
                    }, 250);
                  }, 250);
                }, 250);
              }, 300);
            }, 300);
          }, 900);
        });
      }, 400);
    };

    // ═══ SCREEN 3: Innhold ═══
    const run3_animate = () => {
      if (cancelled) return;
      setS3Phase(1);

      t(() => { if (cancelled) return; setVisibleSources(1);
        t(() => { if (cancelled) return; setVisibleSources(2);
          t(() => { if (cancelled) return; setVisibleSources(3);
            t(() => { if (cancelled) return; setVisibleSources(4);
              t(() => { if (cancelled) return; setExpandedSource(true);
                t(() => { if (cancelled) return;
                  wait(() => fadeToScreen(4, () => {
                    setS3Phase(0); setVisibleSources(0); setExpandedSource(false);
                  }, () => run4_animate()));
                }, 1500);
              }, 500);
            }, 250);
          }, 250);
        }, 250);
      }, 350);
    };

    // ═══ SCREEN 4: Integrasjon ═══
    const run4_animate = () => {
      if (cancelled) return;
      setS4Phase(1);

      t(() => { if (cancelled) return; setActiveColor(1);
        t(() => { if (cancelled) return; setActiveColor(2);
          t(() => { if (cancelled) return; setActiveColor(3);
            t(() => { if (cancelled) return; setS4Phase(2);
              const g = "Hei! Hvordan kan jeg hjelpe?"; let gi = 0;
              const gi_iv = iv(() => {
                if (cancelled) { clearInterval(gi_iv); return; }
                gi++; setWidgetGreeting(g.slice(0, gi));
                if (gi >= g.length) { clearInterval(gi_iv);
                  t(() => { if (cancelled) return; setShowWidgetMsgs(1);
                    t(() => { if (cancelled) return; setShowWidgetMsgs(2);
                      t(() => { if (cancelled) return; setS4Phase(3);
                        setEmbedLines(1);
                        t(() => { if (cancelled) return; setEmbedLines(2);
                          t(() => { if (cancelled) return; setEmbedLines(3);
                            t(() => { if (cancelled) return; setEmbedLines(4);
                              t(() => { if (cancelled) return; setShowCopied(true);
                                t(() => { if (cancelled) return; setShowCopied(false);
                                  t(() => { if (cancelled) return;
                                    // Full loop restart
                                    setFading(true);
                                    t(() => { if (cancelled) return; resetAll(); setActiveScreen(0); setFading(false);
                                      t(() => { if (cancelled) return; wait(run0); }, 200);
                                    }, 300);
                                  }, 2000);
                                }, 1200);
                              }, 500);
                            }, 200);
                          }, 200);
                        }, 200);
                      }, 500);
                    }, 500);
                  }, 400);
                }
              }, 28);
            }, 500);
          }, 500);
        }, 500);
      }, 600);
    };

    wait(run0);
    return () => { cancelled = true; timers.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, []);

  // ══════════════════ RENDER ══════════════════
  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lor", "Son"];
  const embedCodeLines = ["<script", '  src="https://preik.ai/widget.js"', '  data-store-id="din-butikk"', "></script>"];
  const currentAccent = accentColors[activeColor].hex;

  return (
    <div ref={containerRef} className="w-full max-w-[840px] mx-auto bg-preik-surface rounded-2xl shadow-2xl overflow-hidden border border-preik-border">
      <div className="flex h-[480px]">

        {/* ── Sidebar ── */}
        <div className="hidden sm:flex w-[170px] flex-shrink-0 bg-preik-bg border-r border-preik-border p-4 flex-col">
          <div className="mb-5">
            <p className="font-brand font-semibold italic text-[17px] text-preik-text">preik</p>
            <p className="text-[10px] text-preik-text-muted/50 mt-0.5">Dashboard</p>
          </div>

          <nav className="flex flex-col gap-0.5">
            {navItems.map((item, i) => (
              <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-300 relative ${
                activeScreen === i ? "bg-preik-accent/10 text-preik-accent font-medium" : "text-preik-text-muted/50"
              }`}>
                {navIcons[i]}
                <span className="flex-1">{item}</span>
                {navBadges[i] > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {navBadges[i]}
                  </span>
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar bottom */}
          <div className="mt-auto pt-3 border-t border-preik-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-preik-accent/20 flex items-center justify-center relative">
                <span className="text-[10px] font-bold text-preik-accent">MB</span>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-preik-bg" />
              </div>
              <div>
                <p className="text-[12px] text-preik-text-muted font-medium">Min Butikk</p>
                <p className="text-[10px] text-preik-text-muted/40">Starter-plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content (with crossfade) ── */}
        <div className={`flex-1 p-5 overflow-hidden transition-opacity duration-250 ${fading ? "opacity-0" : "opacity-100"}`}>

          {/* ═══ Screen 0: Oversikt ═══ */}
          {activeScreen === 0 && (
            <div className="h-full flex flex-col">
              <div className={`mb-3 transition-opacity duration-500 ${s0Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                <h3 className="text-[17px] font-semibold text-preik-text">Velkommen tilbake</h3>
                <p className="text-[11px] text-preik-text-muted/50 mt-0.5">
                  {new Date().toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>

              {/* Quick action cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {quickActions.map((a, i) => (
                  <div key={i} className={`bg-preik-bg border border-preik-border rounded-xl p-2.5 transition-all duration-400 cursor-pointer hover:border-preik-accent/30 ${
                    visibleActions >= i + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}>
                    <div className="w-6 h-6 rounded-lg bg-preik-accent/10 flex items-center justify-center text-preik-accent mb-1.5">
                      <I t={a.icon} c="w-3 h-3" />
                    </div>
                    <p className="text-[11px] font-medium text-preik-text leading-tight">{a.title}</p>
                    <p className="text-[9px] text-preik-text-muted/50 mt-0.5">{a.sub}</p>
                  </div>
                ))}
              </div>

              {/* Credit usage */}
              <div className={`bg-preik-bg border border-preik-border rounded-xl p-3 mb-3 transition-opacity duration-500 ${s0Phase >= 2 ? "opacity-100" : "opacity-0"}`}>
                <div className="flex justify-between items-center text-[11px] mb-2">
                  <span className="text-preik-text-muted/50 flex items-center gap-1.5">
                    <I t="zap" c="w-3 h-3" /> Kredittforbruk
                  </span>
                  <span className="text-preik-text-muted font-medium tabular-nums">620 / 1 000</span>
                </div>
                <div className="h-1.5 bg-preik-border rounded-full overflow-hidden">
                  <div className="h-full bg-preik-accent rounded-full transition-all duration-1000 ease-out" style={{ width: `${creditWidth}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-preik-text-muted/40">
                  <span>Fornyes 1. april</span>
                  <span className="tabular-nums">{creditWidth}% brukt</span>
                </div>
              </div>

              {/* Recent activity */}
              <div className="flex-1">
                <p className={`text-[10px] font-medium text-preik-text-muted/50 uppercase tracking-wider mb-1.5 transition-opacity duration-300 ${visibleActivity >= 1 ? "opacity-100" : "opacity-0"}`}>
                  Siste aktivitet
                </p>
                {[
                  { icon: "chat", text: "Ny samtale", detail: "«Hvilken hudkrem er best for tørr hud?»", time: "2 min", color: "bg-blue-500/10 text-blue-600" },
                  { icon: "file", text: "Innhold oppdatert", detail: "Produktguide – Hudpleie", time: "1 time", color: "bg-green-500/10 text-green-600" },
                  { icon: "code", text: "Widget installert", detail: "minbutikk.no", time: "3 timer", color: "bg-purple-500/10 text-purple-600" },
                ].map((a, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-1.5 transition-all duration-500 ${
                    visibleActivity >= i + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <I t={a.icon} c="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-preik-text font-medium">{a.text}</p>
                      <p className="text-[9px] text-preik-text-muted/50 truncate">{a.detail}</p>
                    </div>
                    <span className="text-[9px] text-preik-text-muted/40 flex-shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Screen 1: Samtaler ═══ */}
          {activeScreen === 1 && (
            <div className="h-full flex flex-col">
              <div className={`mb-3 transition-opacity duration-400 ${s1Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-[17px] font-semibold text-preik-text">Samtaler</h3>
                  <div className="flex gap-1.5">
                    <div className="bg-preik-bg border border-preik-border rounded-lg px-2 py-1 text-[10px] text-preik-text-muted flex items-center gap-1">
                      <I t="chat" c="w-2.5 h-2.5" /> Alle typer
                    </div>
                    <div className="bg-preik-bg border border-preik-border rounded-lg px-2 py-1 text-[10px] text-preik-text-muted flex items-center gap-1">
                      <I t="check" c="w-2.5 h-2.5" /> Status
                    </div>
                  </div>
                </div>
                <div className="bg-preik-bg border border-preik-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <I t="search" c="w-3.5 h-3.5 text-preik-text-muted/40" />
                  <span className="text-[13px]">
                    {searchText ? (
                      <span className="text-preik-text">{searchText}<span className="inline-block w-0.5 h-3.5 bg-preik-accent ml-0.5 animate-pulse" /></span>
                    ) : (
                      <span className="text-preik-text-muted/40">Sok i samtaler...</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden space-y-1.5">
                {[
                  { q: "Hvilken hudkrem er best for tørr hud?", status: "Besvart", intent: "Produkt", time: "2 min", avatar: "KL", avatarBg: "bg-blue-500/15 text-blue-600" },
                  { q: "Har dere noe som fjerner flekker fra sofa?", status: "Besvart", intent: "Produkt", time: "15 min", avatar: "TS", avatarBg: "bg-orange-500/15 text-orange-600" },
                  { q: "Hva er forskjellen på modell X og Y?", status: "Besvart", intent: "Produkt", time: "1 time", avatar: "AM", avatarBg: "bg-purple-500/15 text-purple-600" },
                ].map((c, i) => (
                  <div key={i} className={`transition-all duration-500 ${visibleConvos >= i + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                    <div className={`bg-preik-bg border rounded-xl p-2.5 ${i === 0 && expandedConvo ? "border-preik-accent/30" : "border-preik-border"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${c.avatarBg}`}>
                          {c.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-preik-text font-medium truncate">&ldquo;{c.q}&rdquo;</p>
                          <p className="text-[9px] text-preik-text-muted/40 mt-0.5">{c.time} siden</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                            c.status === "Besvart" ? "bg-preik-accent/15 text-preik-accent" : "bg-red-500/12 text-red-500"
                          }`}>{c.status}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">{c.intent}</span>
                        </div>
                      </div>

                      {i === 0 && expandedConvo && (
                        <div className="mt-2.5 pt-2.5 border-t border-preik-border">
                          <p className="text-[10px] text-preik-text-muted/50 mb-1">AI-svar:</p>
                          <p className="text-[12px] text-preik-text-muted leading-relaxed">
                            {streamedText}
                            {streamedText.length > 0 && streamedText.length < 105 && (
                              <span className="inline-block w-0.5 h-3 bg-preik-accent ml-0.5 animate-pulse" />
                            )}
                          </p>

                          {showMeta && (
                            <div className="mt-2 flex gap-1.5">
                              {[
                                { l: "Modell", v: "gpt-4o-mini" },
                                { l: "Dokumenter", v: "3 treff" },
                                { l: "Tid", v: "1.2s" },
                              ].map((m, mi) => (
                                <div key={mi} className="bg-preik-surface border border-preik-border rounded-lg px-2 py-1 flex-1 transition-opacity duration-400">
                                  <p className="text-[8px] text-preik-text-muted/40">{m.l}</p>
                                  <p className="text-[10px] text-preik-text-muted font-medium">{m.v}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {showFeedback && (
                            <div className="mt-2 flex items-center gap-2 transition-opacity duration-400">
                              <div className="flex items-center gap-1 text-preik-accent bg-preik-accent/10 rounded-full px-2 py-0.5">
                                <I t="thumb" c="w-2.5 h-2.5" />
                                <span className="text-[9px] font-medium">Nyttig</span>
                              </div>
                              <span className="text-[9px] text-preik-text-muted/40">Kilde: hudpleie-guide.md</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Screen 2: Analyse ═══ */}
          {activeScreen === 2 && (
            <div className="h-full flex flex-col">
              <div className={`mb-3 flex items-center justify-between transition-opacity duration-500 ${s2Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                <h3 className="text-[17px] font-semibold text-preik-text">Analyse</h3>
                <div className="bg-preik-bg border border-preik-border rounded-lg px-2.5 py-1 text-[10px] text-preik-text-muted flex items-center gap-1">
                  <I t="clock" c="w-2.5 h-2.5" /> Siste 30 dager
                </div>
              </div>

              {/* 4 stat cards */}
              <div className={`grid grid-cols-4 gap-2 mb-3 transition-opacity duration-500 ${s2Phase >= 2 ? "opacity-100" : "opacity-0"}`}>
                {[
                  { label: "Samtaler", value: statValues[0], suffix: "", icon: "chat", trend: "+12%", up: true, spark: [20, 35, 28, 45, 40, 55, 50], color: "text-preik-accent" },
                  { label: "Besvart", value: statValues[1], suffix: "%", icon: "check", trend: "+3%", up: true, spark: [80, 85, 88, 90, 87, 92, 94], color: "text-green-600" },
                  { label: "Ubesvarte", value: statValues[2], suffix: "", icon: "warning", trend: "-5", up: false, spark: [25, 20, 18, 22, 15, 14, 12], color: "text-amber-500" },
                  { label: "Kreditt", value: statValues[3], suffix: "%", icon: "zap", trend: "", up: true, spark: [30, 35, 40, 45, 50, 55, 62], color: "text-preik-accent" },
                ].map((s, i) => (
                  <div key={i} className="bg-preik-bg border border-preik-border rounded-xl p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={s.color}><I t={s.icon} c="w-3 h-3" /></span>
                      {s.trend && (
                        <span className={`text-[8px] font-medium flex items-center gap-0.5 ${s.up ? "text-green-600" : "text-red-500"}`}>
                          <I t={s.up ? "up" : "down"} c="w-2 h-2" />{s.trend}
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] font-semibold text-preik-text tabular-nums leading-none">{s.value}{s.suffix}</p>
                    <p className="text-[9px] text-preik-text-muted/50 mt-0.5">{s.label}</p>
                    <div className="mt-1">
                      <Sparkline data={s.spark} color={s.up ? "#2D6A4F" : "#ef4444"} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar chart + intents side by side */}
              <div className="grid grid-cols-5 gap-2 flex-1">
                {/* Chart (3 cols) */}
                <div className={`col-span-3 bg-preik-bg border border-preik-border rounded-xl p-2.5 flex flex-col transition-opacity duration-500 ${s2Phase >= 3 ? "opacity-100" : "opacity-0"}`}>
                  <p className="text-[10px] text-preik-text-muted/50 mb-2">Samtalevolum</p>
                  <div className="flex items-end gap-1.5 flex-1 min-h-0">
                    {dayNames.map((d, i) => (
                      <div key={d} className="flex-1 flex flex-col items-center gap-0.5 h-full">
                        <div className="w-full flex items-end justify-center flex-1">
                          <div className="w-full max-w-[24px] bg-preik-accent/80 rounded-t-sm transition-all duration-700 ease-out" style={{ height: `${barHeights[i]}%` }} />
                        </div>
                        <span className="text-[7px] text-preik-text-muted/40 flex-shrink-0">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intents + terms (2 cols) */}
                <div className="col-span-2 flex flex-col gap-2">
                  {/* Intent breakdown */}
                  <div className="bg-preik-bg border border-preik-border rounded-xl p-2.5">
                    <p className="text-[10px] text-preik-text-muted/50 mb-1.5">Samtaletyper</p>
                    {[
                      { label: "Produkt", pct: 72, color: "bg-orange-400" },
                      { label: "Veiledning", pct: 18, color: "bg-blue-400" },
                      { label: "Henvist", pct: 10, color: "bg-green-400" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 py-0.5 transition-all duration-500 ${
                        visibleIntents >= i + 1 ? "opacity-100" : "opacity-0"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                        <span className="text-[10px] text-preik-text-muted flex-1">{item.label}</span>
                        <span className="text-[9px] text-preik-text-muted/50 tabular-nums">{item.pct}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Top terms */}
                  <div className="bg-preik-bg border border-preik-border rounded-xl p-2.5">
                    <p className="text-[10px] text-preik-text-muted/50 mb-1.5">Topp sokeord</p>
                    {[
                      { term: "hudkrem", count: 42 },
                      { term: "flekkfjerner", count: 38 },
                      { term: "sammenligning", count: 27 },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-1.5 py-0.5 transition-all duration-500 ${
                        visibleTerms >= i + 1 ? "opacity-100" : "opacity-0"
                      }`}>
                        <span className="text-[9px] text-preik-text-muted/40 w-3">{i + 1}.</span>
                        <span className="text-[10px] text-preik-text-muted flex-1">{item.term}</span>
                        <span className="text-[9px] text-preik-text-muted/40 tabular-nums">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Screen 3: Innhold ═══ */}
          {activeScreen === 3 && (
            <div className="h-full flex flex-col">
              <div className={`mb-3 flex items-center justify-between transition-opacity duration-400 ${s3Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                <h3 className="text-[17px] font-semibold text-preik-text">Innhold</h3>
                <div className="flex gap-1.5">
                  <div className="bg-preik-bg border border-preik-border rounded-lg px-2 py-1 text-[10px] text-preik-text-muted flex items-center gap-1">
                    <I t="search" c="w-2.5 h-2.5" /> Sok...
                  </div>
                  <div className="bg-preik-accent text-white rounded-lg px-2.5 py-1 text-[10px] font-medium flex items-center gap-1">
                    + Legg til
                  </div>
                </div>
              </div>

              {/* Summary bar */}
              <div className={`flex gap-3 mb-3 transition-opacity duration-400 ${s3Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                {[
                  { label: "Kilder", value: "12" },
                  { label: "Chunks", value: "284" },
                  { label: "Sist oppdatert", value: "28. feb" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-preik-text-muted/40">{s.label}:</span>
                    <span className="text-preik-text-muted font-medium">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-hidden space-y-1.5">
                {[
                  { title: "Produktguide – Hudpleie", chunks: 8, type: "Manuell", date: "28. feb", preview: "CeraVe Moisturizing Cream inneholder ceramider og hyaluronsyre. Passer for tørr og sensitiv hud." },
                  { title: "Rengjøring og vedlikehold", chunks: 12, type: "Manuell", date: "25. feb", preview: "Dr. Beckmann flekkfjerner fungerer på de fleste tekstiler. Test alltid på et usynlig område først." },
                  { title: "Produktkatalog 2025", chunks: 24, type: "Skrapet", date: "20. feb", preview: "Komplett produktkatalog med spesifikasjoner, priser og tilgjengelighet for alle varegrupper." },
                  { title: "Sammenligning – Populære modeller", chunks: 4, type: "Manuell", date: "18. feb", preview: "Modell X har lengre batteritid, mens modell Y har bedre ytelse. Begge leveres med 2 års garanti." },
                ].map((src, i) => (
                  <div key={i} className={`transition-all duration-500 ${visibleSources >= i + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                    <div className={`bg-preik-bg border rounded-xl p-2.5 ${i === 1 && expandedSource ? "border-preik-accent/30" : "border-preik-border"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            src.type === "Manuell" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                          }`}>
                            <I t="file" c="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-preik-text truncate">{src.title}</p>
                            {!(i === 1 && expandedSource) && (
                              <p className="text-[10px] text-preik-text-muted/40 mt-0.5 truncate">{src.preview}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-preik-accent/10 text-preik-accent font-medium">{src.chunks}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                            src.type === "Manuell" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                          }`}>{src.type}</span>
                        </div>
                      </div>

                      {i === 1 && expandedSource && (
                        <div className="mt-2 pt-2 border-t border-preik-border ml-8">
                          <p className="text-[11px] text-preik-text-muted leading-relaxed">{src.preview}</p>
                          <div className="mt-2 flex items-center gap-2.5 text-[9px]">
                            <span className="text-preik-text-muted/40 flex items-center gap-1"><I t="clock" c="w-2.5 h-2.5" /> {src.date}</span>
                            <span className="text-preik-accent cursor-pointer font-medium">Rediger</span>
                            <span className="text-red-500/70 cursor-pointer">Slett</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Screen 4: Integrasjon ═══ */}
          {activeScreen === 4 && (
            <div className="h-full flex flex-col">
              <h3 className="text-[17px] font-semibold text-preik-text mb-3">Integrasjon</h3>

              <div className="grid grid-cols-2 gap-2.5 flex-1">
                {/* Left: Settings */}
                <div className="flex flex-col gap-2">
                  {/* Color picker */}
                  <div className={`transition-opacity duration-500 ${s4Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                    <div className="bg-preik-bg border border-preik-border rounded-xl p-2.5">
                      <p className="text-[10px] text-preik-text-muted/50 mb-2">Accentfarge</p>
                      <div className="flex gap-2">
                        {accentColors.map((c, i) => (
                          <div key={c.hex} className="flex flex-col items-center gap-0.5">
                            <button className={`w-6 h-6 rounded-full transition-all duration-300 ${
                              activeColor === i ? "ring-2 ring-preik-text ring-offset-2 ring-offset-preik-bg scale-110" : "opacity-35"
                            }`} style={{ backgroundColor: c.hex }} />
                            <span className={`text-[7px] transition-opacity duration-300 ${activeColor === i ? "text-preik-text-muted" : "text-preik-text-muted/25"}`}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className={`transition-opacity duration-500 ${s4Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                    <div className="bg-preik-bg border border-preik-border rounded-xl p-2.5 space-y-2">
                      <div>
                        <p className="text-[9px] text-preik-text-muted/50 mb-1">Posisjon</p>
                        <div className="bg-preik-surface border border-preik-border rounded-lg px-2 py-1 text-[10px] text-preik-text-muted">Nede til hoyre</div>
                      </div>
                      <div>
                        <p className="text-[9px] text-preik-text-muted/50 mb-1">Tema</p>
                        <div className="flex gap-1">
                          <div className="bg-preik-surface border border-preik-accent rounded-lg px-2 py-0.5 text-[10px] text-preik-accent font-medium">Lys</div>
                          <div className="bg-preik-surface border border-preik-border rounded-lg px-2 py-0.5 text-[10px] text-preik-text-muted/40">Mork</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Embed code */}
                  <div className={`transition-opacity duration-500 ${s4Phase >= 3 ? "opacity-100" : "opacity-0"}`}>
                    <div className="bg-preik-bg border border-preik-border rounded-xl p-2.5">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[9px] text-preik-text-muted/50">Installasjonskode</p>
                        {showCopied && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-preik-accent/15 text-preik-accent animate-fade-in font-medium">Kopiert!</span>}
                      </div>
                      <div className="bg-preik-surface rounded-lg p-2 font-mono text-[9px]">
                        {embedCodeLines.map((line, i) => (
                          <div key={i} className={`transition-opacity duration-300 text-preik-text-muted ${embedLines >= i + 1 ? "opacity-100" : "opacity-0"}`}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Platform badges */}
                  <div className={`transition-opacity duration-500 ${s4Phase >= 3 ? "opacity-100" : "opacity-0"}`}>
                    <div className="flex gap-1.5">
                      {["WordPress", "Shopify", "Wix", "Annet"].map(p => (
                        <div key={p} className="bg-preik-bg border border-preik-border rounded-lg px-2 py-1 text-[8px] text-preik-text-muted/50 flex items-center gap-1">
                          <I t="globe" c="w-2 h-2" /> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Widget preview */}
                <div className={`transition-opacity duration-500 ${s4Phase >= 1 ? "opacity-100" : "opacity-0"}`}>
                  <div className="bg-preik-bg border border-preik-border rounded-xl p-2.5 h-full flex flex-col">
                    <p className="text-[10px] text-preik-text-muted/50 mb-2">Forhåndsvisning</p>

                    <div className="bg-preik-surface rounded-lg border border-preik-border overflow-hidden relative flex-1">
                      {/* Browser chrome */}
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-preik-border bg-preik-bg">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
                        <div className="flex-1 mx-1 bg-preik-surface rounded px-1.5 py-0.5">
                          <span className="text-[7px] text-preik-text-muted/40">minbutikk.no</span>
                        </div>
                      </div>

                      {/* Page content */}
                      <div className="p-2.5 space-y-1.5">
                        <div className="h-1.5 w-2/3 bg-preik-border/50 rounded" />
                        <div className="h-1.5 w-full bg-preik-border/30 rounded" />
                        <div className="h-1.5 w-4/5 bg-preik-border/30 rounded" />
                        <div className="h-4" />
                        <div className="h-1.5 w-1/2 bg-preik-border/50 rounded" />
                        <div className="h-1.5 w-full bg-preik-border/30 rounded" />
                      </div>

                      {/* Widget popup */}
                      <div className={`absolute bottom-9 right-1.5 w-[160px] rounded-lg shadow-lg border overflow-hidden transition-all duration-500 ${
                        s4Phase >= 2 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                      }`} style={{ borderColor: currentAccent + "25" }}>
                        <div className="px-2 py-1.5 flex items-center gap-1.5 transition-colors duration-500" style={{ backgroundColor: currentAccent }}>
                          <I t="chat" c="w-2.5 h-2.5 text-white" />
                          <span className="text-[8px] font-medium text-white">Min Butikk</span>
                        </div>
                        <div className="bg-white p-1.5 space-y-1" style={{ minHeight: "60px" }}>
                          {widgetGreeting && (
                            <div className="flex gap-1">
                              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: currentAccent }}>
                                <I t="chat" c="w-1.5 h-1.5 text-white" />
                              </div>
                              <div className="text-[7px] leading-tight bg-gray-100 rounded-md px-1.5 py-1 max-w-[120px]">
                                {widgetGreeting}
                                {widgetGreeting.length < 29 && <span className="inline-block w-0.5 h-2 bg-preik-text ml-0.5 animate-pulse" />}
                              </div>
                            </div>
                          )}
                          {showWidgetMsgs >= 1 && (
                            <div className="flex justify-end">
                              <div className="text-[7px] leading-tight text-white rounded-md px-1.5 py-1 transition-colors duration-500" style={{ backgroundColor: currentAccent }}>
                                Hva koster frakt?
                              </div>
                            </div>
                          )}
                          {showWidgetMsgs >= 2 && (
                            <div className="flex gap-1">
                              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: currentAccent }}>
                                <I t="chat" c="w-1.5 h-1.5 text-white" />
                              </div>
                              <div className="text-[7px] leading-tight bg-gray-100 rounded-md px-1.5 py-1">Frakt er gratis over 499 kr!</div>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-gray-100 px-1.5 py-1 flex items-center gap-1">
                          <div className="flex-1 bg-gray-50 rounded px-1 py-0.5"><span className="text-[6px] text-gray-300">Skriv en melding...</span></div>
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: currentAccent }}>
                            <I t="send" c="w-1.5 h-1.5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* FAB */}
                      <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full shadow-md flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: currentAccent }}>
                        <I t="chat" c="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
