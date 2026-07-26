"use client";

import { useRef } from "react";
import type { Attachment } from "@/lib/client-detail";
import { cn } from "@/lib/utils";

interface AttachmentsListProps {
  attachments: Attachment[];
  onAdd: (file: Attachment) => void;
  onRemove: (id: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function AttachmentsList({
  attachments,
  onAdd,
  onRemove,
  accept,
  maxSizeMB = 5,
  className,
}: AttachmentsListProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande (máx ${maxSizeMB}MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      onAdd({
        id: `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data,
        createdAt: Date.now(),
      });
    };
    reader.onerror = () => alert("Falha ao ler arquivo.");
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {attachments.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/90 italic">
          Nenhum anexo nesta seção.
        </p>
      ) : (
        <ul className="space-y-1">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-muted/30"
            >
              <FileIcon mimeType={att.mimeType} />
              <a
                href={att.data}
                download={att.name}
                className="flex-1 min-w-0 text-xs text-foreground hover:text-primary hover:underline truncate"
                title={`Baixar ${att.name}`}
              >
                {att.name}
              </a>
              <span className="text-[10px] text-muted-foreground/90 shrink-0">
                {formatSize(att.size)}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remover "${att.name}"?`)) onRemove(att.id);
                }}
                className="h-5 w-5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0"
                aria-label="Remover anexo"
                title="Remover"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Anexar arquivo
      </button>
    </div>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <span className="text-sm">🖼️</span>;
  if (mimeType === "application/pdf") return <span className="text-sm">📄</span>;
  if (mimeType.includes("word") || mimeType.includes("msword")) return <span className="text-sm">📝</span>;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <span className="text-sm">📊</span>;
  if (mimeType.startsWith("video/")) return <span className="text-sm">🎬</span>;
  if (mimeType.startsWith("audio/")) return <span className="text-sm">🎵</span>;
  if (mimeType === "application/zip" || mimeType.includes("compressed")) return <span className="text-sm">🗜️</span>;
  return <span className="text-sm">📎</span>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
