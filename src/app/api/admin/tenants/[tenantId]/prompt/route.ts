import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

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
      console.error("Error fetching prompt:", error);
      return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
    }

    return NextResponse.json({ prompt: prompt || null });
  } catch (error) {
    console.error("Error fetching prompt:", error);
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

  try {
    const body = await request.json();
    const { system_prompt } = body;

    if (!system_prompt || typeof system_prompt !== "string") {
      return NextResponse.json({ error: "system_prompt is required" }, { status: 400 });
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
        console.error("Error updating prompt:", error);
        return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
      }

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
        console.error("Error creating prompt:", error);
        return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
      }

      return NextResponse.json({ prompt }, { status: 201 });
    }
  } catch (error) {
    console.error("Error upserting prompt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
