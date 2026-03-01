"use client";

export function CookieSettingsButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("preik-reopen-consent"))}
      className="hover:text-preik-text transition-colors cursor-pointer"
    >
      Cookieinnstillinger
    </button>
  );
}
