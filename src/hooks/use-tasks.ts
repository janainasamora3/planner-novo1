"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_TASKS,
  DEFAULT_TASK_CATEGORIES,
  makeId,
  todayISO,
  type Task,
  type TaskCategory,
} from "@/lib/tasks";

const TASKS_KEY = "dashboard.tasks.v1";
const CATS_KEY = "dashboard.taskCategories.v1";
const EVENT = "dashboard:tasks-change";

let cache: Task[] | null = null;
let catCache: TaskCategory[] | null = null;
const listeners = new Set<() => void>();

// ----- Tasks store -----

/**
 * Sanitiza uma tarefa vinda do localStorage, garantindo que todos os campos
 * obrigatórios existam e tenham tipos corretos. Previne crashes quando o
 * usuário tem dados antigos/corrompidos salvos.
 */
function sanitizeTask(raw: unknown, fallback?: Partial<Task>): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const today = todayISO();

  // ID e título são essenciais — se faltarem, descarta
  if (typeof t.id !== "string" || !t.id) return null;
  if (typeof t.title !== "string" || !t.title) return null;

  // Sanitiza subtasks (inclui doneDates e children para nested)
  let subtasks: Task["subtasks"] = [];
  if (Array.isArray(t.subtasks)) {
    subtasks = t.subtasks
      .map((s) => {
        if (!s || typeof s !== "object") return null;
        const sub = s as Record<string, unknown>;
        if (typeof sub.id !== "string" || typeof sub.title !== "string") return null;
        // Sanitiza doneDates (array de strings)
        let doneDates: string[] | undefined;
        if (Array.isArray(sub.doneDates)) {
          doneDates = sub.doneDates.filter((d): d is string => typeof d === "string");
        }
        // Sanitiza children (recursivo)
        let children: Task["subtasks"] | undefined;
        if (Array.isArray(sub.children) && sub.children.length > 0) {
          children = sub.children
            .map((c) => {
              if (!c || typeof c !== "object") return null;
              const ch = c as Record<string, unknown>;
              if (typeof ch.id !== "string" || typeof ch.title !== "string") return null;
              return {
                id: ch.id,
                title: ch.title,
                done: Boolean(ch.done),
                doneDates: Array.isArray(ch.doneDates) ? ch.doneDates.filter((d): d is string => typeof d === "string") : undefined,
              } as Task["subtasks"][number];
            })
            .filter((c): c is Task["subtasks"][number] => c !== null);
        }
        return {
          id: sub.id,
          title: sub.title,
          done: Boolean(sub.done),
          doneDates,
          children,
        };
      })
      .filter((s): s is Task["subtasks"][number] => s !== null);
  }

  // Sanitiza completedDates
  let completedDates: string[] = [];
  if (Array.isArray(t.completedDates)) {
    completedDates = t.completedDates.filter((d): d is string => typeof d === "string");
  }

  // Sanitiza subtasksByDate (subtarefas específicas por dia)
  let subtasksByDate: Record<string, SubTask[]> | undefined;
  if (t.subtasksByDate && typeof t.subtasksByDate === "object") {
    const clean: Record<string, SubTask[]> = {};
    for (const [date, subs] of Object.entries(t.subtasksByDate as Record<string, unknown>)) {
      if (typeof date === "string" && Array.isArray(subs)) {
        const sanitizedSubs = subs
          .map((s): SubTask | null => {
            if (!s || typeof s !== "object") return null;
            const x = s as Record<string, unknown>;
            if (typeof x.id !== "string" || typeof x.title !== "string") return null;
            return { id: x.id, title: x.title, done: Boolean(x.done), doneDates: Array.isArray(x.doneDates) ? x.doneDates.filter((d): d is string => typeof d === "string") : undefined };
          })
          .filter((s): s is SubTask => s !== null);
        if (sanitizedSubs.length > 0) clean[date] = sanitizedSubs;
      }
    }
    if (Object.keys(clean).length > 0) subtasksByDate = clean;
  }

  // Sanitiza recurrence (aceita valor inválido como "none")
  const recRaw = t.recurrence;
  const recurrence: Task["recurrence"] =
    recRaw === "daily" || recRaw === "weekly" || recRaw === "monthly" || recRaw === "custom_weekly" || recRaw === "none"
      ? recRaw
      : "none";

  // Sanitiza weekdays (apenas para custom_weekly)
  let weekdays: number[] | undefined;
  if (recurrence === "custom_weekly" && Array.isArray(t.weekdays)) {
    weekdays = t.weekdays
      .filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)
      .filter((d, i, arr) => arr.indexOf(d) === i); // remove duplicados
    if (weekdays.length === 0) weekdays = undefined;
  }

  // Sanitiza endMode (modo de término da recorrência)
  const endRaw = t.endMode;
  const endMode: Task["endMode"] | undefined =
    endRaw === "never" || endRaw === "count" || endRaw === "date" ? endRaw : undefined;
  const endCount: number | undefined =
    endMode === "count" && typeof t.endCount === "number" && t.endCount > 0
      ? Math.min(Math.floor(t.endCount), 9999)
      : undefined;
  const endDate: string | undefined =
    endMode === "date" && typeof t.endDate === "string" && t.endDate ? t.endDate : undefined;

  const task: Task = {
    id: t.id,
    title: t.title,
    emoji: typeof t.emoji === "string" ? t.emoji : "📝",
    color: typeof t.color === "string" ? t.color : "#3f3f46",
    date: typeof t.date === "string" && t.date ? t.date : today,
    time: typeof t.time === "string" ? t.time : undefined,
    done: Boolean(t.done),
    subtasks,
    recurrence,
    weekdays,
    endMode,
    endCount,
    endDate,
    completedDates,
    subtasksByDate,
    categoryId: typeof t.categoryId === "string" ? t.categoryId : undefined,
    notes: typeof t.notes === "string" ? t.notes : undefined,
    createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
    updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : Date.now(),
    ...fallback,
  };
  return task;
}

