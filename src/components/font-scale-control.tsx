"use client";

import { useState } from "react";
import { useFontScale, type FontSize } from "@/hooks/use-font-scale";
import { cn } from "@/lib/utils";

/**
 * Controle de tamanho de fonte global (A- / A / A+).
 *
 * Mostra um botão compacto no header. Ao clicar, abre um dropdown com
 * 5 tamanhos predefinidos (Pequena, Normal, Grande, Maior, Máxima).
 * O scale é aplicado ao <html> e persiste em localStorage.
 */
export function FontScaleControl() {
  const { currentSize, setSize, SCALE_MAP, SCALE_LABELS, scale } = useFontScale();
  const [open, setOpen] = useState(false);

  const sizes: FontSize[] = ["sm", "md", "lg", "xl", "xxl"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-8 px-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent",
          "flex items-center gap-0.5 transition-colors text-xs font-medium",
          open && "bg-accent text-foreground"
        )}
        title={`Tamanho da fonte: ${SCALE_LABELS[currentSize]} (${Math.round(scale * 100)}%)`}
        aria-label="Ajustar tamanho da fonte"
      >
        <span className="text-[10px] leading-none">A</span>
        <span className="text-[13px] leading-none font-bold">A</span>
        <span className="text-[16px] leading-none">A</span>
      </button>

      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] py-1.5 rounded-lg bg-popover border border-border shadow-xl">
            <div className="px-3 py-1.5 border-b border-border mb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                Tamanho da fonte
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                {Math.round(scale * 100)}% · {SCALE_LABELS[currentSize]}
              </p>
            </div>
            {sizes.map((size) => {
              const isActive = currentSize === size;
              const s = SCALE_MAP[size];
              return (
                <button
                  key={size}
                  onClick={() => {
                    setSize(size);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {!isActive && <span className="w-3" />}
                    <span>{SCALE_LABELS[size]}</span>
                  </span>
                  <span
                    className="text-muted-foreground tabular-nums"
                    style={{ fontSize: `${10 * s}px` }}
                  >
                    Aa
                  </span>
                </button>
              );
            })}
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => {
                  setSize("md");
                  setOpen(false);
                }}
                className="w-full text-center px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                ↺ Restaurar padrão (100%)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
