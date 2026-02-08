import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import BlogPostContent from "./BlogPostContent";

const SITE_URL = "https://preik.no";

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
