"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

const FONT_FAMILIES = [
  { label: "Padrão", value: "" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Sans", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Mono", value: "'Courier New', monospace" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

const PRESET_COLORS = [
  "#ffffff", "#fbbf24", "#f87171", "#f97316",
  "#34d399", "#60a5fa", "#a78bfa", "#f472b6",
  "#9ca3af", "#000000",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva aqui...",
  minHeight = 240,
  className,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  const isReadyRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "rt-link" },
      }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rt-editor prose prose-invert max-w-none focus:outline-none",
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground"
        style={{ minHeight }}
      >
        Carregando editor...
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border border-border bg-background overflow-hidden", className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="rt-editor-wrapper" />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileImageRef = useRef<HTMLInputElement>(null);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("URL do link:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Imagem muito grande (máx 3MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1000;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.78);
        editor.chain().focus().setImage({ src: compressed }).run();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    if (fileImageRef.current) fileImageRef.current.value = "";
  }

  const btnClass = (active = false) =>
    cn(
      "h-8 w-8 rounded-md flex items-center justify-center text-sm transition-colors",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    );

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnClass()} title="Desfazer (Ctrl+Z)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 7v6h6M21 17a9 9 0 00-15-6.7L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnClass()} title="Refazer (Ctrl+Shift+Z)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 7v6h-6M3 17a9 9 0 0115-6.7L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <Divider />
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={cn(btnClass(editor.isActive("bold")), "font-bold")} title="Negrito (Ctrl+B)">B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn(btnClass(editor.isActive("italic")), "italic")} title="Itálico (Ctrl+I)">I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn(btnClass(editor.isActive("underline")), "underline")} title="Sublinhado (Ctrl+U)">U</button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={cn(btnClass(editor.isActive("strike")), "line-through")} title="Riscado">S</button>
      <Divider />
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={cn(btnClass(editor.isActive("paragraph")), "px-2 text-xs")} title="Parágrafo">P</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn(btnClass(editor.isActive("heading", { level: 1 })), "px-2 text-xs font-bold")} title="Título 1">H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn(btnClass(editor.isActive("heading", { level: 2 })), "px-2 text-xs font-bold")} title="Título 2">H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn(btnClass(editor.isActive("heading", { level: 3 })), "px-2 text-xs font-bold")} title="Título 3">H3</button>
      <Divider />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Lista com marcadores">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Lista numerada">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))} title="Citação">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7H4a3 3 0 00-3 3v7h7v-7H4c0-1.1.9-2 2-2h1V7zm10 0h-3a3 3 0 00-3 3v7h7v-7h-3c0-1.1.9-2 2-2h1V7z"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btnClass(editor.isActive("code"))} title="Código inline">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <Divider />
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btnClass(editor.isActive({ textAlign: "left" }))} title="Alinhar à esquerda">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 10H3M21 6H3M21 14H3M17 18H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btnClass(editor.isActive({ textAlign: "center" }))} title="Centralizar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 10H6M21 6H3M21 14H3M18 18H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btnClass(editor.isActive({ textAlign: "right" }))} title="Alinhar à direita">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 10h14M3 6h18M3 14h18M7 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={btnClass(editor.isActive({ textAlign: "justify" }))} title="Justificar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 10H3M21 6H3M21 14H3M21 18H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <Divider />
      <ColorPickerButton editor={editor} />
      <select
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        value={editor.getAttributes("textStyle").fontFamily || ""}
        className="h-8 px-2 rounded-md bg-muted/40 border border-border text-xs text-foreground hover:bg-muted"
        title="Fonte"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>{f.label}</option>
        ))}
      </select>
      <Divider />
      <button type="button" onClick={setLink} className={btnClass(editor.isActive("link"))} title="Inserir link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <input ref={fileImageRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <button type="button" onClick={() => fileImageRef.current?.click()} className={btnClass()} title="Inserir imagem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <Divider />
      <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={cn(btnClass(), "px-2 text-xs")} title="Limpar formatação">⨯</button>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function ColorPickerButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const currentColor = editor.getAttributes("textStyle").color as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-md flex items-center justify-center text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Cor do texto"
      >
        <span className="text-base font-bold" style={{ color: currentColor || "currentColor" }}>A</span>
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-50 p-2 rounded-md border border-border bg-popover shadow-lg">
          <div className="grid grid-cols-5 gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  editor.chain().focus().setColor(c).run();
                  setOpen(false);
                }}
                className="h-6 w-6 rounded-md border border-border"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setOpen(false);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground px-1.5"
            >
              Sem cor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
