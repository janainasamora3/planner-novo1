"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  id?: string;
}

function isoToBR(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function brToISO(br: string): string {
  const clean = br.replace(/\D/g, "");
  if (clean.length !== 8) return "";
  const d = clean.slice(0, 2);
  const m = clean.slice(2, 4);
  const y = clean.slice(4, 8);
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12) return "";
  if (day < 1 || day > 31) return "";
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return `${y}-${m}-${d}`;
}

function maskBR(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  let out = digits;
  if (digits.length > 4) {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length > 2) {
    out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return out;
}

export function DateInput({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  autoFocus,
  onBlur,
  onKeyDown,
  id,
}: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToBR(value ?? ""));
  const lastExternalValue = useRef(value ?? "");

  useEffect(() => {
    const incomingISO = value ?? "";
    if (incomingISO !== lastExternalValue.current) {
      lastExternalValue.current = incomingISO;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(isoToBR(incomingISO));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskBR(e.target.value);
    setDisplay(masked);
    const iso = brToISO(masked);
    lastExternalValue.current = iso;
    onChange(iso);
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      maxLength={10}
      className={cn(
        "h-8 px-2 text-sm bg-background border border-border rounded-md",
        "text-foreground placeholder:text-muted-foreground/75",
        "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/30",
        className
      )}
    />
  );
}
