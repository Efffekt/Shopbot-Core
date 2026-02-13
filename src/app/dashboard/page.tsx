import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "@/lib/admin-emails";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createLogger } from "@/lib/logger";

const log = createLogger("dashboard");

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
    log.error("Error fetching tenant access:", error);
  }

  const tenants = (tenantAccess || []) as TenantAccess[];

  // If user has exactly one tenant, redirect directly to it
  if (tenants.length === 1) {
    redirect(`/dashboard/${tenants[0].tenant_id}`);
  }

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

      {tenants.length === 0 ? (
        <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-2xl p-8">
          <h2 className="text-lg font-medium text-preik-text">Ingen prosjekter</h2>
          <p className="mt-2 text-preik-text-muted">
            Du har ikke tilgang til noen prosjekter ennå. Kontakt en administrator for å få tilgang.
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
      )}
    </div>
  );
}
