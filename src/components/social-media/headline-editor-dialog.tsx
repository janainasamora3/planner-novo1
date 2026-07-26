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
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_HEADLINE_CATEGORIES,
  type Headline,
} from "@/lib/headlines";
import { cn } from "@/lib/utils";

interface HeadlineEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHeadline?: Headline | null;
  onSubmit: (data: {
    text: string;
    categoryId: string;
    favorite: boolean;
  }) => void;
  onDelete?: (id: string) => void;
}

export function HeadlineEditorDialog({
  open,
  onOpenChange,
  editingHeadline,
  onSubmit,
  onDelete,
}: HeadlineEditorDialogProps) {
  const isEditing = !!editingHeadline;

  const [text, setText] = useState(editingHeadline?.text ?? "");
  const [categoryId, setCategoryId] = useState(
    editingHeadline?.categoryId ?? DEFAULT_HEADLINE_CATEGORIES[0].id
  );
  const [favorite, setFavorite] = useState(editingHeadline?.favorite ?? false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({
      text: text.trim(),
      categoryId,
      favorite,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar headline" : "Nova headline"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Texto da headline
            </Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: 5 erros que estão destruindo seu Instagram..."
              rows={3}
              autoFocus
              required
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              {text.length} caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Categoria
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DEFAULT_HEADLINE_CATEGORIES.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "h-8 px-2 rounded-md text-xs font-medium border-2 transition-all flex items-center gap-1.5",
                      isSelected
                        ? "text-white"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    )}
                    style={
                      isSelected
                        ? { background: cat.color, borderColor: cat.color }
                        : undefined
                    }
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ background: cat.color }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Favorita
            </Label>
            <button
              type="button"
              onClick={() => setFavorite((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 h-8 px-3 rounded-md border text-xs font-medium transition-colors",
                favorite
                  ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              )}
            >
              <span className="text-sm">{favorite ? "⭐" : "☆"}</span>
              {favorite ? "Marcada como favorita" : "Marcar como favorita"}
            </button>
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingHeadline && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm("Excluir esta headline?")) {
                    onDelete(editingHeadline.id);
                    onOpenChange(false);
                  }
                }}
                className="text-destructive hover:text-destructive"
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              {isEditing ? "Salvar" : "Criar headline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
