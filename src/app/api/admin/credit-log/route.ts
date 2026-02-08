import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

// GET - Fetch credit usage log for a tenant
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const days = parseInt(searchParams.get("days") || "30", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = (page - 1) * limit;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data: logs, count, error } = await supabaseAdmin
      .from("credit_usage_log")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching credit log:", error);
      return NextResponse.json({ error: "Failed to fetch credit log" }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in credit log API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
