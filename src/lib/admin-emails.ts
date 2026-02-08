// Super admin emails — full access to all admin sections
// Configure via env: NEXT_PUBLIC_SUPER_ADMIN_EMAILS=a@b.com,c@d.com
// Shared between client (login redirect) and server (auth verification)
function parseEmailList(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export const SUPER_ADMIN_EMAILS = parseEmailList(
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS
);

// Admin emails — access to Oversikt, Analyse, and Blogg only
// Configure via env: NEXT_PUBLIC_ADMIN_EMAILS=e@f.com,g@h.com
export const ADMIN_EMAILS = parseEmailList(
  process.env.NEXT_PUBLIC_ADMIN_EMAILS
);
