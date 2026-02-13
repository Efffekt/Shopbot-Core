import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { createLogger } from "@/lib/logger";
import { sendOnboardingNotification } from "@/lib/email";
import { validateJsonContentType } from "@/lib/validate-content-type";

const log = createLogger("api/onboarding");

const onboardingSchema = z.object({
  industry: z.enum([
    "ecommerce",
    "service",
    "restaurant",
    "professional",
    "other",
  ]),
  useCase: z.enum(["customer_service", "product_help", "custom"]),
  customChallenge: z.string().max(2000).optional(),
  businessSize: z.enum(["solo", "2-10", "11-50", "50+"]),
  trafficRange: z.enum(["<500", "500-2000", "2000-10000", "10000+"]),
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  websiteUrl: z.string().url().max(500).optional().or(z.literal("").transform(() => undefined)),
});

const ALLOWED_ORIGINS = process.env.CONTACT_ALLOWED_ORIGINS
  ? process.env.CONTACT_ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : [
      "https://preik.ai",
      "https://www.preik.ai",
      "https://preik.no",
      "https://www.preik.no",
    ];

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders: Record<string, string> = { Vary: "Origin" };
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development")) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    corsHeaders["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimit = await checkRateLimit(`onboarding:${ip}`, RATE_LIMITS.onboarding);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 3600000) / 1000)),
          },
        }
      );
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 16_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const origin = request.headers.get("origin");
    const corsHeaders: Record<string, string> = { Vary: "Origin" };
    if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development")) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    const { error: dbError } = await supabaseAdmin.from("onboarding_submissions").insert({
      industry: data.industry,
      use_case: data.useCase,
      custom_challenge: data.customChallenge ?? null,
      business_size: data.businessSize,
      traffic_range: data.trafficRange,
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      website_url: data.websiteUrl ?? null,
    });

    if (dbError) {
      log.error("Failed to store onboarding submission", { error: dbError });
    }

    log.info("Onboarding submission received", {
      name: data.name,
      email: data.email,
      industry: data.industry,
      useCase: data.useCase,
    });

    sendOnboardingNotification(data).catch((err) => {
      log.warn("Failed to send onboarding notification email", { error: err as Error });
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    log.error("Onboarding form error", { error: error as Error });
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
