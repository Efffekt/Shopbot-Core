import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/my-tenants");

// GET - List tenants accessible to the current admin
export async function GET() {
  const { authorized, isSuperAdmin, userId, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    if (isSuperAdmin) {
      const { data: tenants, error } = await supabaseAdmin
        .from("tenants")
        .select("id, name")
        .order("name");

      if (error) {
        log.error("Failed to fetch tenants:", error);
        return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
      }

      return NextResponse.json({ tenants: tenants || [] });
    }

    // Regular admins: get tenant IDs from access table
    const { data: access, error: accessError } = await supabaseAdmin
      .from("tenant_user_access")
      .select("tenant_id")
      .eq("user_id", userId);

    if (accessError) {
      log.error("Failed to fetch accessible tenants:", accessError);
      return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }

    const tenantIds = (access || []).map((a) => a.tenant_id);

    if (tenantIds.length === 0) {
      return NextResponse.json({ tenants: [] });
    }

    const { data: tenants, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, name")
      .in("id", tenantIds)
      .order("name");

    if (tenantError) {
      log.error("Failed to fetch tenant details:", tenantError);
      return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }

    return NextResponse.json({ tenants: tenants || [] });
  } catch (error) {
    log.error("Error fetching accessible tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
