"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_PROSPECTS,
  makeId,
  type FunnelStage,
  type Prospect,
} from "@/lib/prospects";

const KEY = "dashboard.social.prospects.v1";
const EVENT = "dashboard:prospects-change";

let cache: Prospect[] | null = null;
const listeners = new Set<() => void>();

function read(): Prospect[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_PROSPECTS;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Prospect[]) : DEFAULT_PROSPECTS;
    if (!Array.isArray(cache)) cache = DEFAULT_PROSPECTS;
  } catch {
    cache = DEFAULT_PROSPECTS;
  }
  return cache;
}

function write(next: Prospect[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar prospects:", e);
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

export function useProspects() {
  const prospects = useSyncExternalStore(subscribe, read, () => DEFAULT_PROSPECTS);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) write(read());
  });

  const addProspect = useCallback(
    (input: Omit<Prospect, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const prospect: Prospect = {
        id: makeId("pros"),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), prospect]);
      return prospect;
    },
    []
  );

  const updateProspect = useCallback((id: string, patch: Partial<Omit<Prospect, "id">>) => {
    write(
      read().map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const removeProspect = useCallback((id: string) => {
    write(read().filter((p) => p.id !== id));
  }, []);

  /** Move um prospect para outra etapa do funil */
  const moveProspect = useCallback((id: string, stage: FunnelStage) => {
    updateProspect(id, { stage });
  }, [updateProspect]);

  const resetAll = useCallback(() => {
    write(DEFAULT_PROSPECTS);
  }, []);

  return {
    prospects,
    addProspect,
    updateProspect,
    removeProspect,
    moveProspect,
    resetAll,
  };
}
