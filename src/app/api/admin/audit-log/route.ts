import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { safeParseInt } from "@/lib/params";

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = safeParseInt(searchParams.get("page"), 1, 1000);
  const entityType = searchParams.get("entityType");
  const limit = 30;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }

  return NextResponse.json({
    entries: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
