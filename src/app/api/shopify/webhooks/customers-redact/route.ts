import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookHmac } from "@/lib/shopify";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/shopify/webhooks/customers-redact");

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

  // No personally identifiable customer data is stored by the chat widget.
  // Anonymous session IDs cannot be linked to Shopify customer records.
  log.info("Customer redact request received", {
    shop: body.shop_domain,
    customer: body.customer?.email,
  });

  return NextResponse.json({ received: true });
}
