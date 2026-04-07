import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/tenant/shopify");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  // Verify user has access to this tenant
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: access } = await supabaseAdmin
    .from("tenant_user_access")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch Shopify installation status
  const { data: install } = await supabaseAdmin
    .from("shopify_installations")
    .select("shop_domain, installed_at, uninstalled_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!install) {
    return NextResponse.json({ shop_domain: null });
  }

  return NextResponse.json(install);
}
