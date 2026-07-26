"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PageCard } from "@/lib/pages";

interface ModoCavernaManagerProps {
  page: PageCard;
  onClose: () => void;
}

// =================== Tipos ===================
interface Habit {
  id: string;
  text: string;
  doneByDate: Record<string, boolean>;
}

const STORAGE_KEY = "dashboard.caverna.v3";
const EVENT = "dashboard:caverna-v3-change";

const DEFAULT_HABITS = [
  "Acordar às 07:00",
  "Usar celular só pra trabalho",
  "Café da manhã",
  "Atividade física 1 hora p. dia",
  "Me arrumar",
  "2L de água",
  "3 refeições saudáveis",
  "3 blocos de estudo",
  "4 blocos de foco nos negócios",
  "30 min de leitura",
  "Sem distrações nas redes sociais",
  "Planejamento do dia seguinte",
];

// =================== Store ===================
let cache: Habit[] | null = null;
const listeners = new Set<() => void>();

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function localISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function read(): Habit[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") { cache = []; return cache; }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) { cache = []; return cache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { cache = []; return cache; }
    cache = parsed.map((h): Habit | null => {
      if (!h || typeof h !== "object") return null;
      const x = h as Record<string, unknown>;
      if (typeof x.id !== "string" || typeof x.text !== "string") return null;
      const doneByDate = (x.doneByDate && typeof x.doneByDate === "object") ? x.doneByDate : {};
      const clean: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(doneByDate)) {
        if (typeof k === "string" && typeof v === "boolean") clean[k] = v;
      }
      return { id: x.id, text: x.text, doneByDate: clean };
    }).filter((h): h is Habit => h !== null);
  } catch { cache = []; }
  return cache;
}

