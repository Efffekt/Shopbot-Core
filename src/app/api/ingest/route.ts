import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { firecrawl } from "@/lib/firecrawl";

const ingestSchema = z.object({
  url: z.url(),
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
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      if (paragraph.length > chunkSize) {
        const words = paragraph.split(/\s+/);
        currentChunk = "";
        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= chunkSize) {
            currentChunk += (currentChunk ? " " : "") + word;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = word;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

const EMBEDDING_BATCH_SIZE = 100;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ingestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, storeId } = parsed.data;

    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("store_id", storeId);

    if (deleteError) {
      console.error("Error deleting existing documents:", deleteError);
      return NextResponse.json(
        { error: "Failed to clear existing documents" },
        { status: 500 }
      );
    }

    console.log(`Starting crawl of ${url}...`);

    const crawlResult = await firecrawl.crawl(url, {
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

    if (crawlResult.status === "failed") {
      return NextResponse.json(
        { error: "Crawl failed" },
        { status: 500 }
      );
    }

    if (!crawlResult.data || crawlResult.data.length === 0) {
      return NextResponse.json(
        { error: "No pages found to crawl" },
        { status: 400 }
      );
    }

    console.log(`Crawled ${crawlResult.data.length} pages`);

    const allChunks: { content: string; source: string }[] = [];

    for (const page of crawlResult.data) {
      if (page.markdown) {
        const pageChunks = splitIntoChunks(page.markdown);
        const sourceUrl = page.metadata?.sourceURL || page.metadata?.url || url;
        for (const chunk of pageChunks) {
          allChunks.push({ content: chunk, source: sourceUrl });
        }
      }
    }

    if (allChunks.length === 0) {
      return NextResponse.json(
        { error: "No content found on website" },
        { status: 400 }
      );
    }

    console.log(`Processing ${allChunks.length} chunks...`);

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
      console.log(`Embedded ${Math.min(i + EMBEDDING_BATCH_SIZE, allChunks.length)}/${allChunks.length} chunks`);
    }

    const documents = allChunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: allEmbeddings[index],
      store_id: storeId,
      metadata: { source: chunk.source },
    }));

    const DB_BATCH_SIZE = 500;
    for (let i = 0; i < documents.length; i += DB_BATCH_SIZE) {
      const batch = documents.slice(i, i + DB_BATCH_SIZE);
      const { error: insertError } = await supabaseAdmin
        .from("documents")
        .insert(batch);

      if (insertError) {
        console.error("Error inserting documents:", insertError);
        return NextResponse.json(
          { error: "Failed to save documents" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully crawled ${crawlResult.data.length} pages and ingested ${allChunks.length} chunks`,
      pagesCount: crawlResult.data.length,
      chunksCount: allChunks.length,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
