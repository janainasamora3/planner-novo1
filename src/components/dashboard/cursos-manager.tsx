"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { PageCard } from "@/lib/pages";

interface CursosManagerProps {
  page: PageCard;
  onClose: () => void;
}

// =================== Tipos ===================
interface CourseCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
}

interface Notebook {
  id: string;
  categoryId: string;
  title: string;
  emoji: string;
  color: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface NoteCard {
  id: string;
  notebookId: string;
  title: string;
  emoji: string;
  color: string;
  intro: string;
  checklist: { id: string; text: string; done: boolean }[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

// =================== localStorage ===================
const CAT_KEY = "dashboard.cursos.categories.v1";
const NOTEBOOK_KEY = "dashboard.cursos.notebooks.v1";
const CARD_KEY = "dashboard.cursos.cards.v1";
const EVENT = "dashboard:cursos-change";

const DEFAULT_CATEGORIES: CourseCategory[] = [
  { id: "cat_marketing", name: "Marketing", emoji: "📣", color: "#dc2626", order: 0 },
  { id: "cat_negocios", name: "Negócios", emoji: "💼", color: "#1e3a8a", order: 1 },
  { id: "cat_tech", name: "Tecnologia", emoji: "💻", color: "#0891b2", order: 2 },
  { id: "cat_devpessoal", name: "Desenvolvimento Pessoal", emoji: "🌱", color: "#16a34a", order: 3 },
  { id: "cat_financas", name: "Finanças", emoji: "💸", color: "#ca8a04", order: 4 },
  { id: "cat_idiomas", name: "Idiomas", emoji: "🌍", color: "#7c3aed", order: 5 },
];

const CARD_COLORS = [
  "#dc2626", "#ea580c", "#d97706", "#ca8a04",
  "#16a34a", "#0891b2", "#2563eb", "#7c3aed",
  "#db2777", "#1e3a8a", "#3f3f46", "#0a0a0a",
];

function makeId(p: string) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function useCursosStore<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setData(JSON.parse(raw) as T);
    } catch {}
    setLoaded(true);
    const handler = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) setData(JSON.parse(raw) as T);
      } catch {}
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [key]);

  const save = useCallback((next: T) => {
    setData(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
  }, [key]);

  return { data, save, loaded };
}

