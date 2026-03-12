"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";

const STORAGE_KEY = "preik-cookie-consent";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "granted";
}

function getServerSnapshot() {
  return false;
}

export function ConsentAnalytics() {
  const consented = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!consented) return null;

  return <Analytics />;
}
