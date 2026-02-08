import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

// GET - List all users with their tenant memberships
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Get all auth users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
    }

    // Get all tenant access records
    const { data: allAccess } = await supabaseAdmin
      .from("tenant_user_access")
      .select("user_id, tenant_id, role");

    // Get all tenants for name lookup
    const { data: allTenants } = await supabaseAdmin
      .from("tenants")
      .select("id, name");

    const tenantMap = new Map((allTenants || []).map(t => [t.id, t.name]));

    let users = authUsers.users.map(u => ({
      id: u.id,
      email: u.email || "",
      created_at: u.created_at,
      memberships: (allAccess || [])
        .filter(a => a.user_id === u.id)
        .map(a => ({
          tenant_id: a.tenant_id,
          tenant_name: tenantMap.get(a.tenant_id) || a.tenant_id,
          role: a.role,
        })),
    }));

    if (search) {
      users = users.filter(u => u.email.toLowerCase().includes(search));
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Invite a new user and grant tenant access
export async function POST(request: NextRequest) {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, tenantId, role } = body;

    if (!email || !tenantId) {
      return NextResponse.json(
        { error: "Email and tenantId are required" },
        { status: 400 }
      );
    }

    // Build redirect URL from request origin
    const origin = request.headers.get("origin") || "https://preik.ai";

    // Invite user via Supabase Auth — sends magic link email through configured SMTP
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${origin}/tilbakestill-passord` }
    );

    if (inviteError) {
      console.error("Failed to invite user:", inviteError);
      if (inviteError.message.includes("already been registered")) {
        return NextResponse.json({ error: "User already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // Grant access to tenant
    const { error: accessError } = await supabaseAdmin
      .from("tenant_user_access")
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role: role || "admin",
      });

    if (accessError) {
      console.error("Failed to grant tenant access:", accessError);
      // Don't fail - user is invited, just access grant failed
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: authData.user.email,
      },
      message: "Invitation sent",
    }, { status: 201 });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
