import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/tenant/export");

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

// GDPR data export — tenant self-service export of their own data
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: access } = await supabase
      .from("tenant_user_access")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .single();

    if (!access || access.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    // Fetch all tenant data in parallel
    const [tenant, conversations, documents, prompts, credits, widgetConfig] = await Promise.all([
      supabaseAdmin.from("tenants").select("*").eq("id", tenantId).single(),
      supabaseAdmin.from("conversations").select("*").eq("store_id", tenantId).order("created_at", { ascending: false }),
      supabaseAdmin.from("documents").select("id, store_id, content, metadata, created_at").eq("store_id", tenantId),
      supabaseAdmin.from("tenant_prompts").select("*").eq("tenant_id", tenantId),
      supabaseAdmin.from("credit_usage_log").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabaseAdmin.from("widget_config").select("*").eq("tenant_id", tenantId),
    ]);

    if (tenant.error || !tenant.data) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      tenant: tenant.data,
      conversations: conversations.data || [],
      documents: (documents.data || []).map((d) => ({
        id: d.id,
        content: d.content,
        metadata: d.metadata,
        created_at: d.created_at,
      })),
      prompts: prompts.data || [],
      creditUsage: credits.data || [],
      widgetConfig: widgetConfig.data?.[0]?.config || null,
    };

    logAudit({
      actorEmail: user.email || user.id,
      action: "tenant.export",
      entityType: "tenant",
      entityId: tenantId,
      details: {
        conversations: (conversations.data || []).length,
        documents: (documents.data || []).length,
      },
    });

    const safeTenantId = tenantId.replace(/[^a-z0-9-]/gi, "_");
    const filename = `preik-export-${safeTenantId}-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    log.error("Unexpected error exporting tenant data:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
