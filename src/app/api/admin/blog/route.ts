import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { safeParseInt } from "@/lib/params";
import { createLogger } from "@/lib/logger";
import { validateJsonContentType } from "@/lib/validate-content-type";

const MAX_CONTENT_LENGTH = 500_000; // 500KB max blog content

const blogPostSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  title: z.string().min(1).max(500),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
  author_name: z.string().min(1).max(200),
  published_at: z.string().datetime().nullable().optional(),
  meta_title: z.string().max(200).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  cover_image_url: z.string().url().max(2000).nullable().optional(),
});

const log = createLogger("api/admin/blog");

// GET - List all posts (published + drafts) for admin panel
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = safeParseInt(searchParams.get("page"), 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 50, 100);
    const offset = (page - 1) * limit;

    const { data: posts, error, count } = await supabaseAdmin
      .from("blog_posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error("Failed to fetch blog posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    return NextResponse.json({ posts, total: count || 0, page, limit });
  } catch (error) {
    log.error("Error fetching blog posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  const { authorized, error: authError, email } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = blogPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { slug, title, excerpt, content, author_name, published_at, meta_title, meta_description, cover_image_url } = parsed.data;

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        slug,
        title,
        excerpt: excerpt || null,
        content,
        author_name,
        published_at: published_at || null,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        cover_image_url: cover_image_url || null,
      })
      .select()
      .single();

    if (error) {
      log.error("Failed to create blog post:", error);
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    await logAudit({
      actorEmail: email || "unknown",
      action: "create",
      entityType: "blog_post",
      entityId: post.id,
      details: { slug, title },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    log.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
