"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PRESET_COLORS } from "@/lib/presets";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  /** Quantas cores preset mostrar (default todas) */
  limit?: number;
}

/**
 * Seletor de cor com swatches pré-definidos + input nativo de cor.
 */
export function ColorPicker({
  value,
  onChange,
  className,
  limit,
}: ColorPickerProps) {
  const colors = limit ? PRESET_COLORS.slice(0, limit) : PRESET_COLORS;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-7 w-7 rounded-md border-2 transition-all",
            value?.toLowerCase() === c.toLowerCase()
              ? "border-primary scale-110"
              : "border-transparent hover:scale-105"
          )}
          style={{ background: c }}
          aria-label={`Cor ${c}`}
        />
      ))}
      <label
        className="h-7 w-7 rounded-md border-2 border-border cursor-pointer relative overflow-hidden flex items-center justify-center bg-card hover:border-primary/50 transition-colors"
        title="Cor personalizada"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
          <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 2l7.586 7.586" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="11" cy="11" r="2" fill="currentColor" />
        </svg>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Escolher cor personalizada"
        />
      </label>
    </div>
  );
}
