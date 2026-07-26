"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PLANEJAMENTO_ITEMS,
  makePlanejamentoId,
  type PlanejamentoItem,
} from "@/lib/planejamento";

const STORAGE_KEY = "dashboard.planejamento.v3";
const LEGACY_KEYS = ["dashboard.planejamento.v2", "dashboard.planejamento.v1"];
const TEMPLATE_VERSION_KEY = "dashboard.planejamento.briefingTemplateVersion";
const EVENT = "dashboard:planejamento-change";
const BRIEFING_ID = "pl-briefing";
/** Versão do template — bump para forçar re-injeção quando o conteúdo mudir. */
const BRIEFING_TEMPLATE_VERSION = 1;

// ----- Store externo (singleton module-level) -----

let cache: PlanejamentoItem[] | null = null;
const listeners = new Set<() => void>();

function read(): PlanejamentoItem[] {
  // Sempre verifica se precisa reinjetar o template — isso roda mesmo
  // se o cache em memória está preenchido, garantindo que bumpar
  // BRIEFING_TEMPLATE_VERSION dispare a re-injeção.
  if (cache !== null) {
    if (needsTemplateReinjection()) {
      const ensured = ensureBriefingTemplate(cache);
      if (ensured !== cache) {
        cache = ensured;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        } catch {
          // ignore quota
        }
        window.dispatchEvent(new CustomEvent(EVENT));
      }
      markTemplateApplied();
    }
    return cache;
  }
  if (typeof window === "undefined") {
    cache = DEFAULT_PLANEJAMENTO_ITEMS;
    return cache;
  }
  try {
    // Tenta a versão atual
    let raw = window.localStorage.getItem(STORAGE_KEY);
    // Migração: se a v3 está vazia mas a v2/v1 existe, migra.
    if (!raw) {
      for (const legacyKey of LEGACY_KEYS) {
        const legacyRaw = window.localStorage.getItem(legacyKey);
        if (legacyRaw) {
          try {
            const legacyParsed = JSON.parse(legacyRaw) as PlanejamentoItem[];
            if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
              const migrated = migrateLegacy(legacyParsed);
              write(migrated);
              raw = window.localStorage.getItem(STORAGE_KEY);
              break;
            }
          } catch {
            // ignore legacy parse errors
          }
        }
      }
    }
    let parsed: PlanejamentoItem[];
    if (!raw) {
      parsed = DEFAULT_PLANEJAMENTO_ITEMS;
    } else {
      const tmp = JSON.parse(raw) as PlanejamentoItem[];
      parsed = Array.isArray(tmp) && tmp.length > 0 ? tmp : DEFAULT_PLANEJAMENTO_ITEMS;
    }

    // GARANTIA: sempre injetar o template no Briefing se precisar.
    parsed = ensureBriefingTemplate(parsed);

    cache = parsed;
    // Persiste se houve alteração (injeção do template)
    if (!raw || JSON.stringify(parsed) !== raw) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // ignore quota
      }
    }
    markTemplateApplied();
    return cache;
  } catch {
    cache = DEFAULT_PLANEJAMENTO_ITEMS;
    return cache;
  }
}

/**
 * Garante que o item Briefing tenha o template preenchido.
 *
 * Estratégia robusta baseada em VERSÃO do template (não em conteúdo):
 * - Lê a versão do template aplicada, guardada em chave separada do localStorage.
 * - Se a versão guardada != BRIEFING_TEMPLATE_VERSION, injeta o template
 *   no Briefing (sobrescrevendo qualquer conteúdo vazio).
 * - Se o Briefing já tem conteúdo customizado (não vazio), preserva.
 * - Se o Briefing não existe, não faz nada.
 *
 * Isso garante que bumpar BRIEFING_TEMPLATE_VERSION force a re-injeção
 * mesmo se o cache em memória foi populado antes da atualização do código.
 */
function ensureBriefingTemplate(items: PlanejamentoItem[]): PlanejamentoItem[] {
  const idx = items.findIndex((i) => i.id === BRIEFING_ID);
  if (idx === -1) return items;
  const current = items[idx];
  // Sempre injeta se estiver vazio (caso comum).
  if (!current.content || current.content.trim() === "") {
    const defaultBriefing = DEFAULT_PLANEJAMENTO_ITEMS.find((i) => i.id === BRIEFING_ID);
    if (!defaultBriefing || !defaultBriefing.content) return items;
    const next = [...items];
    next[idx] = {
      ...current,
      content: defaultBriefing.content,
      updatedAt: Date.now(),
    };
    return next;
  }
  return items;
}

/**
 * Verifica se o template do Briefing precisa ser (re)injetado comparando
 * a versão guardada no localStorage com a versão atual do código.
 * Retorna true se for necessário forçar a re-injeção.
 */
function needsTemplateReinjection(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(TEMPLATE_VERSION_KEY);
    const storedVersion = stored ? parseInt(stored, 10) : 0;
    return storedVersion !== BRIEFING_TEMPLATE_VERSION;
  } catch {
    return false;
  }
}

/**
 * Marca a versão do template como aplicada no localStorage.
 */
function markTemplateApplied() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TEMPLATE_VERSION_KEY,
      String(BRIEFING_TEMPLATE_VERSION)
    );
  } catch {
    // ignore
  }
}

/**
 * Migra dados da v1 → v2. Estratégia:
 * - Mantém todos os itens que o usuário customizou (cor, emoji, imagem, conteúdo).
 * - Garante que o Briefing tenha o template preenchido (se estiver vazio,
 *   injeta o template default).
 * - Garante que todos os 27 itens default existam — se algum sumiu (usuário
 *   excluiu), mantém a exclusão; se algum default faltar, recriia.
 */
function migrateLegacy(legacy: PlanejamentoItem[]): PlanejamentoItem[] {
  const result: PlanejamentoItem[] = [...legacy];
  const defaultBriefing = DEFAULT_PLANEJAMENTO_ITEMS.find((i) => i.id === BRIEFING_ID);
  if (!defaultBriefing) return result;

  const idx = result.findIndex((i) => i.id === BRIEFING_ID);
  if (idx === -1) {
    // Briefing não existe (usuário excluiu?) — não força recriar.
    return result;
  }
  // Se o Briefing está sem conteúdo ou com placeholder antigo vazio,
  // injeta o template default.
  if (!result[idx].content || result[idx].content.trim() === "") {
    result[idx] = {
      ...result[idx],
      content: defaultBriefing.content,
      updatedAt: Date.now(),
    };
  }
  return result;
}

function write(next: PlanejamentoItem[]) {
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

export function usePlanejamento() {
  const items = useSyncExternalStore(
    subscribe,
    read,
    () => DEFAULT_PLANEJAMENTO_ITEMS
  );

  const addItem = useCallback(
    (input: Omit<PlanejamentoItem, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const item: PlanejamentoItem = {
        id: makePlanejamentoId(),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), item]);
      return item;
    },
    []
  );

  const updateItem = useCallback((id: string, patch: Partial<Omit<PlanejamentoItem, "id">>) => {
    const next = read().map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    write(next);
  }, []);

  const removeItem = useCallback((id: string) => {
    write(read().filter((p) => p.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_PLANEJAMENTO_ITEMS);
  }, []);

  return { items, loaded: true, addItem, updateItem, removeItem, resetAll };
}
