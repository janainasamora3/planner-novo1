"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_SERVICE_TYPES,
  makeId,
  type ServiceTypeItem,
} from "@/lib/service-types";

const KEY = "dashboard.crm.serviceTypes.v1";
const EVENT = "dashboard:service-types-change";

let cache: ServiceTypeItem[] | null = null;
const listeners = new Set<() => void>();

function migrate(input: ServiceTypeItem[]): ServiceTypeItem[] {
  return input
    .filter((s) => s && typeof s.id === "string" && typeof s.label === "string")
    .map((s, i) => ({
      ...s,
      order: typeof s.order === "number" ? s.order : i + 1,
      emoji: s.emoji ?? "",
      color: s.color ?? "#1e3a8a",
    }))
    .sort((a, b) => a.order - b.order);
}

function read(): ServiceTypeItem[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_SERVICE_TYPES;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ServiceTypeItem[]) : DEFAULT_SERVICE_TYPES;
    cache = Array.isArray(parsed) ? migrate(parsed) : DEFAULT_SERVICE_TYPES;
  } catch {
    cache = DEFAULT_SERVICE_TYPES;
  }
  return cache;
}

function write(next: ServiceTypeItem[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar tipos de serviço:", e);
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

export function useServiceTypes() {
  const services = useSyncExternalStore(subscribe, read, () => DEFAULT_SERVICE_TYPES);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) {
      write(read());
    } else {
      const current = read();
      const migrated = migrate(current);
      if (JSON.stringify(current) !== JSON.stringify(migrated)) {
        write(migrated);
      }
    }
  });

  const addService = useCallback(
    (input: Omit<ServiceTypeItem, "id" | "order" | "createdAt" | "updatedAt"> & { order?: number }) => {
      const list = read();
      const order = input.order ?? list.length + 1;
      const now = Date.now();
      const item: ServiceTypeItem = {
        id: makeId("svc"),
        order,
        createdAt: now,
        updatedAt: now,
        ...input,
      } as ServiceTypeItem;
      write([...list, item]);
      return item;
    },
    []
  );

  const updateService = useCallback((id: string, patch: Partial<Omit<ServiceTypeItem, "id">>) => {
    write(
      read().map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s))
    );
  }, []);

  const removeService = useCallback((id: string) => {
    write(read().filter((s) => s.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_SERVICE_TYPES);
  }, []);

  return {
    services,
    addService,
    updateService,
    removeService,
    resetAll,
  };
}
