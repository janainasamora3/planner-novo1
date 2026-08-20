"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface QuickTask {
  id: string;
  title: string;
  notes?: string;
  categoryId?: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface QuickTaskCategory {
  id: string;
  name: string;
  color: string;
  emoji?: string;
}

const KEY = "dashboard.quickTasks.v1";
const CATS_KEY = "dashboard.quickTaskCategories.v1";
const EVENT = "dashboard:quickTasks-change";

let cache: QuickTask[] | null = null;
let catsCache: QuickTaskCategory[] | null = null;
const listeners = new Set<() => void>();

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_CATS: QuickTaskCategory[] = [
  { id: "qt_cat1", name: "Trabalho", color: "#dc2626", emoji: "💼" },
  { id: "qt_cat2", name: "Pessoal", color: "#2563eb", emoji: "👤" },
  { id: "qt_cat3", name: "Estudo", color: "#7c3aed", emoji: "📚" },
  { id: "qt_cat4", name: "Casa", color: "#16a34a", emoji: "🏠" },
];

function read(): QuickTask[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") { cache = []; return cache; }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) { cache = []; return cache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { cache = []; return cache; }
    cache = parsed.map((t): QuickTask | null => {
      if (!t || typeof t !== "object") return null;
      const x = t as Record<string, unknown>;
      if (typeof x.id !== "string" || typeof x.title !== "string") return null;
      return { id: x.id, title: x.title, notes: typeof x.notes === "string" ? x.notes : undefined, categoryId: typeof x.categoryId === "string" ? x.categoryId : undefined, done: Boolean(x.done), createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(), updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : Date.now() };
    }).filter((t): t is QuickTask => t !== null);
  } catch { cache = []; }
  return cache;
}

function write(next: QuickTask[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
}

function readCats(): QuickTaskCategory[] {
  if (catsCache !== null) return catsCache;
  if (typeof window === "undefined") { catsCache = DEFAULT_CATS; return catsCache; }
  try {
    const raw = window.localStorage.getItem(CATS_KEY);
    if (!raw) { catsCache = DEFAULT_CATS; return catsCache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { catsCache = DEFAULT_CATS; return catsCache; }
    catsCache = parsed.map((c): QuickTaskCategory | null => {
      if (!c || typeof c !== "object") return null;
      const x = c as Record<string, unknown>;
      if (typeof x.id !== "string" || typeof x.name !== "string") return null;
      return { id: x.id, name: x.name, color: typeof x.color === "string" ? x.color : "#3f3f46", emoji: typeof x.emoji === "string" ? x.emoji : undefined };
    }).filter((c): c is QuickTaskCategory => c !== null);
    if (catsCache.length === 0) catsCache = DEFAULT_CATS;
  } catch { catsCache = DEFAULT_CATS; }
  return catsCache;
}

function writeCats(next: QuickTaskCategory[]) {
  catsCache = next;
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CATS_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

const EMPTY: QuickTask[] = [];

export function useQuickTasks() {
  const tasks = useSyncExternalStore(subscribe, read, () => EMPTY);
  const categories = useSyncExternalStore(subscribe, readCats, () => DEFAULT_CATS);

  const addTask = useCallback((input: Omit<QuickTask, "id" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const task: QuickTask = { ...input, id: makeId("qt"), createdAt: now, updatedAt: now };
    write([...read(), task]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Omit<QuickTask, "id">>) => {
    write(read().map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));
  }, []);

  const removeTask = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id));
  }, []);

  const toggleDone = useCallback((id: string) => {
    write(read().map((t) => (t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t)));
  }, []);

  const addCategory = useCallback((input: Omit<QuickTaskCategory, "id">) => {
    const cat: QuickTaskCategory = { ...input, id: makeId("qtcat") };
    writeCats([...readCats(), cat]);
    return cat;
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Omit<QuickTaskCategory, "id">>) => {
    writeCats(readCats().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCategory = useCallback((id: string) => {
    writeCats(readCats().filter((c) => c.id !== id));
  }, []);

  return { tasks, categories, addTask, updateTask, removeTask, toggleDone, addCategory, updateCategory, removeCategory };
}
