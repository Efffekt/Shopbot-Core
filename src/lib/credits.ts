import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("credits");

export interface CreditCheckResult {
  allowed: boolean;
  creditsUsed: number;
  creditLimit: number;
  percentUsed: number;
}

export interface CreditStatus {
  creditLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  percentUsed: number;
  billingCycleStart: string;
  billingCycleEnd: string;
}

export async function checkAndIncrementCredits(tenantId: string): Promise<CreditCheckResult> {
  const { data, error } = await supabaseAdmin.rpc("increment_credits", {
    p_tenant_id: tenantId,
  });

  if (error) {
    log.error("Credit check error:", error);
    // Fail closed — reject request when credit system is down
    return { allowed: false, creditsUsed: 0, creditLimit: 0, percentUsed: 0 };
  }

  const result = data as { allowed: boolean; credits_used: number; credit_limit: number };
  const percentUsed = result.credit_limit > 0
    ? Math.round((result.credits_used / result.credit_limit) * 100)
    : 0;

  return {
    allowed: result.allowed,
    creditsUsed: result.credits_used,
    creditLimit: result.credit_limit,
    percentUsed,
  };
}

export async function getCreditStatus(tenantId: string): Promise<CreditStatus | null> {
  const { data, error } = await supabaseAdmin.rpc("get_credit_status", {
    p_tenant_id: tenantId,
  });

  if (error || !data || data.error) {
    log.error("Get credit status error:", error || data?.error);
    return null;
  }

  const result = data as {
    credit_limit: number;
    credits_used: number;
    credits_remaining: number;
    billing_cycle_start: string;
    percent_used: number;
  };

  // Calculate billing cycle end (1 month from start, clamped to month boundary)
  const cycleStart = new Date(result.billing_cycle_start);
  const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, cycleStart.getDate());
  // If day overflowed (e.g. Jan 31 → Mar 3), clamp to last day of target month
  if (cycleEnd.getDate() !== cycleStart.getDate()) {
    cycleEnd.setDate(0); // Sets to last day of previous month (the correct target month)
  }

  return {
    creditLimit: result.credit_limit,
    creditsUsed: result.credits_used,
    creditsRemaining: result.credits_remaining,
    percentUsed: result.percent_used,
    billingCycleStart: result.billing_cycle_start,
    billingCycleEnd: cycleEnd.toISOString(),
  };
}

export async function resetCredits(tenantId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("reset_credits", {
    p_tenant_id: tenantId,
  });

  if (error || !data || data.error) {
    log.error("Reset credits error:", error || data?.error);
    return false;
  }

  return true;
}

export function shouldSendWarningEmail(
  creditsUsed: number,
  creditLimit: number
): "80" | "100" | null {
  if (creditLimit <= 0) return null;
  const percent = (creditsUsed / creditLimit) * 100;
  if (percent >= 100) return "100";
  if (percent >= 80) return "80";
  return null;
}
