"use client";

import { useEffect, useRef, useState } from "react";

interface ContextMenuState {
  x: number;
  y: number;
  pageId: string;
}

interface CardContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
  onEdit: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
}

export function CardContextMenu({
  state,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}: CardContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  // Ajusta para não sair da viewport
  const x = Math.min(state.x, typeof window !== "undefined" ? window.innerWidth - 200 : state.x);
  const y = Math.min(state.y, typeof window !== "undefined" ? window.innerHeight - 160 : state.y);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] py-1.5 rounded-lg bg-popover border border-border shadow-2xl shadow-black/50"
      style={{ left: x, top: y }}
    >
      <MenuItem
        onClick={() => {
          onEdit(state.pageId);
          onClose();
        }}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        label="Editar"
      />
      <MenuItem
        onClick={() => {
          onDuplicate(state.pageId);
          onClose();
        }}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        }
        label="Duplicar"
      />
      <div className="my-1 h-px bg-accent" />
      <MenuItem
        onClick={() => {
          onDelete(state.pageId);
          onClose();
        }}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        label="Excluir"
        danger
      />
    </div>
  );
}

function MenuItem({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-foreground/80 hover:bg-accent hover:text-foreground"
      }`}
    >
      <span className="opacity-80">{icon}</span>
      {label}
    </button>
  );
}

export type { ContextMenuState };
