import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyWebhookHmac } from "@/lib/shopify";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/shopify/webhooks/shop-redact");

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
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const shopDomain = body.shop_domain as string;

  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop_domain" }, { status: 400 });
  }

  // Find the installation and delete all associated data
  const { data: install } = await supabaseAdmin
    .from("shopify_installations")
    .select("id, tenant_id")
    .eq("shop_domain", shopDomain)
    .single();

  if (install) {
    // Delete conversations for this tenant
    await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("store_id", install.tenant_id);

    // Delete widget link clicks
    await supabaseAdmin
      .from("widget_link_clicks")
      .delete()
      .eq("store_id", install.tenant_id);

    // Delete the Shopify installation record
    await supabaseAdmin
      .from("shopify_installations")
      .delete()
      .eq("id", install.id);

    logAudit({
      actorEmail: shopDomain,
      action: "shopify_shop_redact",
      entityType: "tenant",
      entityId: install.tenant_id,
      details: { shop: shopDomain },
    });

    log.info("Shop data redacted", { shop: shopDomain, tenantId: install.tenant_id });
  } else {
    log.warn("No installation found for shop redact", { shop: shopDomain });
  }

  return NextResponse.json({ received: true });
}
