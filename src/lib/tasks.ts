/**
 * Tasks — tarefas com recorrência, subtasks, horário, categoria.
 * Persistidas em localStorage via use-tasks.ts.
 */

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "custom_weekly";

/** Como a recorrência termina. */
export type RecurrenceEndMode = "never" | "count" | "date";

export interface SubTask {
  id: string;
  title: string;
  /** Para tarefas sem recorrência: marca como concluída */
  done: boolean;
  /** Para tarefas com recorrência: datas em que a subtarefa foi concluída (yyyy-mm-dd) */
  doneDates?: string[];
  /** Subtarefas aninhadas (subtarefas secundárias dentro desta) */
  children?: SubTask[];
}

export interface TaskCategory {
  id: string;
  label: string;
  color: string;
  emoji?: string;
}

export interface Task {
  id: string;
  title: string;
  emoji: string;
  color: string;
  /** ISO date yyyy-mm-dd — anchor date for the task */
  date: string;
  /** HH:mm — optional time-of-day reminder */
  time?: string;
  /** Marked done on the current date */
  done: boolean;
  subtasks: SubTask[];
  recurrence: Recurrence;
  /**
   * Quando recurrence === "custom_weekly", lista de dias da semana (0=Dom..6=Sáb)
   * em que a tarefa se aplica. Ex: [1, 3, 5] = Segunda, Quarta, Sexta.
   */
  weekdays?: number[];
  /**
   * Como a recorrência termina:
   * - "never": sempre ativo (padrão)
   * - "count": termina após N ocorrências (ver endCount)
   * - "date": termina em uma data específica (ver endDate)
   */
  endMode?: RecurrenceEndMode;
  /** Número de ocorrências (usado quando endMode === "count"). */
  endCount?: number;
  /** Data final ISO yyyy-mm-dd (usada quando endMode === "date"). */
  endDate?: string;
  /** ISO dates (yyyy-mm-dd) where this task was completed (for recurrence history) */
  completedDates: string[];
  /** Subtarefas específicas de um dia: { 'yyyy-mm-dd': SubTask[] } */
  subtasksByDate?: Record<string, SubTask[]>;
  categoryId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Sem repetição",
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  custom_weekly: "Personalizada",
};

export const END_MODE_LABELS: Record<RecurrenceEndMode, string> = {
  never: "Sempre ativo",
  count: "Após N ocorrências",
  date: "Em uma data",
};

/** Nomes curtos dos dias da semana — 0=Dom, 1=Seg, ..., 6=Sáb */
export const WEEKDAY_SHORT: string[] = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAY_FULL: string[] = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Today's date in yyyy-mm-dd format (local time). */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Verifica se a tarefa foi concluída numa data específica. */
export function isTaskDoneOn(task: Task, dateISO: string): boolean {
  if (task.recurrence === "none") return Boolean(task.done);
  // Defensivo: completedDates pode estar undefined em dados antigos/corrompidos
  const completedDates = Array.isArray(task.completedDates) ? task.completedDates : [];
  return completedDates.includes(dateISO);
}

/** Verifica se uma subtarefa foi concluída numa data específica. */
export function isSubTaskDoneOn(subtask: SubTask, task: Task, dateISO: string): boolean {
  if (task.recurrence === "none") return Boolean(subtask.done);
  // Para tarefas recorrentes: usa doneDates
  const doneDates = Array.isArray(subtask.doneDates) ? subtask.doneDates : [];
  return doneDates.includes(dateISO);
}

/** Conta subtarefas concluídas numa data específica (inclui nested + per-day). */
export function countSubTasksDoneOn(task: Task, dateISO: string): { done: number; total: number } {
  let done = 0;
  let total = 0;
  function countSubs(subs: SubTask[]) {
    for (const s of subs) {
      total++;
      if (isSubTaskDoneOn(s, task, dateISO)) done++;
      if (s.children && s.children.length > 0) countSubs(s.children);
    }
  }
  // Subtarefas recorrentes (aparecem todos os dias)
  if (Array.isArray(task.subtasks)) countSubs(task.subtasks);
  // Subtarefas do dia (só aparecem nesta data)
  if (task.subtasksByDate && task.subtasksByDate[dateISO]) {
    countSubs(task.subtasksByDate[dateISO]);
  }
  return { done, total };
}

/** Retorna todas as subtarefas visíveis numa data (recorrentes + per-day). */
export function getSubTasksForDate(task: Task, dateISO: string): { recurring: SubTask[]; daySpecific: SubTask[] } {
  const recurring = Array.isArray(task.subtasks) ? task.subtasks : [];
  const daySpecific = (task.subtasksByDate && task.subtasksByDate[dateISO]) ? task.subtasksByDate[dateISO] : [];
  return { recurring, daySpecific };
}

