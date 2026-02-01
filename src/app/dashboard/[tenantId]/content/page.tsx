import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import Link from "next/link";
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

  const config = TENANT_CONFIGS[tenantId];
  const isAdmin = access.role === "admin";

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/${tenantId}`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Back to {config?.name || tenantId}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="mt-1 text-gray-600">
            View and manage your chatbot&apos;s knowledge base
          </p>
        </div>

        <ContentManager tenantId={tenantId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
