"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_SUBCATEGORIES, makeId, type SubCategory } from "@/lib/subcategories";

const KEY = "dashboard.social.subcategories.v1";
const EVENT = "dashboard:subcategories-change";

let cache: SubCategory[] | null = null;
const listeners = new Set<() => void>();

function read(): SubCategory[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_SUBCATEGORIES;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as SubCategory[]) : DEFAULT_SUBCATEGORIES;
    if (!Array.isArray(cache)) cache = DEFAULT_SUBCATEGORIES;
  } catch {
    cache = DEFAULT_SUBCATEGORIES;
  }
  return cache;
}

function write(next: SubCategory[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar subcategorias:", e);
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

export function useSubCategories(parentId: string | null) {
  const all = useSyncExternalStore(subscribe, read, () => DEFAULT_SUBCATEGORIES);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY);
    if (!stored) {
      // Primeira visita — salva os defaults
      write(read());
      return;
    }
    // Migração: garante que todas as subcategorias default existem.
    // Se uma subcategoria default não estiver no storage (ex: adicionamos "Bloco"
    // depois que o usuário já usou o app), ela é acrescentada sem apagar
    // as customizações existentes (nome/emoji/cor editados pelo usuário).
    try {
      const parsed = JSON.parse(stored) as SubCategory[];
      if (!Array.isArray(parsed)) {
        write(DEFAULT_SUBCATEGORIES);
        return;
      }
      const existingIds = new Set(parsed.map((s) => s.id));
      const missing = DEFAULT_SUBCATEGORIES.filter((d) => !existingIds.has(d.id));
      if (missing.length > 0) {
        write([...parsed, ...missing]);
      }
    } catch {
      write(DEFAULT_SUBCATEGORIES);
    }
  });

  // Filtra apenas as subcategorias do menu pai
  const subcategories = parentId
    ? all.filter((s) => s.parentId === parentId).sort((a, b) => a.order - b.order)
    : [];

  const updateSubCategory = useCallback((id: string, patch: Partial<Omit<SubCategory, "id">>) => {
    write(
      read().map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s
      )
    );
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_SUBCATEGORIES);
  }, []);

  return { subcategories, updateSubCategory, resetAll };
}
