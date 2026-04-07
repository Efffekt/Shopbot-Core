"use client";

import { useState, useRef, useEffect } from "react";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-14 right-0 w-72 bg-preik-surface border border-preik-border rounded-2xl shadow-xl p-5 animate-in fade-in slide-in-from-bottom-2">
          <h3 className="font-semibold text-preik-text mb-2">Trenger du hjelp?</h3>
          <p className="text-sm text-preik-text-muted mb-4">
            Vi hjelper deg gjerne med oppsett og konfigurasjon av chatboten din.
          </p>
          <div className="space-y-2">
            <a
              href="mailto:hei@preik.ai?subject=Trenger hjelp med oppsett"
              className="flex items-center gap-3 p-3 bg-preik-bg rounded-xl hover:bg-preik-accent/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-preik-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-preik-text">Send e-post</p>
                <p className="text-xs text-preik-text-muted">hei@preik.ai</p>
              </div>
            </a>
            <a
              href="/docs"
              className="flex items-center gap-3 p-3 bg-preik-bg rounded-xl hover:bg-preik-accent/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-preik-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-preik-text">Dokumentasjon</p>
                <p className="text-xs text-preik-text-muted">Guider og oppsett</p>
              </div>
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-preik-accent text-white shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
        title="Hjelp"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
}
