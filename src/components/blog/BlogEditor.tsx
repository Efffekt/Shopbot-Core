"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  ImageIcon,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import BlogPostContent from "@/app/articles/[slug]/BlogPostContent";
import "./editor-styles.css";

interface BlogEditorProps {
  content: string;
  onContentChange: (md: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
  uploading: boolean;
}

type Tab = "edit" | "preview";

export default function BlogEditor({
  content,
  onContentChange,
  uploadImage,
  uploading,
}: BlogEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("edit");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "Begynn å skrive innholdet her...",
      }),
      Markdown.configure({
        html: false,
        linkify: false,
        transformPastedText: true,
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      const storage = (ed.storage as unknown as { markdown: MarkdownStorage });
      onContentChange(storage.markdown.getMarkdown());
    },
    editorProps: {
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;

        event.preventDefault();
        uploadImage(file).then((url) => {
          if (url) {
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src: url, alt: file.name });
            const pos = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (pos) {
              const tr = view.state.tr.insert(pos.pos, node);
              view.dispatch(tr);
            }
          }
        });
        return true;
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;

        event.preventDefault();
        uploadImage(file).then((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
          }
        });
        return true;
      },
    },
  });

  // Sync external content changes (e.g., switching between posts)
  useEffect(() => {
    if (!editor) return;
    const storage = (editor.storage as unknown as { markdown: MarkdownStorage });
    const currentMd = storage.markdown.getMarkdown();
    if (currentMd !== content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const handleImageInsert = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp,image/avif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await uploadImage(file);
      if (url && editor) {
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    };
    input.click();
  }, [editor, uploadImage]);

  const handleLinkInsert = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="blog-editor rounded-xl border border-preik-border bg-preik-surface overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-preik-border">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "edit"
              ? "text-preik-accent border-b-2 border-preik-accent"
              : "text-preik-text-muted hover:text-preik-text"
          }`}
        >
          Rediger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "text-preik-accent border-b-2 border-preik-accent"
              : "text-preik-text-muted hover:text-preik-text"
          }`}
        >
          Forh&aring;ndsvisning
        </button>
      </div>

      {/* Edit mode */}
      <div className={activeTab !== "edit" ? "hidden" : ""}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-preik-border bg-preik-bg/50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Overskrift 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Overskrift 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Fet (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Kursiv (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Punktliste"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Nummerert liste"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Sitat"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Kodeblokk"
          >
            <Code2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            active={false}
            title="Horisontal linje"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={handleImageInsert}
            active={false}
            title="Sett inn bilde"
            disabled={uploading}
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleLinkInsert}
            active={editor.isActive("link")}
            title="Sett inn lenke"
          >
            <Link2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
            disabled={!editor.can().undo()}
            title="Angre (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
            disabled={!editor.can().redo()}
            title="Gjenta (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>

          {uploading && (
            <span className="ml-2 text-xs text-preik-text-muted animate-pulse">
              Laster opp bilde...
            </span>
          )}
        </div>

        {/* Bubble menu on text selection */}
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 bg-preik-surface border border-preik-border rounded-lg shadow-lg p-1"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Fet"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Kursiv"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleLinkInsert}
            active={editor.isActive("link")}
            title="Lenke"
          >
            <Link2 className="w-3.5 h-3.5" />
          </ToolbarButton>
        </BubbleMenu>

        <EditorContent editor={editor} />
      </div>

      {/* Preview mode */}
      {activeTab === "preview" && (
        <div className="p-6">
          {content.trim() ? (
            <BlogPostContent content={content} />
          ) : (
            <p className="text-preik-text-muted text-sm italic">
              Ingen innhold å forhåndsvise
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-preik-accent/15 text-preik-accent"
          : "text-preik-text-muted hover:text-preik-text hover:bg-preik-surface"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-preik-border mx-1" />;
}
