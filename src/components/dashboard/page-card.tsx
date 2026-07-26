"use client";

import { cn } from "@/lib/utils";
import type { PageCard } from "@/lib/pages";

interface PageCardItemProps {
  page: PageCard;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  // DnD
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

/**
 * Card estilo "Notion dark" — bloco quadrado com gradiente/emoji no topo
 * e label embaixo. Se houver imageUrl, a imagem vira a capa (com overlay
 * escuro para legibilidade do texto).
 */
export function PageCardItem({
  page,
  onOpen,
  onContextMenu,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: PageCardItemProps) {
  const color = page.color || "#1c1c1c";
  const isEmojiSingle = page.emoji && page.emoji.length <= 3 && !/\s/.test(page.emoji);
  const hasImage = !!page.imageUrl;

  return (
    <button
      type="button"
      onClick={onOpen}
      onContextMenu={onContextMenu}
      // DnD nativo
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-page-id={page.id}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden",
        "bg-card border transition-all duration-200 ease-out",
        "card-glow card-enter",
        "aspect-[4/5] sm:aspect-square",
        isDragging
          ? "border-blue-500/60 opacity-40 scale-95"
          : isDragOver
            ? "border-blue-500/70 ring-2 ring-blue-500/30 -translate-y-0.5"
            : "border-border hover:border-foreground/25 hover:-translate-y-0.5",
        onDragStart && "cursor-grab active:cursor-grabbing"
      )}
      style={{ width: "100%" }}
    >
      {/* Área de mídia (gradient + emoji OU imagem de capa) */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <>
            <img
              src={page.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            {/* Overlay escuro no rodapé para legibilidade do label */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* Reflexo sutil no topo */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.06] to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${color}33 0%, transparent 60%), linear-gradient(135deg, ${color} 0%, #0a0a0a 100%)`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.04] to-transparent" />
          </div>
        )}

        {/* Ícone principal (emoji) — só mostra se NÃO houver imagem,
            ou se houver imagem, mostra como badge discreto no canto */}
        {hasImage ? (
          page.emoji ? (
            <span className="absolute top-2 left-2 h-7 w-7 rounded-md bg-black/40 backdrop-blur-sm border border-border flex items-center justify-center text-base">
              {page.emoji}
            </span>
          ) : null
        ) : (
          <span
            className={cn(
              "relative select-none font-semibold text-foreground/95 drop-shadow-lg",
              isEmojiSingle ? "text-5xl" : "text-3xl tracking-tight"
            )}
          >
            {page.emoji || page.title.slice(0, 2).toUpperCase()}
          </span>
        )}

        {/* Badge "atualizado" */}
        {page.updatedAt > page.createdAt && (
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500/80" />
        )}
      </div>

      {/* Label inferior */}
      <div className="relative px-3 py-2.5 text-center bg-card/95 backdrop-blur-sm">
        <p className="text-[13px] font-medium text-foreground/85 leading-tight line-clamp-2 group-hover:text-foreground">
          {page.title}
        </p>
      </div>
    </button>
  );
}

/**
 * Card vazio "+ Nova página" — estilo tracejado discreto.
 * Também funciona como drop target (anexa ao fim da seção).
 */
export function NewPageCard({
  onClick,
  isDragOver = false,
  onDragOver,
  onDrop,
}: {
  onClick: () => void;
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 rounded-xl",
        "border border-dashed bg-transparent",
        "aspect-[4/5] sm:aspect-square w-full",
        "transition-all duration-200",
        isDragOver
          ? "border-blue-500/70 bg-blue-500/[0.06] ring-2 ring-blue-500/20"
          : "border-border hover:border-blue-500/40 hover:bg-blue-500/[0.03]"
      )}
    >
      <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-foreground/65 group-hover:text-blue-400 transition-colors">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[11px] text-foreground/65 group-hover:text-blue-400 transition-colors">
        Nova página
      </span>
    </button>
  );
}
