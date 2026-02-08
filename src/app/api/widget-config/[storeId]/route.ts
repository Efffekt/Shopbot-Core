import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/ratelimit";

interface RouteParams {
  params: Promise<{ storeId: string }>;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
};

// Rate limit: 60 requests per minute per IP (generous — widget loads once per page view)
const WIDGET_CONFIG_LIMIT = { maxRequests: 60, windowMs: 60_000 };

// Public endpoint — no auth. Widget fetches this on init.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { storeId } = await params;

  if (!storeId || storeId.length > 100) {
    return NextResponse.json({ config: null }, { headers: CORS_HEADERS });
  }

  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkRateLimit(`widgetcfg:${ip}`, WIDGET_CONFIG_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { config: null },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "60" } }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("widget_config")
    .select("config")
    .eq("tenant_id", storeId)
    .single();

  if (error || !data) {
    return NextResponse.json({ config: null }, { headers: CORS_HEADERS });
  }

  return NextResponse.json({ config: data.config }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
