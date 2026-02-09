import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";
import { z } from "zod";

const widgetConfigSchema = z.object({
  accentColor: z.string().max(50).optional(),
  textColor: z.string().max(50).optional(),
  bgColor: z.string().max(50).optional(),
  surfaceColor: z.string().max(50).optional(),
  fontBody: z.string().max(100).optional(),
  fontBrand: z.string().max(100).optional(),
  brandStyle: z.enum(["normal", "italic"]).optional(),
  position: z.enum(["bottom-right", "bottom-left"]).optional(),
  greeting: z.string().max(500).optional(),
  placeholder: z.string().max(200).optional(),
  brandName: z.string().max(100).optional(),
  theme: z.enum(["auto", "light", "dark"]).optional(),
  startOpen: z.boolean().optional(),
  contained: z.boolean().optional(),
  onboarding: z.string().max(5000).optional(),
  onboardingCta: z.string().max(100).optional(),
}).strict();

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

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > 64_000) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const body = await request.json();
  const parsed = widgetConfigSchema.safeParse(body.config);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid config", details: parsed.error.flatten() }, { status: 400 });
  }

  const config = parsed.data;

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
