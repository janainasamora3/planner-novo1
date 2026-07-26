"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_OFFBOARDING_ITEMS,
  makeId,
  type OffboardingItem,
} from "@/lib/offboarding";

const KEY = "dashboard.social.offboarding.v1";
const EVENT = "dashboard:offboarding-change";

let cache: OffboardingItem[] | null = null;
const listeners = new Set<() => void>();

function migrate(items: OffboardingItem[]): OffboardingItem[] {
  // Garante que todos os itens têm os campos esperados (suporte a versões antigas)
  return items.map((it) => ({
    ...it,
    contentBlocks: Array.isArray(it.contentBlocks) ? it.contentBlocks : undefined,
    hasDateAnnotation: it.hasDateAnnotation ?? false,
    dateAnnotation: it.dateAnnotation ?? "",
  }));
}

function read(): OffboardingItem[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_OFFBOARDING_ITEMS;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw
      ? migrate(JSON.parse(raw) as OffboardingItem[])
      : DEFAULT_OFFBOARDING_ITEMS;
    if (!Array.isArray(cache)) cache = DEFAULT_OFFBOARDING_ITEMS;
  } catch {
    cache = DEFAULT_OFFBOARDING_ITEMS;
  }
  return cache;
}

function write(next: OffboardingItem[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar offboarding:", e);
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

export function useOffboarding() {
  const items = useSyncExternalStore(subscribe, read, () => DEFAULT_OFFBOARDING_ITEMS);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY);
    if (!stored) {
      write(read());
    } else {
      // Re-migra e persiste caso tenha migrado algo
      const parsed = migrate(JSON.parse(stored) as OffboardingItem[]);
      if (JSON.stringify(parsed) !== stored) write(parsed);
    }
  });

  const toggleDone = useCallback((id: string) => {
    write(
      read().map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  }, []);

  const updateContentBlock = useCallback(
    (itemId: string, blockId: string, text: string) => {
      write(
        read().map((it) =>
          it.id === itemId && Array.isArray(it.contentBlocks)
            ? {
                ...it,
                contentBlocks: it.contentBlocks.map((b) =>
                  b.id === blockId ? { ...b, text } : b
                ),
              }
            : it
        )
      );
    },
    []
  );

  const updateDateAnnotation = useCallback((itemId: string, value: string) => {
    write(
      read().map((it) =>
        it.id === itemId ? { ...it, dateAnnotation: value } : it
      )
    );
  }, []);

  const updateTitle = useCallback((itemId: string, title: string) => {
    write(
      read().map((it) => (it.id === itemId ? { ...it, title } : it))
    );
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_OFFBOARDING_ITEMS);
  }, []);

  return {
    items,
    toggleDone,
    updateContentBlock,
    updateDateAnnotation,
    updateTitle,
    resetAll,
  };
}
