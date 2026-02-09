import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { sendWelcomeEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/tenants");

// GET - List all tenants
export async function GET() {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      log.error("Failed to fetch tenants:", error);
      return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }

    return NextResponse.json({ tenants }, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    log.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new tenant
export async function POST(request: NextRequest) {
  // Verify super admin access
  const { authorized, email: actorEmail, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 64_000) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const body = await request.json();
    const { id, name, allowed_domains, language, persona, contact_email } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      );
    }

    // Validate ID format (lowercase, no spaces, alphanumeric with hyphens)
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: "ID must be lowercase alphanumeric with hyphens only" },
        { status: 400 }
      );
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        id,
        name,
        allowed_domains: allowed_domains || [],
        language: language || "no",
        persona: persona || "",
        contact_email: contact_email || null,
        features: {
          synonymMapping: false,
          codeBlockFormatting: false,
          boatExpertise: false,
        },
      })
      .select()
      .single();

    if (tenantError) {
      log.error("Failed to create tenant:", tenantError);
      if (tenantError.code === "23505") {
        return NextResponse.json({ error: "Tenant ID already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
    }

    // Send welcome email if contact email provided
    if (contact_email) {
      sendWelcomeEmail({
        tenantName: name,
        contactEmail: contact_email,
        tenantId: id,
      }).catch((err) => {
        log.warn("Failed to send welcome email", { error: err as Error });
      });
    }

    logAudit({ actorEmail: actorEmail!, action: "create", entityType: "tenant", entityId: id, details: { name } });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    log.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
