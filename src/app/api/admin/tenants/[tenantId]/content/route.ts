import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySuperAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

// GET - List content for tenant (admin access)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get("grouped") === "true";
    const source = searchParams.get("source");

    // Single source mode
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
        source,
        title,
        fullText,
        chunkCount: docs?.length || 0,
      });
    }

    // Grouped mode
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
        sources: Array.from(groups.values()),
        totalSources: groups.size,
      });
    }

    return NextResponse.json({ error: "Use ?grouped=true or ?source=X" }, { status: 400 });
  } catch (error) {
    console.error("Admin content list error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

// DELETE - Remove content by source
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { authorized, error: authError } = await verifySuperAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");

    if (!source) {
      return NextResponse.json({ error: "source parameter required" }, { status: 400 });
    }

    const { data: docs } = await supabaseAdmin
      .from("documents")
      .select("id")
      .eq("store_id", tenantId)
      .eq("metadata->>source", source);

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "No documents found for this source" }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("store_id", tenantId)
      .eq("metadata->>source", source);

    if (deleteError) {
      console.error("Error deleting documents:", deleteError);
      return NextResponse.json({ error: "Failed to delete documents" }, { status: 500 });
    }

    return NextResponse.json({
      message: `Slettet ${docs.length} deler`,
      deletedCount: docs.length,
    });
  } catch (error) {
    console.error("Admin content delete error:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
