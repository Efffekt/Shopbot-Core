import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/my-tenants");

// GET - List all tenants for admin panel (any admin can view analytics)
export async function GET() {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name")
      .order("name");

    if (error) {
      log.error("Failed to fetch tenants:", error);
      return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }

    return NextResponse.json({ tenants: tenants || [] });
  } catch (error) {
    log.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
