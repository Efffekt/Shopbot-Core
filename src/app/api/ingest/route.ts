import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { firecrawl } from "@/lib/firecrawl";
import { splitIntoChunks } from "@/lib/chunking";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { isSafeUrl } from "@/lib/url-safety";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const log = createLogger("api/ingest");

const ingestSchema = z.object({
  url: z.string().url().refine(isSafeUrl, {
    message: "Only HTTPS URLs to public hosts are allowed",
  }),
  storeId: z.string().min(1),
});

const EMBEDDING_BATCH_SIZE = 100;

// Allow up to 5 minutes for crawl + embed + insert
export const maxDuration = 300;

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

    // Tight rate limit for expensive crawl operations
    const rl = await checkRateLimit(`ingest:${email}`, RATE_LIMITS.ingest);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = ingestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, storeId } = parsed.data;

    // Crawl FIRST — old documents are preserved until crawl+embed succeeds
    log.info("Starting crawl", { url, storeId });

    const crawlResult = await firecrawl!.crawl(url, {
      scrapeOptions: {
        formats: ["markdown"],
        waitFor: 5000, // Wait 5s for React/Vite to hydrate
        timeout: 60000, // 60s max timeout for slow SPAs
        actions: [
          { type: "wait", milliseconds: 3000 }, // Extra wait for JS rendering
        ],
      },
      limit: 500,
    });

    log.info("Crawl result", {
      status: crawlResult.status,
      pages: crawlResult.data?.length ?? 0,
      hasData: !!crawlResult.data,
    });

    if (crawlResult.status === "failed" || crawlResult.status === "cancelled") {
      return NextResponse.json(
        { error: `Crawl ${crawlResult.status}` },
        { status: 500 }
      );
    }

    if (!crawlResult.data || crawlResult.data.length === 0) {
      return NextResponse.json(
        { error: "No pages found to crawl" },
        { status: 400 }
      );
    }

    const allChunks: { content: string; source: string }[] = [];
    let emptyPages = 0;

    for (const page of crawlResult.data) {
      if (page.markdown) {
        const pageChunks = splitIntoChunks(page.markdown);
        const sourceUrl = page.metadata?.sourceURL || page.metadata?.url || url;
        for (const chunk of pageChunks) {
          allChunks.push({ content: chunk, source: sourceUrl });
        }
      } else {
        emptyPages++;
      }
    }

    log.info("Crawl content", {
      totalPages: crawlResult.data.length,
      emptyPages,
      chunks: allChunks.length,
    });

    if (allChunks.length === 0) {
      return NextResponse.json(
        {
          error: `No content found on website. ${crawlResult.data.length} pages crawled but ${emptyPages} returned empty markdown. The site may block scrapers or require JavaScript rendering.`,
        },
        { status: 400 }
      );
    }

    log.info("Processing chunks", { total: allChunks.length });

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < allChunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = allChunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: batch.map((c) => c.content),
        providerOptions: {
          openai: { dimensions: 1536 },
        },
      });
      allEmbeddings.push(...embeddings);
      log.info("Embedding progress", { done: Math.min(i + EMBEDDING_BATCH_SIZE, allChunks.length), total: allChunks.length });
    }

    const documents = allChunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: allEmbeddings[index],
      store_id: storeId,
      metadata: { source: chunk.source },
    }));

    // Delete old documents only AFTER crawl+embed succeeded
    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("store_id", storeId);

    if (deleteError) {
      log.error("Error deleting existing documents:", deleteError);
      return NextResponse.json(
        { error: "Failed to clear existing documents" },
        { status: 500 }
      );
    }

    const DB_BATCH_SIZE = 500;
    for (let i = 0; i < documents.length; i += DB_BATCH_SIZE) {
      const batch = documents.slice(i, i + DB_BATCH_SIZE);
      const { error: insertError } = await supabaseAdmin
        .from("documents")
        .insert(batch);

      if (insertError) {
        log.error("Error inserting documents:", insertError);
        return NextResponse.json(
          { error: "Failed to save documents" },
          { status: 500 }
        );
      }
    }

    log.info("Ingest complete", { storeId, pages: crawlResult.data.length, chunks: allChunks.length, emptyPages });

    return NextResponse.json({
      success: true,
      message: `Successfully crawled ${crawlResult.data.length} pages and ingested ${allChunks.length} chunks${emptyPages > 0 ? ` (${emptyPages} empty pages skipped)` : ""}`,
      pagesCount: crawlResult.data.length,
      chunksCount: allChunks.length,
      emptyPages,
    });
  } catch (error) {
    log.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
