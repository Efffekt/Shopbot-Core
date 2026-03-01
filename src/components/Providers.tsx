"use client";

import { ToastProvider } from "@/components/Toast";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <CookieConsentBanner />
    </ToastProvider>
  );
}
