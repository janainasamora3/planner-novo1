"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_CATEGORIES, makeId, type Category } from "@/lib/categories";

const KEY = "dashboard.social.categories.v1";
const EVENT = "dashboard:categories-change";

let cache: Category[] | null = null;
const listeners = new Set<() => void>();

function read(): Category[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_CATEGORIES;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Category[]) : DEFAULT_CATEGORIES;
    cache = Array.isArray(parsed) ? migrate(parsed) : DEFAULT_CATEGORIES;
  } catch {
    cache = DEFAULT_CATEGORIES;
  }
  return cache;
}

/**
 * Migra categorias salvas — adiciona defaults que faltam (por ID),
 * preservando customizações do usuário (nome, emoji, cor, ordem).
 * Garante que novos menus default apareçam mesmo para usuários com
 * dados antigos no localStorage.
 */
function migrate(existing: Category[]): Category[] {
  const result = [...existing];
  const existingIds = new Set(result.map((c) => c.id));
  let maxOrder = result.length > 0 ? Math.max(...result.map((c) => c.order ?? 0)) : 0;
  for (const def of DEFAULT_CATEGORIES) {
    if (!existingIds.has(def.id)) {
      result.push({ ...def, order: ++maxOrder });
      existingIds.add(def.id);
    }
  }
  return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function write(next: Category[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar categorias:", e);
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

export function useCategories() {
  const categories = useSyncExternalStore(subscribe, read, () => DEFAULT_CATEGORIES);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    // Sempre migra para garantir que novos menus default apareçam
    const current = read();
    const migrated = migrate(current);
    if (JSON.stringify(current) !== JSON.stringify(migrated)) {
      write(migrated);
    } else if (!window.localStorage.getItem(KEY)) {
      write(current);
    }
  });

  const updateCategory = useCallback((id: string, patch: Partial<Omit<Category, "id">>) => {
    write(
      read().map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      )
    );
  }, []);

  const reorderCategory = useCallback((id: string, newOrder: number) => {
    write(
      read().map((c) => (c.id === id ? { ...c, order: newOrder } : c))
    );
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_CATEGORIES);
  }, []);

  return { categories, updateCategory, reorderCategory, resetAll };
}
