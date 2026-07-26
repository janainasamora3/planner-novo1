import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte um hex color em {r, g, b}. Retorna null se inválido.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b)
  );
}

/**
 * Dada uma cor de fundo (hex), retorna a cor de texto com melhor contraste
 * — "#ffffff" (branco) ou "#0a0a0a" (preto).
 * Se inválida (ex: "var(--x)"), retorna "#ffffff".
 */
export function readableTextColor(bg: string): string {
  const lum = luminance(bg);
  if (lum === null) return "#ffffff";
  return lum > 0.5 ? "#0a0a0a" : "#ffffff";
}
