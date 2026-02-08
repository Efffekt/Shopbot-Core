import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const checks: Record<string, boolean> = {};

  // Lightweight DB ping — select 1 row from tenants
  try {
    const { error } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return Response.json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    checks,
  }, {
    status: allHealthy ? 200 : 503,
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
