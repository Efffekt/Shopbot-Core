import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { splitIntoChunks } from "@/lib/chunking";
import { z } from "zod";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { safeParseInt } from "@/lib/params";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const log = createLogger("api/tenant/content");

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

const addContentSchema = z.object({
  text: z.string().min(1, "Text is required"),
  url: z.string().optional(),
  title: z.string().optional(),
});

const editContentSchema = z.object({
  source: z.string().min(1, "Source is required"),
  text: z.string().min(1, "Text is required"),
  title: z.string().optional(),
});

async function verifyAccess(tenantId: string, requireAdmin = false) {
  const user = await getUser();
  if (!user) return { user: null, error: "Unauthorized", status: 401 };

  const supabase = await createSupabaseServerClient();
  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) return { user: null, error: "Forbidden", status: 403 };
  if (requireAdmin && access.role !== "admin") {
    return { user: null, error: "Forbidden - Admin role required", status: 403 };
  }

  return { user, error: null, status: 200 };
}

// GET - List content for tenant (supports grouped and source modes)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, error: authError, status } = await verifyAccess(tenantId);
  if (!user) return NextResponse.json({ error: authError }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get("grouped") === "true";
    const source = searchParams.get("source");

    // Single source mode: return all chunks for a source, joined as fullText
    if (source) {
      const { data: docs, error } = await supabaseAdmin
        .from("documents")
        .select("id, content, metadata, created_at")
        .eq("store_id", tenantId)
        .eq("metadata->>source", source)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const fullText = (docs || []).map((d) => d.content).join("\n\n");
      const title = docs?.[0]?.metadata?.title || "";

      return NextResponse.json({
        success: true,
        source,
        title,
        fullText,
        chunkCount: docs?.length || 0,
      }, {
        headers: { "Cache-Control": "private, max-age=120, stale-while-revalidate=60" },
      });
    }

    // Grouped mode: return documents grouped by source
    if (grouped) {
      const { data: docs, error } = await supabaseAdmin
        .from("documents")
        .select("id, content, metadata, created_at")
        .eq("store_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const groups = new Map<string, {
        source: string;
        title: string;
        chunkCount: number;
        preview: string;
        isManual: boolean;
        createdAt: string;
      }>();

      for (const doc of docs || []) {
        const src = doc.metadata?.source || "unknown";
        const existing = groups.get(src);
        if (existing) {
          existing.chunkCount++;
        } else {
          groups.set(src, {
            source: src,
            title: doc.metadata?.title || src,
            chunkCount: 1,
            preview: doc.content.substring(0, 200),
            isManual: !!doc.metadata?.manual,
            createdAt: doc.created_at,
          });
        }
      }

      return NextResponse.json({
        success: true,
        sources: Array.from(groups.values()),
        totalSources: groups.size,
      }, {
        headers: { "Cache-Control": "private, max-age=120, stale-while-revalidate=60" },
      });
    }

    // Default: paginated chunk list (legacy)
    const page = safeParseInt(searchParams.get("page"), 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 50, 200);
    const search = (searchParams.get("search")?.trim() || "").slice(0, 200);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("documents")
      .select("id, content, metadata, created_at", { count: "exact" })
      .eq("store_id", tenantId);

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.ilike("content", `%${escaped}%`);
    }

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
    }, {
      headers: { "Cache-Control": "private, max-age=120, stale-while-revalidate=60" },
    });
  } catch (error) {
    log.error("Content list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// POST - Add new content (with duplicate check)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, error: authError, status } = await verifyAccess(tenantId, true);
  if (!user) return NextResponse.json({ error: authError }, { status });

  try {
    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = addContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, url, title } = parsed.data;

    // Duplicate check: if URL provided, check if docs already exist for this source
    if (url) {
      const { data: existing } = await supabaseAdmin
        .from("documents")
        .select("id")
        .eq("store_id", tenantId)
        .eq("metadata->>source", url)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: "Innhold for denne URLen finnes allerede. Bruk rediger-funksjonen for å oppdatere." },
          { status: 409 }
        );
      }
    }

    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to process" },
        { status: 400 }
      );
    }

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
      abortSignal: AbortSignal.timeout(30_000),
    });

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

    await logAudit({ actorEmail: user.email || user.id, action: "create", entityType: "documents", entityId: tenantId, details: { chunks: chunks.length, source: url || "manual" } });

    return NextResponse.json({
      success: true,
      message: `Lagret ${chunks.length} deler`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    log.error("Content add error:", error);
    return NextResponse.json(
      { error: "Failed to add content" },
      { status: 500 }
    );
  }
}

