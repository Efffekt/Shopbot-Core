import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";

export const revalidate = 3600; // ISR: revalidate every hour

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
  content: string;
  author_name: string;
  published_at: string;
  cover_image_url: string | null;
}

function getReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const POSTS_PER_PAGE = 6;

export default async function BloggPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const { side } = await searchParams;
  const currentPage = Math.max(1, parseInt(side || "1", 10) || 1);
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  const [{ data: posts }, { count }] = await Promise.all([
    supabaseAdmin
      .from("blog_posts")
      .select("id, slug, title, excerpt, content, author_name, published_at, cover_image_url")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1),
    supabaseAdmin
      .from("blog_posts")
      .select("*", { count: "exact", head: true })
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString()),
  ]);

  const blogPosts = (posts || []) as BlogPost[];
  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);

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
                  <div className="relative w-full h-48">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 896px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <article className="p-8">
                  <div className="flex items-center gap-2 text-sm text-preik-text-muted">
                    <time>
                      {new Date(post.published_at).toLocaleDateString("nb-NO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span aria-hidden="true">&middot;</span>
                    <span>{getReadingTime(post.content)} min</span>
                  </div>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {currentPage > 1 && (
              <Link
                href={currentPage === 2 ? "/blogg" : `/blogg?side=${currentPage - 1}`}
                className="px-4 py-2 text-sm rounded-xl bg-preik-surface border border-preik-border text-preik-text hover:bg-preik-bg transition-colors"
              >
                &larr; Forrige
              </Link>
            )}
            <span className="text-sm text-preik-text-muted px-2">
              Side {currentPage} av {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/blogg?side=${currentPage + 1}`}
                className="px-4 py-2 text-sm rounded-xl bg-preik-surface border border-preik-border text-preik-text hover:bg-preik-bg transition-colors"
              >
                Neste &rarr;
              </Link>
            )}
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