function write(next: Habit[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch { /* ignore */ }
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY: Habit[] = [];

function useCavernaHabits() {
  const [habits, setHabits] = useState<Habit[]>(read);
  useEffect(() => {
    const unsub = subscribe(() => setHabits(read()));
    return unsub;
  }, []);

  const addHabit = useCallback((text: string) => {
    if (!text.trim()) return;
    write([...read(), { id: makeId("habit"), text: text.trim(), doneByDate: {} }]);
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Omit<Habit, "id">>) => {
    write(read().map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, []);

  const removeHabit = useCallback((id: string) => {
    write(read().filter((h) => h.id !== id));
  }, []);

  const toggleHabit = useCallback((id: string, date: string) => {
    write(read().map((h) => (h.id === id ? { ...h, doneByDate: { ...h.doneByDate, [date]: !h.doneByDate[date] } } : h)));
  }, []);

  return { habits, addHabit, updateHabit, removeHabit, toggleHabit };
}

// =================== Geração de datas ===================
type ViewMode = "dia" | "semana" | "15dias" | "mes";

function getDateRange(mode: ViewMode): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: string[] = [];
  const count = mode === "dia" ? 1 : mode === "semana" ? 7 : mode === "15dias" ? 15 : 30;
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(localISODate(d));
  }
  return dates;
}

function getDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return ["D", "S", "T", "Q", "Q", "S", "S"][d.getDay()];
}

// =================== Componente principal ===================
export function ModoCavernaManager({ page, onClose }: ModoCavernaManagerProps) {
  const { toast } = useToast();
  const { habits, addHabit, updateHabit, removeHabit, toggleHabit } = useCavernaHabits();
  const [viewMode, setViewMode] = useState<ViewMode>("semana");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const dates = useMemo(() => getDateRange(viewMode), [viewMode]);
  const today = localISODate(new Date());

  // Estatísticas
  const stats = useMemo(() => {
    let totalChecks = 0, doneChecks = 0;
    const habitCompletion: { id: string; text: string; done: number; total: number; pct: number }[] = [];
    habits.forEach((h) => {
      let done = 0;
      dates.forEach((d) => { totalChecks++; if (h.doneByDate[d]) { done++; doneChecks++; } });
      habitCompletion.push({ id: h.id, text: h.text, done, total: dates.length, pct: dates.length > 0 ? Math.round((done / dates.length) * 100) : 0 });
    });
    let streak = 0;
    const checkDate = new Date(); checkDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const iso = localISODate(checkDate);
      if (habits.some((h) => h.doneByDate[iso])) streak++;
      else if (i > 0) break;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    const allDoneDates = new Set<string>();
    habits.forEach((h) => { Object.entries(h.doneByDate).forEach(([d, done]) => { if (done) allDoneDates.add(d); }); });
    const sortedDone = Array.from(allDoneDates).sort();
    let bestStreak = 0, tempStreak = 0; let prev: Date | null = null;
    for (const iso of sortedDone) {
      const curr = new Date(iso + "T00:00:00");
      if (prev) { const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000); if (diff === 1) tempStreak++; else { if (tempStreak > bestStreak) bestStreak = tempStreak; tempStreak = 1; } }
      else tempStreak = 1;
      prev = curr;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    return { totalHabits: habits.length, totalChecks, doneChecks, completionRate: totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0, streak, bestStreak, habitCompletion: habitCompletion.sort((a, b) => b.pct - a.pct) };
  }, [habits, dates]);

  function handleSubmitHabit(text: string) {
    if (editingHabitId) { updateHabit(editingHabitId, { text }); toast({ title: "Hábito atualizado", description: text }); setEditingHabitId(null); }
    else { addHabit(text); toast({ title: "✅ Hábito adicionado", description: text }); }
  }
  function handleDeleteHabit(id: string) { const h = habits.find((x) => x.id === id); removeHabit(id); toast({ title: "Hábito excluído", description: h?.text, variant: "destructive" }); setEditorOpen(false); setEditingHabitId(null); }
  const editingHabit = habits.find((h) => h.id === editingHabitId) ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#1e293b"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "🧠"}</div>
            <div><h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1><p className="text-[11px] text-muted-foreground">Rastreador de rotina diária</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setEditingHabitId(null); setEditorOpen(true); }} className="text-muted-foreground">⚙️ Hábitos</Button>
          <FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Seletor de visualização */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-2 shrink-0 flex items-center gap-1">
        {([["dia","Dia"],["semana","Semana"],["15dias","15 dias"],["mes","Mês"]] as const).map(([id,label]) => (
          <button key={id} onClick={() => setViewMode(id)} className={cn("h-7 px-3 rounded-md text-[10px] font-bold transition-colors", viewMode === id ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:bg-muted")}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="min-h-full p-4 sm:p-6">
          {habits.length === 0 ? (
            <div className="text-center py-16"><div className="text-6xl mb-3 opacity-40">🧠</div><p className="text-sm text-muted-foreground mb-3">Nenhum hábito cadastrado ainda.</p><Button variant="ghost" size="sm" onClick={() => { setEditingHabitId(null); setEditorOpen(true); }} className="text-blue-500">+ Cadastrar primeiro hábito</Button></div>
          ) : (
            <>
              {/* Tabela */}
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-muted/30">
                      <th className="text-left px-3 py-2 font-bold text-[10px] uppercase text-muted-foreground sticky left-0 bg-muted/30 z-20 min-w-[180px] border-r border-border">📋 Hábito</th>
                      {dates.map((d) => {
                        const isToday = d === today;
                        const dt = new Date(d + "T00:00:00");
                        return (
                          <th key={d} className={cn("text-center px-1 py-2 font-bold text-[10px] min-w-[40px] border-r border-border/50", isToday ? "text-blue-500" : "text-muted-foreground")}>
                            <div className={cn("text-[10px]", isToday && "font-bold")}>{getDayLabel(d)}</div>
                            <div className={cn("text-sm mx-auto flex items-center justify-center", isToday && "bg-blue-500 text-white rounded-full h-6 w-6")}>{dt.getDate()}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((habit) => (
                      <tr key={habit.id} className="border-t border-border hover:bg-muted/10 group">
                        <td className="px-3 py-2 sticky left-0 bg-card z-10 border-r border-border min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground flex-1 truncate">{habit.text}</span>
                            <button onClick={() => { setEditingHabitId(habit.id); setEditorOpen(true); }} className="text-muted-foreground hover:text-foreground text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" title="Editar">✏️</button>
                            <button onClick={() => { if (confirm(`Excluir hábito "${habit.text}"?`)) handleDeleteHabit(habit.id); }} className="text-muted-foreground hover:text-destructive text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir">🗑️</button>
                          </div>
                        </td>
                        {dates.map((d) => {
                          const done = !!habit.doneByDate[d];
                          const isToday = d === today;
                          return (
                            <td key={d} className="text-center px-1 py-2 border-r border-border/50 cursor-pointer" onClick={() => toggleHabit(habit.id, d)}>
                              <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] mx-auto transition-colors", done ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background hover:border-foreground/40", isToday && !done && "border-blue-500/40")}>{done ? "✓" : ""}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-6" />

              {/* Estatísticas */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="bg-card border border-border rounded-lg p-3 text-center"><div className="text-xl font-bold text-foreground">{stats.totalHabits}</div><div className="text-[9px] text-muted-foreground uppercase">Hábitos</div></div>
                  <div className="bg-card border border-border rounded-lg p-3 text-center"><div className="text-xl font-bold text-emerald-500">{stats.doneChecks}</div><div className="text-[9px] text-muted-foreground uppercase">Concluídos</div></div>
                  <div className="bg-card border border-border rounded-lg p-3 text-center"><div className="text-xl font-bold text-amber-500">{stats.totalChecks - stats.doneChecks}</div><div className="text-[9px] text-muted-foreground uppercase">Pendentes</div></div>
                  <div className="bg-card border border-border rounded-lg p-3 text-center"><div className="text-xl font-bold text-blue-500">{stats.completionRate}%</div><div className="text-[9px] text-muted-foreground uppercase">Taxa</div></div>
                  <div className="bg-card border border-border rounded-lg p-3 text-center"><div className="text-xl font-bold text-orange-500">🔥 {stats.streak}</div><div className="text-[9px] text-muted-foreground uppercase">Streak</div></div>
                </div>

                {/* Progresso por hábito */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase text-muted-foreground">Progresso por hábito</h3>
                  {stats.habitCompletion.map((hc) => (
                    <div key={hc.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]"><span className="text-foreground truncate flex-1">{hc.text}</span><span className="text-muted-foreground shrink-0 ml-2">{hc.done} / {hc.total} ({hc.pct}%)</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full transition-all", hc.pct === 100 ? "bg-emerald-500" : hc.pct >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${hc.pct}%` }} /></div>
                    </div>
                  ))}
                </div>

                {stats.bestStreak > 0 && (
                  <div className="bg-gradient-to-br from-orange-500/10 to-card border border-orange-500/30 rounded-xl p-4 text-center"><p className="text-[10px] uppercase text-muted-foreground font-bold">🏆 Melhor sequência</p><p className="text-3xl font-bold text-orange-500">{stats.bestStreak} dias</p></div>
                )}
              </div>
              <div className="h-8" />
            </>
          )}
        </div>
      </div>

      {/* Editor de hábito */}
      {editorOpen && (
        <HabitEditor habit={editingHabit} onClose={() => { setEditorOpen(false); setEditingHabitId(null); }} onSubmit={handleSubmitHabit} onDelete={editingHabitId ? () => handleDeleteHabit(editingHabitId) : undefined} />
      )}
    </div>
  );
}

// =================== Editor de hábito ===================
function HabitEditor({ habit, onClose, onSubmit, onDelete }: {
  habit?: Habit | null; onClose: () => void; onSubmit: (text: string) => void; onDelete?: () => void;
}) {
  const [text, setText] = useState(habit?.text ?? "");
  const isEditing = !!habit;

  function handleAddContinue() { if (!text.trim()) return; onSubmit(text.trim()); if (isEditing) onClose(); else setText(""); }
  function handleAddClose() { if (!text.trim()) return; onSubmit(text.trim()); onClose(); }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{isEditing ? "Editar hábito" : "Novo hábito"}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button></div>
        <div className="space-y-3">
          <div className="space-y-1"><label className="text-[10px] uppercase text-muted-foreground font-bold">Descrição do hábito *</label>
            <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddContinue(); } }} placeholder="Ex: Acordar às 07:00, 2L de água..." autoFocus className="h-9 bg-muted/30 border-border" />
          </div>
          {!isEditing && (
            <div className="space-y-1"><label className="text-[10px] uppercase text-muted-foreground font-bold">Sugestões (clique para usar)</label>
              <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">{DEFAULT_HABITS.map((h) => (<button key={h} type="button" onClick={() => setText(h)} className="h-7 px-2 rounded-md text-[10px] font-medium bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border transition-colors">{h}</button>))}</div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {isEditing && onDelete && <Button type="button" variant="ghost" onClick={() => { if (confirm("Excluir este hábito?")) { onDelete(); onClose(); } }} className="text-destructive hover:text-destructive">Excluir</Button>}
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Fechar</Button>
            {!isEditing && text.trim() && <Button type="button" onClick={handleAddClose} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0">✓ Adicionar e fechar</Button>}
            <Button type="button" onClick={handleAddContinue} disabled={!text.trim()} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">{isEditing ? "💾 Salvar" : "+ Adicionar e continuar"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
