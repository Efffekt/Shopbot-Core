import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/blog/[postId]");

// GET - Single post by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  try {
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post }, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    log.error("Error fetching blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  try {
    const body = await request.json();
    const { slug, title, excerpt, content, author_name, published_at, meta_title, meta_description, cover_image_url } = body;

    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase alphanumeric with hyphens only" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (slug !== undefined) updates.slug = slug;
    if (title !== undefined) updates.title = title;
    if (excerpt !== undefined) updates.excerpt = excerpt || null;
    if (content !== undefined) updates.content = content;
    if (author_name !== undefined) updates.author_name = author_name;
    if (published_at !== undefined) updates.published_at = published_at || null;
    if (meta_title !== undefined) updates.meta_title = meta_title || null;
    if (meta_description !== undefined) updates.meta_description = meta_description || null;
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url || null;

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .update(updates)
      .eq("id", postId)
      .select()
      .single();

    if (error) {
      log.error("Failed to update blog post:", error);
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    log.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  try {
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      log.error("Failed to delete blog post:", error);
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
