import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabaseAdmin } from "@/lib/supabase";

const manualIngestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  storeId: z.string().min(1, "Store ID is required"),
  url: z.string().optional(),
  title: z.string().optional(),
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
    const parsed = manualIngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, storeId, url, title } = parsed.data;

    console.log(`📝 Manual ingest for store: ${storeId}`);

    // Split text into chunks
    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to process" },
        { status: 400 }
      );
    }

    console.log(`📦 Processing ${chunks.length} chunks...`);

    // Generate embeddings
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
    });

    // Prepare documents for insertion
    const documents = chunks.map((chunk, idx) => ({
      content: chunk,
      embedding: embeddings[idx],
      store_id: storeId,
      metadata: {
        source: url || "manual",
        title: title || "Manuell inntasting",
        manual: true,
      },
    }));

    // Insert into database
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

    console.log(`✅ Successfully ingested ${chunks.length} chunks`);

    return NextResponse.json({
      success: true,
      message: `Lagret ${chunks.length} chunks for "${title || "Manuell inntasting"}"`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error("Manual ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
