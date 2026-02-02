import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import Link from "next/link";
import { redirect } from "next/navigation";
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

      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <h1 className="text-2xl font-brand font-light text-preik-text mb-6">Analyse</h1>
        <TenantAnalyticsDashboard tenantId={tenantId} />
      </div>
    </div>
  );
}
