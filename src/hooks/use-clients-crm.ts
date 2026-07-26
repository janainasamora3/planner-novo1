"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_CLIENTS,
  makeClientId,
  type Client,
  type ClientStatus,
} from "@/lib/clients-crm";

const KEY = "dashboard.crm.clients.v2";
const EVENT = "dashboard:crm-clients-change";

let cache: Client[] | null = null;
const listeners = new Set<() => void>();

function migrate(input: Client[]): Client[] {
  return input
    .filter((c) => c && typeof c.id === "string" && typeof c.name === "string")
    .map((c) => ({
      ...c,
      serviceTypeIds: Array.isArray(c.serviceTypeIds) ? c.serviceTypeIds : [],
    }));
}

function read(): Client[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_CLIENTS;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Client[]) : DEFAULT_CLIENTS;
    cache = Array.isArray(parsed) ? migrate(parsed) : DEFAULT_CLIENTS;
  } catch {
    cache = DEFAULT_CLIENTS;
  }
  return cache;
}

function write(next: Client[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar clientes CRM:", e);
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

export function useClientsCrm() {
  const clients = useSyncExternalStore(subscribe, read, () => DEFAULT_CLIENTS);

  const addClient = useCallback(
    (input: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const client: Client = {
        id: makeClientId(),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), client]);
      return client;
    },
    []
  );

  const updateClient = useCallback((id: string, patch: Partial<Omit<Client, "id">>) => {
    const next = read().map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
    );
    write(next);
  }, []);

  const removeClient = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id));
  }, []);

  const setStatus = useCallback((id: string, status: ClientStatus) => {
    const next = read().map((c) =>
      c.id === id ? { ...c, status, updatedAt: Date.now() } : c
    );
    write(next);
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_CLIENTS);
  }, []);

  return {
    clients,
    addClient,
    updateClient,
    removeClient,
    setStatus,
    resetAll,
  };
}
