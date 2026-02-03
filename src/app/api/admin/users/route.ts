import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

// POST - Create a new user and grant tenant access
export async function POST(request: NextRequest) {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, tenantId, role } = body;

    if (!email || !password || !tenantId) {
      return NextResponse.json(
        { error: "Email, password, and tenantId are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Failed to create user:", authError);
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "User already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
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
      // Don't fail - user is created, just access grant failed
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: authData.user.email,
      },
      message: "User created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
