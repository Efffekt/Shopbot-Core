import { supabaseAdmin } from "@/lib/supabase";

const SITE_URL = "https://preik.ai";

export async function GET() {
  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title, excerpt, author_name, published_at, updated_at")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (posts || [])
    .map((post) => {
      const pubDate = new Date(post.published_at).toUTCString();
      const description = post.excerpt
        ? `<![CDATA[${post.excerpt}]]>`
        : "";
      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blogg/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blogg/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${post.author_name}]]></dc:creator>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = posts?.length
    ? new Date(posts[0].published_at).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Preik Blogg</title>
    <link>${SITE_URL}/blogg</link>
    <description>Artikler om AI, chatbots og norsk teknologi fra Preik.</description>
    <language>nb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/blogg/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
