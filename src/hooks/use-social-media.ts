"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_CLIENTS,
  DEFAULT_POSTS,
  makeId,
  type SocialClient,
  type SocialPost,
} from "@/lib/social-media";

const CLIENTS_KEY = "dashboard.social.clients.v1";
const POSTS_KEY = "dashboard.social.posts.v1";
const EVENT = "dashboard:social-change";

/** Roda um effect apenas uma vez (mesmo em StrictMode dev). */
function useEffectOnce(fn: () => void) {
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    fn();
  }, [fn]);
}

// ---------- Clients store ----------

let clientsCache: SocialClient[] | null = null;
let postsCache: SocialPost[] | null = null;
const listeners = new Set<() => void>();

function readClients(): SocialClient[] {
  if (clientsCache !== null) return clientsCache;
  if (typeof window === "undefined") {
    clientsCache = DEFAULT_CLIENTS;
    return clientsCache;
  }
  try {
    const raw = window.localStorage.getItem(CLIENTS_KEY);
    clientsCache = raw ? (JSON.parse(raw) as SocialClient[]) : DEFAULT_CLIENTS;
    if (!Array.isArray(clientsCache)) clientsCache = DEFAULT_CLIENTS;
  } catch {
    clientsCache = DEFAULT_CLIENTS;
  }
  return clientsCache;
}

function readPosts(): SocialPost[] {
  if (postsCache !== null) return postsCache;
  if (typeof window === "undefined") {
    postsCache = DEFAULT_POSTS;
    return postsCache;
  }
  try {
    const raw = window.localStorage.getItem(POSTS_KEY);
    postsCache = raw ? (JSON.parse(raw) as SocialPost[]) : DEFAULT_POSTS;
    if (!Array.isArray(postsCache)) postsCache = DEFAULT_POSTS;
  } catch {
    postsCache = DEFAULT_POSTS;
  }
  return postsCache;
}

function writeClients(next: SocialClient[]) {
  clientsCache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar clientes (provável quota excedida):", e);
    alert("Não foi possível salvar. O armazenamento local está cheio — remova alguns posts com imagens grandes.");
  }
}

function writePosts(next: SocialPost[]) {
  postsCache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POSTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar posts (provável quota excedida):", e);
    alert("Não foi possível salvar o post. O armazenamento local está cheio — remova posts antigos com imagens grandes.");
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

// ---------- Hook ----------

export function useSocialMedia() {
  const clients = useSyncExternalStore(subscribe, readClients, () => DEFAULT_CLIENTS);
  const posts = useSyncExternalStore(subscribe, readPosts, () => DEFAULT_POSTS);

  // Persiste os defaults no primeiro mount se o localStorage estiver vazio.
  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(CLIENTS_KEY)) writeClients(readClients());
    if (!window.localStorage.getItem(POSTS_KEY)) writePosts(readPosts());
  });

  const addClient = useCallback(
    (input: Omit<SocialClient, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const client: SocialClient = {
        id: makeId("cli"),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      writeClients([...readClients(), client]);
      return client;
    },
    []
  );

  const updateClient = useCallback((id: string, patch: Partial<Omit<SocialClient, "id">>) => {
    writeClients(
      readClients().map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      )
    );
  }, []);

  const removeClient = useCallback((id: string) => {
    writeClients(readClients().filter((c) => c.id !== id));
    // Remove também os posts desse cliente
    writePosts(readPosts().filter((p) => p.clientId !== id));
  }, []);

  const addPost = useCallback(
    (input: Omit<SocialPost, "id" | "status" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const post: SocialPost = {
        id: makeId("post"),
        status: "pending",
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      writePosts([...readPosts(), post]);
      return post;
    },
    []
  );

  const updatePost = useCallback((id: string, patch: Partial<Omit<SocialPost, "id">>) => {
    writePosts(
      readPosts().map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const removePost = useCallback((id: string) => {
    writePosts(readPosts().filter((p) => p.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    writeClients(DEFAULT_CLIENTS);
    writePosts(DEFAULT_POSTS);
  }, []);

  return {
    clients,
    posts,
    addClient,
    updateClient,
    removeClient,
    addPost,
    updatePost,
    removePost,
    resetAll,
  };
}
