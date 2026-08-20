"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface Idea {
  id: string;
  title: string;
  notes: string;
  checklist: { id: string; text: string; done: boolean }[];
  color: string;
  categoryId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface IdeaCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const KEY = "dashboard.ideas.v1";
const CAT_KEY = "dashboard.ideas.categories.v1";
const EVENT = "dashboard:ideas-change";

const DEFAULT_CATEGORIES: IdeaCategory[] = [
  { id: "cat_negocios", name: "Negócios", emoji: "💼", color: "#1e3a8a" },
  { id: "cat_projetos", name: "Projetos", emoji: "🚀", color: "#7c3aed" },
  { id: "cat_pessoal", name: "Pessoal", emoji: "💚", color: "#16a34a" },
  { id: "cat_conteudo", name: "Conteúdo", emoji: "🎬", color: "#db2777" },
  { id: "cat_estudos", name: "Estudos", emoji: "📚", color: "#0891b2" },
  { id: "cat_outros", name: "Outros", emoji: "✨", color: "#d97706" },
];

let cache: Idea[] | null = null;
let catCache: IdeaCategory[] | null = null;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function read(): Idea[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") { cache = []; return cache; }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) { cache = []; return cache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { cache = []; return cache; }
    cache = parsed.map((i): Idea | null => {
      if (!i || typeof i !== "object") return null;
      const x = i as Record<string, unknown>;
      if (typeof x.id !== "string" || typeof x.title !== "string") return null;
      const checklist = Array.isArray(x.checklist) ? x.checklist.map((c): Idea["checklist"][number] | null => {
        if (!c || typeof c !== "object") return null;
        const y = c as Record<string, unknown>;
        if (typeof y.id !== "string" || typeof y.text !== "string") return null;
        return { id: y.id, text: y.text, done: Boolean(y.done) };
      }).filter((c): c is Idea["checklist"][number] => c !== null) : [];
      return {
        id: x.id, title: x.title,
        notes: typeof x.notes === "string" ? x.notes : "",
        checklist,
        color: typeof x.color === "string" ? x.color : "#1e1b4b",
        categoryId: typeof x.categoryId === "string" ? x.categoryId : null,
        createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
        updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : Date.now(),
      };
    }).filter((i): i is Idea => i !== null);
  } catch { cache = []; }
  return cache;
}

function readCats(): IdeaCategory[] {
  if (catCache !== null) return catCache;
  if (typeof window === "undefined") { catCache = DEFAULT_CATEGORIES; return catCache; }
  try {
    const raw = window.localStorage.getItem(CAT_KEY);
    if (!raw) { catCache = DEFAULT_CATEGORIES; return catCache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { catCache = DEFAULT_CATEGORIES; return catCache; }
    catCache = parsed
      .map((c): IdeaCategory | null => {
        if (!c || typeof c !== "object") return null;
        const x = c as Record<string, unknown>;
        if (typeof x.id !== "string" || typeof x.name !== "string") return null;
        return {
          id: x.id, name: x.name,
          emoji: typeof x.emoji === "string" ? x.emoji : "🏷️",
          color: typeof x.color === "string" ? x.color : "#3f3f46",
        };
      })
      .filter((c): c is IdeaCategory => c !== null);
    if (catCache.length === 0) catCache = DEFAULT_CATEGORIES;
  } catch { catCache = DEFAULT_CATEGORIES; }
  return catCache;
}

function write(next: Idea[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
}

function writeCats(next: IdeaCategory[]) {
  catCache = next;
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CAT_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

const EMPTY: Idea[] = [];
const EMPTY_CATS: IdeaCategory[] = [];

export function useIdeas() {
  const ideas = useSyncExternalStore(subscribe, read, () => EMPTY);
  const categories = useSyncExternalStore(subscribe, readCats, () => EMPTY_CATS);

  const addIdea = useCallback((input: Omit<Idea, "id" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const idea: Idea = { ...input, id: makeId("idea"), createdAt: now, updatedAt: now };
    write([...read(), idea]);
    return idea;
  }, []);

  const updateIdea = useCallback((id: string, patch: Partial<Omit<Idea, "id">>) => {
    write(read().map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)));
  }, []);

  const removeIdea = useCallback((id: string) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  const addChecklistItem = useCallback((ideaId: string, text: string) => {
    if (!text.trim()) return;
    const item = { id: makeId("chk"), text: text.trim(), done: false };
    write(read().map((i) => i.id === ideaId ? { ...i, checklist: [...i.checklist, item], updatedAt: Date.now() } : i));
  }, []);

  const toggleChecklistItem = useCallback((ideaId: string, itemId: string) => {
    write(read().map((i) => i.id === ideaId ? { ...i, checklist: i.checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c), updatedAt: Date.now() } : i));
  }, []);

  const removeChecklistItem = useCallback((ideaId: string, itemId: string) => {
    write(read().map((i) => i.id === ideaId ? { ...i, checklist: i.checklist.filter((c) => c.id !== itemId), updatedAt: Date.now() } : i));
  }, []);

  const addCategory = useCallback((name: string, emoji: string, color: string) => {
    const cat: IdeaCategory = { id: makeId("cat"), name: name.trim(), emoji: emoji || "🏷️", color };
    writeCats([...readCats(), cat]);
    return cat;
  }, []);

  const removeCategory = useCallback((id: string) => {
    writeCats(readCats().filter((c) => c.id !== id));
    write(read().map((i) => (i.categoryId === id ? { ...i, categoryId: null, updatedAt: Date.now() } : i)));
  }, []);

  return {
    ideas, categories,
    addIdea, updateIdea, removeIdea,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    addCategory, removeCategory,
  };
}
