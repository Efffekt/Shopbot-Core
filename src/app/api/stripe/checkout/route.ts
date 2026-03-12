import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStripe, PLANS } from "@/lib/stripe";
import { slugify } from "@/lib/slugify";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const log = createLogger("api/stripe/checkout");

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
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

    // Create incomplete subscription — Payment Element will confirm it
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: selectedPlan.priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: {
        userId: user.id,
        userEmail: user.email,
        tenantSlug,
        companyName: trimmedName,
        plan,
      },
    });

    // Retrieve the latest invoice with payment_intent expanded
    const invoiceId = typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;

    if (!invoiceId) {
      throw new Error("No invoice on subscription");
    }

    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["payment_intent"],
    }) as unknown as Record<string, unknown>;

    const paymentIntent = invoice.payment_intent as Record<string, unknown> | null;
    if (!paymentIntent || typeof paymentIntent === "string") {
      throw new Error("Expected expanded payment_intent");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret as string,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    log.error("Checkout session creation failed:", error);
    return NextResponse.json({ error: "Kunne ikke opprette betalingsøkt" }, { status: 500 });
  }
}
