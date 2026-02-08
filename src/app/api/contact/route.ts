import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { createLogger } from "@/lib/logger";
import { sendContactNotification } from "@/lib/email";

const log = createLogger("api/contact");

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (5 per hour)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = await checkRateLimit(`contact:${ip}`, RATE_LIMITS.contact);

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

    // Reject oversized payloads
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 16_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, company, message } = parsed.data;

    // CORS — whitelist known domains for contact form submissions
    const origin = request.headers.get("origin");
    const ALLOWED_ORIGINS = process.env.CONTACT_ALLOWED_ORIGINS
      ? process.env.CONTACT_ALLOWED_ORIGINS.split(",").map((s) => s.trim())
      : ["https://preik.no", "https://www.preik.no", "https://baatpleiebutikken.no", "https://www.baatpleiebutikken.no"];
    const corsHeaders: Record<string, string> = { "Vary": "Origin" };
    if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development")) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    // Store in Supabase
    const { error: dbError } = await supabaseAdmin.from("contact_submissions").insert({
      name,
      email,
      company: company || null,
      message,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      log.error("Failed to store contact submission", { error: dbError });
    }

    log.info("Contact submission received", { name, email, company: company || null });

    // Fire-and-forget email notification
    sendContactNotification({ name, email, company: company || undefined, message }).catch(() => {});

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    log.error("Contact form error", { error: error as Error });
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
