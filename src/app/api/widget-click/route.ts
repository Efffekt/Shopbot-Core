import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/widget-click");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Rate limit: 30 clicks per minute per IP (prevent abuse)
const CLICK_RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rateLimit = await checkRateLimit(`wclick:${ip}`, CLICK_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "60" } }
      );
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 4_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { storeId, sessionId, url, linkText, page, timestamp, messageCount } = body;

    // Basic validation
    if (!storeId || typeof storeId !== "string" || storeId.length > 100) {
      return NextResponse.json({ error: "Invalid storeId" }, { status: 400, headers: CORS_HEADERS });
    }
    if (!url || typeof url !== "string" || url.length > 2000) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400, headers: CORS_HEADERS });
    }

    // Store the click event
    const { error } = await supabaseAdmin.from("widget_link_clicks").insert({
      store_id: storeId,
      session_id: sessionId?.slice(0, 50) || null,
      clicked_url: url.slice(0, 2000),
      link_text: linkText?.slice(0, 500) || null,
      page_url: page?.slice(0, 2000) || null,
      client_timestamp: timestamp || null,
      message_count: typeof messageCount === "number" ? messageCount : null,
      ip_hash: await hashIp(ip),
    });

    if (error) {
      log.error("Failed to store click event:", error);
      return NextResponse.json({ error: "Failed to store" }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    log.error("Unexpected error in widget-click:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Hash IP for privacy — we don't store raw IPs, just detect duplicates
async function hashIp(ip: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + "preik-salt-2026");
    const hash = await crypto.subtle.digest("SHA-256", data);
    const arr = Array.from(new Uint8Array(hash));
    return arr.slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "unknown";
  }
}
