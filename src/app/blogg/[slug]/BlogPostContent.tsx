"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface Heading {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"),
        id: slugify(match[2]),
      });
    }
  }
  return headings;
}

const MIN_HEADINGS_FOR_TOC = 3;

export default function BlogPostContent({ content }: { content: string }) {
  const [tocOpen, setTocOpen] = useState(true);
  const headings = useMemo(() => extractHeadings(content), [content]);
  const showToc = headings.length >= MIN_HEADINGS_FOR_TOC;

  const markdownComponents: Components = useMemo(
    () => ({
      img: ({ src, alt }) => {
        if (!src || typeof src !== "string") return null;
        return (
          <span className="block relative w-full aspect-video my-6">
            <Image
              src={src}
              alt={alt || ""}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain rounded-xl"
            />
          </span>
        );
      },
      h2: ({ children }) => {
        const text = typeof children === "string" ? children : String(children);
        const id = slugify(text);
        return (
          <h2 id={id} className="scroll-mt-24">
            {children}
          </h2>
        );
      },
      h3: ({ children }) => {
        const text = typeof children === "string" ? children : String(children);
        const id = slugify(text);
        return (
          <h3 id={id} className="scroll-mt-24">
            {children}
          </h3>
        );
      },
    }),
    []
  );

  return (
    <div>
      {showToc && (
        <nav
          aria-label="Innholdsfortegnelse"
          className="mb-8 bg-preik-surface rounded-2xl border border-preik-border p-5"
        >
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-preik-text">Innhold</span>
            <svg
              className={`w-4 h-4 text-preik-text-muted transition-transform ${tocOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {tocOpen && (
            <ol className="mt-3 space-y-1.5">
              {headings.map((h, i) => (
                <li key={i} className={h.level === 3 ? "ml-4" : ""}>
                  <a
                    href={`#${h.id}`}
                    className="text-sm text-preik-text-muted hover:text-preik-accent transition-colors"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </nav>
      )}

      <div className="prose prose-preik max-w-none text-preik-text-muted [&_h1]:text-preik-text [&_h2]:text-preik-text [&_h3]:text-preik-text [&_h4]:text-preik-text [&_strong]:text-preik-text [&_a]:text-preik-accent [&_a:hover]:text-preik-accent-hover [&_code]:bg-preik-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-preik-surface [&_pre]:border [&_pre]:border-preik-border [&_pre]:rounded-xl [&_pre]:p-4 [&_blockquote]:border-l-4 [&_blockquote]:border-preik-accent/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-xl [&_table]:border-collapse [&_th]:border [&_th]:border-preik-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-preik-surface [&_td]:border [&_td]:border-preik-border [&_td]:px-3 [&_td]:py-2">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
