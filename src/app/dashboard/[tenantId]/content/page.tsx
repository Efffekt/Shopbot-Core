import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ContentManager from "@/components/ContentManager";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function ContentPage({ params }: PageProps) {
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

  const isAdmin = access.role === "admin";

  return (
    <div>
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-brand font-light text-preik-text">Innholdsadministrasjon</h1>
          <p className="mt-1 text-preik-text-muted">
            Se og administrer kunnskapsbasen til chatboten
          </p>
        </div>

        <ContentManager tenantId={tenantId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
