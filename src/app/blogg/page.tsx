import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blogg | Preik",
  description: "Les artikler om AI, chatbots og norsk teknologi fra Preik.",
  openGraph: {
    title: "Blogg | Preik",
    description: "Les artikler om AI, chatbots og norsk teknologi fra Preik.",
    url: "https://preik.no/blogg",
    type: "website",
  },
  alternates: {
    canonical: "https://preik.no/blogg",
  },
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author_name: string;
  published_at: string;
  cover_image_url: string | null;
}

export default async function BloggPage() {
  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("id, slug, title, excerpt, author_name, published_at, cover_image_url")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  const blogPosts = (posts || []) as BlogPost[];

  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-6 border-b border-preik-border">
        <Link href="/" className="preik-wordmark text-2xl">
          preik
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-brand font-light text-preik-text mb-4">
          Blogg
        </h1>
        <p className="text-lg text-preik-text-muted mb-12">
          Artikler om AI, chatbots og norsk teknologi.
        </p>

        {blogPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-preik-text-muted">
              Ingen artikler publisert ennå. Kom tilbake snart!
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blogg/${post.slug}`}
                className="block bg-preik-surface rounded-2xl border border-preik-border overflow-hidden hover:border-preik-accent/30 transition-colors group"
              >
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <article className="p-8">
                  <time className="text-sm text-preik-text-muted">
                    {new Date(post.published_at).toLocaleDateString("nb-NO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <h2 className="text-2xl font-semibold text-preik-text mt-2 mb-3 group-hover:text-preik-accent transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-preik-text-muted leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-preik-text-muted">
                      {post.author_name}
                    </span>
                    <span className="text-sm text-preik-accent font-medium group-hover:underline">
                      Les mer &rarr;
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-preik-border">
          <Link
            href="/"
            className="text-preik-accent hover:text-preik-accent-hover transition-colors"
          >
            &larr; Tilbake til forsiden
          </Link>
        </div>
      </main>
    </div>
  );
}
