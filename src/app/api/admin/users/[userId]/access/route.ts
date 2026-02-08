import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// DELETE - Remove user's access to a tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("tenant_user_access")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Error removing user access:", error);
      return NextResponse.json({ error: "Failed to remove access" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tilgang fjernet" });
  } catch (error) {
    console.error("Error in user access removal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
