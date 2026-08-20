"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTasks } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskEditorDialog } from "./task-editor-dialog";
import {
  RECURRENCE_LABELS,
  WEEKDAY_SHORT,
  isTaskDoneOn,
  isSubTaskDoneOn,
  countSubTasksDoneOn,
  getSubTasksForDate,
  taskAppliesToDate,
  todayISO,
  type Recurrence,
  type Task,
  type TaskCategory,
  type SubTask,
} from "@/lib/tasks";
import { cn, readableTextColor } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface DayInfo {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  pendingCount: number;
  doneCount: number;
  allDone: boolean;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface CalendarTasksProps {
  /** Optional callback to open the Social Media manager. */
  onOpenSocial?: () => void;
}

export function CalendarTasks({ onOpenSocial: _onOpenSocial }: CalendarTasksProps = {}) {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    removeTask,
    toggleDone,
    toggleSubTask,
    moveTask,
    duplicateTask,
    addSubTaskByDate,
    addNestedSubTaskByDate,
    toggleSubTaskByDate,
    toggleNestedSubTaskByDate,
    removeSubTaskByDate,
    removeNestedSubTaskByDate,
    moveSubTask,
    moveSubTaskByDate,
    renameSubTask,
    renameSubTaskByDate,
    resetAll,
    addCategory,
    updateCategory,
    removeCategory,
  } = useTasks();
  const { toast } = useToast();

  // HIDRATION-SAFE: inicializa com valores null e recalcula no client.
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDate(todayISO());
  }, []);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  // Drag state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const cells = useMemo(
    () => (year !== null && month !== null ? getCalendarCells(year, month, tasks) : []),
    [year, month, tasks]
  );

  const editingTask = useMemo(
    () => tasks.find((t) => t.id === editingId) ?? null,
    [tasks, editingId]
  );

  const dayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks
      .filter((t) => taskAppliesToDate(t, selectedDate))
      .sort((a, b) => {
        const ta = a.time ?? "99:99";
        const tb = b.time ?? "99:99";
        return ta.localeCompare(tb);
      });
  }, [tasks, selectedDate]);

  function prevMonth() {
    if (month === null || year === null) return;
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === null || year === null) return;
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function goToday() {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDate(todayISO());
  }

  function openNewTask() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEditTask(id: string) {
    setEditingId(id);
    setEditorOpen(true);
  }

  function handleSubmit(data: {
    title: string;
    emoji: string;
    color: string;
    date: string;
    time?: string;
    recurrence: Recurrence;
    weekdays?: number[];
    endMode?: "never" | "count" | "date";
    endCount?: number;
    endDate?: string;
    subtasks: Task["subtasks"];
    notes?: string;
    categoryId?: string;
  }) {
    if (editingId) {
      updateTask(editingId, data);
      toast({ title: "Tarefa atualizada", description: data.title });
    } else {
      addTask(data as Omit<Task, "id" | "createdAt" | "updatedAt">);
      toast({ title: "Tarefa criada", description: data.title });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    removeTask(id);
    toast({ title: "Tarefa excluída", variant: "destructive" });
  }

  function handleReset() {
    if (confirm("Restaurar tarefas de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Tarefas restauradas" });
    }
  }

  // ----- Drag & Drop -----

  function handleTaskDragStart(e: React.DragEvent, taskId: string) {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }

  function handleTaskDragEnd() {
    setDraggingTaskId(null);
    setDragOverDate(null);
  }

  function handleDayDragOver(e: React.DragEvent, dateISO: string) {
    if (!draggingTaskId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateISO);
  }

  function handleDayDragLeave(dateISO: string) {
    if (dragOverDate === dateISO) {
      setDragOverDate(null);
    }
  }

  function handleDayDrop(e: React.DragEvent, dateISO: string) {
    e.preventDefault();
    if (!draggingTaskId) return;
    const task = tasks.find((t) => t.id === draggingTaskId);
    if (task && task.date !== dateISO) {
      moveTask(draggingTaskId, dateISO);
      toast({ title: "Tarefa movida", description: `Para ${formatDateBR(dateISO)}` });
    }
    handleTaskDragEnd();
  }

  // Enquanto year/month não foram setados no client, renderiza placeholder.
  if (year === null || month === null) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const currentYear = year;
  const currentMonth = month;

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            Tarefas &amp; Calendário
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCatDialogOpen(true)} className="text-muted-foreground">
              🏷️ Categorias
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
              Restaurar
            </Button>
            <Button size="sm" onClick={openNewTask} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              + Nova tarefa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Calendar */}
          <section className="space-y-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {MONTHS[currentMonth]} <span className="text-muted-foreground font-normal">{currentYear}</span>
              </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={prevMonth} aria-label="Mês anterior">‹</Button>
                <Button variant="ghost" size="sm" onClick={goToday}>Hoje</Button>
                <Button variant="ghost" size="sm" onClick={nextMonth} aria-label="Próximo mês">›</Button>
              </div>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium uppercase text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, i) => {
                const isSelected = cell.date === selectedDate;
                const isDragOver = dragOverDate === cell.date;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(cell.date)}
                    onDragOver={(e) => handleDayDragOver(e, cell.date)}
                    onDragLeave={() => handleDayDragLeave(cell.date)}
                    onDrop={(e) => handleDayDrop(e, cell.date)}
                    className={cn(
                      "relative aspect-square rounded-lg border flex flex-col items-center justify-center text-sm transition-all cursor-pointer",
                      !cell.inMonth && "opacity-35",
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground"
                        : isDragOver
                          ? "border-blue-500/70 ring-2 ring-blue-500/30 bg-blue-500/5"
                          : "border-border bg-card hover:border-foreground/20",
                      cell.isToday && !isSelected && "border-foreground/40"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm",
                        cell.isToday && "font-bold text-primary"
                      )}
                    >
                      {cell.day}
                    </span>
                    {/* Indicadores de tarefas */}
                    <div className="absolute bottom-1 flex items-center gap-0.5">
                      {cell.allDone ? (
                        <span className="text-emerald-500 text-[10px]">✓</span>
                      ) : (
                        cell.pendingCount > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )
                      )}
                      {cell.doneCount > 0 && !cell.allDone && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                      )}
                    </div>
                    {/* Mini badges de tarefas (até 3) */}
                    {cell.pendingCount > 0 && (
                      <div className="absolute top-0.5 left-0.5 right-0.5 flex justify-center gap-0.5 overflow-hidden">
                        {tasks
                          .filter((t) => taskAppliesToDate(t, cell.date))
                          .slice(0, 3)
                          .map((t) => (
                            <span
                              key={t.id}
                              className="h-1 w-1 rounded-full"
                              style={{ background: t.color }}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Pendente
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500 text-[10px]">✓</span>
                Tudo concluído
              </div>
              <div className="flex items-center gap-1.5 text-foreground/60">
                💡 Arraste tarefas para mudar a data
              </div>
            </div>
          </section>

          {/* Task list for selected day */}
          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })
                    : "Selecione um dia"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openNewTask}>
                + Nova
              </Button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {dayTasks.length === 0 ? (
                <div className="text-center py-12 rounded-lg border border-dashed border-border">
                  <div className="text-3xl mb-2 opacity-50">📝</div>
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa para este dia.</p>
                  <Button variant="ghost" size="sm" onClick={openNewTask} className="mt-2">
                    Criar tarefa
                  </Button>
                </div>
              ) : (
                dayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    dateISO={selectedDate}
                    category={categories.find((c) => c.id === task.categoryId)}
                    onToggle={() => toggleDone(task.id, selectedDate)}
                    onToggleSub={(subId) => toggleSubTask(task.id, subId, selectedDate)}
                    onAddDaySub={(title) => addSubTaskByDate(task.id, selectedDate, title)}
                    onAddDayChild={(parentId, title) => addNestedSubTaskByDate(task.id, selectedDate, parentId, title)}
                    onToggleDaySub={(subId) => toggleSubTaskByDate(task.id, selectedDate, subId)}
                    onToggleDayChild={(subId) => toggleNestedSubTaskByDate(task.id, selectedDate, subId)}
                    onRemoveDaySub={(subId) => removeSubTaskByDate(task.id, selectedDate, subId)}
                    onRemoveDayChild={(parentId, childId) => removeNestedSubTaskByDate(task.id, selectedDate, parentId, childId)}
                    onMoveDaySub={(subId, dir) => moveSubTaskByDate(task.id, selectedDate, subId, dir)}
                    onMoveRecurringSub={(subId, dir) => moveSubTask(task.id, subId, dir)}
                    onRenameRecurringSub={(subId, title) => renameSubTask(task.id, subId, title)}
                    onRenameDaySub={(subId, title) => renameSubTaskByDate(task.id, selectedDate, subId, title)}
                    onDuplicate={() => { duplicateTask(task.id); toast({ title: "Tarefa duplicada" }); }}
                    onEdit={() => openEditTask(task.id)}
                    onDragStart={(e) => handleTaskDragStart(e, task.id)}
                    onDragEnd={handleTaskDragEnd}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      <TaskEditorDialog
        key={`task-${editorOpen}-${editingId ?? "new"}-${selectedDate}`}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditingId(null);
        }}
        editingTask={editingTask}
        defaultDate={selectedDate}
        categories={categories}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      {/* Dialog de categorias */}
      {catDialogOpen && (
        <CategoryDialog
          categories={categories}
          onClose={() => setCatDialogOpen(false)}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onRemove={removeCategory}
        />
      )}
    </div>
  );
}

