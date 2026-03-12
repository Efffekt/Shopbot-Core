"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

const STORAGE_KEY = "preik-cookie-consent";

export function ConsentAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(localStorage.getItem(STORAGE_KEY) === "granted");

    function onStorage() {
      setConsented(localStorage.getItem(STORAGE_KEY) === "granted");
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!consented) return null;

  return <Analytics />;
}
