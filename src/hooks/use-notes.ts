"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_NOTES, makeId, type Note, type NoteStep } from "@/lib/notes";

const KEY = "dashboard.social.notes.v1";
const EVENT = "dashboard:notes-change";

let cache: Note[] | null = null;
const listeners = new Set<() => void>();

function read(): Note[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_NOTES;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Note[]) : DEFAULT_NOTES;
    if (!Array.isArray(cache)) cache = DEFAULT_NOTES;
  } catch {
    cache = DEFAULT_NOTES;
  }
  return cache;
}

function write(next: Note[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar notas:", e);
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

export function useNotes() {
  const notes = useSyncExternalStore(subscribe, read, () => DEFAULT_NOTES);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) write(read());
  });

  const addNote = useCallback(
    (input: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const note: Note = {
        id: makeId("note"),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), note]);
      return note;
    },
    []
  );

  const updateNote = useCallback((id: string, patch: Partial<Omit<Note, "id">>) => {
    write(
      read().map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const removeNote = useCallback((id: string) => {
    write(read().filter((n) => n.id !== id));
  }, []);

  /** Toggle do checkbox de um passo da nota */
  const toggleStep = useCallback((noteId: string, stepId: string) => {
    write(
      read().map((n) =>
        n.id === noteId
          ? {
              ...n,
              steps: n.steps.map((s) =>
                s.id === stepId ? { ...s, done: !s.done } : s
              ),
              updatedAt: Date.now(),
            }
          : n
      )
    );
  }, []);

  /** Adiciona um novo passo ao checklist */
  const addStep = useCallback((noteId: string, text: string) => {
    const newStep: NoteStep = { id: makeId("s"), text, done: false };
    write(
      read().map((n) =>
        n.id === noteId
          ? { ...n, steps: [...n.steps, newStep], updatedAt: Date.now() }
          : n
      )
    );
  }, []);

  /** Remove um passo do checklist */
  const removeStep = useCallback((noteId: string, stepId: string) => {
    write(
      read().map((n) =>
        n.id === noteId
          ? { ...n, steps: n.steps.filter((s) => s.id !== stepId), updatedAt: Date.now() }
          : n
      )
    );
  }, []);

  /** Toggle pinned (fixar no topo) */
  const togglePinned = useCallback((noteId: string) => {
    write(
      read().map((n) =>
        n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_NOTES);
  }, []);

  return {
    notes,
    addNote,
    updateNote,
    removeNote,
    toggleStep,
    addStep,
    removeStep,
    togglePinned,
    resetAll,
  };
}