function getCalendarCells(year: number, month: number, tasks: Task[]): DayInfo[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const start = new Date(year, month, 1 - startDay);
  const today = todayISO();
  const cells: DayInfo[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toISO(d);
    const inMonth = d.getMonth() === month;

    const dayTasks = tasks.filter((t) => taskAppliesToDate(t, iso));
    let doneCount = 0;
    for (const t of dayTasks) {
      if (isTaskDoneOn(t, iso)) doneCount++;
    }
    const pendingCount = dayTasks.length - doneCount;
    cells.push({
      date: iso,
      day: d.getDate(),
      inMonth,
      isToday: iso === today,
      pendingCount,
      doneCount,
      allDone: dayTasks.length > 0 && doneCount === dayTasks.length,
    });
  }
  return cells;
}

function formatDateBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// =================== Task Row ===================

function TaskRow({
  task, dateISO, category, onToggle, onToggleSub,
  onAddDaySub, onAddDayChild, onToggleDaySub, onToggleDayChild,
  onRemoveDaySub, onRemoveDayChild, onMoveDaySub, onMoveRecurringSub,
  onRenameRecurringSub, onRenameDaySub,
  onDuplicate, onEdit, onDragStart, onDragEnd,
}: {
  task: Task; dateISO: string; category?: TaskCategory;
  onToggle: () => void;
  onToggleSub: (subId: string) => void;
  onAddDaySub: (title: string) => void;
  onAddDayChild: (parentId: string, title: string) => void;
  onToggleDaySub: (subId: string) => void;
  onToggleDayChild: (subId: string) => void;
  onRemoveDaySub: (subId: string) => void;
  onRemoveDayChild: (parentId: string, childId: string) => void;
  onMoveDaySub: (subId: string, dir: "up" | "down") => void;
  onMoveRecurringSub: (subId: string, dir: "up" | "down") => void;
  onRenameRecurringSub: (subId: string, title: string) => void;
  onRenameDaySub: (subId: string, title: string) => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newDaySub, setNewDaySub] = useState("");
  const [dayChildInput, setDayChildInput] = useState<Record<string, string>>({});
  const [showDayChildInput, setShowDayChildInput] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubText, setEditingSubText] = useState("");
  const done = isTaskDoneOn(task, dateISO);
  const daySubs = getSubTasksForDate(task, dateISO).daySpecific;
  const hasSubs = task.subtasks.length > 0 || daySubs.length > 0;
  const subStats = hasSubs ? countSubTasksDoneOn(task, dateISO) : { done: 0, total: 0 };
  const subDone = subStats.done;
  const subTotal = subStats.total;
  const subProgress = subTotal > 0 ? (subDone / subTotal) * 100 : 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-lg border border-border bg-card overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${task.color}` }}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "mt-0.5 h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors",
            done
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-background hover:border-foreground/40"
          )}
        >
          {done ? "✓" : ""}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.time && (
              <span
                className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                style={{ background: task.color }}
              >
                {task.time}
              </span>
            )}
            {task.emoji && <span className="text-sm">{task.emoji}</span>}
            <span
              className={cn(
                "text-sm font-medium truncate",
                done && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </span>
            {task.recurrence !== "none" && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                ↻ {RECURRENCE_LABELS[task.recurrence]}
                {task.recurrence === "custom_weekly" && Array.isArray(task.weekdays) && task.weekdays.length > 0 && (
                  <span className="ml-1 font-bold">
                    ({task.weekdays.map((d) => WEEKDAY_SHORT[d]).join(", ")})
                  </span>
                )}
                {task.endMode === "count" && typeof task.endCount === "number" && (
                  <span className="ml-1 text-purple-500 font-bold">×{task.endCount}</span>
                )}
                {task.endMode === "date" && task.endDate && (
                  <span className="ml-1 text-purple-500 font-bold">até {task.endDate.split("-").reverse().slice(0, 2).join("/")}</span>
                )}
                {(!task.endMode || task.endMode === "never") && (
                  <span className="ml-1 text-emerald-500 font-bold">∞</span>
                )}
              </span>
            )}
            {category && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: `${category.color}30`,
                  color: category.color,
                  border: `1px solid ${category.color}60`,
                }}
              >
                {category.emoji && <span>{category.emoji}</span>}
                {category.label}
              </span>
            )}
          </div>

          {/* Notes preview */}
          {task.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {task.notes}
            </p>
          )}

          {/* Subtask progress bar + expand (sempre visível pra permitir adicionar do dia) */}
          <div className="mt-2 flex items-center gap-2">
            {hasSubs && <Progress value={subProgress} className="h-1.5 flex-1" />}
            {hasSubs && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {subDone}/{subTotal} {expanded ? "▲" : "▼"}
              </button>
            )}
            {!hasSubs && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                + Subtarefas
              </button>
            )}
            {hasSubs && !expanded && <span className="text-[10px] text-muted-foreground/50">▼ expandir</span>}
          </div>

          {/* Expanded subtasks (com nested + reordenação) */}
          {expanded && task.subtasks.length > 0 && (
            <div className="mt-2 space-y-1 pl-2">
              {task.subtasks.map((s, idx) => {
                const sDone = isSubTaskDoneOn(s, task, dateISO);
                return (
                  <div key={s.id} className="space-y-0.5">
                    <div className="flex items-center gap-1 group">
                      <div className="flex flex-col shrink-0">
                        <button onClick={() => onMoveRecurringSub(s.id, "up")} disabled={idx === 0} className="text-[8px] text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▲</button>
                        <button onClick={() => onMoveRecurringSub(s.id, "down")} disabled={idx === task.subtasks.length - 1} className="text-[8px] text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▼</button>
                      </div>
                      <button onClick={() => onToggleSub(s.id)} className={cn("h-4 w-4 rounded border flex items-center justify-center text-[9px] shrink-0 transition-colors", sDone ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background")}>{sDone ? "✓" : ""}</button>
                      {editingSubId === s.id ? (
                        <input type="text" value={editingSubText} onChange={(e) => setEditingSubText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onRenameRecurringSub(s.id, editingSubText); setEditingSubId(null); } if (e.key === "Escape") setEditingSubId(null); }} onBlur={() => { if (editingSubText.trim()) onRenameRecurringSub(s.id, editingSubText); setEditingSubId(null); }} autoFocus className="flex-1 h-6 text-xs bg-muted/30 border border-border rounded px-1.5 focus:outline-none" />
                      ) : (
                        <span onDoubleClick={() => { setEditingSubId(s.id); setEditingSubText(s.title); }} className={cn("text-xs flex-1 cursor-text", sDone ? "line-through text-muted-foreground" : "text-foreground")}>{s.title}</span>
                      )}
                      <button onClick={() => { setEditingSubId(s.id); setEditingSubText(s.title); }} className="text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100" title="Editar">✏️</button>
                    </div>
                    {s.children && s.children.length > 0 && (
                      <div className="ml-8 space-y-0.5">
                        {s.children.map((child) => {
                          const cDone = isSubTaskDoneOn(child, task, dateISO);
                          return (
                            <div key={child.id} className="flex items-center gap-1">
                              <button onClick={() => onToggleSub(child.id)} className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center text-[8px] shrink-0 transition-colors", cDone ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background")}>{cDone ? "✓" : ""}</button>
                              <span className={cn("text-[11px]", cDone ? "line-through text-muted-foreground" : "text-foreground/80")}>↳ {child.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Subtarefas específicas deste dia (não recorrentes) — com children + reordenação */}
          {expanded && daySubs.length > 0 && (
            <div className="mt-2 space-y-1 pl-2 border-t border-border/50 pt-2">
              <p className="text-[9px] uppercase text-muted-foreground font-bold">📌 Só hoje:</p>
              {daySubs.map((s, idx) => (
                <div key={s.id} className="space-y-0.5">
                  <div className="flex items-center gap-1 group">
                    <div className="flex flex-col shrink-0">
                      <button onClick={() => onMoveDaySub(s.id, "up")} disabled={idx === 0} className="text-[8px] text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▲</button>
                      <button onClick={() => onMoveDaySub(s.id, "down")} disabled={idx === daySubs.length - 1} className="text-[8px] text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▼</button>
                    </div>
                    <button onClick={() => onToggleDaySub(s.id)} className={cn("h-4 w-4 rounded border flex items-center justify-center text-[9px] shrink-0 transition-colors", s.done ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background")}>{s.done ? "✓" : ""}</button>
                    {editingSubId === s.id ? (
                      <input type="text" value={editingSubText} onChange={(e) => setEditingSubText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onRenameDaySub(s.id, editingSubText); setEditingSubId(null); } if (e.key === "Escape") setEditingSubId(null); }} onBlur={() => { if (editingSubText.trim()) onRenameDaySub(s.id, editingSubText); setEditingSubId(null); }} autoFocus className="flex-1 h-6 text-xs bg-muted/30 border border-border rounded px-1.5 focus:outline-none" />
                    ) : (
                      <span onDoubleClick={() => { setEditingSubId(s.id); setEditingSubText(s.title); }} className={cn("text-xs flex-1 cursor-text", s.done && "line-through text-muted-foreground")}>{s.title}</span>
                    )}
                    <button onClick={() => setShowDayChildInput(showDayChildInput === s.id ? null : s.id)} className="text-[10px] text-blue-500 hover:text-blue-400 opacity-0 group-hover:opacity-100" title="Adicionar secundária">＋</button>
                    <button onClick={() => { setEditingSubId(s.id); setEditingSubText(s.title); }} className="text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100" title="Editar">✏️</button>
                    <button onClick={() => onRemoveDaySub(s.id)} className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                  {/* Children (subtarefas secundárias do dia) */}
                  {s.children && s.children.length > 0 && (
                    <div className="ml-8 space-y-0.5">
                      {s.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-1">
                          <button onClick={() => onToggleDayChild(child.id)} className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center text-[8px] shrink-0 transition-colors", child.done ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background")}>{child.done ? "✓" : ""}</button>
                          <span className={cn("text-[11px]", child.done ? "line-through text-muted-foreground" : "text-foreground/80")}>↳ {child.title}</span>
                          <button onClick={() => onRemoveDayChild(s.id, child.id)} className="text-[9px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Input para adicionar child */}
                  {showDayChildInput === s.id && (
                    <div className="ml-8 flex gap-1">
                      <input type="text" value={dayChildInput[s.id] ?? ""} onChange={(e) => setDayChildInput((prev) => ({ ...prev, [s.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter" && (dayChildInput[s.id] ?? "").trim()) { e.preventDefault(); onAddDayChild(s.id, dayChildInput[s.id]); setDayChildInput((prev) => ({ ...prev, [s.id]: "" })); setShowDayChildInput(null); } }} placeholder="Subtarefa secundária..." className="flex-1 h-6 text-[11px] bg-muted/20 border border-border rounded px-2 focus:outline-none" />
                      <button onClick={() => { if ((dayChildInput[s.id] ?? "").trim()) { onAddDayChild(s.id, dayChildInput[s.id] ?? ""); setDayChildInput((prev) => ({ ...prev, [s.id]: "" })); setShowDayChildInput(null); } }} className="h-6 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px]">+</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input para adicionar subtarefa específica do dia */}
          {expanded && (
            <div className="mt-1 pl-2 flex gap-1">
              <input
                type="text"
                value={newDaySub}
                onChange={(e) => setNewDaySub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDaySub.trim()) {
                    e.preventDefault();
                    onAddDaySub(newDaySub);
                    setNewDaySub("");
                  }
                }}
                placeholder="+ Subtarefa só pra hoje..."
                className="flex-1 h-7 text-[11px] bg-muted/30 border border-border rounded px-2 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (newDaySub.trim()) {
                    onAddDaySub(newDaySub);
                    setNewDaySub("");
                  }
                }}
                className="h-7 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Action buttons — sempre visíveis */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent text-xs transition-colors"
            aria-label="Editar tarefa"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 text-xs transition-colors"
            aria-label="Duplicar tarefa"
            title="Duplicar"
          >
            📋
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== Category Dialog ===================

function CategoryDialog({
  categories,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
}: {
  categories: TaskCategory[];
  onClose: () => void;
  onAdd: (cat: Omit<TaskCategory, "id">) => void;
  onUpdate: (id: string, patch: Partial<Omit<TaskCategory, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newColor, setNewColor] = useState("#1e3a8a");

  function handleAdd() {
    if (!newLabel.trim()) return;
    onAdd({ label: newLabel.trim(), emoji: newEmoji.trim(), color: newColor });
    setNewLabel("");
    setNewEmoji("");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">🏷️ Categorias</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Lista de categorias */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border">
              <span
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-sm"
                style={{ background: cat.color, color: readableTextColor(cat.color) }}
              >
                {cat.emoji || "•"}
              </span>
              <Input
                value={cat.label}
                onChange={(e) => onUpdate(cat.id, { label: e.target.value })}
                className="h-7 text-sm bg-transparent border-none flex-1"
              />
              <input
                type="color"
                value={cat.color}
                onChange={(e) => onUpdate(cat.id, { color: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <button
                onClick={() => {
                  if (confirm(`Excluir categoria "${cat.label}"?`)) onRemove(cat.id);
                }}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar nova */}
        <div className="pt-3 border-t border-border space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Nova categoria</p>
          <div className="flex items-center gap-2">
            <Input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="🎯"
              maxLength={4}
              className="h-8 w-14 text-center bg-muted/30 border-border"
            />
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Nome da categoria..."
              className="h-8 flex-1 text-sm bg-muted/30 border-border"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              +
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
