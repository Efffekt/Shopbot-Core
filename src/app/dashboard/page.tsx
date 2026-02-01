import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import Link from "next/link";
import { redirect } from "next/navigation";

interface TenantAccess {
  tenant_id: string;
  role: string;
}

export default async function DashboardPage() {
  const user = await getUser();
  const supabase = await createSupabaseServerClient();

  const { data: tenantAccess, error } = await supabase
    .from("tenant_user_access")
    .select("tenant_id, role")
    .eq("user_id", user?.id);

  if (error) {
    console.error("Error fetching tenant access:", error);
  }

  const tenants = (tenantAccess || []) as TenantAccess[];

  // If user has exactly one tenant, redirect directly to it
  if (tenants.length === 1) {
    redirect(`/dashboard/${tenants[0].tenant_id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Tenants</h1>

      {tenants.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-yellow-800">No Access</h2>
          <p className="mt-2 text-yellow-700">
            You don&apos;t have access to any tenants yet. Please contact an
            administrator to grant you access.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((access) => {
            const config = TENANT_CONFIGS[access.tenant_id];
            return (
              <Link
                key={access.tenant_id}
                href={`/dashboard/${access.tenant_id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {config?.name || access.tenant_id}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Role: <span className="capitalize">{access.role}</span>
                </p>
                {config && (
                  <p className="mt-2 text-sm text-gray-600">{config.persona}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
