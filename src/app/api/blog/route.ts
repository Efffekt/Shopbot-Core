import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Public: list published posts only
export async function GET() {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id, slug, title, excerpt, author_name, published_at")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch published blog posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching published blog posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
