"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface Idea {
  id: string;
  title: string;
  notes: string;
  checklist: { id: string; text: string; done: boolean }[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

const KEY = "dashboard.ideas.v1";
const EVENT = "dashboard:ideas-change";

let cache: Idea[] | null = null;
const listeners = new Set<() => void>();

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
        createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
        updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : Date.now(),
      };
    }).filter((i): i is Idea => i !== null);
  } catch { cache = []; }
  return cache;
}

function write(next: Idea[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

const EMPTY: Idea[] = [];

export function useIdeas() {
  const ideas = useSyncExternalStore(subscribe, read, () => EMPTY);

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

  return { ideas, addIdea, updateIdea, removeIdea, addChecklistItem, toggleChecklistItem, removeChecklistItem };
}
