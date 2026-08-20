"use client";

import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import { PRESET_EMOJIS } from "@/lib/presets";
import {
  RECURRENCE_LABELS,
  END_MODE_LABELS,
  WEEKDAY_SHORT,
  WEEKDAY_FULL,
  formatShortBR,
  getUpcomingDates,
  getTotalOccurrences,
  type Recurrence,
  type RecurrenceEndMode,
  type SubTask,
  type Task,
  type TaskCategory,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface TaskEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task | null;
  defaultDate?: string;
  categories: TaskCategory[];
  onSubmit: (data: {
    title: string;
    emoji: string;
    color: string;
    date: string;
    time?: string;
    recurrence: Recurrence;
    weekdays?: number[];
    endMode?: RecurrenceEndMode;
    endCount?: number;
    endDate?: string;
    subtasks: SubTask[];
    notes?: string;
    categoryId?: string;
  }) => void;
  onDelete?: (id: string) => void;
}

export function TaskEditorDialog({
  open,
  onOpenChange,
  editingTask,
  defaultDate,
  categories,
  onSubmit,
  onDelete,
}: TaskEditorDialogProps) {
  const isEditing = !!editingTask;

  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [emoji, setEmoji] = useState(editingTask?.emoji ?? "✅");
  const [color, setColor] = useState(editingTask?.color ?? "#7c2d12");
  const [date, setDate] = useState(editingTask?.date ?? defaultDate ?? "");
  const [time, setTime] = useState(editingTask?.time ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>(editingTask?.recurrence ?? "none");
  const [weekdays, setWeekdays] = useState<number[]>(editingTask?.weekdays ?? []);
  const [endMode, setEndMode] = useState<RecurrenceEndMode>(editingTask?.endMode ?? "never");
  const [endCount, setEndCount] = useState<number>(editingTask?.endCount ?? 10);
  const [endDate, setEndDate] = useState<string>(editingTask?.endDate ?? "");
  const [subtasks, setSubtasks] = useState<SubTask[]>(editingTask?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState("");
  const [newChildSub, setNewChildSub] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(editingTask?.notes ?? "");
  const [categoryId, setCategoryId] = useState<string | undefined>(editingTask?.categoryId);

  // Toggle de dia da semana (0=Dom..6=Sáb)
  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort()
    );
  }

  // Preview das próximas datas em que a tarefa se aplica
  const upcomingDates = useMemo(() => {
    if (!date) return [];
    if (recurrence === "none") return [];
    // Se for custom_weekly sem dias selecionados, não mostra nada
    if (recurrence === "custom_weekly" && weekdays.length === 0) return [];
    return getUpcomingDates(
      { date, recurrence, weekdays, endMode, endCount, endDate },
      8,
      date
    );
  }, [date, recurrence, weekdays, endMode, endCount, endDate]);

  // Total de ocorrências (para mostrar no preview)
  const totalOccurrences = useMemo(() => {
    if (recurrence === "none") return null;
    return getTotalOccurrences({ endMode, endCount });
  }, [recurrence, endMode, endCount]);

  // Validador: pode salvar?
  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (!date) return false;
    if (recurrence === "custom_weekly" && weekdays.length === 0) return false;
    if (recurrence !== "none") {
      if (endMode === "count" && (!endCount || endCount < 1)) return false;
      if (endMode === "date" && !endDate) return false;
      if (endMode === "date" && endDate && endDate < date) return false;
    }
    return true;
  }, [title, date, recurrence, weekdays, endMode, endCount, endDate]);

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title: newSubtask.trim(), done: false, doneDates: [] },
    ]);
    setNewSubtask("");
  }

  function removeSubtask(id: string) {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  }

  function toggleSubtask(id: string) {
    setSubtasks(subtasks.map((s) => {
      if (s.id === id) return { ...s, done: !s.done };
      if (s.children) return { ...s, children: s.children.map((c) => c.id === id ? { ...c, done: !c.done } : c) };
      return s;
    }));
  }

  // Inicia modo de adicionar child a uma subtarefa
  function addChildToSubtask(parentId: string) {
    setSubtasks(subtasks.map((s) => s.id === parentId ? { ...s, children: s.children ?? [] } : s));
  }

  // Adiciona child com texto do input
  function addChildWithText(parentId: string) {
    const text = (newChildSub[parentId] ?? "").trim();
    if (!text) return;
    const newChild: SubTask = { id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title: text, done: false, doneDates: [] };
    setSubtasks(subtasks.map((s) => s.id === parentId ? { ...s, children: [...(s.children ?? []), newChild] } : s));
    setNewChildSub((prev) => ({ ...prev, [parentId]: "" }));
  }

  // Remove child de uma subtarefa
  function removeChildFromSubtask(parentId: string, childId: string) {
    setSubtasks(subtasks.map((s) => s.id === parentId ? { ...s, children: (s.children ?? []).filter((c) => c.id !== childId) } : s));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      title: title.trim(),
      emoji,
      color,
      date,
      time: time || undefined,
      recurrence,
      weekdays: recurrence === "custom_weekly" ? weekdays : undefined,
      endMode: recurrence === "none" ? undefined : endMode,
      endCount: recurrence !== "none" && endMode === "count" ? endCount : undefined,
      endDate: recurrence !== "none" && endMode === "date" ? endDate : undefined,
      subtasks,
      notes: notes.trim() || undefined,
      categoryId,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com cliente..."
              autoFocus
              required
              className="bg-muted/30 border-border"
            />
          </div>

          {/* Emoji + Cor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ícone</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="✅"
                maxLength={4}
                className="bg-muted/30 border-border"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_EMOJIS.slice(0, 12).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="h-7 w-7 rounded-md bg-muted/50 hover:bg-muted text-sm flex items-center justify-center"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cor</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>

          {/* Data + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data inicial *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-muted/30 border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Horário</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-muted/30 border-border"
              />
            </div>
          </div>

          {/* Recorrência */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Recorrência</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {(["none", "daily", "weekly", "monthly", "custom_weekly"] as Recurrence[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={cn(
                    "h-8 rounded-md text-[10px] font-medium border transition-colors",
                    recurrence === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  )}
                >
                  {RECURRENCE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Picker de dias da semana (somente quando recurrence === custom_weekly) */}
          {recurrence === "custom_weekly" && (
            <div className="space-y-2 p-3 rounded-md bg-blue-500/5 border border-blue-500/30">
              <Label className="text-xs uppercase tracking-wide text-blue-400 font-bold flex items-center gap-1">
                📅 Dias da semana *
              </Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Selecione os dias em que a tarefa se repete
              </p>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_SHORT.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    title={WEEKDAY_FULL[idx]}
                    className={cn(
                      "h-9 rounded-md text-[11px] font-bold border transition-all flex items-center justify-center",
                      weekdays.includes(idx)
                        ? "bg-blue-600 text-white border-blue-600 scale-105"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    )}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
              {weekdays.length === 0 && (
                <p className="text-[10px] text-amber-500 mt-1">
                  ⚠️ Selecione pelo menos 1 dia para poder salvar
                </p>
              )}
              {weekdays.length > 0 && (
                <p className="text-[10px] text-emerald-600 mt-1">
                  ✓ Repete: {weekdays.map((d) => WEEKDAY_FULL[d]).join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Seletor de término (somente para recorrências != none) */}
          {recurrence !== "none" && (
            <div className="space-y-2 p-3 rounded-md bg-purple-500/5 border border-purple-500/30">
              <Label className="text-xs uppercase tracking-wide text-purple-400 font-bold flex items-center gap-1">
                🏁 Quando termina?
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["never", "count", "date"] as RecurrenceEndMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEndMode(m)}
                    className={cn(
                      "h-8 rounded-md text-[10px] font-medium border transition-colors",
                      endMode === m
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    )}
                  >
                    {END_MODE_LABELS[m]}
                  </button>
                ))}
              </div>

              {/* Inputs dinâmicos baseados no endMode */}
              {endMode === "count" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] text-muted-foreground">Número de ocorrências</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={endCount}
                      onChange={(e) => setEndCount(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
                      className="h-8 w-24 text-sm bg-muted/30 border-border"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {endCount === 1 ? "ocorrência (aparece 1 vez)" : `ocorrências (aparece ${endCount} vezes)`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[5, 10, 20, 30, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEndCount(n)}
                        className={cn(
                          "h-6 px-2 rounded text-[10px] font-medium border transition-colors",
                          endCount === n
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {endMode === "date" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] text-muted-foreground">Data final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={date}
                    className="h-8 text-sm bg-muted/30 border-border"
                  />
                  {endDate && endDate < date && (
                    <p className="text-[10px] text-amber-500">
                      ⚠️ A data final deve ser depois da data inicial ({formatShortBR(date)})
                    </p>
                  )}
                  {endDate && endDate >= date && (
                    <p className="text-[10px] text-emerald-600">
                      ✓ Repete até {formatShortBR(endDate)}
                    </p>
                  )}
                </div>
              )}

              {endMode === "never" && (
                <p className="text-[10px] text-emerald-600 pt-1">
                  ♾️ Tarefa sempre ativa — repete para sempre
                </p>
              )}
            </div>
          )}

          {/* Preview das próximas datas */}
          {date && recurrence !== "none" && upcomingDates.length > 0 && (
            <div className="space-y-2 p-3 rounded-md bg-muted/20 border border-border">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1">
                👁️ Preview das próximas {upcomingDates.length} ocorrências
                {totalOccurrences !== null && (
                  <span className="text-purple-500 ml-1">
                    (de {totalOccurrences} total)
                  </span>
                )}
                {totalOccurrences === null && (
                  <span className="text-emerald-500 ml-1">∞ infinitas</span>
                )}
              </Label>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Revise antes de salvar — confirme se a tarefa aparece nos dias que você quer
              </p>
              <div className="flex flex-wrap gap-1">
                {upcomingDates.map((iso) => {
                  const wd = new Date(iso + "T00:00:00").getDay();
                  return (
                    <span
                      key={iso}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium bg-background border border-border"
                      style={{ borderLeft: `3px solid ${color}` }}
                    >
                      <span className="text-muted-foreground">{WEEKDAY_SHORT[wd]}</span>
                      <strong className="text-foreground">{formatShortBR(iso)}</strong>
                    </span>
                  );
                })}
              </div>
              {endMode === "count" && totalOccurrences !== null && totalOccurrences > 8 && (
                <p className="text-[10px] text-muted-foreground/70">
                  + mais {totalOccurrences - 8} ocorrência(s) após essas
                </p>
              )}
              {endMode === "never" && (
                <p className="text-[10px] text-muted-foreground/70">
                  ♾️ E continua assim para sempre…
                </p>
              )}
            </div>
          )}

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Categoria</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId(undefined)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-xs font-medium border transition-colors",
                  !categoryId
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                )}
              >
                Nenhuma
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors",
                    categoryId === cat.id
                      ? "text-white"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  )}
                  style={categoryId === cat.id ? { background: cat.color, borderColor: cat.color } : undefined}
                >
                  {cat.emoji && <span>{cat.emoji}</span>}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks (com nested) */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Subtarefas</Label>
            <div className="space-y-1">
              {subtasks.map((s) => (
                <div key={s.id} className="space-y-0.5">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/30">
                    <button type="button" onClick={() => toggleSubtask(s.id)} className={cn("h-4 w-4 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", s.done ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background")}>{s.done ? "✓" : ""}</button>
                    <span className={cn("text-xs flex-1", s.done && "line-through text-muted-foreground")}>{s.title}</span>
                    <button type="button" onClick={() => addChildToSubtask(s.id)} className="text-[10px] text-blue-500 hover:text-blue-400" title="Adicionar subtarefa secundária">＋</button>
                    <button type="button" onClick={() => removeSubtask(s.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                  {/* Children (subtarefas aninhadas) */}
                  {s.children && s.children.length > 0 && (
                    <div className="ml-6 space-y-0.5">
                      {s.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-muted/20">
                          <button type="button" onClick={() => toggleSubtask(child.id)} className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 transition-colors", child.done ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background")}>{child.done ? "✓" : ""}</button>
                          <span className={cn("text-[11px] flex-1", child.done && "line-through text-muted-foreground")}>↳ {child.title}</span>
                          <button type="button" onClick={() => removeChildFromSubtask(s.id, child.id)} className="text-[10px] text-muted-foreground hover:text-destructive">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Input para adicionar child */}
                  {s.children !== undefined && (
                    <div className="ml-6 flex gap-1">
                      <Input value={newChildSub[s.id] ?? ""} onChange={(e) => setNewChildSub((prev) => ({ ...prev, [s.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChildWithText(s.id); } }} placeholder="Subtarefa secundária..." className="h-7 text-[11px] bg-muted/20 border-border" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => addChildWithText(s.id)} className="h-7 px-2 text-[10px]">+</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} placeholder="Nova subtarefa..." className="h-8 text-xs bg-muted/30 border-border" />
              <Button type="button" variant="outline" size="sm" onClick={addSubtask} className="h-8">+</Button>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre esta tarefa..."
              rows={2}
              className="bg-muted/30 border-border resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingTask && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm("Excluir esta tarefa?")) {
                    onDelete(editingTask.id);
                    onOpenChange(false);
                  }
                }}
                className="text-destructive hover:text-destructive"
              >
                Excluir
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              {isEditing ? "Salvar" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
