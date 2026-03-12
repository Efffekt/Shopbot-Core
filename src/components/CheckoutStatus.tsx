"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutStatus() {
  const router = useRouter();
  const [dots, setDots] = useState(".");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    const refreshInterval = setInterval(() => {
      setElapsed((prev) => prev + 3);
      router.refresh();
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(refreshInterval);
    };
  }, [router]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-brand font-light text-preik-text">
          Betaling mottatt!
        </h2>
        <p className="mt-4 text-preik-text-muted">
          Prosjektet ditt opprettes{dots} Dette tar vanligvis noen sekunder.
        </p>
        <p className="mt-2 text-sm text-preik-text-muted">
          Vi setter opp alt for deg. Du blir automatisk sendt videre når det er klart.
        </p>
        {elapsed > 15 && (
          <p className="mt-4 text-sm text-preik-text-muted">
            Tar det litt lang tid? Prøv å{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-preik-accent hover:underline"
            >
              laste siden på nytt
            </button>
            , eller kontakt oss på{" "}
            <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
              hei@preik.ai
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
