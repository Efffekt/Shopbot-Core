import { NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { getTenantConfigFromDB } from "@/lib/tenants";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/user/tenants");

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: tenantAccess, error } = await supabase
      .from("tenant_user_access")
      .select("tenant_id, role")
      .eq("user_id", user.id);

    if (error) {
      log.error("Error fetching tenant access:", error);
      return NextResponse.json(
        { error: "Failed to fetch tenants" },
        { status: 500 }
      );
    }

    const tenants = await Promise.all(
      (tenantAccess || []).map(async (access) => {
        const config = await getTenantConfigFromDB(access.tenant_id);
        return {
          id: access.tenant_id,
          name: config?.name || access.tenant_id,
          role: access.role,
          persona: config?.persona || null,
        };
      })
    );

    return NextResponse.json({ tenants }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    log.error("Unexpected error fetching user tenants:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
