import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import BlogPostContent from "./BlogPostContent";

const SITE_URL = "https://preik.no";

function getReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_name: string;
  published_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  cover_image_url: string | null;
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

async function getAdjacentPosts(publishedAt: string, slug: string) {
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabaseAdmin
      .from("blog_posts")
      .select("slug, title")
      .not("published_at", "is", null)
      .lt("published_at", publishedAt)
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabaseAdmin
      .from("blog_posts")
      .select("slug, title")
      .not("published_at", "is", null)
      .gt("published_at", publishedAt)
      .neq("slug", slug)
      .order("published_at", { ascending: true })
      .limit(1)
      .single(),
  ]);
  return {
    prev: prev as { slug: string; title: string } | null,
    next: next as { slug: string; title: string } | null,
  };
}

async function getAuthorBio(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "blog_author_bio")
    .single();

  return data?.value || null;
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

  const canonicalUrl = `${SITE_URL}/blogg/${post.slug}`;

  return {
    title: post.meta_title || `${post.title} | Preik Blogg`,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      type: "article",
      url: canonicalUrl,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
    },
    twitter: {
      card: post.cover_image_url ? "summary_large_image" : "summary",
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, authorBio] = await Promise.all([getPost(slug), getAuthorBio()]);


  if (!post) {
    notFound();
  }

  const adjacentPosts = await getAdjacentPosts(post.published_at, post.slug);
  const canonicalUrl = `${SITE_URL}/blogg/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: "nb-NO",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    author: {
      "@type": "Person",
      name: post.author_name,
      ...(authorBio ? { description: authorBio } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Preik",
      url: SITE_URL,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Preik",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blogg",
        item: `${SITE_URL}/blogg`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-preik-bg transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
            <div className="flex items-center gap-3 text-sm text-preik-text-muted">
              <time>
                {new Date(post.published_at).toLocaleDateString("nb-NO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span aria-hidden="true">&middot;</span>
              <span>{getReadingTime(post.content)} min lesetid</span>
            </div>
            <h1 className="text-4xl font-brand font-light text-preik-text mt-2 mb-4">
              {post.title}
            </h1>
            <p className="text-preik-text-muted">{post.author_name}</p>
            {authorBio && (
              <p className="text-sm text-preik-text-muted mt-1">{authorBio}</p>
            )}
            {post.cover_image_url && (
              <div className="relative w-full aspect-[2/1] mt-6">
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                  className="object-cover rounded-2xl"
                />
              </div>
            )}
          </header>

          <BlogPostContent content={post.content} />
        </article>

        {/* Share buttons */}
        <div className="mt-12 pt-8 border-t border-preik-border">
          <p className="text-sm font-medium text-preik-text mb-3">Del denne artikkelen</p>
          <div className="flex items-center gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonicalUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-xl bg-preik-surface border border-preik-border text-preik-text-muted hover:text-preik-text hover:bg-preik-bg transition-colors"
            >
              X / Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-xl bg-preik-surface border border-preik-border text-preik-text-muted hover:text-preik-text hover:bg-preik-bg transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-xl bg-preik-surface border border-preik-border text-preik-text-muted hover:text-preik-text hover:bg-preik-bg transition-colors"
            >
              Facebook
            </a>
          </div>
        </div>

        {/* Previous / Next post */}
        {(adjacentPosts.prev || adjacentPosts.next) && (
          <div className="mt-8 pt-8 border-t border-preik-border grid sm:grid-cols-2 gap-4">
            {adjacentPosts.prev ? (
              <Link
                href={`/blogg/${adjacentPosts.prev.slug}`}
                className="group bg-preik-surface border border-preik-border rounded-xl p-4 hover:border-preik-accent/30 transition-colors"
              >
                <span className="text-xs text-preik-text-muted">&larr; Forrige</span>
                <p className="text-sm font-medium text-preik-text mt-1 group-hover:text-preik-accent transition-colors line-clamp-2">
                  {adjacentPosts.prev.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {adjacentPosts.next && (
              <Link
                href={`/blogg/${adjacentPosts.next.slug}`}
                className="group bg-preik-surface border border-preik-border rounded-xl p-4 hover:border-preik-accent/30 transition-colors text-right"
              >
                <span className="text-xs text-preik-text-muted">Neste &rarr;</span>
                <p className="text-sm font-medium text-preik-text mt-1 group-hover:text-preik-accent transition-colors line-clamp-2">
                  {adjacentPosts.next.title}
                </p>
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-preik-border">
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
