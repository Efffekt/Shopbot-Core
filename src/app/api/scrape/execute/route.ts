import { NextRequest } from "next/server";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { firecrawl } from "@/lib/firecrawl";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateChecksum } from "@/lib/checksum";
import { splitIntoChunks } from "@/lib/chunking";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { isSafeUrl } from "@/lib/url-safety";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const log = createLogger("api/scrape/execute");

const safeUrl = z.string().url().refine(isSafeUrl, {
  message: "Only HTTPS URLs to public hosts are allowed",
});

const executeSchema = z.object({
  urls: z.array(safeUrl).min(1),
  storeId: z.string().min(1),
});

// Allow up to 5 minutes for batch scraping
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { authorized, email, error: authError } = await verifySuperAdmin();
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: authError || "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!firecrawl) {
      return new Response(
        JSON.stringify({ error: "Scraping service not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const rl = await checkRateLimit(`scrape:${email}`, RATE_LIMITS.scrape);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = executeSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { urls, storeId } = parsed.data;
    const total = urls.length;
    const BATCH_SIZE = 5;

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: "start", total, storeId });

        let processed = 0;
        let errors = 0;
        let newPages = 0;
        let updatedPages = 0;
        let skippedPages = 0;
        let emptyPages = 0;

        // Process in batches
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
          const batch = urls.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.allSettled(
            batch.map(async (url) => {
              try {
                // Fast mode first (no actions — works for server-rendered sites like Shopify)
                let scrapeResult = await firecrawl!.scrape(url, {
                  formats: ["markdown"],
                  timeout: 30000,
                });

                // If empty, retry with browser actions for JS-heavy SPAs
                if (!scrapeResult.markdown) {
                  scrapeResult = await firecrawl!.scrape(url, {
                    formats: ["markdown"],
                    waitFor: 5000,
                    timeout: 60000,
                    actions: [
                      { type: "wait", milliseconds: 3000 },
                    ],
                  });
                }

                if (!scrapeResult.markdown) {
                  log.warn("Empty markdown from Firecrawl", { url });
                  return { url, status: "empty" as const };
                }

                const content = scrapeResult.markdown;
                const checksum = calculateChecksum(content);

                // Check if content has changed
                const { data: existing } = await supabaseAdmin
                  .from("documents")
                  .select("checksum")
                  .eq("store_id", storeId)
                  .eq("metadata->>source", url)
                  .single();

                if (existing?.checksum === checksum) {
                  return { url, status: "skipped" as const };
                }

                // Delete old chunks for this URL
                await supabaseAdmin
                  .from("documents")
                  .delete()
                  .eq("store_id", storeId)
                  .eq("metadata->>source", url);

                // Chunk and embed
                const chunks = splitIntoChunks(content);

                if (chunks.length === 0) {
                  return { url, status: "empty" as const };
                }

                const { embeddings } = await embedMany({
                  model: openai.embedding("text-embedding-3-small"),
                  values: chunks,
                  providerOptions: {
                    openai: { dimensions: 1536 },
                  },
                });

                // Insert new chunks
                const documents = chunks.map((chunk, idx) => ({
                  content: chunk,
                  embedding: embeddings[idx],
                  store_id: storeId,
                  checksum,
                  metadata: { source: url },
                }));

                const { error: insertError } = await supabaseAdmin.from("documents").insert(documents);
                if (insertError) {
                  log.error("DB insert failed", { url, error: insertError });
                  return { url, status: "error" as const, error: insertError.message };
                }

                return {
                  url,
                  status: existing ? ("updated" as const) : ("new" as const),
                  chunks: chunks.length,
                };
              } catch (err) {
                log.error(`Error scraping ${url}:`, err);
                return { url, status: "error" as const, error: String(err) };
              }
            })
          );

          // Process batch results
          for (const result of batchResults) {
            processed++;

            if (result.status === "fulfilled") {
              const r = result.value;

              if (r.status === "error") {
                errors++;
              } else if (r.status === "empty") {
                emptyPages++;
              } else if (r.status === "new") {
                newPages++;
              } else if (r.status === "updated") {
                updatedPages++;
              } else if (r.status === "skipped") {
                skippedPages++;
              }

              send({
                type: "progress",
                current: processed,
                total,
                url: r.url,
                status: r.status,
                error: "error" in r ? r.error : undefined,
                chunks: "chunks" in r ? r.chunks : 0,
                stats: { errors, newPages, updatedPages, skippedPages, emptyPages },
              });
            } else {
              errors++;
              send({
                type: "progress",
                current: processed,
                total,
                url: "unknown",
                status: "error",
                error: result.reason,
                stats: { errors, newPages, updatedPages, skippedPages, emptyPages },
              });
            }
          }
        }

        // Send completion
        send({
          type: "complete",
          total: processed,
          stats: { errors, newPages, updatedPages, skippedPages, emptyPages },
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    log.error("Execute error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start scraping" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
