import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { getTenantConfigFromDB } from "@/lib/tenants";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCreditStatus } from "@/lib/credits";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function TenantPage({ params }: PageProps) {
  const { tenantId } = await params;

  // Run auth check and credit fetch in parallel
  const [user, supabase] = await Promise.all([
    getUser(),
    createSupabaseServerClient(),
  ]);

  const [{ data: access, error }, credits] = await Promise.all([
    supabase
      .from("tenant_user_access")
      .select("tenant_id, role")
      .eq("user_id", user?.id)
      .eq("tenant_id", tenantId)
      .single(),
    getCreditStatus(tenantId),
  ]);

  if (error || !access) {
    redirect("/dashboard");
  }

  const config = await getTenantConfigFromDB(tenantId);
  if (!config) {
    notFound();
  }

  const isAdmin = access.role === "admin";
  const percentUsed = credits?.percentUsed ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-brand font-light text-preik-text">{config.name}</h1>
        <p className="mt-2 text-preik-text-muted">{config.persona}</p>
        <div className="mt-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-preik-accent/10 text-preik-accent capitalize">
            {access.role === "admin" ? "Administrator" : "Leser"}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-6" : "lg:grid-cols-4"} gap-4 mb-8`}>
        <Link
          href={`/dashboard/${tenantId}/integrasjon`}
          className="flex flex-col items-center p-6 bg-preik-surface rounded-2xl border border-preik-border hover:border-preik-accent transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="font-medium text-preik-text">Integrasjon</span>
          <span className="text-sm text-preik-text-muted">Hent embed-kode</span>
        </Link>

        <Link
          href={`/dashboard/${tenantId}/analytics`}
          className="flex flex-col items-center p-6 bg-preik-surface rounded-2xl border border-preik-border hover:border-preik-accent transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="font-medium text-preik-text">Analyse</span>
          <span className="text-sm text-preik-text-muted">Se chat-statistikk</span>
        </Link>

        <Link
          href={`/dashboard/${tenantId}/samtaler`}
          className="flex flex-col items-center p-6 bg-preik-surface rounded-2xl border border-preik-border hover:border-preik-accent transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-medium text-preik-text">Samtaler</span>
          <span className="text-sm text-preik-text-muted">Se chatloggen</span>
        </Link>

        {isAdmin && (
          <Link
            href={`/dashboard/${tenantId}/prompt`}
            className="flex flex-col items-center p-6 bg-preik-surface rounded-2xl border border-preik-border hover:border-preik-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="font-medium text-preik-text">Systemprompt</span>
            <span className="text-sm text-preik-text-muted">Rediger AI-oppførsel</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href={`/dashboard/${tenantId}/content`}
            className="flex flex-col items-center p-6 bg-preik-surface rounded-2xl border border-preik-border hover:border-preik-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="font-medium text-preik-text">Innhold</span>
            <span className="text-sm text-preik-text-muted">Administrer kunnskapsbase</span>
          </Link>
        )}

        <Link
          href={`/dashboard/${tenantId}/innstillinger`}
          className="flex flex-col items-center p-6 bg-preik-surface rounded-2xl border border-preik-border hover:border-preik-accent transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-preik-accent/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-medium text-preik-text">Innstillinger</span>
          <span className="text-sm text-preik-text-muted">Konto og passord</span>
        </Link>
      </div>

      {/* Credit Usage */}
      {credits && (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-preik-text mb-4">Kredittforbruk denne måneden</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-preik-border rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    percentUsed > 80 ? "bg-red-500" : percentUsed > 60 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-preik-text-muted whitespace-nowrap">
              {credits.creditsUsed.toLocaleString("nb-NO")} av {credits.creditLimit.toLocaleString("nb-NO")} kreditter brukt
            </span>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <h2 className="text-lg font-semibold text-preik-text mb-6">Konfigurasjon</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="text-sm font-medium text-preik-text-muted mb-1">Språk</h3>
            <p className="text-preik-text">
              {config.language === "no"
                ? "Norsk"
                : config.language === "en"
                  ? "Engelsk"
                  : "Norsk/Engelsk"}
            </p>
          </div>

          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="text-sm font-medium text-preik-text-muted mb-1">Funksjoner</h3>
            <p className="text-preik-text text-sm">
              {[
                config.features.synonymMapping && "Synonymmapping",
                config.features.codeBlockFormatting && "Kodeformatering",
                config.features.boatExpertise && "Båtekspertise",
              ]
                .filter(Boolean)
                .join(", ") || "Ingen spesialfunksjoner"}
            </p>
          </div>

          <div className="bg-preik-bg rounded-xl p-4">
            <h3 className="text-sm font-medium text-preik-text-muted mb-1">Tillatte domener</h3>
            <p className="text-preik-text text-sm">
              {config.allowedDomains
                .filter((d) => !d.includes("localhost") && !d.includes("127.0.0.1"))
                .join(", ") || "Ingen konfigurert"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
