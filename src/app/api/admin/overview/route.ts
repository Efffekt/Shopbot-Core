import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/overview");

// GET - Admin overview stats
export async function GET() {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    // Get overview stats
    const { data: statsData, error: statsError } = await supabaseAdmin
      .rpc("get_admin_overview_stats");

    if (statsError) {
      log.error("Error fetching overview stats:", statsError);
      return NextResponse.json({ error: "Failed to fetch overview stats" }, { status: 500 });
    }

    // Get most active tenants
    const { data: activeTenants, error: activeError } = await supabaseAdmin
      .rpc("get_most_active_tenants", { p_days: 30, p_limit: 10 });

    if (activeError) {
      log.error("Error fetching active tenants:", activeError);
    }

    return NextResponse.json({
      stats: statsData,
      activeTenants: activeTenants || [],
    }, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    log.error("Error in overview API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
