"use client";

import { useMemo, useState } from "react";
import { useLinks } from "@/hooks/use-links";
import { useToast } from "@/hooks/use-toast";
import type { LinkCategory } from "@/lib/links";
import { colorForIndex } from "@/lib/links";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESET_EMOJIS } from "@/lib/presets";
import { cn } from "@/lib/utils";

export function LinksView() {
  const {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    addLink,
    updateLink,
    removeLink,
    resetAll,
  } = useLinks();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<LinkCategory | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  // Aplica cor da paleta para categorias que não têm cor explícita
  const catsWithColor = useMemo(
    () =>
      sortedCats.map((c, idx) => ({
        ...c,
        color: c.color ?? colorForIndex(idx),
      })),
    [sortedCats]
  );

  const filteredCats = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return catsWithColor;
    return catsWithColor
      .map((c) => ({
        ...c,
        links: c.links.filter(
          (l) =>
            l.title.toLowerCase().includes(s) ||
            l.url.toLowerCase().includes(s) ||
            c.name.toLowerCase().includes(s)
        ),
      }))
      .filter((c) => c.links.length > 0 || c.name.toLowerCase().includes(s));
  }, [catsWithColor, search]);

  const totalLinks = categories.reduce((s, c) => s + c.links.length, 0);

  function openNewCategory() {
    setEditingCat(null);
    setDialogOpen(true);
  }

  function openEditCategory(cat: LinkCategory) {
    setEditingCat(cat);
    setDialogOpen(true);
  }

  function handleSubmitCategory(data: { name: string; emoji: string; color?: string }) {
    if (editingCat) {
      updateCategory(editingCat.id, data);
      toast({ title: "Categoria atualizada", description: data.name });
    } else {
      addCategory(data.name, data.emoji);
      toast({ title: "Categoria criada", description: data.name });
    }
    setEditingCat(null);
  }

  function handleDeleteCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (confirm(`Excluir categoria "${cat?.name}" e todos os seus links?`)) {
      removeCategory(id);
      toast({
        title: "Categoria excluída",
        description: cat?.name,
        variant: "destructive",
      });
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    if (!draggingId || draggingId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggingId;
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    moveCategory(sourceId, targetId);
    toast({ title: "Categoria movida" });
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleReset() {
    if (confirm("Restaurar categorias de links padrão? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Links restaurados" });
    }
  }

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔗</span>
              <h2 className="text-lg font-bold text-foreground">Links</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {categories.length} categorias · {totalLinks} links · Biblioteca de ferramentas e recursos
            </p>
          </div>
          <Button
            onClick={openNewCategory}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Nova categoria
          </Button>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar link, categoria ou URL..."
            className="h-9 pl-10 text-sm"
          />
        </div>

        {/* Grid de categorias */}
        {filteredCats.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <div className="text-5xl mb-3 opacity-40">🔗</div>
            <p className="text-base font-medium text-foreground mb-1">
              {search ? "Nenhum link encontrado" : "Nenhuma categoria ainda"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? "Tente outro termo de busca."
                : "Crie a primeira categoria com o botão acima."}
            </p>
            {!search && (
              <Button onClick={openNewCategory} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                + Nova categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCats.map((cat) => (
              <LinkCategoryCard
                key={cat.id}
                category={cat}
                isDragging={draggingId === cat.id}
                isDragOver={dragOverId === cat.id}
                onDragStart={(e) => handleDragStart(e, cat.id)}
                onDragOver={(e) => handleDragOver(e, cat.id)}
                onDrop={(e) => handleDrop(e, cat.id)}
                onDragEnd={handleDragEnd}
                onEdit={() => openEditCategory(cat)}
                onDelete={() => handleDeleteCategory(cat.id)}
                onAddLink={(title, url) => addLink(cat.id, { title, url })}
                onUpdateLink={(linkId, patch) => updateLink(cat.id, linkId, patch)}
                onRemoveLink={(linkId) => removeLink(cat.id, linkId)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Dica: arraste as categorias para reorganizar
          </p>
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
          >
            ↺ Restaurar demo
          </button>
        </div>
      </div>

      <LinkCategoryEditorDialog
        key={`cat-${dialogOpen}-${editingCat?.id ?? "new"}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingCat(null);
        }}
        editingCategory={editingCat}
        onSubmit={handleSubmitCategory}
      />
    </div>
  );
}

function LinkCategoryCard({
  category,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onEdit,
  onDelete,
  onAddLink,
  onUpdateLink,
  onRemoveLink,
}: {
  category: LinkCategory & { color: string };
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLink: (title: string, url: string) => void;
  onUpdateLink: (linkId: string, patch: { title?: string; url?: string }) => void;
  onRemoveLink: (linkId: string) => void;
}) {
  const color = category.color;
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = newTitle.trim();
    const u = newUrl.trim();
    if (!t || !u) return;
    onAddLink(t, normalizeUrl(u));
    setNewTitle("");
    setNewUrl("");
  }

  function startEditLink(linkId: string, title: string, url: string) {
    setEditingLinkId(linkId);
    setEditTitle(title);
    setEditUrl(url);
  }

  function saveEditLink() {
    if (!editingLinkId) return;
    const t = editTitle.trim();
    const u = editUrl.trim();
    if (t && u) {
      onUpdateLink(editingLinkId, { title: t, url: normalizeUrl(u) });
    }
    setEditingLinkId(null);
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all shadow-sm",
        isDragging ? "opacity-50 border-primary" : "border-border",
        isDragOver && !isDragging && "border-primary border-2"
      )}
    >
      {/* Header da categoria — fundo colorido suave + emoji grande + nome + contador + ações */}
      <div
        className="flex items-center justify-between gap-2 p-3 border-b"
        style={{
          background: `${color}15`,
          borderColor: `${color}30`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="h-8 w-8 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ background: `${color}25` }}
          >
            {category.emoji}
          </span>
          <span className="text-sm font-bold text-foreground truncate">
            {category.name}
          </span>
          <span
            className="text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums"
            style={{
              background: `${color}20`,
              color: color,
            }}
          >
            {category.links.length}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
            aria-label="Editar categoria"
            title="Editar categoria"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
            aria-label="Excluir categoria"
            title="Excluir categoria"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Lista de links */}
      <div className="p-2.5 space-y-1.5 max-h-96 overflow-y-auto">
        {category.links.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            Nenhum link ainda.
          </p>
        ) : (
          category.links.map((link) => {
            const isEditing = editingLinkId === link.id;
            return (
              <div
                key={link.id}
                className="group rounded-lg border border-border bg-background hover:border-primary/40 transition-colors overflow-hidden"
              >
                {isEditing ? (
                  <div className="p-2.5 space-y-1.5 bg-muted/30">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Título"
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setEditingLinkId(null)}
                        className="h-7 px-2.5 rounded text-xs text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveEditLink}
                        className="h-7 px-2.5 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5">
                    {/* Indicador colorido da categoria à esquerda */}
                    <span
                      className="h-9 w-1 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 py-0.5"
                    >
                      <div className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
                        {link.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {domainFromUrl(link.url)}
                      </div>
                    </a>
                    {/* Badge da categoria */}
                    <span
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: `${color}15`,
                        color: color,
                      }}
                      title={category.name}
                    >
                      {category.emoji} {category.name}
                    </span>
                    {/* Ações — sempre visíveis */}
                    <button
                      onClick={() => startEditLink(link.id, link.title, link.url)}
                      className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0"
                      aria-label="Editar link"
                      title="Editar link"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemoveLink(link.id)}
                      className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                      aria-label="Excluir link"
                      title="Excluir link"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Adicionar link inline — input + botão azul redondo */}
      <form
        onSubmit={handleAdd}
        className="p-2.5 border-t border-border bg-muted/20 space-y-1.5"
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título do link"
          className="h-8 text-sm"
        />
        <div className="flex gap-1.5">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="h-8 text-sm flex-1"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-sm"
            aria-label="Adicionar link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}

function LinkCategoryEditorDialog({
  open,
  onOpenChange,
  editingCategory,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: LinkCategory | null;
  onSubmit: (data: { name: string; emoji: string; color?: string }) => void;
}) {
  const isEditing = !!editingCategory;
  const [name, setName] = useState(editingCategory?.name ?? "");
  const [emoji, setEmoji] = useState(editingCategory?.emoji ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), emoji: emoji.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium bg-muted text-foreground border border-border">
              {emoji && <span className="text-base leading-none">{emoji}</span>}
              <span>{name || "Nome da categoria"}</span>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Nome
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Músicas, Copy..."
              autoFocus
              required
            />
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Emoji
            </Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎵"
              maxLength={4}
            />
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="h-8 w-8 rounded-md bg-muted hover:bg-accent text-lg flex items-center justify-center transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Adiciona protocolo https:// caso não tenha */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Extrai o domínio de uma URL (ex: "google.com") */
function domainFromUrl(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
