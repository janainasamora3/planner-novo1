"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePlanejamento } from "@/hooks/use-planejamento";
import type { PlanejamentoItem } from "@/lib/planejamento";
import { PlanejamentoItemEditor } from "@/components/dashboard/planejamento-item-editor";
import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * Página /planejamento — menu grande com os 27 cards.
 * Cada card é clicável e leva à sua própria página em /planejamento/[itemId].
 */
export default function PlanejamentoPage() {
  const router = useRouter();
  const { items, addItem, updateItem, removeItem, resetAll } = usePlanejamento();
  const { toast } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = items.find((i) => i.id === editingId) || null;

  function openEditorNewItem() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function handleSubmit(data: {
    title: string;
    emoji: string;
    color: string;
    imageUrl: string;
    content: string;
  }) {
    if (editingId) {
      updateItem(editingId, data);
      toast({ title: "Card atualizado", description: data.title });
    } else {
      const created = addItem(data);
      toast({ title: "Card criado", description: data.title });
      router.push(`/planejamento/${created.id}`);
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const item = items.find((i) => i.id === id);
    removeItem(id);
    toast({
      title: "Card excluído",
      description: item?.title,
      variant: "destructive",
    });
  }

  function handleReset() {
    if (confirm("Restaurar cards padrão do Planejamento? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Cards restaurados" });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="h-9 w-9 rounded-md border border-border hover:bg-muted flex items-center justify-center transition-colors shrink-0"
              aria-label="Voltar ao dashboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <span className="text-2xl">🗓️</span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold leading-tight truncate">
                Planejamento
              </h1>
              <p className="text-xs text-muted-foreground/80">
                {items.length} cards · clique para abrir a página
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs sm:text-sm h-9"
            >
              Restaurar padrão
            </Button>
            <Button
              type="button"
              onClick={openEditorNewItem}
              className="bg-blue-600 hover:bg-blue-500 text-foreground border-0 h-9 text-xs sm:text-sm gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Novo card
            </Button>
          </div>
        </div>
      </header>

      {/* Grade de cards */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          }}
        >
          {items.map((item) => (
            <PlanejamentoSubCardLink
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingId(item.id);
                setEditorOpen(true);
              }}
            />
          ))}

          {/* Card "Novo" ao final da grade */}
          <button
            type="button"
            onClick={openEditorNewItem}
            className={cn(
              "group flex flex-col items-center justify-center gap-2 rounded-xl",
              "border border-dashed bg-transparent",
              "aspect-square w-full",
              "transition-all duration-200",
              "border-border hover:border-blue-500/40 hover:bg-blue-500/[0.03]"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/70 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[11px] text-muted-foreground/70 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
              Novo card
            </span>
          </button>
        </div>

        <footer className="mt-12 pt-4 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            {items.length} cards · Dados salvos localmente · Clique em um card para abrir sua página
          </p>
        </footer>
      </main>

      {/* Editor (dialog) — para criar/editar */}
      <PlanejamentoItemEditor
        key={`${editorOpen}-${editingId ?? "new"}`}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditingId(null);
        }}
        editingItem={editingItem}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

// ---------- Sub-card (Link para a página própria) ----------

function PlanejamentoSubCardLink({
  item,
  onEdit,
}: {
  item: PlanejamentoItem;
  onEdit: () => void;
}) {
  const color = item.color || "#1c1c1c";
  const isEmojiSingle = item.emoji && item.emoji.length <= 3 && !/\s/.test(item.emoji);
  const hasImage = !!item.imageUrl;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden",
        "bg-card border transition-all duration-200 ease-out",
        "card-glow card-enter",
        "aspect-[4/5] sm:aspect-square",
        "border-border hover:border-blue-500/40 hover:-translate-y-0.5"
      )}
    >
      {/* Link principal: abre a página própria */}
      <Link
        href={`/planejamento/${item.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Abrir página de ${item.title}`}
      />

      {/* Área de mídia */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <>
            <img
              src={item.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
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

        {/* Ícone principal */}
        {hasImage ? (
          item.emoji ? (
            <span className="absolute top-2 left-2 h-7 w-7 rounded-md bg-black/40 backdrop-blur-sm border border-border flex items-center justify-center text-base">
              {item.emoji}
            </span>
          ) : null
        ) : (
          <span
            className={cn(
              "relative select-none font-semibold text-white/95 drop-shadow-lg",
              isEmojiSingle ? "text-5xl" : "text-3xl tracking-tight"
            )}
          >
            {item.emoji || item.title.slice(0, 2).toUpperCase()}
          </span>
        )}

        {/* Botão de editar (canto superior direito) — aparece no hover */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 z-20 h-7 w-7 rounded-md bg-black/50 backdrop-blur-sm border border-border text-foreground/90 hover:bg-blue-600 hover:text-foreground flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Editar card"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Badge "atualizado" */}
        {item.updatedAt > item.createdAt && (
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500/80 group-hover:opacity-0 transition-opacity" />
        )}
      </div>

      {/* Label inferior */}
      <div className="relative px-3 py-2.5 text-center bg-card/95 backdrop-blur-sm">
        <p className="text-[13px] font-medium text-foreground/90 leading-tight line-clamp-2 group-hover:text-foreground">
          {item.title}
        </p>
      </div>
    </div>
  );
}
