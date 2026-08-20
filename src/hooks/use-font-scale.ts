"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Controle global de tamanho de fonte (acessibilidade).
 *
 * Funciona aplicando um multiplicador ao font-size do <html> via CSS variable
 * `--font-scale`. Todos os tamanhos de fonte rem (em `font-size: 0.875rem` etc)
 * herdam esse multiplicador automaticamente.
 *
 * Persistência: localStorage.
 * Valor padrão: 1 (100%).
 * Faixa: 0.85 a 1.4 (85% a 140%).
 */

export type FontSize = "sm" | "md" | "lg" | "xl" | "xxl";

const SCALE_MAP: Record<FontSize, number> = {
  sm: 0.85,
  md: 1.0,
  lg: 1.15,
  xl: 1.3,
  xxl: 1.4,
};

const SCALE_LABELS: Record<FontSize, string> = {
  sm: "Pequena",
  md: "Normal",
  lg: "Grande",
  xl: "Maior",
  xxl: "Máxima",
};

const STORAGE_KEY = "dashboard.fontScale.v1";
const EVENT = "dashboard:font-scale-change";

let currentScale: number | null = null;
const listeners = new Set<() => void>();

function readScale(): number {
  if (currentScale !== null) return currentScale;
  if (typeof window === "undefined") {
    currentScale = 1.0;
    return currentScale;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseFloat(raw) : 1.0;
    if (isNaN(parsed) || parsed < 0.7 || parsed > 1.6) {
      currentScale = 1.0;
    } else {
      currentScale = parsed;
    }
  } catch {
    currentScale = 1.0;
  }
  return currentScale;
}

function writeScale(scale: number) {
  currentScale = scale;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(scale));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar font scale:", e);
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

/**
 * Hook que retorna o scale atual e funções para alterá-lo.
 * Também aplica o scale ao <html> automaticamente via effect.
 */
export function useFontScale() {
  const scale = useSyncExternalStore(
    subscribe,
    readScale,
    () => 1.0
  );

  // Aplica o scale ao <html> via CSS variable
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--font-scale", String(scale));
    // Aplica também no font-size do <html> para que `rem` seja escalado
    root.style.fontSize = `${16 * scale}px`;
  }, [scale]);

  const setScale = useCallback((next: number) => {
    const clamped = Math.max(0.7, Math.min(1.6, next));
    writeScale(clamped);
  }, []);

  const increase = useCallback(() => {
    setScale(readScale() + 0.15);
  }, [setScale]);

  const decrease = useCallback(() => {
    setScale(readScale() - 0.15);
  }, [setScale]);

  const reset = useCallback(() => {
    setScale(1.0);
  }, [setScale]);

  const setSize = useCallback((size: FontSize) => {
    setScale(SCALE_MAP[size]);
  }, [setScale]);

  // Determina qual é o "size" atual mais próximo
  const currentSize: FontSize = (() => {
    const entries = Object.entries(SCALE_MAP) as [FontSize, number][];
    let closest: FontSize = "md";
    let minDiff = Infinity;
    for (const [size, s] of entries) {
      const diff = Math.abs(s - scale);
      if (diff < minDiff) {
        minDiff = diff;
        closest = size;
      }
    }
    return closest;
  })();

  return {
    scale,
    currentSize,
    setScale,
    setSize,
    increase,
    decrease,
    reset,
    SCALE_MAP,
    SCALE_LABELS,
  };
}
