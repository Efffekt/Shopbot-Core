"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires fbq('track', 'PageView') on every client-side route change.
 * The initial PageView is handled by the inline pixel script in layout.tsx,
 * so we skip the first render and only track subsequent navigations.
 */
export function FacebookPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial mount — the inline pixel already fired PageView
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (window.fbq) {
      window.fbq("track", "PageView", {}, { eventID: crypto.randomUUID() });
    }
  }, [pathname, searchParams]);

  return null;
}
