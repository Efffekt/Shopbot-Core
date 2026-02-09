import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/tenants/prompt");

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

// GET - Fetch tenant prompt
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    const { data: prompt, error } = await supabaseAdmin
      .from("tenant_prompts")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      log.error("Error fetching prompt:", error);
      return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
    }

    return NextResponse.json({ prompt: prompt || null });
  } catch (error) {
    log.error("Error fetching prompt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Upsert tenant prompt
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > 64_000) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  try {
    const body = await request.json();
    const { system_prompt } = body;

    if (!system_prompt || typeof system_prompt !== "string") {
      return NextResponse.json({ error: "system_prompt is required" }, { status: 400 });
    }

    if (system_prompt.length > 50_000) {
      return NextResponse.json({ error: "System prompt too long (max 50,000 characters)" }, { status: 400 });
    }

    // Check if prompt exists
    const { data: existing } = await supabaseAdmin
      .from("tenant_prompts")
      .select("id, version")
      .eq("tenant_id", tenantId)
      .single();

    if (existing) {
      // Update existing
      const { data: prompt, error } = await supabaseAdmin
        .from("tenant_prompts")
        .update({
          system_prompt,
          version: (existing.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        log.error("Error updating prompt:", error);
        return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
      }

      await logAudit({ actorEmail: "super-admin", action: "update", entityType: "tenant_prompt", entityId: tenantId });
      return NextResponse.json({ prompt });
    } else {
      // Create new
      const { data: prompt, error } = await supabaseAdmin
        .from("tenant_prompts")
        .insert({
          tenant_id: tenantId,
          system_prompt,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        log.error("Error creating prompt:", error);
        return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
      }

      await logAudit({ actorEmail: "super-admin", action: "create", entityType: "tenant_prompt", entityId: tenantId });
      return NextResponse.json({ prompt }, { status: 201 });
    }
  } catch (error) {
    log.error("Error upserting prompt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
