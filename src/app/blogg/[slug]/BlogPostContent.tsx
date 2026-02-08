"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
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
};

export default function BlogPostContent({ content }: { content: string }) {
  return (
    <div className="prose prose-preik max-w-none text-preik-text-muted [&_h1]:text-preik-text [&_h2]:text-preik-text [&_h3]:text-preik-text [&_h4]:text-preik-text [&_strong]:text-preik-text [&_a]:text-preik-accent [&_a:hover]:text-preik-accent-hover [&_code]:bg-preik-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-preik-surface [&_pre]:border [&_pre]:border-preik-border [&_pre]:rounded-xl [&_pre]:p-4 [&_blockquote]:border-l-4 [&_blockquote]:border-preik-accent/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-xl [&_table]:border-collapse [&_th]:border [&_th]:border-preik-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-preik-surface [&_td]:border [&_td]:border-preik-border [&_td]:px-3 [&_td]:py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
