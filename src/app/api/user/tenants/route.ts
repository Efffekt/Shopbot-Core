import { NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";

export async function GET() {
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
    console.error("Error fetching tenant access:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }

  const tenants = (tenantAccess || []).map((access) => {
    const config = TENANT_CONFIGS[access.tenant_id];
    return {
      id: access.tenant_id,
      name: config?.name || access.tenant_id,
      role: access.role,
      persona: config?.persona || null,
    };
  });

  return NextResponse.json({ tenants });
}
