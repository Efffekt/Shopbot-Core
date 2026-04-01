import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getShopifyConfig,
  isValidShopDomain,
  verifyHmac,
  exchangeCodeForToken,
  setTenantMetafield,
  getShopInfo,
  registerWebhooks,
} from "@/lib/shopify";
import { slugify } from "@/lib/slugify";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/shopify/callback");

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { code, shop, state, hmac } = params;

  // ── Validate required params ─────────────────────────────────────────
  if (!code || !shop || !state || !hmac) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
  }

  // ── Verify nonce (CSRF protection) ───────────────────────────────────
  const storedNonce = request.cookies.get("shopify_nonce")?.value;
  if (!storedNonce || storedNonce !== state) {
    log.warn("Nonce mismatch", { shop });
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 403 });
  }

  // ── Verify HMAC ──────────────────────────────────────────────────────
  const { apiSecret, appUrl } = getShopifyConfig();
  const isValid = await verifyHmac(params, apiSecret);
  if (!isValid) {
    log.warn("HMAC verification failed", { shop });
    return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 403 });
  }

  // ── Exchange code for access token ───────────────────────────────────
  let accessToken: string;
  let scopes: string;
  try {
    const result = await exchangeCodeForToken(shop, code);
    accessToken = result.access_token;
    scopes = result.scope;
  } catch (err) {
    log.error("Token exchange failed", err);
    return NextResponse.json({ error: "Failed to complete installation" }, { status: 500 });
  }

  // ── Fetch shop info ──────────────────────────────────────────────────
  let shopInfo: { name: string; email: string; domain: string; myshopify_domain: string };
  try {
    shopInfo = await getShopInfo(shop, accessToken);
  } catch (err) {
    log.error("Failed to fetch shop info", err);
    return NextResponse.json({ error: "Failed to fetch shop info" }, { status: 500 });
  }

  // ── Check for existing installation (reinstall case) ─────────────────
  const { data: existingInstall } = await supabaseAdmin
    .from("shopify_installations")
    .select("id, tenant_id, uninstalled_at")
    .eq("shop_domain", shop)
    .single();

  let tenantId: string;

  if (existingInstall) {
    // Reinstall: reactivate existing installation
    tenantId = existingInstall.tenant_id;

    await supabaseAdmin
      .from("shopify_installations")
      .update({
        access_token: accessToken,
        scopes,
        uninstalled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingInstall.id);

    log.info("Shopify reinstall", { shop, tenantId });
  } else {
    // New install: provision tenant
    let tenantSlug = slugify(shopInfo.name || shop.replace(".myshopify.com", ""));

    // Handle slug collisions
    const { data: existing } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("id", tenantSlug)
      .single();

    if (existing) {
      const suffix = Math.random().toString(36).substring(2, 6);
      tenantSlug = `${tenantSlug}-${suffix}`;
      log.warn("Tenant slug collision, using suffix", { original: slugify(shopInfo.name), final: tenantSlug });
    }

    tenantId = tenantSlug;

    // Create tenant with starter-level free trial credits
    const { error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        id: tenantId,
        name: shopInfo.name,
        allowed_domains: [shopInfo.domain, shop].filter(Boolean),
        language: "no",
        persona: "",
        contact_email: shopInfo.email,
        credit_limit: 100, // Free trial credits
        credits_used: 0,
        billing_cycle_start: new Date().toISOString(),
        stripe_customer_id: "",
        stripe_subscription_id: "",
        stripe_plan: "",
        features: {
          synonymMapping: false,
          codeBlockFormatting: false,
        },
      });

    if (tenantError) {
      log.error("Failed to create tenant", tenantError);
      return NextResponse.json({ error: "Failed to provision tenant" }, { status: 500 });
    }

    // Create shopify_installations row
    const { error: installError } = await supabaseAdmin
      .from("shopify_installations")
      .insert({
        tenant_id: tenantId,
        shop_domain: shop,
        access_token: accessToken,
        scopes,
      });

    if (installError) {
      log.error("Failed to create Shopify installation record", installError);
      return NextResponse.json({ error: "Failed to save installation" }, { status: 500 });
    }

    log.info("New Shopify tenant provisioned", { shop, tenantId });
  }

  // ── Write tenant ID metafield (for Theme App Extension) ──────────────
  try {
    await setTenantMetafield(shop, accessToken, tenantId);
  } catch (err) {
    log.warn("Metafield write failed (non-fatal)", { error: String(err) });
  }

  // ── Register webhooks ────────────────────────────────────────────────
  try {
    await registerWebhooks(shop, accessToken, appUrl);
  } catch (err) {
    log.warn("Webhook registration failed (non-fatal)", { error: String(err) });
  }

  // ── Audit log ────────────────────────────────────────────────────────
  logAudit({
    actorEmail: shopInfo.email || shop,
    action: existingInstall ? "shopify_reinstall" : "shopify_install",
    entityType: "tenant",
    entityId: tenantId,
    details: { shop, scopes },
  });

  // ── Redirect to dashboard ────────────────────────────────────────────
  const dashboardUrl = `${appUrl}/dashboard/${tenantId}?shopify=installed`;
  const response = NextResponse.redirect(dashboardUrl);

  // Clear the nonce cookie
  response.cookies.delete("shopify_nonce");

  return response;
}
