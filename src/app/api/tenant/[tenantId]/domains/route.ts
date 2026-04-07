import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { validateJsonContentType } from "@/lib/validate-content-type";

const log = createLogger("api/tenant/domains");

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

const domainSchema = z.object({
  domains: z
    .array(z.string().max(253).regex(/^[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})(:\d+)?$/, "Ugyldig domeneformat"))
    .max(20),
});

async function verifyAccess(tenantId: string) {
  const user = await getUser();
  if (!user) return { user: null, role: null, error: "Unauthorized", status: 401 };

  const { data: access } = await supabaseAdmin
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) return { user: null, role: null, error: "Forbidden", status: 403 };
  return { user, role: access.role, error: null, status: 200 };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, error: authError, status } = await verifyAccess(tenantId);
  if (!user) return NextResponse.json({ error: authError }, { status });

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("allowed_domains")
    .eq("id", tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Filter out dev domains
  const domains = (data.allowed_domains || []).filter(
    (d: string) => !d.includes("localhost") && !d.includes("127.0.0.1")
  );

  return NextResponse.json({ domains });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, role, error: authError, status } = await verifyAccess(tenantId);
  if (!user) return NextResponse.json({ error: authError }, { status });
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const contentTypeError = validateJsonContentType(request);
  if (contentTypeError) return contentTypeError;

  const body = await request.json();
  const parsed = domainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid domains", details: parsed.error.flatten() }, { status: 400 });
  }

  // Normalize: lowercase, strip protocol, strip trailing slash
  const cleanDomains = parsed.data.domains.map((d) =>
    d.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  );

  // Preserve dev domains that may already exist
  const { data: existing } = await supabaseAdmin
    .from("tenants")
    .select("allowed_domains")
    .eq("id", tenantId)
    .single();

  const devDomains = (existing?.allowed_domains || []).filter(
    (d: string) => d.includes("localhost") || d.includes("127.0.0.1")
  );

  const { error } = await supabaseAdmin
    .from("tenants")
    .update({ allowed_domains: [...cleanDomains, ...devDomains] })
    .eq("id", tenantId);

  if (error) {
    log.error("Failed to update domains:", error);
    return NextResponse.json({ error: "Failed to update domains" }, { status: 500 });
  }

  logAudit({
    actorEmail: user.email || user.id,
    action: "update_domains",
    entityType: "tenant",
    entityId: tenantId,
    details: { domains: cleanDomains },
  });

  return NextResponse.json({ success: true, domains: cleanDomains });
}
