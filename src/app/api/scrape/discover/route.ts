import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firecrawl } from "@/lib/firecrawl";

const discoverSchema = z.object({
  baseUrl: z.string().url(),
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
    const body = await request.json();
    const parsed = discoverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { baseUrl } = parsed.data;

    console.log(`🔍 Starting discovery for: ${baseUrl}`);

    // Use Firecrawl's map function for fast URL discovery
    const mapResult = await firecrawl.map(baseUrl, {
      limit: 500,
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

    console.log(`✅ Discovered ${filteredUrls.length} pages (filtered from ${mapResult.links.length})`);

    return NextResponse.json({
      success: true,
      totalCount: filteredUrls.length,
      urls: filteredUrls,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json(
      { error: "Failed to discover pages" },
      { status: 500 }
    );
  }
}
