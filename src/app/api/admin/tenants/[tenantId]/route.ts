import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { resetCredits } from "@/lib/credits";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const patchTenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  allowed_domains: z.array(z.string().max(253)).optional(),
  language: z.string().max(10).optional(),
  persona: z.string().max(500).optional(),
  credit_limit: z.number().int().min(0).optional(),
  features: z.record(z.string(), z.boolean()).optional(),
});

const log = createLogger("api/admin/tenants/[tenantId]");

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
      log.error("Failed to fetch tenant access:", accessError);
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

    return NextResponse.json({ tenant, users }, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    log.error("Error fetching tenant:", error);
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
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 64_000) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = patchTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { name, allowed_domains, language, persona, credit_limit, features } = parsed.data;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (allowed_domains !== undefined) updates.allowed_domains = allowed_domains;
    if (language !== undefined) updates.language = language;
    if (persona !== undefined) updates.persona = persona;
    if (credit_limit !== undefined) updates.credit_limit = credit_limit;
    if (features !== undefined) updates.features = features;

    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .update(updates)
      .eq("id", tenantId)
      .select()
      .single();

    if (error) {
      log.error("Failed to update tenant:", error);
      return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
    }

    await logAudit({ actorEmail: "super-admin", action: "update", entityType: "tenant", entityId: tenantId, details: { updatedFields: Object.keys(updates) } });

    return NextResponse.json({ tenant });
  } catch (error) {
    log.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Actions (reset credits)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { authorized, email: actorEmail, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const { action } = body;

    if (action === "reset_credits") {
      const success = await resetCredits(tenantId);
      if (!success) {
        return NextResponse.json({ error: "Failed to reset credits" }, { status: 500 });
      }
      logAudit({ actorEmail: actorEmail!, action: "reset_credits", entityType: "tenant", entityId: tenantId });
      return NextResponse.json({ success: true, message: "Credits reset successfully" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    log.error("Error performing tenant action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Verify super admin access
  const { authorized, email: actorEmail, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    // Delete all related data before deleting tenant
    await supabaseAdmin
      .from("tenant_user_access")
      .delete()
      .eq("tenant_id", tenantId);

    await supabaseAdmin
      .from("tenant_prompts")
      .delete()
      .eq("tenant_id", tenantId);

    await supabaseAdmin
      .from("documents")
      .delete()
      .eq("store_id", tenantId);

    await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("store_id", tenantId);

    await supabaseAdmin
      .from("credit_usage_log")
      .delete()
      .eq("tenant_id", tenantId);

    // Delete tenant
    const { error } = await supabaseAdmin
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (error) {
      log.error("Failed to delete tenant:", error);
      return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
    }

    logAudit({ actorEmail: actorEmail!, action: "delete", entityType: "tenant", entityId: tenantId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
