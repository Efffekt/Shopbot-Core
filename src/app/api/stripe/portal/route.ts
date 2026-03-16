import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/stripe/portal");

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json({ error: "Mangler tenant-ID" }, { status: 400 });
    }

    // Verify user has access to this tenant
    const { data: access } = await supabaseAdmin
      .from("tenant_user_access")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .single();

    if (!access || access.role !== "admin") {
      return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
    }

    // Get tenant's Stripe customer ID
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("stripe_customer_id")
      .eq("id", tenantId)
      .single();

    if (!tenant?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Ingen aktiv betalingsplan funnet" },
        { status: 404 }
      );
    }

    const origin = request.headers.get("origin") || "https://preik.ai";
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${origin}/dashboard/${tenantId}/innstillinger`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    log.error("Failed to create billing portal session:", error);
    return NextResponse.json(
      { error: "Kunne ikke åpne betalingsportalen" },
      { status: 500 }
    );
  }
}
