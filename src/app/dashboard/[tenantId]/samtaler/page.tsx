import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import TenantConversationBrowser from "@/components/TenantConversationBrowser";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function SamtalerPage({ params }: PageProps) {
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

  const { count } = await supabaseAdmin
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("store_id", tenantId);

  return (
    <div>
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
        <h1 className="text-2xl font-brand font-light text-preik-text mb-2">Samtaler</h1>
        <p className="text-preik-text-muted mb-6">Se loggen over alle chatsamtaler</p>
        {count === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-preik-accent/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-preik-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-preik-text mb-2">Ingen samtaler enda</h2>
            <p className="text-preik-text-muted mb-6 max-w-md mx-auto">
              Samtaler vises her når kunder begynner å chatte med widgeten din. Sørg for at widgeten er installert og at domenet er hvitelistet.
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
          <TenantConversationBrowser tenantId={tenantId} isAdmin={access.role === "admin"} />
        )}
      </div>
    </div>
  );
}
