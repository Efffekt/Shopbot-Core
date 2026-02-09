import type { Metadata } from "next";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import { redirect } from "next/navigation";
import TenantNav from "@/components/TenantNav";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { tenantId } = await params;
  const config = TENANT_CONFIGS[tenantId];
  return {
    title: `${config?.name || tenantId} – Preik`,
  };
}

export default async function TenantLayout({ children, params }: LayoutProps) {
  const { tenantId } = await params;
  const user = await getUser();
  const supabase = await createSupabaseServerClient();

  const { data: access, error } = await supabase
    .from("tenant_user_access")
    .select("tenant_id, role")
    .eq("user_id", user?.id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !access) {
    redirect("/dashboard");
  }

  const config = TENANT_CONFIGS[tenantId];
  const tenantName = config?.name || tenantId;
  const isAdmin = access.role === "admin";

  return (
    <div>
      <TenantNav tenantId={tenantId} tenantName={tenantName} isAdmin={isAdmin} />
      {children}
    </div>
  );
}
