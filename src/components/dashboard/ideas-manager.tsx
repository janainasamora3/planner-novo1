"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIdeas, type Idea } from "@/hooks/use-ideas";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PageCard } from "@/lib/pages";

interface IdeasManagerProps {
  page: PageCard;
  onClose: () => void;
}

const PRESET_COLORS = ["#1e1b4b", "#831843", "#166534", "#7c2d12", "#1e3a8a", "#0891b2"];

export function IdeasManager({ page, onClose }: IdeasManagerProps) {
  const { ideas, addIdea, updateIdea, removeIdea, addChecklistItem, toggleChecklistItem, removeChecklistItem } = useIdeas();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { if (editingId) setEditingId(null); else onClose(); } }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, editingId]);

  function handleAdd() {
    if (!newTitle.trim()) return;
    addIdea({ title: newTitle.trim(), notes: "", checklist: [], color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] });
    setNewTitle("");
    toast({ title: "Ideia adicionada!" });
  }

  const editingIdea = ideas.find((i) => i.id === editingId) ?? null;

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
            <IdeaEditor idea={editingIdea} onUpdate={updateIdea} onRemove={removeIdea} onAddChecklist={addChecklistItem} onToggleChecklist={toggleChecklistItem} onRemoveChecklist={removeChecklistItem} newChecklistText={newChecklistText} setNewChecklistText={setNewChecklistText} onBack={() => setEditingId(null)} />
          ) : (
            <>
              {/* Input para nova ideia */}
              <div className="flex gap-2">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} placeholder="💡 Anote uma nova ideia..." className="h-9 bg-muted/30 border-border" />
                <Button onClick={handleAdd} disabled={!newTitle.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+ Adicionar</Button>
              </div>

              {/* Lista de ideias */}
              {ideas.length === 0 ? (
                <div className="text-center py-16"><div className="text-6xl mb-3 opacity-40">💡</div><p className="text-sm text-muted-foreground">Nenhuma ideia ainda. Anote a primeira acima!</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ideas.slice().sort((a, b) => b.createdAt - a.createdAt).map((idea) => {
                    const doneCount = idea.checklist.filter((c) => c.done).length;
                    return (
                      <div key={idea.id} onClick={() => setEditingId(idea.id)} className="group rounded-2xl border border-border overflow-hidden cursor-pointer hover:border-foreground/30 transition-all hover:shadow-lg">
                        <div className="h-3" style={{ background: idea.color }} />
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{idea.title}</h3>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir "${idea.title}"?`)) { removeIdea(idea.id); toast({ title: "Ideia excluída", variant: "destructive" }); } }} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100">🗑️</button>
                          </div>
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
    </div>
  );
}

function IdeaEditor({ idea, onUpdate, onRemove, onAddChecklist, onToggleChecklist, onRemoveChecklist, newChecklistText, setNewChecklistText, onBack }: {
  idea: Idea;
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

  function save() {
    onUpdate(idea.id, { title: title.trim() || "Sem título", notes, color });
  }

  return (
    <div className="space-y-4">
      {/* Título */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Título</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} className="h-9 bg-muted/30 border-border" />
      </div>

      {/* Cor */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Cor</label>
        <div className="flex gap-1">{PRESET_COLORS.map((c) => (<button key={c} onClick={() => { setColor(c); onUpdate(idea.id, { color: c }); }} className={cn("h-6 w-6 rounded-md border-2", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />))}</div>
      </div>

      {/* Notas detalhadas */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-bold">Anotações detalhadas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={save} placeholder="Desenvolva sua ideia aqui..." rows={6} className="w-full bg-muted/30 border border-border rounded-md p-3 text-sm resize-y" />
      </div>

      {/* Checklist */}
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

      {/* Botões */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => { if (confirm("Excluir esta ideia?")) { onRemove(idea.id); onBack(); } }} className="text-destructive hover:text-destructive">🗑️ Excluir</Button>
        <Button variant="ghost" onClick={onBack} className="flex-1">← Voltar</Button>
        <Button onClick={save} className="bg-blue-600 hover:bg-blue-500 text-white border-0">💾 Salvar</Button>
      </div>
    </div>
  );
}
