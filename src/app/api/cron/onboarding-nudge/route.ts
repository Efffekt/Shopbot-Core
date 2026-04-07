import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import {
  sendNudgeInstallEmail,
  sendNudgeTipsEmail,
  sendNudgeReengageEmail,
  buildUnsubscribeUrl,
} from "@/lib/email";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/cron/onboarding-nudge");

function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (!authHeader) return false;
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;

  // Fetch tenants created via Stripe (have a subscription) within the last 14 days
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tenants, error } = await supabaseAdmin
    .from("tenants")
    .select("id, name, contact_email, created_at, widget_first_seen_at, onboarding_nudge_install_sent, onboarding_nudge_tips_sent, onboarding_nudge_reengage_sent, email_unsubscribed")
    .neq("stripe_subscription_id", "")
    .gte("created_at", fourteenDaysAgo);

  if (error || !tenants) {
    log.error("Failed to fetch tenants for onboarding nudge", { error });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  for (const tenant of tenants) {
    if (!tenant.contact_email) continue;
    if (tenant.email_unsubscribed) continue;

    const createdAt = new Date(tenant.created_at);
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const hasWidget = !!tenant.widget_first_seen_at;

    // Check conversation count for this tenant
    const { count: convCount } = await supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("store_id", tenant.id);

    const hasConversations = (convCount ?? 0) > 0;

    const unsubUrl = await buildUnsubscribeUrl(tenant.id);
    const emailData = { tenantName: tenant.name || tenant.id, contactEmail: tenant.contact_email, tenantId: tenant.id, unsubUrl };

    // Day 2+: Widget not installed
    if (daysSinceCreation >= 2 && !hasWidget && !tenant.onboarding_nudge_install_sent) {
      await sendNudgeInstallEmail(emailData);
      await supabaseAdmin.from("tenants").update({ onboarding_nudge_install_sent: true }).eq("id", tenant.id);
      sent++;
      continue; // One email per run per tenant
    }

    // Day 5+: Widget installed but no conversations
    if (daysSinceCreation >= 5 && hasWidget && !hasConversations && !tenant.onboarding_nudge_tips_sent) {
      await sendNudgeTipsEmail(emailData);
      await supabaseAdmin.from("tenants").update({ onboarding_nudge_tips_sent: true }).eq("id", tenant.id);
      sent++;
      continue;
    }

    // Day 12+: Still inactive (no conversations)
    if (daysSinceCreation >= 12 && !hasConversations && !tenant.onboarding_nudge_reengage_sent) {
      await sendNudgeReengageEmail(emailData);
      await supabaseAdmin.from("tenants").update({ onboarding_nudge_reengage_sent: true }).eq("id", tenant.id);
      sent++;
    }
  }

  log.info("Onboarding nudge cron complete", { tenantsChecked: tenants.length, emailsSent: sent });
  return NextResponse.json({ ok: true, tenantsChecked: tenants.length, emailsSent: sent });
}
