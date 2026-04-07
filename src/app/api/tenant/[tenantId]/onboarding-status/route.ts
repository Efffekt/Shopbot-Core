import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: access } = await supabaseAdmin
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Run all checks in parallel
  const [tenantResult, docsResult, promptResult, widgetResult, shopifyResult] = await Promise.all([
    supabaseAdmin.from("tenants").select("allowed_domains, widget_first_seen_at, widget_first_seen_domain").eq("id", tenantId).single(),
    supabaseAdmin.from("documents").select("id", { count: "exact", head: true }).eq("store_id", tenantId),
    supabaseAdmin.from("tenant_prompts").select("id").eq("tenant_id", tenantId).limit(1),
    supabaseAdmin.from("widget_config").select("tenant_id").eq("tenant_id", tenantId).limit(1),
    supabaseAdmin.from("shopify_installations").select("id").eq("tenant_id", tenantId).is("uninstalled_at", null).limit(1),
  ]);

  const domains = (tenantResult.data?.allowed_domains || []).filter(
    (d: string) => !d.includes("localhost") && !d.includes("127.0.0.1")
  );

  const widgetDetected = !!tenantResult.data?.widget_first_seen_at;
  const hasShopify = (shopifyResult.data?.length ?? 0) > 0;

  const steps = {
    domainsAdded: domains.length > 0,
    contentAdded: (docsResult.count ?? 0) > 0,
    promptConfigured: (promptResult.data?.length ?? 0) > 0,
    widgetCustomized: (widgetResult.data?.length ?? 0) > 0,
    widgetInstalled: widgetDetected || hasShopify,
  };

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;

  return NextResponse.json({
    steps,
    completedCount,
    totalSteps,
    widgetFirstSeenAt: tenantResult.data?.widget_first_seen_at || null,
    widgetFirstSeenDomain: tenantResult.data?.widget_first_seen_domain || null,
  }, {
    headers: { "Cache-Control": "private, max-age=15" },
  });
}
