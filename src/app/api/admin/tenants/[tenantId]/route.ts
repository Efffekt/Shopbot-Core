import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

// GET - Get single tenant with users
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    // Get tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get users with access to this tenant
    const { data: access, error: accessError } = await supabaseAdmin
      .from("tenant_user_access")
      .select("user_id, role")
      .eq("tenant_id", tenantId);

    if (accessError) {
      console.error("Failed to fetch tenant access:", accessError);
    }

    // Get user emails for each user_id
    const userIds = (access || []).map((a) => a.user_id);
    let users: { id: string; email: string; role: string }[] = [];

    if (userIds.length > 0) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (!authError && authUsers) {
        users = authUsers.users
          .filter((u) => userIds.includes(u.id))
          .map((u) => ({
            id: u.id,
            email: u.email || "",
            role: access?.find((a) => a.user_id === u.id)?.role || "viewer",
          }));
      }
    }

    return NextResponse.json({ tenant, users });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update tenant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    const body = await request.json();
    const { name, allowed_domains, language, persona } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (allowed_domains !== undefined) updates.allowed_domains = allowed_domains;
    if (language !== undefined) updates.language = language;
    if (persona !== undefined) updates.persona = persona;

    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .update(updates)
      .eq("id", tenantId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update tenant:", error);
      return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    // Delete tenant access first
    await supabaseAdmin
      .from("tenant_user_access")
      .delete()
      .eq("tenant_id", tenantId);

    // Delete tenant prompts
    await supabaseAdmin
      .from("tenant_prompts")
      .delete()
      .eq("tenant_id", tenantId);

    // Delete tenant
    const { error } = await supabaseAdmin
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (error) {
      console.error("Failed to delete tenant:", error);
      return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
