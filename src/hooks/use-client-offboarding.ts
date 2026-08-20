"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_OFFBOARDING_ITEMS, type OffboardingItem } from "@/lib/offboarding";

const KEY = "dashboard.social.offboarding.clientStates.v2";
const EVENT = "dashboard:offboarding-client-change";

/**
 * Estado de offboarding por cliente.
 * Cada cliente tem seu próprio checklist (8 itens) com:
 * - done: checkbox marcado
 * - dateAnnotation: data agendada ou data em que foi enviado
 * - sent: marcação de "enviado ao cliente"
 * - sentAt: timestamp de quando foi enviado
 */
export interface ClientOffboardingItem {
  itemId: string;
  done: boolean;
  dateAnnotation: string;
  sent: boolean;
  sentAt?: number;
}

export interface ClientOffboardingState {
  clientId: string;
  items: ClientOffboardingItem[];
  updatedAt: number;
}

type ClientStatesMap = Record<string, ClientOffboardingState>;

let cache: ClientStatesMap | null = null;
const listeners = new Set<() => void>();

function makeInitialItems(): ClientOffboardingItem[] {
  return DEFAULT_OFFBOARDING_ITEMS.map((it) => ({
    itemId: it.id,
    done: false,
    dateAnnotation: "",
    sent: false,
  }));
}

function read(): ClientStatesMap {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = {};
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ClientStatesMap) : {};
    if (!cache || typeof cache !== "object") cache = {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: ClientStatesMap) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar offboarding client state:", e);
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

export function useClientOffboarding(clientId: string | null) {
  const allStates = useSyncExternalStore(subscribe, read, () => ({}));

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    read();
  });

  const state: ClientOffboardingState | null = clientId
    ? allStates[clientId] ?? null
    : null;

  // Items merged with template (so changes to template propagate)
  const items: ClientOffboardingItem[] = (() => {
    if (!state) return makeInitialItems();
    return DEFAULT_OFFBOARDING_ITEMS.map((tpl) => {
      const existing = state.items.find((it) => it.itemId === tpl.id);
      return existing ?? {
        itemId: tpl.id,
        done: false,
        dateAnnotation: "",
        sent: false,
      };
    });
  })();

  const toggleDone = useCallback(
    (itemId: string) => {
      if (!clientId) return;
      const current = read()[clientId];
      const nextItems = items.map((it) =>
        it.itemId === itemId
          ? {
              ...it,
              done: !it.done,
              // Se marcar como done e tem sent=false, não altera sent automaticamente
            }
          : it
      );
      write({
        ...read(),
        [clientId]: {
          clientId,
          items: nextItems,
          updatedAt: Date.now(),
        },
      });
    },
    [clientId, items]
  );

  const markSent = useCallback(
    (itemId: string) => {
      if (!clientId) return;
      const nextItems = items.map((it) =>
        it.itemId === itemId
          ? {
              ...it,
              sent: true,
              sentAt: Date.now(),
              // Marcando como enviado também marca como done automaticamente
              done: true,
            }
          : it
      );
      write({
        ...read(),
        [clientId]: {
          clientId,
          items: nextItems,
          updatedAt: Date.now(),
        },
      });
    },
    [clientId, items]
  );

  const unmarkSent = useCallback(
    (itemId: string) => {
      if (!clientId) return;
      const nextItems = items.map((it) =>
        it.itemId === itemId
          ? { ...it, sent: false, sentAt: undefined }
          : it
      );
      write({
        ...read(),
        [clientId]: {
          clientId,
          items: nextItems,
          updatedAt: Date.now(),
        },
      });
    },
    [clientId, items]
  );

  const updateDate = useCallback(
    (itemId: string, value: string) => {
      if (!clientId) return;
      const nextItems = items.map((it) =>
        it.itemId === itemId ? { ...it, dateAnnotation: value } : it
      );
      write({
        ...read(),
        [clientId]: {
          clientId,
          items: nextItems,
          updatedAt: Date.now(),
        },
      });
    },
    [clientId, items]
  );

  const resetClient = useCallback(() => {
    if (!clientId) return;
    const next = { ...read() };
    delete next[clientId];
    write(next);
  }, [clientId]);

  return {
    items,
    state,
    toggleDone,
    markSent,
    unmarkSent,
    updateDate,
    resetClient,
  };
}

/**
 * Hook para listar TODOS os estados de offboarding (dashboard view).
 */
export function useAllClientOffboarding() {
  const allStates = useSyncExternalStore(subscribe, read, () => ({}));

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    read();
  });

  const clientIds = Object.keys(allStates);

  // Para cada cliente, calcula progresso
  const summaries = clientIds.map((cid) => {
    const state = allStates[cid];
    const items = DEFAULT_OFFBOARDING_ITEMS.map((tpl) => {
      const existing = state.items.find((it) => it.itemId === tpl.id);
      return existing ?? {
        itemId: tpl.id,
        done: false,
        dateAnnotation: "",
        sent: false,
      };
    });
    const doneCount = items.filter((i) => i.done).length;
    const sentCount = items.filter((i) => i.sent).length;
    const total = items.length;
    const nextPending = items.find((i) => !i.done);
    const nextPendingItem = nextPending
      ? DEFAULT_OFFBOARDING_ITEMS.find((t) => t.id === nextPending.itemId)
      : null;

    return {
      clientId: cid,
      doneCount,
      sentCount,
      total,
      progress: total > 0 ? (doneCount / total) * 100 : 0,
      isComplete: doneCount === total,
      nextPendingItem,
      nextPendingDate: nextPending?.dateAnnotation ?? null,
      updatedAt: state.updatedAt,
    };
  });

  return { summaries };
}

/**
 * Utilitário para limpar todos os estados (debug).
 */
export function clearAllClientOffboarding() {
  write({});
}
