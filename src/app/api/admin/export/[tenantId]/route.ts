import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

// GDPR data export — exports all tenant data as JSON
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await verifySuperAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { tenantId } = await params;

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
    exportedBy: auth.email,
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

  // Log the export action
  logAudit({
    actorEmail: auth.email!,
    action: "tenant.export",
    entityType: "tenant",
    entityId: tenantId,
    details: {
      conversations: (conversations.data || []).length,
      documents: (documents.data || []).length,
    },
  });

  const filename = `preik-export-${tenantId}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
