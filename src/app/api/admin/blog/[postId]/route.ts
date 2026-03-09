import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const MAX_CONTENT_LENGTH = 500_000; // 500KB max blog content

const blogPostUpdateSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only").optional(),
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(1000).nullable().optional(),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH).optional(),
  author_name: z.string().min(1).max(200).optional(),
  published_at: z.string().datetime().nullable().optional(),
  meta_title: z.string().max(200).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  cover_image_url: z.string().url().max(2000).nullable().optional(),
});

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

    return NextResponse.json({ post });
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
  const { authorized, error: authError, email } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  try {
    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = blogPostUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { slug, title, excerpt, content, author_name, published_at, meta_title, meta_description, cover_image_url } = parsed.data;

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

    await logAudit({
      actorEmail: email || "unknown",
      action: "update",
      entityType: "blog_post",
      entityId: postId,
      details: { updatedFields: Object.keys(body) },
    });

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
  const { authorized, error: authError, email } = await verifyAdmin();
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

    await logAudit({
      actorEmail: email || "unknown",
      action: "delete",
      entityType: "blog_post",
      entityId: postId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
