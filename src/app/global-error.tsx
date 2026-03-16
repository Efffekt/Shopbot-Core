"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="no">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Noe gikk galt
            </h1>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              Beklager, det oppstod en feil. Prøv igjen eller kontakt oss hvis problemet vedvarer.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2D6A4F",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Prøv igjen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
