import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
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

  return (
    <div>
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <h1 className="text-2xl font-brand font-light text-preik-text mb-2">Analyse</h1>
        <p className="text-preik-text-muted mb-6">Se hvordan chatboten din presterer</p>
        <TenantAnalyticsDashboard tenantId={tenantId} />
      </div>
    </div>
  );
}
