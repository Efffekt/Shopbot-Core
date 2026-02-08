/**
 * One-time script to seed hardcoded system prompts into the tenant_prompts table.
 * Run with: npx tsx scripts/seed-prompts.ts
 *
 * After running, prompts can be managed via the dashboard prompt editor
 * without requiring code changes. The hardcoded prompts in tenants.ts
 * serve as fallbacks only.
 */
import { createClient } from "@supabase/supabase-js";

// Import all hardcoded configs
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TENANT_CONFIGS } = require("../src/lib/tenants");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPrompts() {
  console.log("Seeding system prompts into tenant_prompts table...\n");

  for (const [tenantId, config] of Object.entries(TENANT_CONFIGS)) {
    const { systemPrompt } = config as { systemPrompt: string };

    if (!systemPrompt) {
      console.log(`  [SKIP] ${tenantId} — no system prompt`);
      continue;
    }

    // Check if prompt already exists in DB
    const { data: existing } = await supabase
      .from("tenant_prompts")
      .select("tenant_id, version")
      .eq("tenant_id", tenantId)
      .single();

    if (existing) {
      console.log(`  [SKIP] ${tenantId} — already has DB prompt (v${existing.version})`);
      continue;
    }

    // Insert the hardcoded prompt
    const { error } = await supabase.from("tenant_prompts").insert({
      tenant_id: tenantId,
      system_prompt: systemPrompt,
      version: 1,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`  [FAIL] ${tenantId} — ${error.message}`);
    } else {
      console.log(`  [OK]   ${tenantId} — seeded (${systemPrompt.length} chars)`);
    }
  }

  console.log("\nDone. Prompts can now be managed via the dashboard.");
}

seedPrompts();
