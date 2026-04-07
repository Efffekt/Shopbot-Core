import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import TenantAnalyticsDashboard from "@/components/TenantAnalyticsDashboard";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function AnalyticsPage({ params }: PageProps) {
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

  // Check if there are any conversations yet
  const { count } = await supabaseAdmin
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("store_id", tenantId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-brand font-light text-preik-text mb-2">Analyse</h1>
        <p className="text-preik-text-muted">Se hvordan chatboten din presterer</p>
      </div>
      {count === 0 ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-preik-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-preik-text mb-2">Ingen data enda</h2>
          <p className="text-preik-text-muted mb-6 max-w-md mx-auto">
            Når chatboten din er installert og kunder begynner å bruke den, vil du se statistikk og innsikt her.
          </p>
          <Link
            href={`/dashboard/${tenantId}/integrasjon`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-preik-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Installer widgeten
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <TenantAnalyticsDashboard tenantId={tenantId} />
      )}
    </div>
  );
}
