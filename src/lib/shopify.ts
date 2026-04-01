import { createLogger } from "./logger";

const log = createLogger("lib/shopify");

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing ${name} environment variable`);
  return val;
}

export function getShopifyConfig() {
  return {
    apiKey: requireEnv("SHOPIFY_API_KEY"),
    apiSecret: requireEnv("SHOPIFY_API_SECRET"),
    scopes: process.env.SHOPIFY_SCOPES || "",
    appUrl: requireEnv("SHOPIFY_APP_URL"),
  };
}

// ---------------------------------------------------------------------------
// Shop domain validation
// ---------------------------------------------------------------------------

const SHOP_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export function isValidShopDomain(shop: string): boolean {
  return SHOP_REGEX.test(shop);
}

// ---------------------------------------------------------------------------
// HMAC verification (OAuth callbacks + webhooks)
// ---------------------------------------------------------------------------

export async function verifyHmac(
  params: Record<string, string>,
  secret: string
): Promise<boolean> {
  const hmac = params.hmac;
  if (!hmac) return false;

  // Build the message from all params except hmac, sorted alphabetically
  const entries = Object.entries(params)
    .filter(([key]) => key !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b));
  const message = entries.map(([k, v]) => `${k}=${v}`).join("&");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const computed = Buffer.from(signature).toString("hex");

  // Timing-safe comparison
  if (computed.length !== hmac.length) return false;
  const a = encoder.encode(computed);
  const b = encoder.encode(hmac);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

export async function verifyWebhookHmac(
  rawBody: string,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = Buffer.from(signature).toString("base64");

  // Timing-safe comparison
  if (computed.length !== hmacHeader.length) return false;
  const a = encoder.encode(computed);
  const b = encoder.encode(hmacHeader);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// OAuth token exchange
// ---------------------------------------------------------------------------

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const { apiKey, apiSecret } = getShopifyConfig();

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    log.error("Token exchange failed", { shop, status: res.status, body: text });
    throw new Error(`Shopify token exchange failed: ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Admin API helpers
// ---------------------------------------------------------------------------

export async function shopifyAdminFetch(
  shop: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://${shop}/admin/api/2026-04/${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
      ...options.headers,
    },
  });
}

/** Write tenant ID as an app-owned metafield on the shop */
export async function setTenantMetafield(
  shop: string,
  accessToken: string,
  tenantId: string
): Promise<void> {
  const res = await shopifyAdminFetch(shop, accessToken, "metafields.json", {
    method: "POST",
    body: JSON.stringify({
      metafield: {
        namespace: "preik",
        key: "tenant_id",
        value: tenantId,
        type: "single_line_text_field",
        owner_resource: "shop",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    log.error("Failed to set tenant metafield", { shop, status: res.status, body: text });
    throw new Error(`Failed to set metafield: ${res.status}`);
  }

  log.info("Tenant metafield set", { shop, tenantId });
}

/** Fetch basic shop info from Shopify Admin API */
export async function getShopInfo(
  shop: string,
  accessToken: string
): Promise<{ name: string; email: string; domain: string; myshopify_domain: string }> {
  const res = await shopifyAdminFetch(shop, accessToken, "shop.json");

  if (!res.ok) {
    throw new Error(`Failed to fetch shop info: ${res.status}`);
  }

  const data = await res.json();
  return data.shop;
}

// ---------------------------------------------------------------------------
// Webhook registration
// ---------------------------------------------------------------------------

const REQUIRED_WEBHOOKS = [
  { topic: "app/uninstalled", path: "/api/shopify/webhooks/app-uninstalled" },
] as const;

export async function registerWebhooks(
  shop: string,
  accessToken: string,
  appUrl: string
): Promise<void> {
  for (const wh of REQUIRED_WEBHOOKS) {
    const res = await shopifyAdminFetch(shop, accessToken, "webhooks.json", {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          topic: wh.topic,
          address: `${appUrl}${wh.path}`,
          format: "json",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      log.warn("Webhook registration failed", { shop, topic: wh.topic, status: res.status, body: text });
    } else {
      log.info("Webhook registered", { shop, topic: wh.topic });
    }
  }
}
