"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_FUTURE_ITEMS,
  makeId,
  type FutureCategory,
  type FutureItem,
  type FuturePriority,
} from "@/lib/future";

const KEY = "dashboard.social.future.v2";
const EVENT = "dashboard:future-change";

let cache: FutureItem[] | null = null;
const listeners = new Set<() => void>();

/** Migra items antigos (sem os novos campos) para o novo schema. */
function migrate(items: FutureItem[]): FutureItem[] {
  return items.map((it) => {
    const oldItem = it as FutureItem & { text?: string };
    return {
    id: it.id,
    title: oldItem.text ?? it.title ?? "",
    description: it.description,
    done: it.done ?? false,
    order: it.order ?? 0,
    category: it.category ?? "medio",
    priority: it.priority ?? "media",
    deadline: it.deadline ?? "",
    owner: it.owner ?? "",
    steps: Array.isArray(it.steps) ? it.steps : [],
    completedAt: it.completedAt,
    createdAt: it.createdAt,
  };
  });
}

function read(): FutureItem[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_FUTURE_ITEMS;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Tenta migrar da versão antiga (v1)
      const oldRaw = window.localStorage.getItem("dashboard.social.future.v1");
      if (oldRaw) {
        try {
          const oldItems = JSON.parse(oldRaw) as FutureItem[];
          cache = migrate(oldItems);
          write(cache);
          return cache;
        } catch {
          cache = DEFAULT_FUTURE_ITEMS;
        }
      }
      cache = DEFAULT_FUTURE_ITEMS;
      return cache;
    }
    const parsed = JSON.parse(raw) as FutureItem[];
    cache = Array.isArray(parsed) ? migrate(parsed) : DEFAULT_FUTURE_ITEMS;
  } catch {
    cache = DEFAULT_FUTURE_ITEMS;
  }
  return cache;
}

function write(next: FutureItem[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar futuro:", e);
    alert("Não foi possível salvar. Armazenamento local cheio.");
  }
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

function useEffectOnce(fn: () => void) {
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    fn();
  }, [fn]);
}

export interface FutureItemInput {
  title: string;
  description?: string;
  category?: FutureCategory;
  priority?: FuturePriority;
  deadline?: string;
  owner?: string;
  steps?: { text: string }[];
}

export function useFuture() {
  const items = useSyncExternalStore(subscribe, read, () => DEFAULT_FUTURE_ITEMS);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) write(read());
  });

  const addItem = useCallback((input: FutureItemInput | string) => {
    // Aceita string (compat) ou objeto completo
    const data: FutureItemInput =
      typeof input === "string" ? { title: input } : input;
    const order = read().reduce((max, i) => Math.max(max, i.order), 0) + 1;
    const item: FutureItem = {
      id: makeId("fut"),
      title: data.title,
      description: data.description ?? "",
      done: false,
      order,
      category: data.category ?? "medio",
      priority: data.priority ?? "media",
      deadline: data.deadline ?? "",
      owner: data.owner ?? "",
      steps: (data.steps ?? []).map((s) => ({
        id: makeId("step"),
        text: s.text,
        done: false,
      })),
      createdAt: Date.now(),
    };
    write([...read(), item]);
    return item;
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<FutureItem, "id">>) => {
      write(read().map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    []
  );

  const updateText = useCallback((id: string, title: string) => {
    write(read().map((i) => (i.id === id ? { ...i, title } : i)));
  }, []);

  const toggleDone = useCallback((id: string) => {
    write(
      read().map((i) =>
        i.id === id
          ? {
              ...i,
              done: !i.done,
              completedAt: !i.done ? Date.now() : undefined,
            }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  // --- Steps (plano de ação) ---

  const addStep = useCallback((itemId: string, text: string) => {
    write(
      read().map((i) =>
        i.id === itemId
          ? {
              ...i,
              steps: [
                ...(i.steps ?? []),
                { id: makeId("step"), text, done: false },
              ],
            }
          : i
      )
    );
  }, []);

  const toggleStep = useCallback((itemId: string, stepId: string) => {
    write(
      read().map((i) =>
        i.id === itemId
          ? {
              ...i,
              steps: (i.steps ?? []).map((s) =>
                s.id === stepId ? { ...s, done: !s.done } : s
              ),
            }
          : i
      )
    );
  }, []);

  const removeStep = useCallback((itemId: string, stepId: string) => {
    write(
      read().map((i) =>
        i.id === itemId
          ? { ...i, steps: (i.steps ?? []).filter((s) => s.id !== stepId) }
          : i
      )
    );
  }, []);

  const updateStep = useCallback(
    (itemId: string, stepId: string, text: string) => {
      write(
        read().map((i) =>
          i.id === itemId
            ? {
                ...i,
                steps: (i.steps ?? []).map((s) =>
                  s.id === stepId ? { ...s, text } : s
                ),
              }
            : i
        )
      );
    },
    []
  );

  const moveItem = useCallback((id: string, direction: "up" | "down") => {
    const list = read().slice().sort((a, b) => a.order - b.order);
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    const aOrder = a.order;
    a.order = b.order;
    b.order = aOrder;
    write(list);
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_FUTURE_ITEMS);
  }, []);

  return {
    items,
    addItem,
    updateItem,
    updateText,
    toggleDone,
    removeItem,
    addStep,
    toggleStep,
    removeStep,
    updateStep,
    moveItem,
    resetAll,
  };
}
