import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AccountSettings from "@/components/AccountSettings";
import { getCreditStatus } from "@/lib/credits";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { tenantId } = await params;
  const user = await getUser();
  const supabase = await createSupabaseServerClient();

  const { data: access, error: accessError } = await supabase
    .from("tenant_user_access")
    .select("tenant_id, role")
    .eq("user_id", user?.id)
    .eq("tenant_id", tenantId)
    .single();

  if (accessError || !access) {
    redirect("/dashboard");
  }

  const credits = await getCreditStatus(tenantId);

  const percentUsed = credits?.percentUsed ?? 0;
  const barColor = percentUsed > 80
    ? "bg-red-500"
    : percentUsed > 60
      ? "bg-yellow-500"
      : "bg-green-500";
  const statusColor = percentUsed > 80
    ? "text-red-600 bg-red-500/10"
    : percentUsed > 60
      ? "text-yellow-600 bg-yellow-500/10"
      : "text-green-600 bg-green-500/10";

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-brand font-light text-preik-text">Innstillinger</h1>
        <p className="text-sm text-preik-text-muted mt-1">Administrer konto, passord og se kredittforbruk</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Account & Password */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-preik-accent/10 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-preik-text">Konto</h2>
                <p className="text-xs text-preik-text-muted">E-post og passord</p>
              </div>
            </div>
            <AccountSettings userEmail={user?.email || ""} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Credit Usage */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-preik-accent/10 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-preik-text">Kreditter</h2>
                <p className="text-xs text-preik-text-muted">Forbruk denne perioden</p>
              </div>
            </div>

            {credits ? (
              <div className="space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-preik-bg rounded-xl p-3 border border-preik-border text-center">
                    <p className="text-2xl font-brand font-light text-preik-text">{credits.creditsUsed.toLocaleString("nb-NO")}</p>
                    <p className="text-xs text-preik-text-muted mt-0.5">Brukt</p>
                  </div>
                  <div className="bg-preik-bg rounded-xl p-3 border border-preik-border text-center">
                    <p className="text-2xl font-brand font-light text-preik-text">{credits.creditsRemaining.toLocaleString("nb-NO")}</p>
                    <p className="text-xs text-preik-text-muted mt-0.5">Gjenstår</p>
                  </div>
                  <div className="bg-preik-bg rounded-xl p-3 border border-preik-border text-center">
                    <p className="text-2xl font-brand font-light text-preik-text">{credits.creditLimit.toLocaleString("nb-NO")}</p>
                    <p className="text-xs text-preik-text-muted mt-0.5">Totalt</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-preik-text-muted">Forbruk</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      {percentUsed}%
                    </span>
                  </div>
                  <div className="w-full bg-preik-border rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Billing period */}
                <div className="flex items-center gap-2 text-xs text-preik-text-muted">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(credits.billingCycleStart).toLocaleDateString("nb-NO")} – {new Date(credits.billingCycleEnd).toLocaleDateString("nb-NO")}
                  </span>
                </div>

                <p className="text-sm text-preik-text-muted pt-2 border-t border-preik-border">
                  Trenger du flere kreditter?{" "}
                  <a href="mailto:hei@preik.no" className="text-preik-accent hover:underline">
                    Kontakt oss for å oppgradere.
                  </a>
                </p>
              </div>
            ) : (
              <p className="text-sm text-preik-text-muted">Kunne ikke hente kredittinformasjon.</p>
            )}
          </div>

          {/* Support */}
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-preik-accent/10 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-preik-text">Support</h2>
                <p className="text-xs text-preik-text-muted">Vi hjelper deg gjerne</p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="mailto:hei@preik.no"
                className="flex items-center gap-3 p-4 bg-preik-bg rounded-xl border border-preik-border hover:border-preik-accent transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-preik-accent/10 flex items-center justify-center group-hover:bg-preik-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-preik-text font-medium text-sm">Send oss en e-post</p>
                  <p className="text-xs text-preik-text-muted">hei@preik.no · Svar innen 24 timer</p>
                </div>
              </a>

              <a
                href="/docs"
                className="flex items-center gap-3 p-4 bg-preik-bg rounded-xl border border-preik-border hover:border-preik-accent transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-preik-accent/10 flex items-center justify-center group-hover:bg-preik-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-preik-text font-medium text-sm">Dokumentasjon</p>
                  <p className="text-xs text-preik-text-muted">Guider og oppsett</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
