import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import Link from "next/link";
import { redirect } from "next/navigation";
import AccountSettings from "@/components/AccountSettings";

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

  const config = TENANT_CONFIGS[tenantId];

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/${tenantId}`}
          className="text-sm text-preik-text-muted hover:text-preik-text transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tilbake til {config?.name || tenantId}
        </Link>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
          <h1 className="text-2xl font-brand font-light text-preik-text mb-6">Kontoinnstillinger</h1>
          <AccountSettings userEmail={user?.email || ""} />
        </div>

        {/* Subscription Info - Placeholder for manual billing */}
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
          <h2 className="text-lg font-semibold text-preik-text mb-4">Abonnement</h2>
          <div className="bg-preik-bg rounded-xl p-4 border border-preik-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-preik-text font-medium">Aktiv</p>
                <p className="text-sm text-preik-text-muted">Ditt abonnement er aktivt</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                Aktiv
              </span>
            </div>
          </div>
          <p className="text-sm text-preik-text-muted mt-4">
            For sporsmal om faktura eller abonnement, kontakt{" "}
            <a href="mailto:hei@preik.no" className="text-preik-accent hover:underline">
              hei@preik.no
            </a>
          </p>
        </div>

        {/* Support */}
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
          <h2 className="text-lg font-semibold text-preik-text mb-4">Hjelp og support</h2>
          <div className="space-y-3">
            <a
              href="mailto:hei@preik.no"
              className="flex items-center gap-3 p-4 bg-preik-bg rounded-xl border border-preik-border hover:border-preik-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-preik-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-preik-text font-medium">Kontakt oss</p>
                <p className="text-sm text-preik-text-muted">hei@preik.no</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
