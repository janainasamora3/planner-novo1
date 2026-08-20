"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_TRANSACTIONS, makeId, type Transaction } from "@/lib/finance";

const KEY = "dashboard.social.finance.v1";
const EVENT = "dashboard:finance-change";

let cache: Transaction[] | null = null;
const listeners = new Set<() => void>();

function read(): Transaction[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_TRANSACTIONS;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Transaction[]) : DEFAULT_TRANSACTIONS;
    if (!Array.isArray(cache)) cache = DEFAULT_TRANSACTIONS;
  } catch {
    cache = DEFAULT_TRANSACTIONS;
  }
  return cache;
}

function write(next: Transaction[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar transações:", e);
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

export function useFinance() {
  const transactions = useSyncExternalStore(subscribe, read, () => DEFAULT_TRANSACTIONS);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) write(read());
  });

  const addTransaction = useCallback(
    (input: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const tx: Transaction = {
        id: makeId("fin"),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), tx]);
      return tx;
    },
    []
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<Omit<Transaction, "id">>) => {
      write(
        read().map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
        )
      );
    },
    []
  );

  const removeTransaction = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_TRANSACTIONS);
  }, []);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    resetAll,
  };
}
