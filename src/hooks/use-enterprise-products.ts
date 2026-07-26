"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Catálogo de produtos/serviços por empresa.
 * Cada empresa (pageId) tem sua própria lista de produtos cadastrados.
 * Quando o usuário cadastra um produto aqui, ele aparece automaticamente
 * no CRM Clientes e na Prospecção com nome e valor pré-preenchidos.
 */

export interface CatalogProduct {
  id: string;
  name: string;
  value: string;
  description: string;
  active: boolean;
  createdAt: number;
}

const EVENT = "dashboard:enterprise-products-change";
const KEY_PREFIX = "dashboard.enterprise.products.";

const listeners = new Set<() => void>();
const cache = new Map<string, CatalogProduct[]>();

function getKey(pageId: string) {
  return `${KEY_PREFIX}${pageId}`;
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

function readKey(key: string): CatalogProduct[] {
  if (cache.has(key)) return cache.get(key)!;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw ? (JSON.parse(raw) as CatalogProduct[]) : [];
    cache.set(key, value);
    return value;
  } catch {
    cache.set(key, []);
    return [];
  }
}

function makeId(prefix = "prod"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const EMPTY_PRODUCTS: CatalogProduct[] = [];

export function useEnterpriseProducts(pageId: string) {
  const key = getKey(pageId);

  const products = useSyncExternalStore(
    subscribe,
    () => readKey(key),
    () => EMPTY_PRODUCTS
  );

  const addProduct = useCallback(
    (name: string, value: string, description: string = "") => {
      const list = readKey(key);
      const newProduct: CatalogProduct = {
        id: makeId(),
        name,
        value,
        description,
        active: true,
        createdAt: Date.now(),
      };
      const next = [...list, newProduct];
      cache.set(key, next);
      window.localStorage.setItem(key, JSON.stringify(next));
      notify();
      return newProduct;
    },
    [key]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<CatalogProduct>) => {
      const list = readKey(key);
      const next = list.map((p) => (p.id === id ? { ...p, ...patch } : p));
      cache.set(key, next);
      window.localStorage.setItem(key, JSON.stringify(next));
      notify();
    },
    [key]
  );

  const removeProduct = useCallback(
    (id: string) => {
      const list = readKey(key);
      const next = list.filter((p) => p.id !== id);
      cache.set(key, next);
      window.localStorage.setItem(key, JSON.stringify(next));
      notify();
    },
    [key]
  );

  return { products, addProduct, updateProduct, removeProduct };
}
