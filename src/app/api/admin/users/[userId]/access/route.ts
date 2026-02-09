import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const deleteAccessSchema = z.object({
  tenantId: z.string().min(1),
});

const log = createLogger("api/admin/users/access");

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// DELETE - Remove user's access to a tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { authorized, error: authError, email } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const body = await request.json();
    const parsed = deleteAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { tenantId } = parsed.data;

    const { error } = await supabaseAdmin
      .from("tenant_user_access")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);

    if (error) {
      log.error("Error removing user access:", error);
      return NextResponse.json({ error: "Failed to remove access" }, { status: 500 });
    }

    await logAudit({
      actorEmail: email || "unknown",
      action: "delete",
      entityType: "tenant_user_access",
      entityId: userId,
      details: { tenantId },
    });

    return NextResponse.json({ success: true, message: "Tilgang fjernet" });
  } catch (error) {
    log.error("Error in user access removal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
