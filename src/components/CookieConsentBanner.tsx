"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "preik-cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function updateConsent(granted: boolean) {
  const value = granted ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted") {
      updateConsent(true);
    } else if (stored === "denied") {
      updateConsent(false);
    } else {
      setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
    }

    function handleReopen() {
      setVisible(true);
    }

    window.addEventListener("preik-reopen-consent", handleReopen);
    return () =>
      window.removeEventListener("preik-reopen-consent", handleReopen);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "granted");
    updateConsent(true);
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "denied");
    updateConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] w-full max-w-lg px-4">
      <div className="bg-preik-surface border border-preik-border rounded-2xl p-4 shadow-lg">
        <p className="text-preik-text text-sm mb-3">
          Vi bruker informasjonskapsler for å måle effekten av annonser og
          trafikk.{" "}
          <Link
            href="/cookies"
            className="text-preik-accent underline underline-offset-2"
          >
            Les mer
          </Link>
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm font-medium text-preik-text-muted border border-preik-border rounded-xl hover:bg-preik-bg transition-colors cursor-pointer"
          >
            Avvis
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white bg-preik-accent rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Godta
          </button>
        </div>
      </div>
    </div>
  );
}