/** Clona uma tarefa inteira (com novas IDs para ela e subtarefas). */
export function cloneTaskForDuplicate(task: Task): Omit<Task, "id" | "createdAt" | "updatedAt"> {
  function cloneSubs(subs: SubTask[]): SubTask[] {
    return subs.map((s) => ({
      id: `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: s.title,
      done: false,
      doneDates: [],
      children: s.children ? cloneSubs(s.children) : undefined,
    }));
  }
  return {
    title: `${task.title} (cópia)`,
    emoji: task.emoji,
    color: task.color,
    date: task.date,
    time: task.time,
    done: false,
    subtasks: cloneSubs(task.subtasks),
    recurrence: task.recurrence,
    weekdays: task.weekdays ? [...task.weekdays] : undefined,
    endMode: task.endMode,
    endCount: task.endCount,
    endDate: task.endDate,
    completedDates: [],
    subtasksByDate: {},
    categoryId: task.categoryId,
    notes: task.notes,
  };
}

/** Verifica se a tarefa se aplica a uma data específica. */
export function taskAppliesToDate(task: Task, dateISO: string): boolean {
  if (!task || !task.date) return false;
  if (task.recurrence === "none") {
    return task.date === dateISO;
  }
  // Recorrência: compara a partir da data âncora
  const anchor = new Date(task.date + "T00:00:00");
  const target = new Date(dateISO + "T00:00:00");
  if (Number.isNaN(anchor.getTime()) || Number.isNaN(target.getTime())) return false;
  if (target < anchor) return false;

  // Verifica limite por data final (endMode === "date")
  if (task.endMode === "date" && task.endDate) {
    const endDate = new Date(task.endDate + "T00:00:00");
    if (!Number.isNaN(endDate.getTime()) && target > endDate) return false;
  }

  // Verifica limite por contagem (endMode === "count")
  // A tarefa se aplica a essa data apenas se ela for uma das primeiras N ocorrências.
  // Para saber a posição dessa data na sequência, contamos quantas ocorrências
  // aconteceram entre anchor e target (inclusive).
  if (task.endMode === "count" && typeof task.endCount === "number" && task.endCount > 0) {
    const occurrenceIndex = countOccurrencesUpTo(task, target);
    if (occurrenceIndex > task.endCount) return false;
  }

  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly") {
    const diff = Math.floor(
      (target.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff % 7 === 0;
  }
  if (task.recurrence === "monthly") {
    return anchor.getDate() === target.getDate();
  }
  if (task.recurrence === "custom_weekly") {
    // target.getDay() retorna 0=Dom, 1=Seg, ..., 6=Sáb
    const weekdays = Array.isArray(task.weekdays) ? task.weekdays : [];
    if (weekdays.length === 0) return false;
    return weekdays.includes(target.getDay());
  }
  return false;
}

/**
 * Conta quantas ocorrências da tarefa aconteceram entre a data âncora e
 * a data alvo (inclusive). Usado para limitar por endCount.
 * Retorna 0 se a data alvo for anterior à âncora ou não for uma ocorrência.
 */
function countOccurrencesUpTo(task: Pick<Task, "date" | "recurrence" | "weekdays">, target: Date): number {
  const anchor = new Date(task.date + "T00:00:00");
  if (Number.isNaN(anchor.getTime()) || target < anchor) return 0;

  if (task.recurrence === "daily") {
    const diff = Math.floor((target.getTime() - anchor.getTime()) / 86400000);
    return diff + 1; // inclui a própria âncora
  }
  if (task.recurrence === "weekly") {
    const diff = Math.floor((target.getTime() - anchor.getTime()) / 86400000);
    const weeksPassed = Math.floor(diff / 7);
    return weeksPassed + 1;
  }
  if (task.recurrence === "monthly") {
    let count = 0;
    const cursor = new Date(anchor);
    let safety = 0;
    while (cursor <= target && safety < 1200) {
      if (cursor.getDate() === anchor.getDate()) count++;
      cursor.setMonth(cursor.getMonth() + 1);
      safety++;
    }
    return count;
  }
  if (task.recurrence === "custom_weekly") {
    const weekdays = Array.isArray(task.weekdays) ? task.weekdays : [];
    if (weekdays.length === 0) return 0;
    let count = 0;
    const cursor = new Date(anchor);
    let safety = 0;
    while (cursor <= target && safety < 800) {
      if (weekdays.includes(cursor.getDay())) count++;
      cursor.setDate(cursor.getDate() + 1);
      safety++;
    }
    return count;
  }
  return 0;
}

/**
 * Retorna as próximas N datas (ISO yyyy-mm-dd) em que a tarefa se aplica,
 * começando a partir da data informada (default: hoje). Útil para preview
 * no editor antes de salvar.
 *
 * Respeita os limites de término (endMode "count" ou "date").
 */
export function getUpcomingDates(
  task: Pick<Task, "date" | "recurrence" | "weekdays" | "endMode" | "endCount" | "endDate">,
  count = 10,
  fromISO?: string
): string[] {
  const startISO = fromISO ?? todayISO();
  const start = new Date(startISO + "T00:00:00");
  if (Number.isNaN(start.getTime())) return [];

  // Para tarefas sem repetição, só retorna a própria data se for >= start
  if (task.recurrence === "none") {
    const anchor = new Date(task.date + "T00:00:00");
    if (Number.isNaN(anchor.getTime())) return [];
    if (anchor >= start) return [task.date];
    return [];
  }

  // Limite efetivo: se for por contagem, só pode mostrar até endCount ocorrências
  // no total. Já mostra as primeiras N (onde N = min(count, endCount))
  let effectiveCount = count;
  if (task.endMode === "count" && typeof task.endCount === "number" && task.endCount > 0) {
    effectiveCount = Math.min(count, task.endCount);
  }

  // Data limite (se endMode === "date"): paramos de incluir datas após endDate
  let limitDate: Date | null = null;
  if (task.endMode === "date" && task.endDate) {
    limitDate = new Date(task.endDate + "T00:00:00");
    if (Number.isNaN(limitDate.getTime())) limitDate = null;
  }

  const result: string[] = [];
  const anchorDate = new Date(task.date + "T00:00:00");
  if (Number.isNaN(anchorDate.getTime())) return [];

  const cursor = new Date(start);
  if (cursor < anchorDate) cursor.setTime(anchorDate.getTime());

  let safety = 0;
  while (result.length < effectiveCount && safety < 400) {
    // Se passou da data limite, para
    if (limitDate && cursor > limitDate) break;

    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (taskAppliesToDate(task, iso)) {
      result.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
    safety++;
  }
  return result;
}

/**
 * Retorna o número total de ocorrências previstas para a tarefa, ou null
 * se for infinita (endMode === "never" ou undefined).
 */
export function getTotalOccurrences(task: Pick<Task, "endMode" | "endCount">): number | null {
  if (task.endMode === "count" && typeof task.endCount === "number" && task.endCount > 0) {
    return task.endCount;
  }
  return null;
}

/** Formata ISO yyyy-mm-dd para dd/mm (mais amigável pra preview). */
export function formatShortBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Categorias padrão. */
export const DEFAULT_TASK_CATEGORIES: TaskCategory[] = [
  { id: "cat_pessoal", label: "Pessoal", color: "#831843", emoji: "💗" },
  { id: "cat_profissional", label: "Profissional", color: "#1e3a8a", emoji: "💼" },
  { id: "cat_saude", label: "Saúde", color: "#166534", emoji: "🩺" },
  { id: "cat_estudo", label: "Estudo", color: "#713f12", emoji: "📚" },
  { id: "cat_financas", label: "Finanças", color: "#155e75", emoji: "💸" },
];

/** Tarefas padrão de demonstração. */
export const DEFAULT_TASKS: Omit<Task, "id" | "createdAt" | "updatedAt">[] = [
  {
    title: "Reunião de planejamento semanal",
    emoji: "📅",
    color: "#1e3a8a",
    date: "2026-07-19",
    time: "09:30",
    done: false,
    subtasks: [
      { id: "st1", title: "Preparar pauta", done: false },
      { id: "st2", title: "Enviar convites", done: true },
      { id: "st3", title: "Levar notebook", done: false },
    ],
    recurrence: "weekly",
    completedDates: [],
    categoryId: "cat_profissional",
    notes: "Levar o notebook com os relatórios impressos.",
  },
  {
    title: "Responder DMs e comentários",
    emoji: "💬",
    color: "#166534",
    date: "2026-07-19",
    time: "10:00",
    done: false,
    subtasks: [],
    recurrence: "daily",
    completedDates: [],
    categoryId: "cat_profissional",
  },
  {
    title: "Publicar reel no Instagram",
    emoji: "🎬",
    color: "#7c2d12",
    date: "2026-07-19",
    time: "12:00",
    done: false,
    subtasks: [
      { id: "st4", title: "Editar vídeo", done: true },
      { id: "st5", title: "Escrever legenda", done: false },
    ],
    recurrence: "none",
    completedDates: [],
    categoryId: "cat_profissional",
  },
  {
    title: "Estudar tendências de TikTok",
    emoji: "🔥",
    color: "#7f1d1d",
    date: "2026-07-19",
    done: false,
    subtasks: [],
    recurrence: "daily",
    completedDates: [],
    categoryId: "cat_estudo",
  },
  {
    title: "Treino na academia",
    emoji: "🏃",
    color: "#166534",
    date: "2026-07-20",
    time: "07:00",
    done: false,
    subtasks: [],
    recurrence: "weekly",
    completedDates: [],
    categoryId: "cat_saude",
  },
  {
    title: "Pagar contas do mês",
    emoji: "💸",
    color: "#155e75",
    date: "2026-07-21",
    done: false,
    subtasks: [],
    recurrence: "monthly",
    completedDates: [],
    categoryId: "cat_financas",
  },
];
