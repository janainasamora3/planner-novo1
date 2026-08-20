"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/use-tasks";
import {
  RECURRENCE_LABELS,
  WEEKDAY_SHORT,
  isTaskDoneOn,
  countSubTasksDoneOn,
  taskAppliesToDate,
  todayISO,
  getUpcomingDates,
  formatShortBR,
  type Task,
  type TaskCategory,
} from "@/lib/tasks";
import { cn, readableTextColor } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarTasks } from "./calendar-tasks";
import { TaskEditorDialog } from "./task-editor-dialog";
import type { PageCard } from "@/lib/pages";

interface TasksManagerProps {
  page: PageCard;
  onClose: () => void;
}

const STATUS_TAG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  done: { bg: "#16a34a20", text: "#16a34a", label: "✓ Concluída" },
  pending: { bg: "#2563eb20", text: "#2563eb", label: "Não iniciado" },
};

export function TasksManager({ page, onClose }: TasksManagerProps) {
  const [view, setView] = useState<"tabela" | "calendario">("tabela");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#7c2d12"} 0%, #0a0a0a 100%)`, color: "#fff" }}>
              {page.emoji || "✅"}
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1>
              <p className="text-[11px] text-muted-foreground">Tarefas &amp; Calendário</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FontScaleControl />
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-border bg-card px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setView("tabela")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "tabela" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>📝 Tabela</button>
          <button onClick={() => setView("calendario")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "calendario" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>📅 Calendário</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto bg-background">
        {view === "tabela" ? <TaskTableView /> : <CalendarTasks />}
      </div>
    </div>
  );
}

