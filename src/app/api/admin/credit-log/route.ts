import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminTenantAccess } from "@/lib/admin-auth";
import { safeParseInt } from "@/lib/params";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/credit-log");

// GET - Fetch credit usage log for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const days = safeParseInt(searchParams.get("days"), 30, 365);
    const page = safeParseInt(searchParams.get("page"), 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 50, 200);
    const offset = (page - 1) * limit;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const { authorized, error: authError } = await verifyAdminTenantAccess(tenantId);
    if (!authorized) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
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
      log.error("Error fetching credit log:", error);
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
    }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
    });
  } catch (error) {
    log.error("Error in credit log API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
