import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/settings");

// Only these keys can be set via the API
const ALLOWED_SETTING_KEYS = new Set([
  "hero_title",
  "hero_subtitle",
  "hero_cta",
  "pricing_starter",
  "pricing_pro",
  "pricing_enterprise",
  "contact_email",
  "contact_phone",
  "footer_text",
]);

// GET - Return all site settings as { settings: { key: value, ... } }
export async function GET() {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value");

    if (error) {
      log.error("Failed to fetch site settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    for (const row of rows || []) {
      settings[row.key] = row.value ?? "";
    }

    return NextResponse.json({ settings }, {
      headers: { "Cache-Control": "private, max-age=600, stale-while-revalidate=300" },
    });
  } catch (error) {
    log.error("Error fetching site settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Upsert settings from { settings: { key: value, ... } }
export async function PUT(request: NextRequest) {
  const { authorized, error: authError, email } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { settings } = body as { settings?: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Request body must include a settings object" },
        { status: 400 }
      );
    }

    // Filter to allowed keys only
    const validEntries = Object.entries(settings).filter(([key]) => ALLOWED_SETTING_KEYS.has(key));
    if (validEntries.length === 0) {
      return NextResponse.json({ error: "No valid setting keys provided" }, { status: 400 });
    }

    const rows = validEntries.map(([key, value]) => ({
      key,
      value: value ?? "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      log.error("Failed to upsert site settings:", error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    await logAudit({
      actorEmail: email || "unknown",
      action: "update",
      entityType: "site_settings",
      details: { changedKeys: validEntries.map(([key]) => key) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error saving site settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
