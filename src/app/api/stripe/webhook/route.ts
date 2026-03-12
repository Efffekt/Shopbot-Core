import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe, PLANS, getPlanByPriceId } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import { createLogger } from "@/lib/logger";
import Stripe from "stripe";

const log = createLogger("api/stripe/webhook");

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    log.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        log.info(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    log.error(`Error handling ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, userEmail, tenantSlug, companyName, plan } = session.metadata || {};

  if (!userId || !userEmail || !tenantSlug || !companyName || !plan) {
    log.error("Missing metadata in checkout session", { sessionId: session.id });
    return;
  }

  const planConfig = PLANS[plan];
  if (!planConfig) {
    log.error("Unknown plan in checkout metadata", { plan, sessionId: session.id });
    return;
  }

  // Resolve final slug (handle duplicates by appending suffix)
  let finalSlug = tenantSlug;
  const { data: existing } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("id", tenantSlug)
    .single();

  if (existing) {
    const suffix = Math.random().toString(36).substring(2, 6);
    finalSlug = `${tenantSlug}-${suffix}`;
    log.warn("Tenant slug collision, using suffix", { original: tenantSlug, final: finalSlug });
  }

  // Create tenant
  const { error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      id: finalSlug,
      name: companyName,
      allowed_domains: [],
      language: "no",
      persona: "",
      contact_email: userEmail,
      credit_limit: planConfig.credits,
      credits_used: 0,
      billing_cycle_start: new Date().toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      stripe_plan: plan,
      features: {
        synonymMapping: false,
        codeBlockFormatting: false,
        boatExpertise: false,
      },
    });

  if (tenantError) {
    log.error("Failed to create tenant from checkout:", tenantError);
    throw new Error(`Tenant creation failed: ${tenantError.message}`);
  }

  // Grant user admin access
  const { error: accessError } = await supabaseAdmin
    .from("tenant_user_access")
    .insert({
      tenant_id: finalSlug,
      user_id: userId,
      role: "admin",
    });

  if (accessError) {
    log.error("Failed to grant tenant access:", accessError);
    // Tenant was created, so don't throw — log and continue
  }

  logAudit({
    actorEmail: userEmail,
    action: "create",
    entityType: "tenant",
    entityId: finalSlug,
    details: { plan, source: "stripe_checkout", stripeSessionId: session.id },
  });

  sendWelcomeEmail({
    tenantName: companyName,
    contactEmail: userEmail,
    tenantId: finalSlug,
  }).catch((err) => {
    log.warn("Failed to send welcome email", { error: err as Error });
  });

  log.info("Tenant provisioned via Stripe checkout", { tenantId: finalSlug, plan, userId });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("id, contact_email")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!tenant) {
    log.warn("No tenant found for deleted subscription", { subscriptionId: subscription.id });
    return;
  }

  await supabaseAdmin
    .from("tenants")
    .update({ credit_limit: 0 })
    .eq("id", tenant.id);

  logAudit({
    actorEmail: tenant.contact_email || "stripe",
    action: "subscription_cancelled",
    entityType: "tenant",
    entityId: tenant.id,
    details: { stripeSubscriptionId: subscription.id },
  });

  log.info("Subscription cancelled, credits zeroed", { tenantId: tenant.id });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("id, contact_email, stripe_plan")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!tenant) {
    log.warn("No tenant found for updated subscription", { subscriptionId: subscription.id });
    return;
  }

  // Check if the price changed
  const newPriceId = subscription.items.data[0]?.price?.id;
  if (!newPriceId) return;

  const newPlan = getPlanByPriceId(newPriceId);
  if (!newPlan || newPlan.key === tenant.stripe_plan) return;

  await supabaseAdmin
    .from("tenants")
    .update({
      credit_limit: newPlan.plan.credits,
      stripe_plan: newPlan.key,
    })
    .eq("id", tenant.id);

  logAudit({
    actorEmail: tenant.contact_email || "stripe",
    action: "plan_changed",
    entityType: "tenant",
    entityId: tenant.id,
    details: { oldPlan: tenant.stripe_plan, newPlan: newPlan.key },
  });

  log.info("Subscription plan updated", { tenantId: tenant.id, newPlan: newPlan.key });
}
