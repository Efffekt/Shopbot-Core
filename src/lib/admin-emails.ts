// Super admin emails — full access to all admin sections
// Configure via env: SUPER_ADMIN_EMAILS=a@b.com,c@d.com
// Server-only — never exposed to the client bundle
function parseEmailList(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export const SUPER_ADMIN_EMAILS = parseEmailList(
  process.env.SUPER_ADMIN_EMAILS
);

// Admin emails — access to Oversikt, Analyse, and Articles only
// Configure via env: ADMIN_EMAILS=e@f.com,g@h.com
export const ADMIN_EMAILS = parseEmailList(
  process.env.ADMIN_EMAILS
);
