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

    const scrapeResult = await firecrawl.scrape(url, {
      formats: ["markdown"],
    });

    if (!scrapeResult.markdown) {
      return NextResponse.json(
        { error: "Failed to scrape URL or no content found" },
        { status: 500 }
      );
    }

    const chunks = splitIntoChunks(scrapeResult.markdown);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content found at URL" },
        { status: 400 }
      );
    }

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
    });

    const documents = chunks.map((content, index) => ({
      content,
      embedding: embeddings[index],
      store_id: storeId,
      metadata: { source: url },
    }));

    const { error: insertError } = await supabaseAdmin
      .from("documents")
      .insert(documents);

    if (insertError) {
      console.error("Error inserting documents:", insertError);
      return NextResponse.json(
        { error: "Failed to save documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ingested ${chunks.length} chunks from ${url}`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
