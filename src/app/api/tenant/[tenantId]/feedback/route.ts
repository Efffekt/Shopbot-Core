import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/tenant/feedback");

const VALID_CATEGORIES = ["feil_svar", "manglende_info", "feil_lenke", "annet"] as const;

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

async function verifyTenantAccess(userId: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .single();
  return !!access;
}

/**
 * GET - Fetch feedback for specific conversation IDs or all tenant feedback
 * Query params: ?conversationIds=id1,id2,id3
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyTenantAccess(user.id, tenantId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const conversationIds = searchParams.get("conversationIds");

    let query = supabaseAdmin
      .from("conversation_feedback")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (conversationIds) {
      const ids = conversationIds.split(",").filter(Boolean).slice(0, 100);
      if (ids.length === 0) {
        return NextResponse.json({ feedback: [] });
      }
      query = query.in("conversation_id", ids);
    }

    const { data: feedback, error } = await query;

    if (error) {
      log.error("Error fetching feedback:", error);
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    return NextResponse.json({ feedback: feedback || [] });
  } catch (error) {
    log.error("Error in tenant feedback GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST - Submit feedback for a conversation
 * Body: { conversationId, category, comment }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyTenantAccess(user.id, tenantId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { conversationId, category, comment } = body;

    // Validate required fields
    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }
    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return NextResponse.json({ error: "comment is required" }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify conversation belongs to this tenant
    const { data: conversation } = await supabaseAdmin
      .from("conversations")
      .select("id, store_id")
      .eq("id", conversationId)
      .single();

    if (!conversation || conversation.store_id !== tenantId) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check for duplicate feedback from this user on this conversation
    const { data: existing } = await supabaseAdmin
      .from("conversation_feedback")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("created_by", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Du har allerede gitt tilbakemelding på denne samtalen" },
        { status: 409 }
      );
    }

    const { data: feedback, error } = await supabaseAdmin
      .from("conversation_feedback")
      .insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        created_by: user.id,
        created_by_email: user.email || "unknown",
        category,
        comment: comment.trim().slice(0, 2000),
      })
      .select()
      .single();

    if (error) {
      log.error("Error creating feedback:", error);
      return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
    }

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    log.error("Error in tenant feedback POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
