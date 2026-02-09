import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { splitIntoChunks } from "@/lib/chunking";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/manual-ingest");

const manualIngestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  storeId: z.string().min(1, "Store ID is required"),
  url: z.string().optional(),
  title: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Verify super admin access
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 2_000_000) {
      return NextResponse.json({ error: "Request body too large (max 2MB)" }, { status: 413 });
    }

    const body = await request.json();
    const parsed = manualIngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, storeId, url, title } = parsed.data;

    log.info("Manual ingest started", { storeId });

    // Split text into chunks
    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to process" },
        { status: 400 }
      );
    }

    log.info("Processing chunks", { count: chunks.length });

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
      log.error("Error inserting documents:", insertError);
      return NextResponse.json(
        { error: "Failed to save documents" },
        { status: 500 }
      );
    }

    log.info("Manual ingest complete", { chunks: chunks.length });

    return NextResponse.json({
      success: true,
      message: `Lagret ${chunks.length} chunks for "${title || "Manuell inntasting"}"`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    log.error("Manual ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