// PATCH - Edit content by source (delete old chunks, re-chunk, re-embed)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, error: authError, status } = await verifyAccess(tenantId, true);
  if (!user) return NextResponse.json({ error: authError }, { status });

  try {
    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = editContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { source, text, title } = parsed.data;

    // Re-chunk and re-embed BEFORE deleting old data to minimize gap
    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to process" },
        { status: 400 }
      );
    }

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
      abortSignal: AbortSignal.timeout(30_000),
    });

    const isManual = source === "manual" || !source.startsWith("http");

    const documents = chunks.map((chunk, idx) => ({
      content: chunk,
      embedding: embeddings[idx],
      store_id: tenantId,
      metadata: {
        source,
        title: title || "Manuell inntasting",
        ...(isManual && { manual: true, added_by: user.id }),
      },
    }));

    // Collect old chunk IDs before modifying
    const { data: oldDocs } = await supabaseAdmin
      .from("documents")
      .select("id")
      .eq("store_id", tenantId)
      .eq("metadata->>source", source);
    const oldIds = (oldDocs || []).map((d: { id: string }) => d.id);

    // Insert new chunks first — if this fails, old content is preserved
    const { error: insertError } = await supabaseAdmin
      .from("documents")
      .insert(documents);

    if (insertError) {
      log.error("Error inserting updated documents:", insertError);
      return NextResponse.json(
        { error: "Failed to save updated content" },
        { status: 500 }
      );
    }

    // Delete old chunks by ID — new content is already safely saved
    if (oldIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("documents")
        .delete()
        .in("id", oldIds);

      if (deleteError) {
        log.warn("Old chunks not cleaned up (new content saved)", { error: deleteError.message });
      }
    }

    await logAudit({ actorEmail: user.email || user.id, action: "update", entityType: "documents", entityId: tenantId, details: { source, chunks: chunks.length } });

    return NextResponse.json({
      success: true,
      message: `Oppdatert med ${chunks.length} deler`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    log.error("Content edit error:", error);
    return NextResponse.json(
      { error: "Failed to edit content" },
      { status: 500 }
    );
  }
}

// DELETE - Remove content by ID or by source
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const { user, error: authError, status } = await verifyAccess(tenantId, true);
  if (!user) return NextResponse.json({ error: authError }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");
    const source = searchParams.get("source");

    // Delete by source: remove all chunks matching that source
    if (source) {
      const { data: docs } = await supabaseAdmin
        .from("documents")
        .select("id")
        .eq("store_id", tenantId)
        .eq("metadata->>source", source);

      if (!docs || docs.length === 0) {
        return NextResponse.json(
          { error: "No documents found for this source" },
          { status: 404 }
        );
      }

      const { error: deleteError } = await supabaseAdmin
        .from("documents")
        .delete()
        .eq("store_id", tenantId)
        .eq("metadata->>source", source);

      if (deleteError) {
        log.error("Error deleting documents by source:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete documents" },
          { status: 500 }
        );
      }

      await logAudit({ actorEmail: user.email || user.id, action: "delete", entityType: "documents", entityId: tenantId, details: { source, deletedCount: docs.length } });

      return NextResponse.json({
        success: true,
        message: `Slettet ${docs.length} deler`,
        deletedCount: docs.length,
      });
    }

    // Delete by ID (legacy)
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID or source required" },
        { status: 400 }
      );
    }

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
      log.error("Error deleting document:", deleteError);
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
    log.error("Content delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
