import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resetCredits } from "@/lib/credits";
import { createLogger } from "@/lib/logger";

const log = createLogger("/api/cron/reset-credits");

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn("Unauthorized cron attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Idempotency: skip if already ran within the last hour
    const { data: recentRun } = await supabaseAdmin
      .from("audit_log")
      .select("id")
      .eq("action", "cron_reset_credits")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentRun && recentRun.length > 0) {
      log.info("Cron already ran recently, skipping");
      return NextResponse.json({ success: true, skipped: true });
    }

    // Record this run
    await supabaseAdmin.from("audit_log").insert({
      actor_email: "system",
      action: "cron_reset_credits",
      entity_type: "system",
      entity_id: "cron",
    });

    // Find tenants whose billing cycle started more than 1 month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, billing_cycle_start, credits_used")
      .lte("billing_cycle_start", oneMonthAgo.toISOString())
      .gt("credits_used", 0);

    if (error) {
      log.error("Failed to query tenants", { error });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!tenants || tenants.length === 0) {
      log.info("No tenants need credit reset");
      return NextResponse.json({ success: true, reset: 0 });
    }

    log.info("Starting credit reset", { tenantCount: tenants.length });

    const results: { id: string; name: string; success: boolean }[] = [];

    for (const tenant of tenants) {
      const success = await resetCredits(tenant.id);
      results.push({ id: tenant.id, name: tenant.name, success });

      if (success) {
        log.info("Reset credits for tenant", {
          tenantId: tenant.id,
          tenantName: tenant.name,
          previousUsage: tenant.credits_used,
        });
      } else {
        log.error("Failed to reset credits for tenant", {
          tenantId: tenant.id,
          tenantName: tenant.name,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    log.info("Credit reset complete", { successCount, failCount });

    // Cleanup old conversations (>90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: deletedConversations, error: cleanupError } = await supabaseAdmin
      .from("conversations")
      .delete({ count: "exact" })
      .lt("created_at", ninetyDaysAgo.toISOString());

    if (cleanupError) {
      log.error("Conversation cleanup failed", { error: cleanupError });
    } else if (deletedConversations && deletedConversations > 0) {
      log.info("Cleaned up old conversations", { deleted: deletedConversations });
    }

    return NextResponse.json({
      success: true,
      reset: successCount,
      failed: failCount,
      details: results,
      conversationsDeleted: deletedConversations || 0,
    });
  } catch (error) {
    log.error("Cron job failed", { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
