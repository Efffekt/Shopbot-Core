import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firecrawl } from "@/lib/firecrawl";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { isSafeUrl } from "@/lib/url-safety";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/scrape/discover");

const discoverSchema = z.object({
  baseUrl: z.string().url().refine(isSafeUrl, {
    message: "Only HTTPS URLs to public hosts are allowed",
  }),
});

// Filter out non-relevant URLs
function filterUrls(urls: string[], baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>();

  return urls.filter((url) => {
    try {
      const parsed = new URL(url);

      // Must be same domain
      if (parsed.hostname !== base.hostname) return false;

      // Skip non-HTML resources
      const path = parsed.pathname.toLowerCase();
      if (
        path.endsWith(".pdf") ||
        path.endsWith(".jpg") ||
        path.endsWith(".jpeg") ||
        path.endsWith(".png") ||
        path.endsWith(".gif") ||
        path.endsWith(".svg") ||
        path.endsWith(".webp") ||
        path.endsWith(".mp4") ||
        path.endsWith(".mp3") ||
        path.endsWith(".zip") ||
        path.endsWith(".css") ||
        path.endsWith(".js")
      ) {
        return false;
      }

      // Skip social/external paths
      if (
        path.includes("/cdn-cgi/") ||
        path.includes("/wp-admin/") ||
        path.includes("/wp-login")
      ) {
        return false;
      }

      // Normalize URL for deduplication (remove trailing slash, query params)
      const normalized = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;

      if (seen.has(normalized)) return false;
      seen.add(normalized);

      return true;
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, email, error: authError } = await verifySuperAdmin();
    if (!authorized) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    if (!firecrawl) {
      return NextResponse.json({ error: "Scraping service not configured" }, { status: 503 });
    }

    const rl = await checkRateLimit(`scrape:${email}`, RATE_LIMITS.scrape);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = discoverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { baseUrl } = parsed.data;

    log.info("Starting discovery", { baseUrl });

    // Use Firecrawl's map function for fast URL discovery
    // Note: map() uses sitemap/links discovery, may not work well for SPAs
    const mapResult = await firecrawl!.map(baseUrl, {
      limit: 500,
      search: "", // Empty search to get all pages
    });

    if (!mapResult.links || mapResult.links.length === 0) {
      return NextResponse.json(
        { error: "No pages found on this website" },
        { status: 404 }
      );
    }

    // Extract URLs from SearchResultWeb objects
    const urls = mapResult.links.map((link) => link.url);
    const filteredUrls = filterUrls(urls, baseUrl);

    log.info("Discovery complete", { found: filteredUrls.length, raw: mapResult.links.length });

    return NextResponse.json({
      success: true,
      totalCount: filteredUrls.length,
      urls: filteredUrls,
    });
  } catch (error) {
    log.error("Discovery error", { error: error as Error });
    return NextResponse.json(
      { error: "Failed to discover pages" },
      { status: 500 }
    );
  }
}
