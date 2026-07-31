"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuickTasks } from "@/hooks/use-quick-tasks";
import { cn, readableTextColor } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PageCard } from "@/lib/pages";

interface QuickTasksManagerProps {
  page: PageCard;
  onClose: () => void;
}

export function QuickTasksManager({ page, onClose }: QuickTasksManagerProps) {
  const { tasks, categories, addTask, updateTask, removeTask, toggleDone, addCategory, updateCategory, removeCategory } = useQuickTasks();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("");
  const [filterCat, setFilterCat] = useState<string>("todos");
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCat, setEditCat] = useState<string | undefined>(undefined);
  const [sortedTask, setSortedTask] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { if (editingId) setEditingId(null); else onClose(); } }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, editingId]);

  function handleAdd() {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), categoryId: newCat || undefined, done: false });
    setNewTitle("");
    toast({ title: "Tarefa adicionada!" });
  }

  function handleSortear() {
    const pool = filterCat === "todos" ? tasks.filter((t) => !t.done) : tasks.filter((t) => !t.done && t.categoryId === filterCat);
    if (pool.length === 0) { toast({ title: "Nenhuma tarefa para sortear", description: "Adicione tarefas ou mude o filtro" }); return; }
    setIsSpinning(true);
    setSortedTask(null);
    const interval = setInterval(() => { setSortedTask(pool[Math.floor(Math.random() * pool.length)].id); }, 80);
    setTimeout(() => {
      clearInterval(interval);
      const final = pool[Math.floor(Math.random() * pool.length)];
      setSortedTask(final.id);
      setIsSpinning(false);
      toast({ title: "🎲 Tarefa sorteada!", description: final.title });
    }, 1500);
  }

  function openEdit(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id); setEditTitle(t.title); setEditNotes(t.notes ?? ""); setEditCat(t.categoryId);
  }
  function saveEdit() {
    if (!editingId) return;
    updateTask(editingId, { title: editTitle.trim() || "Sem título", notes: editNotes.trim() || undefined, categoryId: editCat });
    toast({ title: "Tarefa atualizada" });
    setEditingId(null);
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => filterCat === "todos" || t.categoryId === filterCat).sort((a, b) => a.done === b.done ? b.createdAt - a.createdAt : a.done ? 1 : -1);
  }, [tasks, filterCat]);

  const stats = useMemo(() => ({ total: tasks.length, done: tasks.filter((t) => t.done).length, pending: tasks.filter((t) => !t.done).length }), [tasks]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => editingId ? setEditingId(null) : onClose()} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#7c2d12"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "📝"}</div>
            <div><h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1><p className="text-[11px] text-muted-foreground">{stats.pending} pendentes · {stats.done} concluídas</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2"><FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" /></div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {/* Input nova tarefa */}
          <div className="flex gap-2">
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="h-9 text-xs bg-muted/30 border border-border rounded-md px-2 w-32">
              <option value="">Sem categoria</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.name}</option>))}
            </select>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} placeholder="📝 Adicionar tarefa..." className="flex-1 h-9 bg-muted/30 border-border" />
            <Button onClick={handleAdd} disabled={!newTitle.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+</Button>
          </div>

          {/* Filtros + Sortear + Categorias */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilterCat("todos")} className={cn("h-7 px-3 rounded-md text-[10px] font-bold border", filterCat === "todos" ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:bg-accent")}>Todas ({tasks.length})</button>
            {categories.map((c) => (<button key={c.id} onClick={() => setFilterCat(c.id)} className={cn("h-7 px-3 rounded-md text-[10px] font-bold border", filterCat === c.id ? "text-white" : "bg-background text-muted-foreground border-border hover:bg-accent")} style={filterCat === c.id ? { background: c.color, borderColor: c.color } : undefined}>{c.emoji} {c.name} ({tasks.filter((t) => t.categoryId === c.id).length})</button>))}
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => setShowCatManager(true)} className="text-muted-foreground">🏷️ Categorias</Button>
            <Button size="sm" onClick={handleSortear} disabled={isSpinning} className="bg-purple-600 hover:bg-purple-500 text-white border-0">🎲 Sortear</Button>
          </div>

          {/* Sorteado */}
          {sortedTask && (() => {
            const t = tasks.find((x) => x.id === sortedTask);
            if (!t) return null;
            return (
              <div className={cn("rounded-xl p-4 text-center border-2", isSpinning ? "border-purple-500/50 bg-purple-500/5 animate-pulse" : "border-purple-500 bg-purple-500/10")}>
                <p className="text-[10px] uppercase text-purple-500 font-bold mb-1">{isSpinning ? "Sorteando..." : "🎲 Tarefa sorteada"}</p>
                <p className="text-base font-bold text-foreground">{t.title}</p>
                {t.categoryId && (() => { const c = categories.find((x) => x.id === t.categoryId); return c ? <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${c.color}20`, color: c.color }}>{c.emoji} {c.name}</span> : null; })()}
              </div>
            );
          })()}

          {/* Lista de tarefas */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16"><div className="text-6xl mb-3 opacity-40">📝</div><p className="text-sm text-muted-foreground">Nenhuma tarefa. Adicione acima!</p></div>
          ) : (
            <div className="space-y-1.5">
              {filteredTasks.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                return (
                  <div key={t.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all group", t.done ? "bg-emerald-500/5 border-emerald-500/30" : "bg-card border-border hover:border-foreground/30", sortedTask === t.id && !isSpinning && "ring-2 ring-purple-500")}>
                    <button onClick={() => toggleDone(t.id)} className={cn("h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", t.done ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background hover:border-foreground/40")}>{t.done ? "✓" : ""}</button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold", t.done && "line-through text-muted-foreground")}>{t.title}</p>
                      {t.notes && <p className="text-[10px] text-muted-foreground line-clamp-1">{t.notes}</p>}
                    </div>
                    {cat && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.emoji} {cat.name}</span>}
                    <button onClick={() => openEdit(t.id)} className="text-muted-foreground hover:text-foreground text-xs px-1 opacity-0 group-hover:opacity-100">✏️</button>
                    <button onClick={() => { if (confirm(`Excluir "${t.title}"?`)) { removeTask(t.id); toast({ title: "Tarefa excluída", variant: "destructive" }); } }} className="text-muted-foreground hover:text-destructive text-xs px-1 opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="h-8" />

          {/* Editor inline */}
          {editingId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingId(null)}>
              <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Editar tarefa</h3><button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">✕</button></div>
                <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Título</label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9 bg-muted/30 border-border" /></div>
                <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</label><select value={editCat ?? ""} onChange={(e) => setEditCat(e.target.value || undefined)} className="w-full h-9 text-sm bg-muted/30 border border-border rounded-md px-2"><option value="">Sem categoria</option>{categories.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.name}</option>))}</select></div>
                <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Notas</label><textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full bg-muted/30 border border-border rounded-md p-2 text-sm resize-y" /></div>
                <div className="flex gap-2"><Button variant="ghost" onClick={() => setEditingId(null)} className="flex-1">Cancelar</Button><Button onClick={saveEdit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">💾 Salvar</Button></div>
              </div>
            </div>
          )}

          {/* Gerenciador de categorias */}
          {showCatManager && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatManager(false)}>
              <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">🏷️ Categorias</h3><button onClick={() => setShowCatManager(false)} className="text-muted-foreground hover:text-foreground">✕</button></div>
                <div className="space-y-2">{categories.map((cat) => (<div key={cat.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border"><span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm shrink-0" style={{ background: cat.color, color: readableTextColor(cat.color) }}>{cat.emoji || "•"}</span><Input value={cat.name} onChange={(e) => updateCategory(cat.id, { name: e.target.value })} className="h-7 text-sm bg-transparent border-none flex-1" /><input type="color" value={cat.color} onChange={(e) => updateCategory(cat.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" /><Input value={cat.emoji ?? ""} onChange={(e) => updateCategory(cat.id, { emoji: e.target.value })} maxLength={4} className="h-7 w-12 text-center bg-muted/30 border-border" /><button onClick={() => { if (confirm(`Excluir "${cat.name}"?`)) removeCategory(cat.id); }} className="text-muted-foreground hover:text-destructive text-xs">🗑️</button></div>))}</div>
                <div className="pt-3 border-t border-border flex items-center gap-2"><Input placeholder="Nova categoria..." onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (v) { addCategory({ name: v, color: "#3f3f46", emoji: "📌" }); (e.target as HTMLInputElement).value = ""; } } }} className="h-8 flex-1 text-sm bg-muted/30 border-border" /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
