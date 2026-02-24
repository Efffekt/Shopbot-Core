import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { safeParseInt } from "@/lib/params";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/feedback");

const VALID_STATUSES = ["new", "reviewed", "resolved"] as const;
const VALID_CATEGORIES = ["feil_svar", "manglende_info", "feil_lenke", "annet"] as const;

/**
 * GET - Paginated list of all feedback tickets with filters
 * Query params: status, category, tenantId, page, limit
 */
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const tenantId = searchParams.get("tenantId");
    const page = safeParseInt(searchParams.get("page"), 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("conversation_feedback")
      .select("*", { count: "exact" });

    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      query = query.eq("status", status);
    }
    if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      query = query.eq("category", category);
    }
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: tickets, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error("Error fetching feedback tickets:", error);
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        tickets: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Batch-fetch related conversations and tenant names (avoid N+1)
    const conversationIds = [...new Set(tickets.map((t) => t.conversation_id))];
    const tenantIds = [...new Set(tickets.map((t) => t.tenant_id))];

    const [conversationsResult, tenantsResult] = await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("id, user_query, ai_response, created_at, detected_intent, was_handled")
        .in("id", conversationIds),
      supabaseAdmin
        .from("tenants")
        .select("id, name")
        .in("id", tenantIds),
    ]);

    const conversationMap = new Map(
      (conversationsResult.data || []).map((c) => [c.id, c])
    );
    const tenantMap = new Map(
      (tenantsResult.data || []).map((t) => [t.id, t.name])
    );

    const enrichedTickets = tickets.map((ticket) => ({
      ...ticket,
      conversation: conversationMap.get(ticket.conversation_id) || null,
      tenant_name: tenantMap.get(ticket.tenant_id) || null,
    }));

    return NextResponse.json({
      tickets: enrichedTickets,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    log.error("Error in admin feedback GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH - Update feedback ticket status and/or admin note
 * Body: { id, status, adminNote? }
 */
export async function PATCH(request: NextRequest) {
  const { authorized, email, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, adminNote } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNote !== undefined) {
      updates.admin_note = typeof adminNote === "string" ? adminNote.trim().slice(0, 2000) : null;
    }

    const { data: ticket, error } = await supabaseAdmin
      .from("conversation_feedback")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log.error("Error updating feedback:", error);
      return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Log to audit trail
    await supabaseAdmin.from("audit_log").insert({
      actor_email: email,
      action: `feedback.${status}`,
      entity_type: "feedback",
      entity_id: id,
      details: {
        tenant_id: ticket.tenant_id,
        conversation_id: ticket.conversation_id,
        ...(adminNote ? { admin_note: adminNote.slice(0, 200) } : {}),
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    log.error("Error in admin feedback PATCH:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
