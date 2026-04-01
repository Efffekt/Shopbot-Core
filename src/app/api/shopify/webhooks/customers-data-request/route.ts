import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookHmac } from "@/lib/shopify";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/shopify/webhooks/customers-data-request");

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

  // The chat widget uses anonymous session IDs, not Shopify customer IDs.
  // No personally identifiable customer data is stored that can be linked
  // back to a specific Shopify customer. Log the request for compliance.
  log.info("Customer data request received", {
    shop: body.shop_domain,
    customer: body.customer?.email,
    ordersRequested: body.orders_requested?.length || 0,
  });

  return NextResponse.json({ received: true });
}
