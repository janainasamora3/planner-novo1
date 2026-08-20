"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  STATUS_COLORS_DEFAULT,
  type ClientStatus,
} from "@/lib/clients-crm";

const STORAGE_KEY = "dashboard.crm.statusColors.v1";
const EVENT = "dashboard:status-colors-change";

const STATUS_CSS_VARS: Record<ClientStatus, string> = {
  ativo: "--status-ativo",
  pausado: "--status-pausado",
  inativo: "--status-inativo",
  lead: "--status-lead",
};

let cache: Record<ClientStatus, string> | null = null;
const listeners = new Set<() => void>();

function read(): Record<ClientStatus, string> {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = { ...STATUS_COLORS_DEFAULT };
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = { ...STATUS_COLORS_DEFAULT };
      return cache;
    }
    const parsed = JSON.parse(raw) as Partial<Record<ClientStatus, string>>;
    cache = { ...STATUS_COLORS_DEFAULT, ...parsed } as Record<ClientStatus, string>;
    return cache;
  } catch {
    cache = { ...STATUS_COLORS_DEFAULT };
    return cache;
  }
}

function write(next: Record<ClientStatus, string>) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota
    }
    const root = document.documentElement;
    for (const status of Object.keys(STATUS_CSS_VARS) as ClientStatus[]) {
      root.style.setProperty(STATUS_CSS_VARS[status], next[status]);
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

export function useStatusColors() {
  const colors = useSyncExternalStore(
    subscribe,
    read,
    () => STATUS_COLORS_DEFAULT
  );

  useEffect(() => {
    const current = read();
    const root = document.documentElement;
    for (const status of Object.keys(STATUS_CSS_VARS) as ClientStatus[]) {
      root.style.setProperty(STATUS_CSS_VARS[status], current[status]);
    }
  }, []);

  const setStatusColor = useCallback((status: ClientStatus, hex: string) => {
    write({ ...read(), [status]: hex });
  }, []);

  const resetAll = useCallback(() => {
    write({ ...STATUS_COLORS_DEFAULT });
  }, []);

  return { colors, setStatusColor, resetAll };
}