// =================== Componente principal ===================
export function CursosManager({ page, onClose }: CursosManagerProps) {
  const { data: categories, save: saveCats, loaded: catsLoaded } = useCursosStore<CourseCategory[]>(CAT_KEY, DEFAULT_CATEGORIES);
  const { data: notebooks, save: saveNotebooks } = useCursosStore<Notebook[]>(NOTEBOOK_KEY, []);
  const { data: cards, save: saveCards } = useCursosStore<NoteCard[]>(CARD_KEY, []);
  const { toast } = useToast();

  const [activeCat, setActiveCat] = useState<string>("");
  const [openNotebookId, setOpenNotebookId] = useState<string | null>(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [newNbTitle, setNewNbTitle] = useState("");
  const [newNbEmoji, setNewNbEmoji] = useState("📓");

  useEffect(() => {
    if (catsLoaded && categories.length > 0 && !activeCat) {
      setActiveCat(categories[0].id);
    }
  }, [catsLoaded, categories, activeCat]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { if (openNotebookId) setOpenNotebookId(null); else onClose(); } }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, openNotebookId]);

  function addNotebook(categoryId: string) {
    if (!newNbTitle.trim()) return;
    const cat = categories.find((c) => c.id === categoryId);
    const order = notebooks.filter((n) => n.categoryId === categoryId).length;
    const nb: Notebook = {
      id: makeId("nb"), categoryId, title: newNbTitle.trim(),
      emoji: newNbEmoji || "📓", color: cat?.color ?? "#3f3f46", order,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    saveNotebooks([...notebooks, nb]);
    setNewNbTitle(""); setNewNbEmoji("📓"); setShowNewNotebook(false);
    toast({ title: "Caderno criado!" });
  }

  function removeNotebook(id: string) {
    const nb = notebooks.find((n) => n.id === id);
    if (!nb) return;
    if (!confirm(`Excluir o caderno "${nb.title}" e todos os seus cards?`)) return;
    saveNotebooks(notebooks.filter((n) => n.id !== id));
    saveCards(cards.filter((c) => c.notebookId !== id));
    if (openNotebookId === id) setOpenNotebookId(null);
    toast({ title: "Caderno excluído", variant: "destructive" });
  }

  function renameNotebook(id: string, title: string) {
    saveNotebooks(notebooks.map((n) => n.id === id ? { ...n, title, updatedAt: Date.now() } : n));
  }

  function addCard(notebookId: string, partial: Partial<NoteCard> = {}) {
    const order = cards.filter((c) => c.notebookId === notebookId).length;
    const card: NoteCard = {
      id: makeId("card"), notebookId,
      title: partial.title ?? "Novo card",
      emoji: partial.emoji ?? "✨",
      color: partial.color ?? "#dc2626",
      intro: partial.intro ?? "",
      checklist: partial.checklist ?? [],
      order, createdAt: Date.now(), updatedAt: Date.now(),
    };
    saveCards([...cards, card]);
    return card;
  }

  function updateCard(id: string, patch: Partial<Omit<NoteCard, "id">>) {
    saveCards(cards.map((c) => c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c));
  }

  function removeCard(id: string) {
    if (!confirm("Excluir este card?")) return;
    saveCards(cards.filter((c) => c.id !== id));
    toast({ title: "Card excluído", variant: "destructive" });
  }

  function addChecklistItem(cardId: string, text: string) {
    if (!text.trim()) return;
    const item = { id: makeId("chk"), text: text.trim(), done: false };
    saveCards(cards.map((c) => c.id === cardId ? { ...c, checklist: [...c.checklist, item], updatedAt: Date.now() } : c));
  }

  function toggleChecklistItem(cardId: string, itemId: string) {
    saveCards(cards.map((c) => c.id === cardId ? { ...c, checklist: c.checklist.map((i) => i.id === itemId ? { ...i, done: !i.done } : i), updatedAt: Date.now() } : c));
  }

  function removeChecklistItem(cardId: string, itemId: string) {
    saveCards(cards.map((c) => c.id === cardId ? { ...c, checklist: c.checklist.filter((i) => i.id !== itemId), updatedAt: Date.now() } : c));
  }

  const openNotebook = notebooks.find((n) => n.id === openNotebookId) ?? null;
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.order - b.order), [categories]);
  const activeCategory = categories.find((c) => c.id === activeCat) ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => openNotebookId ? setOpenNotebookId(null) : onClose()} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#0891b2"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "🎓"}</div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{openNotebook ? `${openNotebook.emoji} ${openNotebook.title}` : page.title}</h1>
              <p className="text-[11px] text-muted-foreground">
                {openNotebook
                  ? `${cards.filter((c) => c.notebookId === openNotebook.id).length} cards`
                  : `${categories.length} categorias · ${notebooks.length} cadernos`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!openNotebookId && (
            <Button size="sm" variant="outline" onClick={() => setShowCatManager(true)} className="text-xs h-8">🏷️ Categorias</Button>
          )}
          <FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Abas de categorias no topo (chips) */}
      {!openNotebookId && (
        <nav className="border-b border-border bg-card px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2">
            {sortedCategories.map((c) => {
              const count = notebooks.filter((n) => n.categoryId === c.id).length;
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 whitespace-nowrap",
                    active ? "text-white border-transparent" : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  )}
                  style={active ? { background: c.color, borderColor: c.color } : undefined}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                  <span className={cn("text-[9px] px-1 rounded", active ? "bg-white/20" : "bg-muted/40")}>{count}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <div className="flex-1 overflow-y-auto bg-background">
        {openNotebook ? (
          <NotebookView
            notebook={openNotebook}
            cards={cards.filter((c) => c.notebookId === openNotebook.id).sort((a, b) => a.order - b.order)}
            onAddCard={(partial) => addCard(openNotebook.id, partial)}
            onUpdateCard={updateCard}
            onRemoveCard={removeCard}
            onAddChecklist={addChecklistItem}
            onToggleChecklist={toggleChecklistItem}
            onRemoveChecklist={removeChecklistItem}
            onRenameNotebook={(title) => renameNotebook(openNotebook.id, title)}
          />
        ) : (
          <CategoryView
            category={activeCategory}
            notebooks={notebooks.filter((n) => n.categoryId === activeCat).sort((a, b) => a.order - b.order)}
            cards={cards}
            loaded={catsLoaded}
            showNewNotebook={showNewNotebook}
            newNbTitle={newNbTitle}
            newNbEmoji={newNbEmoji}
            setShowNewNotebook={setShowNewNotebook}
            setNewNbTitle={setNewNbTitle}
            setNewNbEmoji={setNewNbEmoji}
            onAddNotebook={() => activeCat && addNotebook(activeCat)}
            onOpenNotebook={(id) => setOpenNotebookId(id)}
            onRemoveNotebook={removeNotebook}
          />
        )}
      </div>

      {showCatManager && (
        <CategoryManagerModal
          categories={categories}
          notebooks={notebooks}
          onClose={() => setShowCatManager(false)}
          onSave={(next) => { saveCats(next); toast({ title: "Categorias atualizadas!" }); }}
        />
      )}
    </div>
  );
}

// =================== View de categoria ===================
function CategoryView({
  category, notebooks, cards, loaded,
  showNewNotebook, newNbTitle, newNbEmoji,
  setShowNewNotebook, setNewNbTitle, setNewNbEmoji,
  onAddNotebook, onOpenNotebook, onRemoveNotebook,
}: {
  category: CourseCategory | null;
  notebooks: Notebook[];
  cards: NoteCard[];
  loaded: boolean;
  showNewNotebook: boolean;
  newNbTitle: string;
  newNbEmoji: string;
  setShowNewNotebook: (b: boolean) => void;
  setNewNbTitle: (s: string) => void;
  setNewNbEmoji: (s: string) => void;
  onAddNotebook: () => void;
  onOpenNotebook: (id: string) => void;
  onRemoveNotebook: (id: string) => void;
}) {
  if (!loaded) return null;
  if (!category) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-3 opacity-40">🎓</div>
        <p className="text-sm text-muted-foreground">Nenhuma categoria. Clique em "🏷️ Categorias" para criar.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-md flex items-center justify-center text-base shrink-0" style={{ background: category.color }}>{category.emoji}</span>
          <div>
            <h2 className="text-base font-bold leading-tight">{category.name}</h2>
            <p className="text-[11px] text-muted-foreground">{notebooks.length} caderno{notebooks.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={() => setShowNewNotebook(!showNewNotebook)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors flex items-center gap-1">
          {showNewNotebook ? "✕ Cancelar" : "+ Novo caderno"}
        </button>
      </div>

      {showNewNotebook && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border">
          <Input value={newNbEmoji} onChange={(e) => setNewNbEmoji(e.target.value)} maxLength={4} className="w-14 h-9 text-center text-lg bg-background border-border" />
          <Input value={newNbTitle} onChange={(e) => setNewNbTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onAddNotebook(); }} placeholder="Nome do caderno (ex: Aula 1 - Introdução)" className="flex-1 h-9 text-sm bg-background border-border" autoFocus />
          <Button size="sm" onClick={onAddNotebook} disabled={!newNbTitle.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Criar</Button>
        </div>
      )}

      {notebooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {notebooks.map((nb) => {
            const nbCards = cards.filter((c) => c.notebookId === nb.id).length;
            return (
              <div
                key={nb.id}
                onClick={() => onOpenNotebook(nb.id)}
                className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-foreground/30 hover:shadow-md transition-all group relative"
              >
                <div className="aspect-[4/3] flex items-center justify-center text-5xl" style={{ background: `linear-gradient(135deg, ${nb.color} 0%, #0a0a0a 100%)` }}>
                  <span className="opacity-90 drop-shadow-md">{nb.emoji}</span>
                </div>
                <div className="p-2.5">
                  <h4 className="text-xs font-bold line-clamp-2 leading-tight">{nb.title}</h4>
                  <p className="text-[9px] text-muted-foreground mt-1">{nbCards} card{nbCards !== 1 ? "s" : ""} · {new Date(nb.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveNotebook(nb.id); }}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive transition-colors flex items-center justify-center text-[10px]"
                >✕</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-[11px] text-muted-foreground italic border border-dashed border-border rounded-lg">
          Nenhum caderno nesta categoria ainda. Clique em "+ Novo caderno".
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}

// =================== View do caderno (cards estilo Notion) ===================
function NotebookView({
  notebook, cards,
  onAddCard, onUpdateCard, onRemoveCard,
  onAddChecklist, onToggleChecklist, onRemoveChecklist,
  onRenameNotebook,
}: {
  notebook: Notebook;
  cards: NoteCard[];
  onAddCard: (partial?: Partial<NoteCard>) => NoteCard;
  onUpdateCard: (id: string, patch: Partial<Omit<NoteCard, "id">>) => void;
  onRemoveCard: (id: string) => void;
  onAddChecklist: (cardId: string, text: string) => void;
  onToggleChecklist: (cardId: string, itemId: string) => void;
  onRemoveChecklist: (cardId: string, itemId: string) => void;
  onRenameNotebook: (title: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(notebook.title);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [cTitle, setCTitle] = useState("");
  const [cEmoji, setCEmoji] = useState("✨");
  const [cColor, setCColor] = useState("#dc2626");

  function handleAddCard() {
    if (!cTitle.trim()) return;
    onAddCard({ title: cTitle.trim(), emoji: cEmoji, color: cColor });
    setCTitle(""); setCEmoji("✨"); setCColor("#dc2626");
    setShowCardForm(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <span className="text-2xl">{notebook.emoji}</span>
        {editingTitle ? (
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { onRenameNotebook(titleDraft.trim() || "Sem título"); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onRenameNotebook(titleDraft.trim() || "Sem título"); setEditingTitle(false); } }}
            autoFocus
            className="h-9 text-base font-bold bg-muted/30 border-border"
          />
        ) : (
          <h2 className="text-base font-bold flex-1 cursor-text" onClick={() => { setEditingTitle(true); setTitleDraft(notebook.title); }}>{notebook.title}</h2>
        )}
        <button onClick={() => setEditingTitle(!editingTitle)} className="text-xs text-muted-foreground hover:text-foreground">{editingTitle ? "✓" : "✏️"}</button>
      </div>

      <button
        onClick={() => setShowCardForm(!showCardForm)}
        className="w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/20 transition-colors text-xs text-muted-foreground flex items-center justify-center gap-1.5"
      >
        {showCardForm ? "✕ Cancelar" : "+ Adicionar card"}
      </button>

      {showCardForm && (
        <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-2">
          <div className="text-[10px] uppercase text-muted-foreground font-bold">Novo card</div>
          <div className="flex items-center gap-2">
            <Input value={cEmoji} onChange={(e) => setCEmoji(e.target.value)} maxLength={4} className="w-14 h-9 text-center text-lg bg-background border-border" />
            <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddCard(); }} placeholder="Título do card (ex: Comece por aqui)" className="flex-1 h-9 text-sm bg-background border-border" autoFocus />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CARD_COLORS.map((c) => (
              <button key={c} onClick={() => setCColor(c)} className={cn("h-6 w-6 rounded-md border-2 transition-all", cColor === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
            ))}
          </div>
          <Button size="sm" onClick={handleAddCard} disabled={!cTitle.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Criar card</Button>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-40">📝</div>
          <p className="text-sm text-muted-foreground">Nenhum card ainda. Clique em "+ Adicionar card" para criar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <NotionCard
              key={card.id}
              card={card}
              isEditing={editingCardId === card.id}
              onEdit={() => setEditingCardId(card.id)}
              onClose={() => setEditingCardId(null)}
              onUpdate={(patch) => onUpdateCard(card.id, patch)}
              onRemove={() => onRemoveCard(card.id)}
              onAddChecklist={(text) => onAddChecklist(card.id, text)}
              onToggleChecklist={(itemId) => onToggleChecklist(card.id, itemId)}
              onRemoveChecklist={(itemId) => onRemoveChecklist(card.id, itemId)}
            />
          ))}
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}

// =================== NotionCard ===================
function NotionCard({
  card, isEditing, onEdit, onClose, onUpdate, onRemove,
  onAddChecklist, onToggleChecklist, onRemoveChecklist,
}: {
  card: NoteCard;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onUpdate: (patch: Partial<Omit<NoteCard, "id">>) => void;
  onRemove: () => void;
  onAddChecklist: (text: string) => void;
  onToggleChecklist: (itemId: string) => void;
  onRemoveChecklist: (itemId: string) => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [emoji, setEmoji] = useState(card.emoji);
  const [color, setColor] = useState(card.color);
  const [intro, setIntro] = useState(card.intro);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [showColors, setShowColors] = useState(false);

  useEffect(() => {
    setTitle(card.title); setEmoji(card.emoji); setColor(card.color); setIntro(card.intro);
  }, [card.id, card.title, card.emoji, card.color, card.intro]);

  function save() {
    onUpdate({ title: title.trim() || "Sem título", emoji, color, intro });
    onClose();
  }

  function addCheck() {
    if (!newChecklistText.trim()) return;
    onAddChecklist(newChecklistText);
    setNewChecklistText("");
  }

  const doneCount = card.checklist.filter((i) => i.done).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div
        className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${color}18 0%, transparent 100%)` }}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-12 h-8 text-center text-lg bg-background border-border" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 h-8 text-sm font-bold bg-background border-border" autoFocus />
            <button onClick={() => setShowColors(!showColors)} className="h-8 w-8 rounded-md border border-border flex items-center justify-center" style={{ background: color }} title="Mudar cor">🎨</button>
          </div>
        ) : (
          <button onClick={onEdit} className="flex items-center gap-2 flex-1 text-left cursor-text">
            <span className="text-lg">{emoji}</span>
            <h3 className="text-sm font-bold" style={{ color }}>{title}</h3>
            {card.checklist.length > 0 && (
              <span className="text-[10px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded">
                {doneCount}/{card.checklist.length}
              </span>
            )}
          </button>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button onClick={save} className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white">💾 Salvar</button>
              <button onClick={onClose} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground">✕</button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1">✏️</button>
              <button onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive px-1.5 py-1">🗑️</button>
            </>
          )}
        </div>
      </div>

      {isEditing && showColors && (
        <div className="px-4 py-2 border-b border-border/40 bg-muted/10 flex items-center gap-1.5 flex-wrap">
          {CARD_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-md border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
          ))}
        </div>
      )}

      <div className="p-4 space-y-3">
        {isEditing ? (
          <RichTextEditor
            value={intro}
            onChange={setIntro}
            placeholder="Escreva aqui... use negrito, itálico, sublinhado, fonte, tamanho, cor, marca-texto, títulos, listas, checkbox (✓) inline com o texto, emojis, imagens, links..."
            minHeight={220}
          />
        ) : (
          card.intro && (
            <div
              className="text-sm text-foreground/80 leading-relaxed rt-editor prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: card.intro }}
            />
          )
        )}

        <div className="space-y-1.5">
          {card.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <button
                onClick={() => onToggleChecklist(item.id)}
                className={cn(
                  "h-5 w-5 rounded border flex items-center justify-center text-[11px] shrink-0 transition-colors",
                  item.done ? "bg-blue-500 text-white border-blue-500" : "border-border bg-background hover:border-blue-500"
                )}
              >
                {item.done ? "✓" : ""}
              </button>
              <span className={cn("text-sm flex-1", item.done ? "line-through text-muted-foreground" : "text-foreground")}>
                {item.text}
              </span>
              <button onClick={() => onRemoveChecklist(item.id)} className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">✕</button>
            </div>
          ))}

          <div className="flex gap-1 pt-1">
            <Input
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCheck(); } }}
              placeholder="+ Adicionar item à checklist..."
              className="h-7 text-xs bg-muted/30 border-border"
            />
            <Button size="sm" onClick={addCheck} disabled={!newChecklistText.trim()} className="h-7 px-2 bg-blue-600 hover:bg-blue-500 text-white border-0 text-[10px]">+</Button>
          </div>
        </div>

        {!isEditing && (
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Atualizado em {new Date(card.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            {card.checklist.length > 0 && (
              <span>{Math.round((doneCount / card.checklist.length) * 100)}% concluído</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =================== Gerenciador de Categorias ===================
function CategoryManagerModal({
  categories, notebooks, onClose, onSave,
}: {
  categories: CourseCategory[];
  notebooks: Notebook[];
  onClose: () => void;
  onSave: (c: CourseCategory[]) => void;
}) {
  const [list, setList] = useState<CourseCategory[]>(categories);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎓");
  const [color, setColor] = useState(CARD_COLORS[0]);

  function addCategory() {
    if (!name.trim()) return;
    setList([...list, { id: makeId("cat"), name: name.trim(), emoji: emoji || "🎓", color, order: list.length }]);
    setName(""); setEmoji("🎓"); setColor(CARD_COLORS[0]);
  }

  function removeCategory(id: string, name: string) {
    const count = notebooks.filter((n) => n.categoryId === id).length;
    if (count > 0) {
      if (!confirm(`Existem ${count} caderno(s) em "${name}". Eles serão excluídos junto. Continuar?`)) return;
    } else {
      if (!confirm(`Excluir a categoria "${name}"?`)) return;
    }
    setList(list.filter((c) => c.id !== id));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">🏷️ Categorias de Cursos</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          <div className="space-y-1.5">
            {list.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma categoria ainda.</p>}
            {list.map((c) => {
              const count = notebooks.filter((n) => n.categoryId === c.id).length;
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border group">
                  <span className="h-7 w-7 rounded-md flex items-center justify-center text-sm shrink-0" style={{ background: c.color }}>{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{c.name}</div>
                    <div className="text-[9px] text-muted-foreground">{count} caderno{count !== 1 ? "s" : ""}</div>
                  </div>
                  <button onClick={() => removeCategory(c.id, c.name)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="text-[10px] uppercase text-muted-foreground font-bold">Nova categoria</div>
            <div className="flex items-center gap-2">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-12 h-9 text-center text-lg bg-background border-border" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Programação)" className="flex-1 h-9 text-sm bg-background border-border" onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CARD_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-md border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
            <Button size="sm" onClick={addCategory} disabled={!name.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Adicionar categoria</Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={() => { onSave(list); onClose(); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">💾 Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
