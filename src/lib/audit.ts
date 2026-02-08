import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("lib/audit");

export async function logAudit(params: {
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("audit_log").insert({
      actor_email: params.actorEmail,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || {},
    });
  } catch (error) {
    // Never block the main operation if audit logging fails
    log.error("Audit log error:", error);
  }
}
