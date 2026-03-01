/**
 * Ingest a curated knowledge base .md file into the documents table.
 *
 * 1. Deletes ALL existing documents for the given store_id
 * 2. Splits the .md file into sections (by ## headings)
 * 3. Extracts the URL from each markdown-link heading
 * 4. Chunks each section, generates embeddings, and inserts into DB
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/ingest-knowledge-base.ts <file> <storeId>
 *
 * Example:
 *   npx tsx --env-file=.env.local scripts/ingest-knowledge-base.ts baatpleiebutikken_knowledge.md baatpleiebutikken
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// ── env ──────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Run with: npx tsx --env-file=.env.local scripts/ingest-knowledge-base.ts ...");
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── chunking (mirrors src/lib/chunking.ts) ───────────────────────────
function splitIntoChunks(text: string, chunkSize = 1000): string[] {
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

// ── section parsing ──────────────────────────────────────────────────
interface Section {
  title: string;
  url: string;
  text: string;
}

function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const parts = markdown.split(/^(?=## )/m);

  for (const part of parts) {
    if (!part.startsWith("## ")) continue;

    // Try to extract markdown link from heading: ## [Title](url)
    const linkMatch = part.match(/^## \[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const plainMatch = part.match(/^## (.+)/);

    const title = linkMatch ? linkMatch[1] : plainMatch ? plainMatch[1].trim() : "Unknown";
    const url = linkMatch ? linkMatch[2] : "";
    const text = part.trim();

    sections.push({ title, url, text });
  }

  return sections;
}

// ── main ─────────────────────────────────────────────────────────────
async function main() {
  const [filePath, storeId] = process.argv.slice(2);

  if (!filePath || !storeId) {
    console.error("Usage: npx tsx --env-file=.env.local scripts/ingest-knowledge-base.ts <file> <storeId>");
    process.exit(1);
  }

  const absPath = resolve(filePath);
  const markdown = readFileSync(absPath, "utf-8");
  console.log(`Read ${(markdown.length / 1024).toFixed(0)} KB from ${absPath}`);

  // ── Step 1: Delete existing documents via RPC (avoids PostgREST timeout) ──
  console.log(`\nDeleting existing documents for store_id="${storeId}"...`);
  let totalDeleted = 0;
  while (true) {
    // Delete in batches using a raw SQL call via rpc
    const { data, error: delError } = await supabase.rpc("delete_documents_batch", {
      p_store_id: storeId,
      p_limit: 500,
    });

    if (delError) {
      // If the RPC doesn't exist, fall back to select+delete approach
      if (delError.message.includes("not find") || delError.message.includes("not exist") || delError.code === "42883") {
        console.log("  RPC not found, using fallback batch delete...");
        // Fallback: select small batch of IDs, then delete them
        while (true) {
          const { data: batch } = await supabase
            .from("documents")
            .select("id")
            .eq("store_id", storeId)
            .limit(100);

          if (!batch || batch.length === 0) break;

          const ids = batch.map((d: { id: string }) => d.id);
          for (let i = 0; i < ids.length; i += 20) {
            const slice = ids.slice(i, i + 20);
            const { error } = await supabase.from("documents").delete().in("id", slice);
            if (error) {
              console.error("Delete failed:", error.message);
              process.exit(1);
            }
            totalDeleted += slice.length;
          }
          console.log(`  Deleted ${totalDeleted} documents so far...`);
        }
        break;
      }
      console.error("Delete failed:", delError.message);
      process.exit(1);
    }

    const deleted = typeof data === "number" ? data : 0;
    if (deleted === 0) break;
    totalDeleted += deleted;
    console.log(`  Deleted ${totalDeleted} documents so far...`);
  }
  console.log(`Deleted ${totalDeleted} existing documents total.`);

  // ── Step 2: Parse sections and chunk ──
  const sections = parseSections(markdown);
  console.log(`\nParsed ${sections.length} sections from knowledge base.`);

  // Build all chunks with per-section metadata
  const allChunks: { content: string; url: string; title: string }[] = [];

  for (const section of sections) {
    const chunks = splitIntoChunks(section.text);
    for (const chunk of chunks) {
      allChunks.push({
        content: chunk,
        url: section.url || "manual",
        title: section.title,
      });
    }
  }

  // Also handle top-level content before first ## heading (e.g. page title, intro)
  const preHeading = markdown.split(/^## /m)[0].replace(/^# .+\n*/m, "").trim();
  if (preHeading.length > 50) {
    const chunks = splitIntoChunks(preHeading);
    for (const chunk of chunks) {
      allChunks.unshift({
        content: chunk,
        url: "manual",
        title: "Generell info",
      });
    }
  }

  console.log(`Total chunks to embed: ${allChunks.length}`);

  // ── Step 3: Generate embeddings in batches ──
  const BATCH_SIZE = 200;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((c) => c.content);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allChunks.length / BATCH_SIZE);
    console.log(`Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: batchTexts,
    });
    allEmbeddings.push(...embeddings);
  }

  // ── Step 4: Insert into database in batches ──
  const INSERT_BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < allChunks.length; i += INSERT_BATCH) {
    const batchDocs = allChunks.slice(i, i + INSERT_BATCH).map((chunk, idx) => ({
      content: chunk.content,
      embedding: JSON.stringify(allEmbeddings[i + idx]),
      store_id: storeId,
      metadata: {
        source: chunk.url,
        title: chunk.title,
        manual: true,
      },
    }));

    const { error: insertError } = await supabase.from("documents").insert(batchDocs);

    if (insertError) {
      console.error(`Insert failed at batch starting ${i}:`, insertError.message);
      process.exit(1);
    }

    inserted += batchDocs.length;
    console.log(`Inserted ${inserted}/${allChunks.length} documents...`);
  }

  // ── Summary ──
  const withUrl = allChunks.filter((c) => c.url !== "manual").length;
  console.log(`\nDone! Ingested ${inserted} chunks for "${storeId}" from ${sections.length} sections.`);
  console.log(`  ${withUrl} chunks have product/guide URLs in metadata`);
  console.log(`  ${inserted - withUrl} chunks have generic "manual" source`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
