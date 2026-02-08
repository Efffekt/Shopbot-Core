import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

// GET - Admin overview stats
export async function GET() {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    // Get overview stats
    const { data: statsData, error: statsError } = await supabaseAdmin
      .rpc("get_admin_overview_stats");

    if (statsError) {
      console.error("Error fetching overview stats:", statsError);
      return NextResponse.json({ error: "Failed to fetch overview stats" }, { status: 500 });
    }

    // Get most active tenants
    const { data: activeTenants, error: activeError } = await supabaseAdmin
      .rpc("get_most_active_tenants", { p_days: 30, p_limit: 10 });

    if (activeError) {
      console.error("Error fetching active tenants:", activeError);
    }

    return NextResponse.json({
      stats: statsData,
      activeTenants: activeTenants || [],
    });
  } catch (error) {
    console.error("Error in overview API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
