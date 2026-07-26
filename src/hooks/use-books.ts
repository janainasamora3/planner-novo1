"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_BOOKS, makeBookId, type Book, type BookStatus, type BookFormat } from "@/lib/books";

const KEY = "dashboard.books.v1";
const EVENT = "dashboard:books-change";

let cache: Book[] | null = null;
const listeners = new Set<() => void>();

/**
 * Sanitiza um livro vindo do localStorage, garantindo que todos os campos
 * obrigatórios existam. Previne crashes com dados corrompidos/antigos.
 */
function sanitizeBook(raw: unknown): Book | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.id !== "string" || !b.id) return null;
  if (typeof b.title !== "string" || !b.title) return null;

  // Status
  const statusRaw = b.status;
  const status: BookStatus =
    statusRaw === "quero_ler" || statusRaw === "lendo" || statusRaw === "lido" || statusRaw === "pausado" || statusRaw === "abandonei"
      ? statusRaw
      : "quero_ler";

  // Format
  const formatRaw = b.format;
  const format: BookFormat | undefined =
    formatRaw === "fisico" || formatRaw === "ebook" || formatRaw === "audiobook"
      ? formatRaw
      : undefined;

  // Tags
  let tags: string[] = [];
  if (Array.isArray(b.tags)) {
    tags = b.tags.filter((t): t is string => typeof t === "string");
  }

  // readingLog
  let readingLog: Record<string, number> | undefined;
  if (b.readingLog && typeof b.readingLog === "object") {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(b.readingLog as Record<string, unknown>)) {
      if (typeof k === "string" && typeof v === "number" && v > 0) {
        clean[k] = v;
      }
    }
    readingLog = Object.keys(clean).length > 0 ? clean : undefined;
  }

  return {
    id: b.id,
    title: b.title,
    author: typeof b.author === "string" ? b.author : "",
    coverUrl: typeof b.coverUrl === "string" ? b.coverUrl : undefined,
    color: typeof b.color === "string" ? b.color : "#3f3f46",
    status,
    rating: typeof b.rating === "number" && b.rating >= 0 && b.rating <= 5 ? b.rating : 0,
    totalPages: typeof b.totalPages === "number" ? b.totalPages : undefined,
    pagesRead: typeof b.pagesRead === "number" ? b.pagesRead : undefined,
    startDate: typeof b.startDate === "string" ? b.startDate : undefined,
    finishDate: typeof b.finishDate === "string" ? b.finishDate : undefined,
    tags,
    notes: typeof b.notes === "string" ? b.notes : undefined,
    list: b.list === "desejo" || b.list === "comprado" ? b.list : null,
    format,
    readingLog,
    createdAt: typeof b.createdAt === "number" ? b.createdAt : Date.now(),
    updatedAt: typeof b.updatedAt === "number" ? b.updatedAt : Date.now(),
  };
}

function read(): Book[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_BOOKS.map((b) => ({ ...b, id: makeBookId(), createdAt: Date.now(), updatedAt: Date.now() }));
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cache = DEFAULT_BOOKS.map((b) => ({ ...b, id: makeBookId(), createdAt: Date.now(), updatedAt: Date.now() }));
      return cache;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = [];
      return cache;
    }
    cache = parsed
      .map((b) => sanitizeBook(b))
      .filter((b): b is Book => b !== null);
    // Se descartou algum livro inválido, persiste versão limpa
    if (cache.length !== parsed.length) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(cache));
      } catch {
        // ignore quota
      }
    }
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Book[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch { /* ignore */ }
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

const EMPTY: Book[] = [];

export function useBooks() {
  const books = useSyncExternalStore(subscribe, read, () => EMPTY);

  const addBook = useCallback((input: Omit<Book, "id" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const book: Book = { ...input, id: makeBookId(), createdAt: now, updatedAt: now };
    write([...read(), book]);
    return book;
  }, []);

  const updateBook = useCallback((id: string, patch: Partial<Omit<Book, "id">>) => {
    write(read().map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)));
  }, []);

  const removeBook = useCallback((id: string) => {
    write(read().filter((b) => b.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_BOOKS.map((b) => ({ ...b, id: makeBookId(), createdAt: Date.now(), updatedAt: Date.now() })));
  }, []);

  return { books, addBook, updateBook, removeBook, resetAll };
}