function read(): Task[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_TASKS.map((t) => ({
      ...t,
      id: makeId("task"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) {
      cache = DEFAULT_TASKS.map((t) => ({
        ...t,
        id: makeId("task"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      return cache;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = [];
      return cache;
    }
    // Sanitiza cada tarefa — descarta inválidas em vez de quebrar o app
    cache = parsed
      .map((t) => sanitizeTask(t))
      .filter((t): t is Task => t !== null);
    // Se sanitização descartou alguma tarefa, persiste versão limpa
    if (cache.length !== parsed.length) {
      try {
        window.localStorage.setItem(TASKS_KEY, JSON.stringify(cache));
      } catch {
        // ignore quota
      }
    }
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Task[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

// ----- Categories store -----

function sanitizeCategory(raw: unknown): TaskCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== "string" || typeof c.label !== "string") return null;
  return {
    id: c.id,
    label: c.label,
    color: typeof c.color === "string" ? c.color : "#3f3f46",
    emoji: typeof c.emoji === "string" ? c.emoji : undefined,
  };
}

function readCats(): TaskCategory[] {
  if (catCache !== null) return catCache;
  if (typeof window === "undefined") {
    catCache = DEFAULT_TASK_CATEGORIES;
    return catCache;
  }
  try {
    const raw = window.localStorage.getItem(CATS_KEY);
    if (!raw) {
      catCache = DEFAULT_TASK_CATEGORIES;
      return catCache;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      catCache = DEFAULT_TASK_CATEGORIES;
      return catCache;
    }
    const sanitized = parsed
      .map((c) => sanitizeCategory(c))
      .filter((c): c is TaskCategory => c !== null);
    catCache = sanitized.length > 0 ? sanitized : DEFAULT_TASK_CATEGORIES;
    if (catCache !== parsed && catCache === DEFAULT_TASK_CATEGORIES) {
      // dados corrompidos — sobrescreve com defaults
      try {
        window.localStorage.setItem(CATS_KEY, JSON.stringify(catCache));
      } catch {
        // ignore
      }
    }
  } catch {
    catCache = DEFAULT_TASK_CATEGORIES;
  }
  return catCache;
}

function writeCats(next: TaskCategory[]) {
  catCache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT));
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

// ----- Hook -----

// Constantes imutáveis para getServerSnapshot (evita loop infinito
// no useSyncExternalStore — não pode retornar array novo a cada chamada)
const EMPTY_TASKS: Task[] = [];

export function useTasks() {
  const tasks = useSyncExternalStore(subscribe, read, () => EMPTY_TASKS);
  const categories = useSyncExternalStore(subscribe, readCats, () => DEFAULT_TASK_CATEGORIES);

  const addTask = useCallback(
    (input: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      // Sanitiza recurrence e weekdays
      const recurrence: Task["recurrence"] =
        input.recurrence === "daily" || input.recurrence === "weekly" || input.recurrence === "monthly" || input.recurrence === "custom_weekly" || input.recurrence === "none"
          ? input.recurrence
          : "none";
      let weekdays: number[] | undefined;
      if (recurrence === "custom_weekly" && Array.isArray(input.weekdays)) {
        weekdays = input.weekdays
          .filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)
          .filter((d, i, arr) => arr.indexOf(d) === i);
        if (weekdays.length === 0) weekdays = undefined;
      }
      // Sanitiza modo de término
      const endMode: Task["endMode"] | undefined =
        input.endMode === "never" || input.endMode === "count" || input.endMode === "date" ? input.endMode : undefined;
      const endCount: number | undefined =
        endMode === "count" && typeof input.endCount === "number" && input.endCount > 0
          ? Math.min(Math.floor(input.endCount), 9999)
          : undefined;
      const endDate: string | undefined =
        endMode === "date" && typeof input.endDate === "string" && input.endDate ? input.endDate : undefined;

      const task: Task = {
        id: makeId("task"),
        createdAt: now,
        updatedAt: now,
        // Garante campos obrigatórios mesmo se o editor passar undefined
        title: String(input.title ?? "").trim() || "Sem título",
        emoji: typeof input.emoji === "string" ? input.emoji : "📝",
        color: typeof input.color === "string" ? input.color : "#7c2d12",
        date: typeof input.date === "string" && input.date ? input.date : todayISO(),
        time: typeof input.time === "string" ? input.time : undefined,
        done: Boolean(input.done),
        subtasks: Array.isArray(input.subtasks) ? input.subtasks : [],
        recurrence,
        weekdays,
        endMode,
        endCount,
        endDate,
        completedDates: Array.isArray(input.completedDates) ? input.completedDates : [],
        categoryId: typeof input.categoryId === "string" ? input.categoryId : undefined,
        notes: typeof input.notes === "string" ? input.notes : undefined,
      };
      write([...read(), task]);
      return task;
    },
    []
  );

  const updateTask = useCallback((id: string, patch: Partial<Omit<Task, "id">>) => {
    write(read().map((t) => {
      if (t.id !== id) return t;
      // Merge defensivo: garante arrays/strings válidas no patch
      const merged = { ...t, ...patch, updatedAt: Date.now() };
      if (patch.subtasks !== undefined && !Array.isArray(patch.subtasks)) {
        merged.subtasks = t.subtasks;
      }
      if (patch.completedDates !== undefined && !Array.isArray(patch.completedDates)) {
        merged.completedDates = t.completedDates;
      }
      return merged;
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id));
  }, []);

  /** Marca/desmarca tarefa como concluída numa data específica. */
  const toggleDone = useCallback((id: string, dateISO: string) => {
    const task = read().find((t) => t.id === id);
    if (!task) return;
    if (task.recurrence === "none") {
      write(read().map((t) => (t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t)));
    } else {
      // Garante que completedDates é array (defensivo)
      const completedDates = Array.isArray(task.completedDates) ? task.completedDates : [];
      const isDone = completedDates.includes(dateISO);
      const next = isDone
        ? completedDates.filter((d) => d !== dateISO)
        : [...completedDates, dateISO];
      write(read().map((t) => (t.id === id ? { ...t, completedDates: next, updatedAt: Date.now() } : t)));
    }
  }, []);

  /** Marca/desmarca subtask. Para tarefas recorrentes, rastreia por data. */
  const toggleSubTask = useCallback((taskId: string, subId: string, dateISO?: string) => {
    const task = read().find((t) => t.id === taskId);
    if (!task) return;
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

    // Função recursiva para togglear subtasks (inclui nested)
    function toggleSubs(subs: SubTask[]): SubTask[] {
      return subs.map((s) => {
        if (s.id === subId) {
          if (task.recurrence !== "none" && dateISO) {
            // Tarefa recorrente: toggle por data
            const doneDates = Array.isArray(s.doneDates) ? s.doneDates : [];
            const isDone = doneDates.includes(dateISO);
            return {
              ...s,
              doneDates: isDone ? doneDates.filter((d) => d !== dateISO) : [...doneDates, dateISO],
              done: isDone ? s.done : true, // sync done para compat
            };
          }
          // Tarefa sem recorrência: toggle simples
          return { ...s, done: !s.done };
        }
        // Recursão em children
        if (s.children && s.children.length > 0) {
          return { ...s, children: toggleSubs(s.children) };
        }
        return s;
      });
    }

    write(read().map((t) => (t.id === taskId ? { ...t, subtasks: toggleSubs(subtasks), updatedAt: Date.now() } : t)));
  }, []);

  /** Move tarefa para outra data (drag-and-drop). */
  const moveTask = useCallback((id: string, newDate: string) => {
    write(read().map((t) => (t.id === id ? { ...t, date: newDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Duplica uma tarefa (com novas IDs, resetando conclusões). */
  const duplicateTask = useCallback((id: string) => {
    const task = read().find((t) => t.id === id);
    if (!task) return null;
    const now = Date.now();
    function cloneSubs(subs: SubTask[]): SubTask[] {
      return subs.map((s) => ({
        id: `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        title: s.title,
        done: false,
        doneDates: [],
        children: s.children ? cloneSubs(s.children) : undefined,
      }));
    }
    const clone: Task = {
      ...task,
      id: makeId("task"),
      title: `${task.title} (cópia)`,
      done: false,
      completedDates: [],
      subtasks: cloneSubs(task.subtasks),
      createdAt: now,
      updatedAt: now,
    };
    write([...read(), clone]);
    return clone;
  }, []);

  /** Adiciona subtarefa aninhada (child) a uma subtarefa existente. */
  const addNestedSubTask = useCallback((taskId: string, parentSubId: string, title: string) => {
    if (!title.trim()) return;
    const task = read().find((t) => t.id === taskId);
    if (!task) return;
    function addNested(subs: SubTask[]): SubTask[] {
      return subs.map((s) => {
        if (s.id === parentSubId) {
          const newChild: SubTask = {
            id: `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            title: title.trim(),
            done: false,
            doneDates: [],
          };
          return { ...s, children: [...(s.children ?? []), newChild] };
        }
        if (s.children && s.children.length > 0) {
          return { ...s, children: addNested(s.children) };
        }
        return s;
      });
    }
    write(read().map((t) => (t.id === taskId ? { ...t, subtasks: addNested(t.subtasks), updatedAt: Date.now() } : t)));
  }, []);

  /** Remove subtarefa (inclui nested). */
  const removeSubTask = useCallback((taskId: string, subId: string) => {
    const task = read().find((t) => t.id === taskId);
    if (!task) return;
    function removeSubs(subs: SubTask[]): SubTask[] {
      const filtered = subs.filter((s) => s.id !== subId);
      return filtered.map((s) => (s.children ? { ...s, children: removeSubs(s.children) } : s));
    }
    write(read().map((t) => (t.id === taskId ? { ...t, subtasks: removeSubs(t.subtasks), updatedAt: Date.now() } : t)));
  }, []);

  /** Adiciona subtarefa específica de um dia (não recorrente). */
  const addSubTaskByDate = useCallback((taskId: string, dateISO: string, title: string) => {
    if (!title.trim()) return;
    const task = read().find((t) => t.id === taskId);
    if (!task) return;
    const byDate = { ...(task.subtasksByDate ?? {}) };
    const newSub: SubTask = { id: `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, title: title.trim(), done: false, children: [] };
    byDate[dateISO] = [...(byDate[dateISO] ?? []), newSub];
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Adiciona child a uma subtarefa do dia. */
  const addNestedSubTaskByDate = useCallback((taskId: string, dateISO: string, parentSubId: string, title: string) => {
    if (!title.trim()) return;
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    byDate[dateISO] = byDate[dateISO].map((s) => {
      if (s.id === parentSubId) {
        const newChild: SubTask = { id: `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, title: title.trim(), done: false };
        return { ...s, children: [...(s.children ?? []), newChild] };
      }
      return s;
    });
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Toggle child de uma subtarefa do dia. */
  const toggleNestedSubTaskByDate = useCallback((taskId: string, dateISO: string, subId: string) => {
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    byDate[dateISO] = byDate[dateISO].map((s) => {
      if (s.id === subId) return { ...s, done: !s.done };
      if (s.children) return { ...s, children: s.children.map((c) => c.id === subId ? { ...c, done: !c.done } : c) };
      return s;
    });
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Remove child de uma subtarefa do dia. */
  const removeNestedSubTaskByDate = useCallback((taskId: string, dateISO: string, parentId: string, childId: string) => {
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    byDate[dateISO] = byDate[dateISO].map((s) => s.id === parentId ? { ...s, children: (s.children ?? []).filter((c) => c.id !== childId) } : s);
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Toggle subtarefa específica de um dia. */
  const toggleSubTaskByDate = useCallback((taskId: string, dateISO: string, subId: string) => {
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    byDate[dateISO] = byDate[dateISO].map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Remove subtarefa específica de um dia. */
  const removeSubTaskByDate = useCallback((taskId: string, dateISO: string, subId: string) => {
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    byDate[dateISO] = byDate[dateISO].filter((s) => s.id !== subId);
    if (byDate[dateISO].length === 0) delete byDate[dateISO];
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Reordena subtarefas recorrentes (move up/down). */
  const moveSubTask = useCallback((taskId: string, subId: string, direction: "up" | "down") => {
    const task = read().find((t) => t.id === taskId);
    if (!task) return;
    const subs = [...task.subtasks];
    const idx = subs.findIndex((s) => s.id === subId);
    if (idx === -1) return;
    if (direction === "up" && idx > 0) { [subs[idx - 1], subs[idx]] = [subs[idx], subs[idx - 1]]; }
    if (direction === "down" && idx < subs.length - 1) { [subs[idx + 1], subs[idx]] = [subs[idx], subs[idx + 1]]; }
    write(read().map((t) => (t.id === taskId ? { ...t, subtasks: subs, updatedAt: Date.now() } : t)));
  }, []);

  /** Edita o título de uma subtarefa recorrente. */
  const renameSubTask = useCallback((taskId: string, subId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    function renameSubs(subs: SubTask[]): SubTask[] {
      return subs.map((s) => {
        if (s.id === subId) return { ...s, title: newTitle.trim() };
        if (s.children) return { ...s, children: renameSubs(s.children) };
        return s;
      });
    }
    write(read().map((t) => (t.id === taskId ? { ...t, subtasks: renameSubs(t.subtasks), updatedAt: Date.now() } : t)));
  }, []);

  /** Edita o título de uma subtarefa do dia. */
  const renameSubTaskByDate = useCallback((taskId: string, dateISO: string, subId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    byDate[dateISO] = byDate[dateISO].map((s) => s.id === subId ? { ...s, title: newTitle.trim() } : s);
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  /** Reordena subtarefas do dia (move up/down). */
  const moveSubTaskByDate = useCallback((taskId: string, dateISO: string, subId: string, direction: "up" | "down") => {
    const task = read().find((t) => t.id === taskId);
    if (!task || !task.subtasksByDate || !task.subtasksByDate[dateISO]) return;
    const byDate = { ...task.subtasksByDate };
    const subs = [...byDate[dateISO]];
    const idx = subs.findIndex((s) => s.id === subId);
    if (idx === -1) return;
    if (direction === "up" && idx > 0) { [subs[idx - 1], subs[idx]] = [subs[idx], subs[idx - 1]]; }
    if (direction === "down" && idx < subs.length - 1) { [subs[idx + 1], subs[idx]] = [subs[idx], subs[idx + 1]]; }
    byDate[dateISO] = subs;
    write(read().map((t) => (t.id === taskId ? { ...t, subtasksByDate: byDate, updatedAt: Date.now() } : t)));
  }, []);

  const resetAll = useCallback(() => {
    write(
      DEFAULT_TASKS.map((t) => ({
        ...t,
        id: makeId("task"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))
    );
    writeCats(DEFAULT_TASK_CATEGORIES);
  }, []);

  // ----- Categories -----

  const addCategory = useCallback((input: Omit<TaskCategory, "id">) => {
    const cat: TaskCategory = { ...input, id: makeId("cat") };
    writeCats([...readCats(), cat]);
    return cat;
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Omit<TaskCategory, "id">>) => {
    writeCats(readCats().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCategory = useCallback((id: string) => {
    writeCats(readCats().filter((c) => c.id !== id));
    // Limpa categoryId das tarefas que usavam essa categoria
    write(
      read().map((t) => (t.categoryId === id ? { ...t, categoryId: undefined } : t))
    );
  }, []);

  return {
    tasks,
    categories,
    addTask,
    updateTask,
    removeTask,
    toggleDone,
    toggleSubTask,
    moveTask,
    duplicateTask,
    addNestedSubTask,
    removeSubTask,
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
  };
}
