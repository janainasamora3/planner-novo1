"use client";

import { cn } from "@/lib/utils";
import type { PageCard, SectionId } from "@/lib/pages";
import { PageCardItem, NewPageCard } from "./page-card";

interface PageSectionProps {
  sectionId: SectionId;
  title: string;
  count: number;
  pages: PageCard[];
  onAdd: () => void;
  onOpenPage: (page: PageCard) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
  // DnD — repassados para cada card
  dragState: {
    draggingId: string | null;
    dragOverCardId: string | null;
    dragOverSection: SectionId | null;
  };
  onCardDragStart: (e: React.DragEvent, page: PageCard) => void;
  onCardDragEnd: (e: React.DragEvent) => void;
  onCardDragOver: (e: React.DragEvent, page: PageCard) => void;
  onCardDrop: (e: React.DragEvent, page: PageCard) => void;
  onSectionDragOver: (e: React.DragEvent, sectionId: SectionId) => void;
  onSectionDrop: (e: React.DragEvent, sectionId: SectionId) => void;
}

export function PageSection({
  sectionId,
  title,
  count,
  pages,
  onAdd,
  onOpenPage,
  onContextMenu,
  dragState,
  onCardDragStart,
  onCardDragEnd,
  onCardDragOver,
  onCardDrop,
  onSectionDragOver,
  onSectionDrop,
}: PageSectionProps) {
  const isSectionDragOver = dragState.dragOverSection === sectionId;

  return (
    <section
      data-section={sectionId}
      className={cn(
        "flex-1 min-w-0 scroll-mt-20 rounded-xl transition-colors",
        isSectionDragOver && "bg-blue-500/[0.03]"
      )}
      onDragOver={(e) => onSectionDragOver(e, sectionId)}
      onDrop={(e) => onSectionDrop(e, sectionId)}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground/60 uppercase tracking-wider">
            {title}
          </h2>
          <span className="text-xs text-foreground/55 bg-accent px-1.5 py-0.5 rounded-md">
            {count}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {pages.map((page) => (
          <PageCardItem
            key={page.id}
            page={page}
            onOpen={() => onOpenPage(page)}
            onContextMenu={(e) => onContextMenu(e, page.id)}
            isDragging={dragState.draggingId === page.id}
            isDragOver={dragState.dragOverCardId === page.id}
            onDragStart={(e) => onCardDragStart(e, page)}
            onDragEnd={onCardDragEnd}
            onDragOver={(e) => onCardDragOver(e, page)}
            onDrop={(e) => onCardDrop(e, page)}
          />
        ))}
        <NewPageCard
          onClick={onAdd}
          isDragOver={isSectionDragOver}
          onDragOver={(e) => onSectionDragOver(e, sectionId)}
          onDrop={(e) => onSectionDrop(e, sectionId)}
        />
      </div>
    </section>
  );
}
