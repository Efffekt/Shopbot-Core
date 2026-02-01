import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: promptData } = await supabase
    .from("tenant_prompts")
    .select("system_prompt, version, updated_at")
    .eq("tenant_id", tenantId)
    .single();

  const config = TENANT_CONFIGS[tenantId];
  const fallbackPrompt = config?.systemPrompt || "";

  return NextResponse.json({
    systemPrompt: promptData?.system_prompt || fallbackPrompt,
    version: promptData?.version || 0,
    updatedAt: promptData?.updated_at || null,
    isCustom: !!promptData,
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access || access.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - Admin role required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { systemPrompt } = body;

  if (typeof systemPrompt !== "string" || systemPrompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Invalid system prompt" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("tenant_prompts")
    .select("id, version")
    .eq("tenant_id", tenantId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("tenant_prompts")
      .update({
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
        version: existing.version + 1,
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating prompt:", error);
      return NextResponse.json(
        { error: "Failed to update prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: existing.version + 1,
    });
  } else {
    const { error } = await supabase.from("tenant_prompts").insert({
      tenant_id: tenantId,
      system_prompt: systemPrompt,
      updated_by: user.id,
      version: 1,
    });

    if (error) {
      console.error("Error creating prompt:", error);
      return NextResponse.json(
        { error: "Failed to create prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: 1,
    });
  }
}
