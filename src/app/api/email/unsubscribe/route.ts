import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/email/unsubscribe");

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("t");
  const token = request.nextUrl.searchParams.get("k");

  if (!tenantId || !token) {
    return new NextResponse(page("Ugyldig lenke", "Avmeldingslenken er ugyldig."), html());
  }

  // Verify token (simple HMAC of tenantId with secret)
  const secret = process.env.CRON_SECRET || "fallback";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(tenantId));
  const expected = Buffer.from(sig).toString("hex").slice(0, 16);

  if (token !== expected) {
    return new NextResponse(page("Ugyldig lenke", "Avmeldingslenken er ugyldig eller utløpt."), html());
  }

  await supabaseAdmin
    .from("tenants")
    .update({ email_unsubscribed: true })
    .eq("id", tenantId);

  log.info("Tenant unsubscribed from emails", { tenantId });

  return new NextResponse(
    page("Avmeldt", "Du er nå avmeldt fra e-poster fra Preik. Du kan fortsatt bruke dashbordet som vanlig."),
    html()
  );
}

function html() {
  return { headers: { "Content-Type": "text/html; charset=utf-8" } };
}

function page(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="no">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} – Preik</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:60px auto;padding:0 20px;text-align:center;color:#1a1a2e;">
  <h1 style="font-size:24px;">${title}</h1>
  <p style="line-height:1.6;color:#666;">${message}</p>
  <a href="https://preik.ai" style="color:#C2410C;">Gå til preik.ai</a>
</body>
</html>`;
}
