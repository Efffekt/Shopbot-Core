import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

const addContentSchema = z.object({
  text: z.string().min(1, "Text is required"),
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

// GET - List all content for tenant
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("documents")
      .select("id, content, metadata, created_at", { count: "exact" })
      .eq("store_id", tenantId);

    // Add search filter if provided
    if (search) {
      query = query.ilike("content", `%${search}%`);
    }

    // Get documents with pagination
    const { data: documents, count: totalCount, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      documents: documents || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      search,
    });
  } catch (error) {
    console.error("Content list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// POST - Add new content
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access || access.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - Admin role required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = addContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, url, title } = parsed.data;

    // Split text into chunks
    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to process" },
        { status: 400 }
      );
    }

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
      store_id: tenantId,
      metadata: {
        source: url || "manual",
        title: title || "Manuell inntasting",
        manual: true,
        added_by: user.id,
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

    return NextResponse.json({
      success: true,
      message: `Lagret ${chunks.length} chunks`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error("Content add error:", error);
    return NextResponse.json(
      { error: "Failed to add content" },
      { status: 500 }
    );
  }
}

// DELETE - Remove content by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access || access.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - Admin role required" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    // Verify document belongs to tenant before deleting
    const { data: doc } = await supabaseAdmin
      .from("documents")
      .select("id, store_id")
      .eq("id", documentId)
      .single();

    if (!doc || doc.store_id !== tenantId) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      console.error("Error deleting document:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    console.error("Content delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
