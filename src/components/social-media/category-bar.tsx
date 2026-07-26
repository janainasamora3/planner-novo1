"use client";

import { useState } from "react";
import type { Category } from "@/lib/categories";

interface CategoryBarProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (category: Category) => void;
}

export function CategoryBar({
  categories,
  selectedId,
  onSelect,
  onEdit,
}: CategoryBarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  function handleContextMenu(e: React.MouseEvent, cat: Category) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id: cat.id });
  }

  return (
    <>
      <nav className="flex flex-wrap gap-3">
        {sorted.map((cat) => {
          const isActive = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isActive ? "" : cat.id)}
              onContextMenu={(e) => handleContextMenu(e, cat)}
              className="group relative flex flex-col items-center justify-center gap-1.5 w-[110px] h-[110px] rounded-xl text-xs font-medium transition-all overflow-hidden"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${cat.color} 0%, #0a0a0a 100%)`
                  : `${cat.color}26`,
                border: isActive
                  ? `2px solid ${cat.color}`
                  : `1px solid ${cat.color}55`,
                color: "#fff",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${cat.color}40`;
                  e.currentTarget.style.borderColor = `${cat.color}aa`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${cat.color}26`;
                  e.currentTarget.style.borderColor = `${cat.color}55`;
                }
              }}
              title="Clique direito para editar"
            >
              {/* Glow interno sutil */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 20%, ${cat.color}80 0%, transparent 60%)`,
                }}
              />
              {/* Ícone grande no topo */}
              <span className="relative text-3xl leading-none drop-shadow-lg">
                {cat.emoji}
              </span>
              {/* Nome embaixo */}
              <span className="relative text-center px-1 leading-tight font-medium">
                {cat.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Menu de contexto (clique direito) */}
      {contextMenu && (
        <>
          {/* Overlay pra fechar ao clicar fora */}
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
                const cat = categories.find((c) => c.id === contextMenu.id);
                if (cat) onEdit(cat);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Editar menu
            </button>
          </div>
        </>
      )}
    </>
  );
}
