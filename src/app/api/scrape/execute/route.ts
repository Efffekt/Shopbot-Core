import { NextRequest } from "next/server";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { firecrawl } from "@/lib/firecrawl";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateChecksum } from "@/lib/checksum";

const executeSchema = z.object({
  urls: z.array(z.string().url()).min(1),
  storeId: z.string().min(1),
});

function splitIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      if (paragraph.length > chunkSize) {
        const words = paragraph.split(/\s+/);
        currentChunk = "";
        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= chunkSize) {
            currentChunk += (currentChunk ? " " : "") + word;
          } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = word;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.filter((c) => c.length > 0);
}

export async function POST(request: NextRequest) {
  try {
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

        // Process in batches
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
          const batch = urls.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.allSettled(
            batch.map(async (url) => {
              try {
                // Scrape the page with SPA support
                const scrapeResult = await firecrawl.scrape(url, {
                  formats: ["markdown"],
                  waitFor: 3000, // Wait 3s for JavaScript/SPA content to load
                  timeout: 30000, // 30s max timeout
                });

                if (!scrapeResult.markdown) {
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

                await supabaseAdmin.from("documents").insert(documents);

                return {
                  url,
                  status: existing ? ("updated" as const) : ("new" as const),
                  chunks: chunks.length,
                };
              } catch (err) {
                console.error(`Error scraping ${url}:`, err);
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
                chunks: "chunks" in r ? r.chunks : 0,
                stats: { errors, newPages, updatedPages, skippedPages },
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
                stats: { errors, newPages, updatedPages, skippedPages },
              });
            }
          }
        }

        // Send completion
        send({
          type: "complete",
          total: processed,
          stats: { errors, newPages, updatedPages, skippedPages },
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Execute error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start scraping" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
