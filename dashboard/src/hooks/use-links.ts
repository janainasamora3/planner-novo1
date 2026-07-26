"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_LINK_CATEGORIES,
  makeId,
  type LinkCategory,
  type LinkItem,
} from "@/lib/links";

const KEY = "dashboard.social.links.v1";
const EVENT = "dashboard:links-change";

let cache: LinkCategory[] | null = null;
const listeners = new Set<() => void>();

function read(): LinkCategory[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_LINK_CATEGORIES;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as LinkCategory[]) : DEFAULT_LINK_CATEGORIES;
    if (!Array.isArray(cache)) cache = DEFAULT_LINK_CATEGORIES;
  } catch {
    cache = DEFAULT_LINK_CATEGORIES;
  }
  return cache;
}

function write(next: LinkCategory[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar links:", e);
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

export function useLinks() {
  const categories = useSyncExternalStore(subscribe, read, () => DEFAULT_LINK_CATEGORIES);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) write(read());
  });

  const addCategory = useCallback((name: string, emoji: string) => {
    const order = read().reduce((max, c) => Math.max(max, c.order), 0) + 1;
    const cat: LinkCategory = {
      id: makeId("lnk"),
      name,
      emoji,
      links: [],
      order,
    };
    write([...read(), cat]);
    return cat;
  }, []);

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<LinkCategory, "id">>) => {
      write(
        read().map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const removeCategory = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id));
  }, []);

  /** Move uma categoria para uma nova posição (drag-drop) */
  const moveCategory = useCallback(
    (sourceId: string, targetId: string) => {
      const list = read();
      const sourceIdx = list.findIndex((c) => c.id === sourceId);
      const targetIdx = list.findIndex((c) => c.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return;
      const next = [...list];
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      // Reatribui order
      write(next.map((c, i) => ({ ...c, order: i + 1 })));
    },
    []
  );

  const addLink = useCallback((categoryId: string, link: Omit<LinkItem, "id">) => {
    const newLink: LinkItem = { id: makeId("l"), ...link };
    write(
      read().map((c) =>
        c.id === categoryId ? { ...c, links: [...c.links, newLink] } : c
      )
    );
    return newLink;
  }, []);

  const updateLink = useCallback(
    (categoryId: string, linkId: string, patch: Partial<Omit<LinkItem, "id">>) => {
      write(
        read().map((c) =>
          c.id === categoryId
            ? {
                ...c,
                links: c.links.map((l) =>
                  l.id === linkId ? { ...l, ...patch } : l
                ),
              }
            : c
        )
      );
    },
    []
  );

  const removeLink = useCallback((categoryId: string, linkId: string) => {
    write(
      read().map((c) =>
        c.id === categoryId
          ? { ...c, links: c.links.filter((l) => l.id !== linkId) }
          : c
      )
    );
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_LINK_CATEGORIES);
  }, []);

  return {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    addLink,
    updateLink,
    removeLink,
    resetAll,
  };
}
