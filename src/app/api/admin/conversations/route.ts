import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { safeParseInt } from "@/lib/params";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/conversations");

// GET - List conversations with filters
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const search = searchParams.get("search")?.trim().slice(0, 200);
    const intent = searchParams.get("intent");
    const wasHandled = searchParams.get("wasHandled");
    const page = safeParseInt(searchParams.get("page"), 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("conversations")
      .select("*", { count: "exact" });

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.ilike("user_query", `%${escaped}%`);
    }

    if (intent && intent !== "all") {
      query = query.eq("detected_intent", intent);
    }

    if (wasHandled === "true") {
      query = query.eq("was_handled", true);
    } else if (wasHandled === "false") {
      query = query.eq("was_handled", false);
    }

    const { data: conversations, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error("Error fetching conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    return NextResponse.json({
      conversations: conversations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    log.error("Error in conversations API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
