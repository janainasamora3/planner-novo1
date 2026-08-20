"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIdeas, type Idea, type IdeaCategory } from "@/hooks/use-ideas";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PageCard } from "@/lib/pages";

interface IdeasManagerProps {
  page: PageCard;
  onClose: () => void;
}

const PRESET_COLORS = ["#1e1b4b", "#831843", "#166534", "#7c2d12", "#1e3a8a", "#0891b2"];
const CAT_PALETTE = ["#1e3a8a", "#7c3aed", "#16a34a", "#db2777", "#0891b2", "#d97706", "#dc2626", "#2563eb", "#65a30d", "#9333ea", "#0d9488", "#ca8a04"];

export function IdeasManager({ page, onClose }: IdeasManagerProps) {
  const {
    ideas, categories,
    addIdea, updateIdea, removeIdea,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    addCategory, removeCategory,
  } = useIdeas();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState<string>("");
  const [filterCat, setFilterCat] = useState<string | "all" | "none">("all");
  const [search, setSearch] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { if (editingId) setEditingId(null); else onClose(); } }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, editingId]);

  function handleAdd() {
    if (!newTitle.trim()) return;
    addIdea({
      title: newTitle.trim(),
      notes: "",
      checklist: [],
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      categoryId: newCat || null,
    });
    setNewTitle("");
    toast({ title: "Ideia adicionada!" });
  }

  const editingIdea = ideas.find((i) => i.id === editingId) ?? null;

  const catName = (id: string | null | undefined) => {
    if (!id) return null;
    return categories.find((c) => c.id === id) ?? null;
  };

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((i) => {
        if (filterCat === "all") return true;
        if (filterCat === "none") return !i.categoryId;
        return i.categoryId === filterCat;
      })
      .filter((i) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [ideas, filterCat, search]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => editingId ? setEditingId(null) : onClose()} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#1e1b4b"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "💡"}</div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{editingIdea ? editingIdea.title : page.title}</h1>
              <p className="text-[11px] text-muted-foreground">{editingIdea ? "Editando ideia" : `${ideas.length} ideias`}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2"><FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" /></div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {editingIdea ? (
            <IdeaEditor
              idea={editingIdea}
              categories={categories}
              onUpdate={updateIdea}
              onRemove={removeIdea}
              onAddChecklist={addChecklistItem}
              onToggleChecklist={toggleChecklistItem}
              onRemoveChecklist={removeChecklistItem}
              newChecklistText={newChecklistText}
              setNewChecklistText={setNewChecklistText}
              onBack={() => setEditingId(null)}
            />
          ) : (
            <>
              {/* Input + busca + categorias */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} placeholder="💡 Anote uma nova ideia..." className="h-9 bg-muted/30 border-border" />
                  <Button onClick={handleAdd} disabled={!newTitle.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+ Adicionar</Button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Categoria:</span>
                  <button onClick={() => setNewCat("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", !newCat ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Sem categoria</button>
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => setNewCat(c.id)} className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1", newCat === c.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30")} style={newCat === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Busca + gerenciar */}
              <div className="flex gap-2 items-center">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar ideia..." className="h-8 text-sm bg-muted/20 border-border" />
                <Button size="sm" variant="outline" onClick={() => setShowCatManager(true)} className="text-xs h-8 shrink-0">🏷️ Categorias</Button>
              </div>

              {/* Filtro */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => setFilterCat("all")} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterCat === "all" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>
                  Todas ({ideas.length})
                </button>
                {categories.map((c) => {
                  const count = ideas.filter((i) => i.categoryId === c.id).length;
                  const active = filterCat === c.id;
                  return (
                    <button key={c.id} onClick={() => setFilterCat(active ? "all" : c.id)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1", active ? "text-white border-transparent" : "bg-card text-muted-foreground border-border hover:border-foreground/30")} style={active ? { background: c.color, borderColor: c.color } : undefined}>
                      <span>{c.emoji}</span> {c.name} ({count})
                    </button>
                  );
                })}
                {ideas.some((i) => !i.categoryId) && (
                  <button onClick={() => setFilterCat(filterCat === "none" ? "all" : "none")} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterCat === "none" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>
                    Sem categoria ({ideas.filter((i) => !i.categoryId).length})
                  </button>
                )}
              </div>

              {/* Lista */}
              {filteredIdeas.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-3 opacity-40">💡</div>
                  <p className="text-sm text-muted-foreground">
                    {ideas.length === 0 ? "Nenhuma ideia ainda. Anote a primeira acima!" : "Nenhuma ideia encontrada com esse filtro."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredIdeas.map((idea) => {
                    const doneCount = idea.checklist.filter((c) => c.done).length;
                    const cat = catName(idea.categoryId);
                    return (
                      <div key={idea.id} onClick={() => setEditingId(idea.id)} className="group rounded-2xl border border-border overflow-hidden cursor-pointer hover:border-foreground/30 transition-all hover:shadow-lg">
                        <div className="h-3 flex">
                          <div className="flex-1" style={{ background: idea.color }} />
                          {cat && <div className="w-1.5" style={{ background: cat.color }} />}
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-foreground flex-1 line-clamp-2">{idea.title}</h3>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir "${idea.title}"?`)) { removeIdea(idea.id); toast({ title: "Ideia excluída", variant: "destructive" }); } }} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100 shrink-0">🗑️</button>
                          </div>
                          {cat && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: cat.color }}>
                              {cat.emoji} {cat.name}
                            </span>
                          )}
                          {idea.notes && <p className="text-xs text-muted-foreground line-clamp-3">{idea.notes}</p>}
                          {idea.checklist.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(doneCount / idea.checklist.length) * 100}%` }} /></div>
                              <span className="text-[9px] text-muted-foreground">{doneCount}/{idea.checklist.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="h-8" />
            </>
          )}
        </div>
      </div>

      {showCatManager && (
        <CategoryManagerModal
          categories={categories}
          ideas={ideas}
          onClose={() => setShowCatManager(false)}
          onAdd={addCategory}
          onRemove={removeCategory}
        />
      )}
    </div>
  );
}

function IdeaEditor({ idea, categories, onUpdate, onRemove, onAddChecklist, onToggleChecklist, onRemoveChecklist, newChecklistText, setNewChecklistText, onBack }: {
  idea: Idea;
  categories: IdeaCategory[];
  onUpdate: (id: string, patch: Partial<Omit<Idea, "id">>) => void;
  onRemove: (id: string) => void;
  onAddChecklist: (ideaId: string, text: string) => void;
  onToggleChecklist: (ideaId: string, itemId: string) => void;
  onRemoveChecklist: (ideaId: string, itemId: string) => void;
  newChecklistText: Record<string, string>;
  setNewChecklistText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(idea.title);
  const [notes, setNotes] = useState(idea.notes);
  const [color, setColor] = useState(idea.color);
  const [categoryId, setCategoryId] = useState<string>(idea.categoryId ?? "");

  function save() {
    onUpdate(idea.id, { title: title.trim() || "Sem título", notes, color, categoryId: categoryId || null });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Título</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} className="h-9 bg-muted/30 border-border" />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => { setCategoryId(""); save(); }} className={cn("px-2 py-0.5 rounded-full text-[10px] border", !categoryId ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Sem categoria</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => { setCategoryId(c.id); onUpdate(idea.id, { categoryId: c.id }); }} className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1", categoryId === c.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30")} style={categoryId === c.id ? { background: c.color, borderColor: c.color } : undefined}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Cor</label>
        <div className="flex gap-1">{PRESET_COLORS.map((c) => (<button key={c} onClick={() => { setColor(c); onUpdate(idea.id, { color: c }); }} className={cn("h-6 w-6 rounded-md border-2", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />))}</div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Anotações detalhadas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={save} placeholder="Desenvolva sua ideia aqui..." rows={6} className="w-full bg-muted/30 border border-border rounded-md p-3 text-sm resize-y" />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Checklist</label>
        <div className="space-y-1">
          {idea.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 group">
              <button onClick={() => onToggleChecklist(idea.id, item.id)} className={cn("h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", item.done ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background")}>{item.done ? "✓" : ""}</button>
              <span className={cn("text-xs flex-1", item.done && "line-through text-muted-foreground")}>{item.text}</span>
              <button onClick={() => onRemoveChecklist(idea.id, item.id)} className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input value={newChecklistText[idea.id] ?? ""} onChange={(e) => setNewChecklistText((prev) => ({ ...prev, [idea.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter" && (newChecklistText[idea.id] ?? "").trim()) { e.preventDefault(); onAddChecklist(idea.id, newChecklistText[idea.id]); setNewChecklistText((prev) => ({ ...prev, [idea.id]: "" })); } }} placeholder="+ Novo item..." className="h-8 text-xs bg-muted/30 border-border" />
          <Button size="sm" onClick={() => { if ((newChecklistText[idea.id] ?? "").trim()) { onAddChecklist(idea.id, newChecklistText[idea.id] ?? ""); setNewChecklistText((prev) => ({ ...prev, [idea.id]: "" })); } }} className="h-8 px-2 bg-blue-600 hover:bg-blue-500 text-white border-0">+</Button>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => { if (confirm("Excluir esta ideia?")) { onRemove(idea.id); onBack(); } }} className="text-destructive hover:text-destructive">🗑️ Excluir</Button>
        <Button variant="ghost" onClick={onBack} className="flex-1">← Voltar</Button>
        <Button onClick={save} className="bg-blue-600 hover:bg-blue-500 text-white border-0">💾 Salvar</Button>
      </div>
    </div>
  );
}

function CategoryManagerModal({
  categories, ideas, onClose, onAdd, onRemove,
}: {
  categories: IdeaCategory[];
  ideas: Idea[];
  onClose: () => void;
  onAdd: (name: string, emoji: string, color: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState(CAT_PALETTE[0]);

  function handleAdd() {
    if (!name.trim()) return;
    onAdd(name, emoji, color);
    setName(""); setEmoji("🏷️"); setColor(CAT_PALETTE[0]);
  }

  function handleRemove(id: string, name: string) {
    const count = ideas.filter((i) => i.categoryId === id).length;
    if (count > 0) {
      if (!confirm(`Existem ${count} ideia(s) usando "${name}". Elas ficarão sem categoria. Continuar?`)) return;
    } else {
      if (!confirm(`Excluir a categoria "${name}"?`)) return;
    }
    onRemove(id);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">🏷️ Categorias de Ideias</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          <div className="space-y-1.5">
            {categories.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma categoria ainda.</p>}
            {categories.map((c) => {
              const count = ideas.filter((i) => i.categoryId === c.id).length;
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border group">
                  <span className="h-7 w-7 rounded-md flex items-center justify-center text-sm shrink-0" style={{ background: c.color }}>{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{c.name}</div>
                    <div className="text-[9px] text-muted-foreground">{count} ideia{count !== 1 ? "s" : ""}</div>
                  </div>
                  <button onClick={() => handleRemove(c.id, c.name)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="text-[10px] uppercase text-muted-foreground font-bold">Nova categoria</div>
            <div className="flex items-center gap-2">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-12 h-9 text-center text-lg bg-background border-border" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Negócios)" className="flex-1 h-9 text-sm bg-background border-border" onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CAT_PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-md border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!name.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Adicionar categoria</Button>
          </div>

          <Button variant="ghost" onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </div>
    </div>
  );
}
