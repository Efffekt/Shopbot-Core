import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/blog");

// GET - Public: list published posts only
export async function GET() {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id, slug, title, excerpt, author_name, published_at, cover_image_url")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      log.error("Failed to fetch published blog posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    return NextResponse.json({ posts }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    log.error("Error fetching published blog posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
