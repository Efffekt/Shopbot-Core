import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import BlogPostContent from "./BlogPostContent";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_name: string;
  published_at: string;
  meta_title: string | null;
  meta_description: string | null;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const { data: post } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .single();

  return post as BlogPost | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Innlegg ikke funnet | Preik" };
  }

  return {
    title: post.meta_title || `${post.title} | Preik Blogg`,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author_name],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.published_at,
    author: {
      "@type": "Person",
      name: post.author_name,
    },
    publisher: {
      "@type": "Organization",
      name: "Preik",
      url: "https://preik.no",
    },
  };

  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="px-6 py-6 border-b border-preik-border">
        <Link href="/" className="preik-wordmark text-2xl">
          preik
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/blogg"
          className="text-sm text-preik-accent hover:text-preik-accent-hover transition-colors"
        >
          &larr; Alle innlegg
        </Link>

        <article className="mt-8">
          <header className="mb-10">
            <time className="text-sm text-preik-text-muted">
              {new Date(post.published_at).toLocaleDateString("nb-NO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <h1 className="text-4xl font-brand font-light text-preik-text mt-2 mb-4">
              {post.title}
            </h1>
            <p className="text-preik-text-muted">{post.author_name}</p>
          </header>

          <BlogPostContent content={post.content} />
        </article>

        <div className="mt-12 pt-8 border-t border-preik-border">
          <Link
            href="/blogg"
            className="text-preik-accent hover:text-preik-accent-hover transition-colors"
          >
            &larr; Tilbake til bloggen
          </Link>
        </div>
      </main>
    </div>
  );
}
