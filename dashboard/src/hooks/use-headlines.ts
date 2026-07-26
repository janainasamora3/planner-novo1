"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_HEADLINES,
  makeId,
  type Headline,
} from "@/lib/headlines";

const KEY = "dashboard.social.headlines.v1";
const EVENT = "dashboard:headlines-change";

let cache: Headline[] | null = null;
const listeners = new Set<() => void>();

function migrate(input: Headline[]): Headline[] {
  return input
    .filter((h) => h && typeof h.id === "string" && typeof h.text === "string")
    .map((h) => ({
      ...h,
      favorite: h.favorite ?? false,
      order: typeof h.order === "number" ? h.order : 0,
    }))
    .sort((a, b) => a.order - b.order);
}

function read(): Headline[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_HEADLINES.map((h, i) => ({
      ...h,
      id: `hd_seed_${i}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cache = DEFAULT_HEADLINES.map((h, i) => ({
        ...h,
        id: `hd_seed_${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      return cache;
    }
    const parsed = JSON.parse(raw) as Headline[];
    cache = Array.isArray(parsed) ? migrate(parsed) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Headline[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar headlines:", e);
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

// Constante imutável para getServerSnapshot (evita loop infinito)
const EMPTY_HEADLINES: Headline[] = [];

export function useHeadlines() {
  const headlines = useSyncExternalStore(subscribe, read, () => EMPTY_HEADLINES);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) {
      write(read());
    } else {
      const current = read();
      const migrated = migrate(current);
      if (JSON.stringify(current) !== JSON.stringify(migrated)) {
        write(migrated);
      }
    }
  });

  const addHeadline = useCallback(
    (input: Omit<Headline, "id" | "createdAt" | "updatedAt" | "order"> & { order?: number }) => {
      const list = read();
      const order = input.order ?? (list.length > 0 ? Math.max(...list.map((h) => h.order)) + 1 : 1);
      const now = Date.now();
      const item: Headline = {
        id: makeId("hd"),
        order,
        createdAt: now,
        updatedAt: now,
        ...input,
      } as Headline;
      write([...list, item]);
      return item;
    },
    []
  );

  const updateHeadline = useCallback((id: string, patch: Partial<Omit<Headline, "id">>) => {
    write(
      read().map((h) => (h.id === id ? { ...h, ...patch, updatedAt: Date.now() } : h))
    );
  }, []);

  const removeHeadline = useCallback((id: string) => {
    write(read().filter((h) => h.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    write(
      read().map((h) =>
        h.id === id ? { ...h, favorite: !h.favorite, updatedAt: Date.now() } : h
      )
    );
  }, []);

  /**
   * Move uma headline de uma posição para outra (drag-and-drop).
   * Reordena todas as headlines entre a origem e o destino.
   */
  const moveHeadline = useCallback((fromId: string, toId: string) => {
    const list = read();
    const fromIdx = list.findIndex((h) => h.id === fromId);
    const toIdx = list.findIndex((h) => h.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const next = [...list];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    // Reordena todos os `order` para refletir a nova sequência
    const reordered = next.map((h, i) => ({ ...h, order: i + 1 }));
    write(reordered);
  }, []);

  const resetAll = useCallback(() => {
    write(
      DEFAULT_HEADLINES.map((h, i) => ({
        ...h,
        id: `hd_seed_${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))
    );
  }, []);

  return {
    headlines,
    addHeadline,
    updateHeadline,
    removeHeadline,
    toggleFavorite,
    moveHeadline,
    resetAll,
  };
}
