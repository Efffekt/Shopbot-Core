import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/widget/verify-install");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const storeId = body.storeId as string;
    const domain = body.domain as string;

    if (!storeId || typeof storeId !== "string" || storeId.length > 100) {
      return NextResponse.json({ error: "Invalid storeId" }, { status: 400, headers: CORS_HEADERS });
    }

    // Check if already recorded
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("widget_first_seen_at")
      .eq("id", storeId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Unknown store" }, { status: 404, headers: CORS_HEADERS });
    }

    // Only record the first detection
    if (!tenant.widget_first_seen_at) {
      const cleanDomain = (domain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").slice(0, 253);

      await supabaseAdmin
        .from("tenants")
        .update({
          widget_first_seen_at: new Date().toISOString(),
          widget_first_seen_domain: cleanDomain || null,
        })
        .eq("id", storeId);

      log.info("Widget first detected", { storeId, domain: cleanDomain });
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }
}
