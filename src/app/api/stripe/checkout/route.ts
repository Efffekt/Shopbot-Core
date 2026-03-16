import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStripe, PLANS } from "@/lib/stripe";
import { slugify } from "@/lib/slugify";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

const log = createLogger("api/stripe/checkout");

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
    }

    // Rate limit per user
    const rl = await checkRateLimit(`stripe-checkout:${user.id}`, RATE_LIMITS.stripeCheckout);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "For mange forespørsler. Prøv igjen senere." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs || 60000) / 1000)) } }
      );
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 64_000) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const { plan, companyName } = body;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Ugyldig plan" }, { status: 400 });
    }

    if (plan === "business") {
      return NextResponse.json({ error: "Business-planen krever direkte kontakt" }, { status: 400 });
    }

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json({ error: "Bedriftsnavn er påkrevd (minst 2 tegn)" }, { status: 400 });
    }

    const trimmedName = companyName.trim();
    const tenantSlug = slugify(trimmedName);

    if (!tenantSlug || !/^[a-z0-9-]+$/.test(tenantSlug)) {
      return NextResponse.json({ error: "Bedriftsnavnet ga en ugyldig ID. Bruk bokstaver og tall." }, { status: 400 });
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("id", tenantSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "En bedrift med dette navnet finnes allerede. Velg et annet navn." },
        { status: 409 }
      );
    }

    const selectedPlan = PLANS[plan];
    const stripe = getStripe();

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
        tenantSlug,
      },
    });

    // Determine return URL
    const origin = request.headers.get("origin") || "https://preik.ai";

    // Create Checkout Session with custom UI mode (Payment Element)
    const session = await stripe.checkout.sessions.create({
      ui_mode: "custom",
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      return_url: `${origin}/dashboard?checkout=success`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        tenantSlug,
        companyName: trimmedName,
        plan,
      },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
    });
  } catch (error) {
    log.error("Checkout session creation failed:", error);
    return NextResponse.json({ error: "Kunne ikke opprette betalingsøkt" }, { status: 500 });
  }
}
