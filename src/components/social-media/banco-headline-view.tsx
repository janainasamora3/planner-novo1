"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHeadlines } from "@/hooks/use-headlines";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_HEADLINE_CATEGORIES,
  type Headline,
  type HeadlineCategory,
} from "@/lib/headlines";
import { HeadlineEditorDialog } from "./headline-editor-dialog";
import { cn } from "@/lib/utils";

interface DragState {
  draggingId: string | null;
  dragOverId: string | null;
}

export function BancoHeadlineView() {
  const {
    headlines,
    addHeadline,
    updateHeadline,
    removeHeadline,
    toggleFavorite,
    moveHeadline,
    resetAll,
  } = useHeadlines();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("todas");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    draggingId: null,
    dragOverId: null,
  });

  const editingHeadline = useMemo(
    () => headlines.find((h) => h.id === editingId) ?? null,
    [headlines, editingId]
  );

  const sorted = useMemo(
    () => [...headlines].sort((a, b) => a.order - b.order),
    [headlines]
  );

  // Contagem por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: headlines.length };
    for (const cat of DEFAULT_HEADLINE_CATEGORIES) {
      counts[cat.id] = headlines.filter((h) => h.categoryId === cat.id).length;
    }
    return counts;
  }, [headlines]);

  const favoriteCount = useMemo(
    () => headlines.filter((h) => h.favorite).length,
    [headlines]
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return sorted.filter((h) => {
      if (showOnlyFavorites && !h.favorite) return false;
      if (filterCategory !== "todas" && h.categoryId !== filterCategory) return false;
      if (s && !h.text.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [sorted, search, filterCategory, showOnlyFavorites]);

  function getCategory(id: string): HeadlineCategory | undefined {
    return DEFAULT_HEADLINE_CATEGORIES.find((c) => c.id === id);
  }

  function openNew() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setEditorOpen(true);
  }

  function handleSubmit(data: { text: string; categoryId: string; favorite: boolean }) {
    if (editingId) {
      updateHeadline(editingId, data);
      toast({ title: "Headline atualizada" });
    } else {
      addHeadline(data);
      toast({ title: "Headline criada" });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    removeHeadline(id);
    toast({ title: "Headline excluída", variant: "destructive" });
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado para a área de transferência" });
    } catch {
      toast({ title: "Falha ao copiar", variant: "destructive" });
    }
  }

  function handleReset() {
    if (confirm("Restaurar headlines padrão? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Headlines restauradas" });
    }
  }

  // ----- Drag & Drop -----

  function handleDragStart(e: React.DragEvent, h: Headline) {
    setDragState({ draggingId: h.id, dragOverId: null });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", h.id);
  }

  function handleDragEnd() {
    setDragState({ draggingId: null, dragOverId: null });
  }

  function handleDragOver(e: React.DragEvent, target: Headline) {
    if (!dragState.draggingId) return;
    if (dragState.draggingId === target.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragState((prev) =>
      prev.dragOverId === target.id ? prev : { ...prev, dragOverId: target.id }
    );
  }

  function handleDrop(e: React.DragEvent, target: Headline) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = dragState.draggingId;
    if (!sourceId || sourceId === target.id) {
      handleDragEnd();
      return;
    }
    moveHeadline(sourceId, target.id);
    toast({ title: "Headline movida" });
    handleDragEnd();
  }

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              📋 Banco de Headline
            </h1>
            <p className="text-xs text-foreground/70 mt-0.5">
              {headlines.length} headlines · {favoriteCount} favoritas · Inspirações de copy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="text-foreground/70 hover:text-foreground"
            >
              Restaurar
            </Button>
            <Button
              size="sm"
              onClick={openNew}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              + Nova headline
            </Button>
          </div>
        </div>

        {/* Busca */}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar headline..."
          className="h-9 max-w-md text-sm bg-card border-border"
        />

        {/* Filtros por categoria */}
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip
            label="Todas"
            count={categoryCounts.todas}
            color="#1c1917"
            active={filterCategory === "todas" && !showOnlyFavorites}
            onClick={() => {
              setFilterCategory("todas");
              setShowOnlyFavorites(false);
            }}
          />
          <CategoryChip
            label="⭐ Favoritas"
            count={favoriteCount}
            color="#a16207"
            active={showOnlyFavorites}
            onClick={() => setShowOnlyFavorites((v) => !v)}
          />
          {DEFAULT_HEADLINE_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.label}
              count={categoryCounts[cat.id] ?? 0}
              color={cat.color}
              active={filterCategory === cat.id && !showOnlyFavorites}
              onClick={() => {
                setFilterCategory(cat.id);
                setShowOnlyFavorites(false);
              }}
            />
          ))}
        </div>

        {/* Lista de headlines */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-lg border border-dashed border-border">
            <div className="text-4xl mb-3 opacity-60">📋</div>
            <p className="text-sm text-foreground/80 mb-4">
              {headlines.length === 0
                ? "Nenhuma headline cadastrada. Crie a primeira!"
                : "Nenhuma headline encontrada com esses filtros."}
            </p>
            <Button
              size="sm"
              onClick={openNew}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              + Nova headline
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => {
              const cat = getCategory(h.categoryId);
              const isDragging = dragState.draggingId === h.id;
              const isDragOver = dragState.dragOverId === h.id;
              return (
                <HeadlineCard
                  key={h.id}
                  headline={h}
                  category={cat}
                  isDragging={isDragging}
                  isDragOver={isDragOver}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onToggleFavorite={() => toggleFavorite(h.id)}
                  onCopy={() => handleCopy(h.text)}
                  onEdit={() => openEdit(h.id)}
                  onDelete={() => handleDelete(h.id)}
                />
              );
            })}
          </div>
        )}

        {/* Dica de drag */}
        {filtered.length > 0 && (
          <p className="text-[11px] text-foreground/60 text-center pt-2">
            💡 Dica: arraste os cards para reordenar as headlines
          </p>
        )}
      </div>

      <HeadlineEditorDialog
        key={`hd-${editorOpen}-${editingId ?? "new"}`}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditingId(null);
        }}
        editingHeadline={editingHeadline}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function CategoryChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors",
        active
          ? "text-white"
          : "bg-card text-foreground/80 border-border hover:bg-accent hover:text-foreground"
      )}
      style={
        active
          ? { background: color, borderColor: color }
          : { borderColor: `${color}55` }
      }
    >
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span>{label}</span>
      <span className={cn("text-[10px]", active ? "text-foreground/80" : "text-muted-foreground")}>
        ({count})
      </span>
    </button>
  );
}

