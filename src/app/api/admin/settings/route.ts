import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

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
      console.error("Failed to fetch site settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    for (const row of rows || []) {
      settings[row.key] = row.value ?? "";
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Upsert settings from { settings: { key: value, ... } }
export async function PUT(request: NextRequest) {
  const { authorized, error: authError } = await verifyAdmin();
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

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value ?? "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      console.error("Failed to upsert site settings:", error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving site settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
