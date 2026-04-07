"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface OnboardingSteps {
  domainsAdded: boolean;
  contentAdded: boolean;
  promptConfigured: boolean;
  widgetCustomized: boolean;
  widgetInstalled: boolean;
}

const STEP_CONFIG = [
  {
    key: "domainsAdded" as const,
    label: "Legg til domene",
    desc: "Hviteliste domenet der widgeten skal brukes",
    href: (id: string) => `/dashboard/${id}`,
    linkLabel: "Legg til",
  },
  {
    key: "contentAdded" as const,
    label: "Legg til innhold",
    desc: "Fyll kunnskapsbasen slik at chatboten kan svare",
    href: (id: string) => `/dashboard/${id}/content`,
    linkLabel: "Gå til innhold",
  },
  {
    key: "promptConfigured" as const,
    label: "Sett opp systemprompt",
    desc: "Definer hvordan chatboten skal oppføre seg",
    href: (id: string) => `/dashboard/${id}/prompt`,
    linkLabel: "Gå til prompt",
  },
  {
    key: "widgetCustomized" as const,
    label: "Tilpass widgeten",
    desc: "Velg farger, tekster og utseende",
    href: (id: string) => `/dashboard/${id}/integrasjon`,
    linkLabel: "Tilpass",
  },
  {
    key: "widgetInstalled" as const,
    label: "Installer widgeten",
    desc: "Legg til embed-kode eller koble til Shopify",
    doneDesc: null as string | null, // set dynamically
    href: (id: string) => `/dashboard/${id}/integrasjon`,
    linkLabel: "Installer",
  },
];

export function OnboardingChecklist({ tenantId }: { tenantId: string }) {
  // Read dismissed state synchronously from localStorage to avoid cascading renders
  const isDismissedInitially = typeof window !== "undefined"
    && localStorage.getItem(`onboarding-dismissed-${tenantId}`) === "true";

  const [steps, setSteps] = useState<OnboardingSteps | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5);
  const [dismissed, setDismissed] = useState(isDismissedInitially);
  const [loading, setLoading] = useState(!isDismissedInitially);
  const [widgetDomain, setWidgetDomain] = useState<string | null>(null);

  useEffect(() => {
    if (isDismissedInitially) return;

    fetch(`/api/tenant/${tenantId}/onboarding-status`)
      .then((r) => r.json())
      .then((data) => {
        setSteps(data.steps);
        setCompletedCount(data.completedCount);
        setTotalSteps(data.totalSteps);
        setWidgetDomain(data.widgetFirstSeenDomain);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId, isDismissedInitially]);

  if (loading || dismissed || !steps) return null;
  if (completedCount === totalSteps) return null;

  const progress = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="bg-preik-surface rounded-2xl border border-preik-border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-preik-text">Kom i gang</h2>
          <p className="text-sm text-preik-text-muted mt-0.5">
            {completedCount} av {totalSteps} steg fullfort
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(`onboarding-dismissed-${tenantId}`, "true");
            setDismissed(true);
          }}
          className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
        >
          Skjul
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-preik-border rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full bg-preik-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEP_CONFIG.map((step) => {
          const done = steps[step.key];
          return (
            <div
              key={step.key}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                done ? "bg-green-50 dark:bg-green-900/10" : "bg-preik-bg"
              }`}
            >
              {/* Check circle */}
              <div
                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? "bg-green-500 border-green-500"
                    : "border-preik-border"
                }`}
              >
                {done && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? "text-green-700 dark:text-green-300" : "text-preik-text"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-preik-text-muted">
                  {done && step.key === "widgetInstalled" && widgetDomain
                    ? `Widget oppdaget på ${widgetDomain}`
                    : step.desc}
                </p>
              </div>

              {/* Action */}
              {!done && (
                <Link
                  href={step.href(tenantId)}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium text-preik-accent hover:bg-preik-accent/10 rounded-lg transition-colors"
                >
                  {step.linkLabel}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Help */}
      <div className="mt-5 pt-4 border-t border-preik-border flex items-center gap-2 text-sm text-preik-text-muted">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Trenger du hjelp? Send en e-post til{" "}
        <a href="mailto:hei@preik.ai" className="text-preik-accent hover:underline">
          hei@preik.ai
        </a>
      </div>
    </div>
  );
}