function HeadlineCard({
  headline,
  category,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onToggleFavorite,
  onCopy,
  onEdit,
  onDelete,
}: {
  headline: Headline;
  category: HeadlineCategory | undefined;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, h: Headline) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, target: Headline) => void;
  onDrop: (e: React.DragEvent, target: Headline) => void;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const catColor = category?.color ?? "#3f3f46";
  const catLabel = category?.label ?? "Sem categoria";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, headline)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, headline)}
      onDrop={(e) => onDrop(e, headline)}
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing",
        headline.favorite
          ? "bg-amber-500/[0.10] border-amber-500/50"
          : "bg-card border-border",
        isDragging && "opacity-40 scale-[0.98]",
        isDragOver && "ring-2 ring-blue-500/60 -translate-y-0.5",
        "hover:border-foreground/30"
      )}
    >
      {/* Indicador de drag (⋮⋮) — aparece no hover */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-foreground/60">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="8" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="8" cy="12" r="1.2" />
        </svg>
      </div>

      {/* Tag de categoria */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0"
        style={{
          background: `${catColor}40`,
          color: catColor,
          border: `1px solid ${catColor}80`,
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: catColor }}
        />
        {catLabel}
      </div>

      {/* Texto da headline */}
      <p className="flex-1 text-sm text-foreground leading-snug">
        {headline.text}
      </p>

      {/* Botão favoritar (estrela) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center text-sm transition-colors shrink-0",
          headline.favorite
            ? "text-amber-400 hover:bg-amber-500/15"
            : "text-foreground/60 hover:text-amber-400 hover:bg-amber-500/15 opacity-0 group-hover:opacity-100"
        )}
        title={headline.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        {headline.favorite ? "⭐" : "☆"}
      </button>

      {/* Ações */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="h-7 w-7 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          title="Copiar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-7 w-7 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          title="Editar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Excluir esta headline?")) onDelete();
          }}
          className="h-7 w-7 rounded-md text-foreground/70 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          title="Excluir"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