// =================== Tabela estilo Notion ===================
function TaskTableView() {
  const { tasks, categories, addTask, updateTask, removeTask, toggleDone, duplicateTask, addCategory, updateCategory, removeCategory } = useTasks();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendentes" | "concluidas">("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const today = todayISO();

  const editingTask = tasks.find((t) => t.id === editingId) ?? null;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search) { const s = search.toLowerCase(); if (!t.title.toLowerCase().includes(s) && !t.notes?.toLowerCase().includes(s)) return false; }
      if (statusFilter === "pendentes" && isTaskDoneOn(t, today)) return false;
      if (statusFilter === "concluidas" && !isTaskDoneOn(t, today)) return false;
      if (categoryFilter !== "todos" && t.categoryId !== categoryFilter) return false;
      return true;
    }).sort((a, b) => { const aDone = isTaskDoneOn(a, today); const bDone = isTaskDoneOn(b, today); if (aDone !== bDone) return aDone ? 1 : -1; return (a.date ?? "").localeCompare(b.date ?? ""); });
  }, [tasks, search, statusFilter, categoryFilter, today]);

  function handleSubmit(data: Parameters<ReturnType<typeof useTasks>["addTask"]>[0]) {
    if (editingId) { updateTask(editingId, data); toast({ title: "Tarefa atualizada", description: data.title }); }
    else { addTask(data); toast({ title: "Tarefa criada", description: data.title }); }
    setEditingId(null);
  }
  function handleDelete(id: string) { const t = tasks.find((x) => x.id === id); removeTask(id); toast({ title: "Tarefa excluída", description: t?.title, variant: "destructive" }); setEditorOpen(false); setEditingId(null); }
  function handleDuplicate(id: string) { const clone = duplicateTask(id); if (clone) toast({ title: "Tarefa duplicada", description: clone.title }); }

  const catById = (id?: string) => categories.find((c) => c.id === id);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">📁 Tarefas ({filteredTasks.length})</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{filteredTasks.filter((t) => !isTaskDoneOn(t, today)).length} pendentes · {filteredTasks.filter((t) => isTaskDoneOn(t, today)).length} concluídas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setCatDialogOpen(true)} className="text-muted-foreground">🏷️ Categorias</Button>
          <Button size="sm" onClick={() => { setEditingId(null); setEditorOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+ Nova tarefa</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar tarefa..." className="h-8 max-w-[200px] text-xs bg-muted/30 border-border" />
        <div className="flex items-center gap-1">
          <button onClick={() => setStatusFilter("todos")} className={cn("h-7 px-2.5 rounded-md text-[10px] font-bold border", statusFilter === "todos" ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:bg-accent")}>Todas</button>
          <button onClick={() => setStatusFilter("pendentes")} className={cn("h-7 px-2.5 rounded-md text-[10px] font-bold border", statusFilter === "pendentes" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border hover:bg-accent")}>Pendentes</button>
          <button onClick={() => setStatusFilter("concluidas")} className={cn("h-7 px-2.5 rounded-md text-[10px] font-bold border", statusFilter === "concluidas" ? "bg-emerald-600 text-white border-emerald-600" : "bg-background text-muted-foreground border-border hover:bg-accent")}>Concluídas</button>
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-7 text-[10px] bg-muted/30 border border-border rounded-md px-2">
          <option value="todos">Todas as categorias</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.label}</option>))}
        </select>
      </div>

      {/* Tabela (desktop) */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-[10px] uppercase text-muted-foreground">
              <th className="text-left px-3 py-2 font-bold w-8"></th>
              <th className="text-left px-3 py-2 font-bold">📝 Tarefa</th>
              <th className="text-left px-3 py-2 font-bold">📊 Status</th>
              <th className="text-left px-3 py-2 font-bold">🏷️ Categoria</th>
              <th className="text-left px-3 py-2 font-bold">📅 Data</th>
              <th className="text-left px-3 py-2 font-bold">🔄 Recorrência</th>
              <th className="text-left px-3 py-2 font-bold">⏭️ Próxima</th>
              <th className="text-left px-3 py-2 font-bold w-16">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground"><div className="text-4xl mb-2 opacity-40">📝</div><p className="text-sm">Nenhuma tarefa encontrada.</p></td></tr>
            ) : (
              filteredTasks.map((task) => {
                const done = isTaskDoneOn(task, today);
                const cat = catById(task.categoryId);
                const upcoming = task.recurrence !== "none" ? getUpcomingDates({ date: task.date, recurrence: task.recurrence, weekdays: task.weekdays, endMode: task.endMode, endCount: task.endCount, endDate: task.endDate }, 1, today) : [];
                const nextDate = upcoming[0] ?? (task.recurrence === "none" ? task.date : "");
                return (
                  <tr key={task.id} onClick={() => { setEditingId(task.id); setEditorOpen(true); }} className="border-t border-border hover:bg-muted/20 cursor-pointer transition-colors group">
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleDone(task.id, today)} className={cn("h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", done ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background hover:border-foreground/40")}>{done ? "✓" : ""}</button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {task.emoji && <span className="text-base">{task.emoji}</span>}
                        <span className={cn("text-xs font-bold text-foreground", done && "line-through text-muted-foreground")}>{task.title}</span>
                        {task.subtasks.length > 0 && (() => { const ss = countSubTasksDoneOn(task, today); return <span className="text-[9px] bg-muted/40 text-muted-foreground px-1 py-0.5 rounded">{ss.done}/{ss.total}</span>; })()}
                      </div>
                    </td>
                    <td className="px-3 py-2"><span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded" style={done ? STATUS_TAG_STYLES.done : STATUS_TAG_STYLES.pending}>{done ? "✓ Concluída" : "Não iniciado"}</span></td>
                    <td className="px-3 py-2">{cat ? <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.emoji && <span>{cat.emoji}</span>}{cat.label}</span> : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{task.date ? formatShortBR(task.date) : "—"}{task.time && <span className="ml-1 text-[10px]">{task.time}</span>}</td>
                    <td className="px-3 py-2">{task.recurrence !== "none" ? <span className="text-[9px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded">↻ {RECURRENCE_LABELS[task.recurrence]}{task.recurrence === "custom_weekly" && task.weekdays && task.weekdays.length > 0 && <span className="ml-1 font-bold">({task.weekdays.map((d) => WEEKDAY_SHORT[d]).join(",")})</span>}{(!task.endMode || task.endMode === "never") && <span className="ml-1 text-emerald-500">∞</span>}{task.endMode === "count" && task.endCount && <span className="ml-1 text-purple-500">×{task.endCount}</span>}{task.endMode === "date" && task.endDate && <span className="ml-1 text-purple-500">até {formatShortBR(task.endDate)}</span>}</span> : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{nextDate ? formatShortBR(nextDate) : "—"}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingId(task.id); setEditorOpen(true); }} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent text-[10px] flex items-center justify-center" title="Editar">✏️</button>
                        <button onClick={() => handleDuplicate(task.id)} className="h-6 w-6 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 text-[10px] flex items-center justify-center" title="Duplicar">📋</button>
                        <button onClick={() => { if (confirm(`Excluir "${task.title}"?`)) handleDelete(task.id); }} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[10px] flex items-center justify-center" title="Excluir">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="lg:hidden space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-border"><div className="text-4xl mb-2 opacity-40">📝</div><p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p></div>
        ) : (
          filteredTasks.map((task) => {
            const done = isTaskDoneOn(task, today);
            const cat = catById(task.categoryId);
            return (
              <div key={task.id} onClick={() => { setEditingId(task.id); setEditorOpen(true); }} className="rounded-xl border border-border bg-card p-3 hover:border-foreground/30 transition-all cursor-pointer">
                <div className="flex items-start gap-2">
                  <button onClick={(e) => { e.stopPropagation(); toggleDone(task.id, today); }} className={cn("mt-0.5 h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", done ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background")}>{done ? "✓" : ""}</button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">{task.emoji && <span className="text-base">{task.emoji}</span>}<span className={cn("text-sm font-bold", done && "line-through text-muted-foreground")}>{task.title}</span></div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {cat && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.emoji} {cat.label}</span>}
                      {task.recurrence !== "none" && <span className="text-[9px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded">↻ {RECURRENCE_LABELS[task.recurrence]}</span>}
                      {task.date && <span className="text-[10px] text-muted-foreground">📅 {formatShortBR(task.date)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Gerenciador de categorias */}
      {catDialogOpen && <TaskCategoryDialog categories={categories} onAdd={addCategory} onUpdate={updateCategory} onRemove={removeCategory} onClose={() => setCatDialogOpen(false)} />}

      {/* Editor */}
      {editorOpen && (
        <TaskEditorDialog key={`task-${editorOpen}-${editingId ?? "new"}-${today}`} open={editorOpen} onOpenChange={(o) => { if (!o) { setEditorOpen(false); setEditingId(null); } }} editingTask={editingTask} defaultDate={today} categories={categories} onSubmit={handleSubmit} onDelete={editingId ? () => handleDelete(editingId) : undefined} />
      )}
    </div>
  );
}

// =================== Dialog de categorias ===================
function TaskCategoryDialog({ categories, onAdd, onUpdate, onRemove, onClose }: {
  categories: TaskCategory[];
  onAdd: (input: Omit<TaskCategory, "id">) => TaskCategory;
  onUpdate: (id: string, patch: Partial<Omit<TaskCategory, "id">>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎯");
  const [newColor, setNewColor] = useState("#3f3f46");
  const { toast } = useToast();

  function handleAdd() {
    if (!newLabel.trim()) return;
    onAdd({ label: newLabel.trim(), emoji: newEmoji.trim() || undefined, color: newColor });
    setNewLabel(""); setNewEmoji("🎯"); setNewColor("#3f3f46");
    toast({ title: "Categoria criada" });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">🏷️ Categorias de Tarefas</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm shrink-0" style={{ background: cat.color, color: readableTextColor(cat.color) }}>{cat.emoji || "•"}</span>
              <Input value={cat.label} onChange={(e) => onUpdate(cat.id, { label: e.target.value })} className="h-7 text-sm bg-transparent border-none flex-1" />
              <input type="color" value={cat.color} onChange={(e) => onUpdate(cat.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
              <Input value={cat.emoji ?? ""} onChange={(e) => onUpdate(cat.id, { emoji: e.target.value })} maxLength={4} className="h-7 w-12 text-center bg-muted/30 border-border" />
              <button onClick={() => { if (confirm(`Excluir categoria "${cat.label}"?`)) { onRemove(cat.id); toast({ title: "Categoria excluída" }); } }} className="text-muted-foreground hover:text-destructive text-xs">🗑️</button>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-border space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Nova categoria</p>
          <div className="flex items-center gap-2">
            <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={4} className="h-8 w-14 text-center bg-muted/30 border-border" />
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} placeholder="Nome da categoria..." className="h-8 flex-1 text-sm bg-muted/30 border-border" />
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
            <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8">+</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
