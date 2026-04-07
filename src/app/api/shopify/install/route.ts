import { NextRequest, NextResponse } from "next/server";
import { getShopifyConfig, isValidShopDomain } from "@/lib/shopify";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/shopify/install");

export async function GET(request: NextRequest) {
  let shop = request.nextUrl.searchParams.get("shop")?.trim().toLowerCase() || "";

  // Allow bare store names (e.g. "preik-test") — append .myshopify.com
  if (shop && !shop.includes(".")) {
    shop = `${shop}.myshopify.com`;
  }
  // Strip trailing slashes and protocol if pasted as full URL
  shop = shop.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: "Missing or invalid shop parameter. Expected format: your-store.myshopify.com" },
      { status: 400 }
    );
  }

  const { apiKey, scopes, appUrl } = getShopifyConfig();
  const nonce = crypto.randomUUID();
  const redirectUri = `${appUrl}/api/shopify/callback`;

  const installUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  installUrl.searchParams.set("client_id", apiKey);
  installUrl.searchParams.set("scope", scopes);
  installUrl.searchParams.set("redirect_uri", redirectUri);
  installUrl.searchParams.set("state", nonce);

  log.info("Initiating Shopify OAuth", { shop });

  const response = NextResponse.redirect(installUrl.toString());

  // Store nonce in a short-lived HttpOnly cookie for validation in callback
  response.cookies.set("shopify_nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/shopify/callback",
    maxAge: 600, // 10 minutes
  });

  return response;
}
