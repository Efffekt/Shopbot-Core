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

  // Vertex AI — verify credentials and project are configured
  try {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!key || !project) {
      checks.vertexAi = false;
    } else {
      const creds = JSON.parse(key);
      checks.vertexAi = !!(creds.private_key && creds.client_email);
    }
  } catch {
    checks.vertexAi = false;
  }

  // Upstash Redis — ping to verify connectivity
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      checks.redis = false;
    } else {
      const res = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });
      checks.redis = res.ok;
    }
  } catch {
    checks.redis = false;
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
