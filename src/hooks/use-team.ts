"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_TEAM, makeId, type TeamMember } from "@/lib/team";

const KEY = "dashboard.social.team.v1";
const EVENT = "dashboard:team-change";

let cache: TeamMember[] | null = null;
const listeners = new Set<() => void>();

function read(): TeamMember[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = DEFAULT_TEAM;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as TeamMember[]) : DEFAULT_TEAM;
    if (!Array.isArray(cache)) cache = DEFAULT_TEAM;
  } catch {
    cache = DEFAULT_TEAM;
  }
  return cache;
}

function write(next: TeamMember[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar equipe:", e);
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

export function useTeam() {
  const team = useSyncExternalStore(subscribe, read, () => DEFAULT_TEAM);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) write(read());
  });

  const addMember = useCallback(
    (input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const member: TeamMember = {
        id: makeId("team"),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      write([...read(), member]);
      return member;
    },
    []
  );

  const updateMember = useCallback(
    (id: string, patch: Partial<Omit<TeamMember, "id">>) => {
      write(
        read().map((m) =>
          m.id === id ? { ...m, ...patch, updatedAt: Date.now() } : m
        )
      );
    },
    []
  );

  const removeMember = useCallback((id: string) => {
    write(read().filter((m) => m.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT_TEAM);
  }, []);

  return { team, addMember, updateMember, removeMember, resetAll };
}
