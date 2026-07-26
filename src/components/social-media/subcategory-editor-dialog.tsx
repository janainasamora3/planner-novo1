"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubCategory } from "@/lib/subcategories";

interface SubCategoryEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSubCategory: SubCategory | null;
  onSubmit: (data: { name: string; emoji: string; color: string }) => void;
}

const PRESET_COLORS = [
  "#1e3a8a", "#7c2d12", "#14532d", "#1e1b4b",
  "#831843", "#155e75", "#713f12", "#1c1917",
  "#3f3f46", "#166534", "#7f1d1d", "#0a0a0a",
];

const PRESET_EMOJIS = [
  "📊","📋","🎯","👥","🤝","💰","👋","🔗",
  "🚀","💼","📈","📅","⭐","🔥","💡","🗂️",
];

export function SubCategoryEditorDialog({
  open,
  onOpenChange,
  editingSubCategory,
  onSubmit,
}: SubCategoryEditorDialogProps) {
  const [name, setName] = useState(editingSubCategory?.name ?? "");
  const [emoji, setEmoji] = useState(editingSubCategory?.emoji ?? "");
  const [color, setColor] = useState(editingSubCategory?.color ?? PRESET_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      emoji: emoji.trim(),
      color,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar sub-menu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview da aba — estilo underline como aparece na barra */}
          <div className="flex justify-center py-2 border-b-2" style={{ borderColor: color }}>
            <div className="flex items-center gap-1.5 pb-2">
              {emoji && <span className="text-[13px]">{emoji}</span>}
              <span className="text-xs font-medium text-foreground">{name || "Nome do sub-menu"}</span>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Funil, Lista, Atividades..."
              autoFocus
              required
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Emoji</Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="📊"
              maxLength={4}
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="h-8 w-8 rounded-md bg-accent hover:bg-accent text-base flex items-center justify-center transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Cor</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-md border-2 transition-all ${
                    color === c ? "border-blue-500 scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground/60 hover:text-foreground hover:bg-muted/40"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
