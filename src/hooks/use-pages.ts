"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_PAGES, makeId, type PageCard, type SectionId } from "@/lib/pages";

const STORAGE_KEY = "dashboard.pages.v1";
const EVENT = "dashboard:pages-change";

// ----- Store externo (singleton module-level) ---

let cache: PageCard[] | null = null;
const listeners = new Set<() => void>();

/**
 * Sanitiza uma página vinda do localStorage, garantindo que todos os campos
 * obrigatórios existam. Previne crashes com dados corrompidos/antigos.
 */
function sanitizePage(raw: unknown): PageCard | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id) return null;
  if (typeof p.title !== "string" || !p.title) return null;
  if (p.section !== "negocios" && p.section !== "pessoal") return null;

  const specialRaw = p.special;
  const special: PageCard["special"] | undefined =
    specialRaw === "social-media" || specialRaw === "enterprise" || specialRaw === "business-plan" || specialRaw === "books" || specialRaw === "tasks" || specialRaw === "caverna" || specialRaw === "planejamento" || specialRaw === "finance" || specialRaw === "ideas" || specialRaw === "quick-tasks" || specialRaw === "fitness"
      ? specialRaw
      : undefined;

  return {
    id: p.id,
    section: p.section,
    title: p.title,
    emoji: typeof p.emoji === "string" ? p.emoji : undefined,
    color: typeof p.color === "string" ? p.color : undefined,
    imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : undefined,
    content: typeof p.content === "string" ? p.content : undefined,
    special,
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
  };
}

function read(): PageCard[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_PAGES;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = DEFAULT_PAGES;
      return cache;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = DEFAULT_PAGES;
      return cache;
    }
    // Sanitiza cada página — descarta inválidas em vez de quebrar o app
    let list = parsed
      .map((p) => sanitizePage(p))
      .filter((p): p is PageCard => p !== null);

    // Se sanitização descartou alguma página, persiste versão limpa
    if (list.length !== parsed.length) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore quota
      }
    }

    // Migração: garante que páginas especiais têm o campo special correto.
    // Necessário porque versões antigas do app salvavam páginas sem special.
    // Mapa id → special esperado (para páginas padrão)
    const specialById: Record<string, PageCard["special"]> = {
      p1: "quick-tasks",
      p2: "caverna",
      p3: "planejamento",
      p4: "finance",
      p5: "ideas",
      p7: "fitness",
      p10: "books",
    };
    // Mapa title (lowercase) → special (para casos onde o id mudou)
    const specialByTitle: Record<string, PageCard["special"]> = {
      tarefas: "quick-tasks",
      "modo caverna": "caverna",
      planejamento: "planejamento",
      financas: "finance",
      finanças: "finance",
      ideias: "ideas",
      fitness: "fitness",
      livros: "books",
    };
    let changed = false;
    list = list.map((p) => {
      const expectedSpecial =
        specialById[p.id] ??
        specialByTitle[(p.title ?? "").toLowerCase().trim()] ??
        null;
      if (expectedSpecial && p.special !== expectedSpecial) {
        changed = true;
        return { ...p, special: expectedSpecial };
      }
      return p;
    });
    cache = list;
    if (changed) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore quota
      }
    }
    return cache;
  } catch {
    cache = DEFAULT_PAGES;
    return cache;
  }
}

function write(next: PageCard[]) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota
    }
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ----- Hook -----

export function usePages() {
  // useSyncExternalStore resolve hydration mismatch automaticamente:
  // no SSR usa getServerSnapshot (DEFAULT_PAGES), no client usa o snapshot do store.
  const pages = useSyncExternalStore(
    subscribe,
    read,
    () => DEFAULT_PAGES
  );

  const addPage = useCallback(
    (input: Omit<PageCard, "id" | "createdAt" | "updatedAt"> & { section: SectionId }) => {
      const now = Date.now();
      const page: PageCard = {
        id: makeId(),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), page]);
      return page;
    },
    []
  );

  const updatePage = useCallback((id: string, patch: Partial<Omit<PageCard, "id">>) => {
    const next = read().map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    write(next);
  }, []);

  const removePage = useCallback((id: string) => {
    write(read().filter((p) => p.id !== id));
  }, []);

  /**
   * Move uma página para outra seção (e/ou posição).
   * - toSection: seção de destino
   * - beforeId: id da página antes da qual inserir. Se null, anexa ao fim da seção.
   */
  const movePage = useCallback(
    (id: string, toSection: SectionId, beforeId: string | null) => {
      const all = [...read()];
      const sourceIdx = all.findIndex((p) => p.id === id);
      if (sourceIdx === -1) return;
      const [moved] = all.splice(sourceIdx, 1);
      moved.section = toSection;
      moved.updatedAt = Date.now();

      if (beforeId) {
        // Recalcula o índice após splice
        const targetIdx = all.findIndex((p) => p.id === beforeId);
        if (targetIdx >= 0) {
          all.splice(targetIdx, 0, moved);
        } else {
          all.push(moved);
        }
      } else {
        all.push(moved);
      }
      write(all);
    },
    []
  );

  const resetAll = useCallback(() => {
    write(DEFAULT_PAGES);
  }, []);

  return { pages, loaded: true, addPage, updatePage, removePage, movePage, resetAll };
}
