import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS, getTenantConfigFromDB } from "@/lib/tenants";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "@/lib/admin-emails";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createLogger } from "@/lib/logger";
import PricingCards from "@/components/PricingCards";
import CheckoutStatus from "@/components/CheckoutStatus";

const log = createLogger("dashboard");

interface TenantAccess {
  tenant_id: string;
  role: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; plan?: string }>;
}) {
  const user = await getUser();
  const supabase = await createSupabaseServerClient();
  const { checkout, plan } = await searchParams;

  const { data: tenantAccess, error } = await supabase
    .from("tenant_user_access")
    .select("tenant_id, role")
    .eq("user_id", user?.id);

  if (error) {
    log.error("Error fetching tenant access:", error);
  }

  const tenants = (tenantAccess || []) as TenantAccess[];

  // If user has exactly one tenant, redirect directly to it
  // (but not if they just completed checkout — show the onboarding message)
  if (tenants.length === 1 && checkout !== "success") {
    redirect(`/dashboard/${tenants[0].tenant_id}`);
  }

  // Fetch configs (hardcoded + DB) for display names
  const tenantConfigs = await Promise.all(
    tenants.map(async (t) => ({
      tenant_id: t.tenant_id,
      config: TENANT_CONFIGS[t.tenant_id] || await getTenantConfigFromDB(t.tenant_id),
    }))
  );
  const configMap = Object.fromEntries(tenantConfigs.map((t) => [t.tenant_id, t.config]));

  // If user has no tenant projects but is an admin, redirect to admin panel
  if (tenants.length === 0) {
    const email = user?.email?.toLowerCase() ?? "";
    if (SUPER_ADMIN_EMAILS.includes(email) || ADMIN_EMAILS.includes(email)) {
      redirect("/admin");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-brand font-light text-preik-text mb-8">
        Dine prosjekter
      </h1>

      {checkout === "success" && (
        <CheckoutStatus
          tenantId={tenants.length > 0 ? tenants[0].tenant_id : undefined}
          tenantName={tenants.length > 0 ? (configMap[tenants[0].tenant_id]?.name || tenants[0].tenant_id) : undefined}
        />
      )}

      {tenants.length === 0 && checkout !== "success" ? (
        <PricingCards userEmail={user?.email || ""} initialPlan={plan} />
      ) : tenants.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((access) => {
            const config = configMap[access.tenant_id];
            return (
              <Link
                key={access.tenant_id}
                href={`/dashboard/${access.tenant_id}`}
                className="block bg-preik-surface rounded-2xl border border-preik-border p-6 hover:border-preik-accent transition-colors"
              >
                <h2 className="text-lg font-semibold text-preik-text">
                  {config?.name || access.tenant_id}
                </h2>
                <p className="mt-1 text-sm text-preik-text-muted">
                  Rolle: <span className="capitalize">{access.role === "admin" ? "Administrator" : "Leser"}</span>
                </p>
                {config && (
                  <p className="mt-3 text-sm text-preik-text-muted">{config.persona}</p>
                )}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
