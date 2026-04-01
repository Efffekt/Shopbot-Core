import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyWebhookHmac } from "@/lib/shopify";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/shopify/webhooks/app-uninstalled");

export async function POST(request: NextRequest) {
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) {
    return NextResponse.json({ error: "Missing HMAC" }, { status: 401 });
  }

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    log.error("Missing SHOPIFY_API_SECRET");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const valid = await verifyWebhookHmac(rawBody, hmacHeader, secret);
  if (!valid) {
    log.warn("Invalid webhook HMAC");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const shopDomain = body.myshopify_domain as string;

  if (!shopDomain) {
    log.warn("Missing myshopify_domain in webhook body");
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  // Mark installation as uninstalled
  const { data: install } = await supabaseAdmin
    .from("shopify_installations")
    .select("id, tenant_id")
    .eq("shop_domain", shopDomain)
    .is("uninstalled_at", null)
    .single();

  if (install) {
    await supabaseAdmin
      .from("shopify_installations")
      .update({ uninstalled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", install.id);

    logAudit({
      actorEmail: shopDomain,
      action: "shopify_uninstall",
      entityType: "tenant",
      entityId: install.tenant_id,
      details: { shop: shopDomain },
    });

    log.info("App uninstalled", { shop: shopDomain, tenantId: install.tenant_id });
  } else {
    log.warn("No active installation found for uninstall webhook", { shop: shopDomain });
  }

  return NextResponse.json({ received: true });
}
