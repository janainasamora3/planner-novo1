"use client";

import { useState } from "react";
import type { SubCategory } from "@/lib/subcategories";
import { cn } from "@/lib/utils";

interface SubCategoryBarProps {
  subcategories: SubCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (subcategory: SubCategory) => void;
}

export function SubCategoryBar({
  subcategories,
  selectedId,
  onSelect,
  onEdit,
}: SubCategoryBarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  function handleContextMenu(e: React.MouseEvent, sub: SubCategory) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id: sub.id });
  }

  return (
    <>
      <nav className="flex flex-wrap gap-0 border-b border-border">
        {subcategories.map((sub) => {
          const isActive = sub.id === selectedId;
          return (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              onContextMenu={(e) => handleContextMenu(e, sub)}
              className={cn(
                "group relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors -mb-px border-b-2",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{
                borderColor: isActive ? sub.color : "transparent",
              }}
              title="Clique direito para editar"
            >
              {sub.emoji && <span className="text-[13px] leading-none">{sub.emoji}</span>}
              <span>{sub.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Menu de contexto (clique direito) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed z-50 min-w-[160px] py-1.5 rounded-lg bg-popover border border-border shadow-2xl shadow-black/50"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 100),
            }}
          >
            <button
              type="button"
              onClick={() => {
                const sub = subcategories.find((s) => s.id === contextMenu.id);
                if (sub) onEdit(sub);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Editar sub-menu
            </button>
          </div>
        </>
      )}
    </>
  );
}
