import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/tenant/widget-config");

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

async function verifyAccess(tenantId: string) {
  const user = await getUser();
  if (!user) return { user: null, error: "Unauthorized", status: 401 };

  const supabase = await createSupabaseServerClient();
  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) return { user: null, error: "Forbidden", status: 403 };
  return { user, role: access.role, error: null, status: 200 };
}

// GET - Load widget config for tenant
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, error: authError, status } = await verifyAccess(tenantId);
  if (!user) return NextResponse.json({ error: authError }, { status });

  const { data, error } = await supabaseAdmin
    .from("widget_config")
    .select("config, updated_at")
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ config: null }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  return NextResponse.json({ config: data.config, updatedAt: data.updated_at }, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}

// PUT - Save widget config for tenant
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, role, error: authError, status } = await verifyAccess(tenantId);
  if (!user) return NextResponse.json({ error: authError }, { status });
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = await request.json();
  const { config } = body;

  if (!config || typeof config !== "object") {
    return NextResponse.json({ error: "Config object required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("widget_config")
    .upsert({
      tenant_id: tenantId,
      config,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, { onConflict: "tenant_id" });

  if (error) {
    log.error("Failed to save widget config:", error);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
