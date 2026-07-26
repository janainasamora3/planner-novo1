"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Hook genérico para persistir dados por empresa no localStorage.
 * Cada empresa (pageId) tem seu próprio namespace.
 *
 * Padrão usado: ler o raw string do localStorage em cada getSnapshot,
 * mas só re-parsear se o string mudou. Isto é O(1) no caso comum
 * (comparação de string) e sempre reflete o estado mais recente do
 * localStorage — sem cache stale.
 *
 * Quando setData é chamado (em qualquer componente), ele:
 * 1. Escreve no localStorage
 * 2. Dispara o evento `dashboard:enterprise-change`
 * 3. Todos os useSyncExternalStore subscribed re-executam getSnapshot
 * 4. getSnapshot lê o novo raw string, vê que mudou, re-parseia
 * 5. Retorna o novo valor → React re-renderiza
 */

const EVENT = "dashboard:enterprise-change";

function getKey(pageId: string, namespace: string) {
  return `dashboard.enterprise.${namespace}.${pageId}`;
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

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function useEnterpriseData<T>(
  pageId: string,
  namespace: string,
  defaultValue: T
): { data: T; setData: (next: T) => void } {
  const key = getKey(pageId, namespace);

  // Refs para evitar re-parse desnecessário — compara raw string
  const lastKeyRef = useRef<string | null>(null);
  const lastRawRef = useRef<string | null>(null);
  const lastValueRef = useRef<T | null>(null);

  const getSnapshot = useCallback((): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      // Se a key mudou ou o raw string mudou, re-parseia
      if (lastKeyRef.current !== key || lastRawRef.current !== raw) {
        let value: T;
        if (raw === null) {
          value = defaultValue;
        } else {
          try {
            value = JSON.parse(raw) as T;
          } catch {
            value = defaultValue;
          }
        }
        lastKeyRef.current = key;
        lastRawRef.current = raw;
        lastValueRef.current = value;
      }
      return lastValueRef.current as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const setData = useCallback(
    (next: T) => {
      if (typeof window === "undefined") return;
      try {
        const raw = JSON.stringify(next);
        window.localStorage.setItem(key, raw);
        // Atualiza refs locais para evitar re-parse desnecessário no próximo getSnapshot
        lastKeyRef.current = key;
        lastRawRef.current = raw;
        lastValueRef.current = next;
        // Notifica todos os componentes que usam este hook
        notify();
      } catch (e) {
        console.error("Falha ao salvar:", e);
      }
    },
    [key]
  );

  const data = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  return { data, setData };
}
