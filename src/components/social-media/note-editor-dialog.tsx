"use client";

import { useRef, useState } from "react";
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
import type { Note, NoteStep } from "@/lib/notes";
import { makeId } from "@/lib/notes";

interface NoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote?: Note | null;
  onSubmit: (data: {
    title: string;
    content: string;
    steps: NoteStep[];
    emoji: string;
    color: string;
    pinned: boolean;
  }) => void;
  onDelete?: (id: string) => void;
}

const PRESET_COLORS = [
  "#1e3a8a", "#7c2d12", "#14532d", "#1e1b4b",
  "#831843", "#155e75", "#713f12", "#1c1917",
  "#3f3f46", "#166534", "#7f1d1d", "#0a0a0a",
];

const PRESET_EMOJIS = [
  "📞","🤝","⏰","📝","💡","🎯","📋","🔥",
  "✅","💬","🚀","⭐","💼","📊","📅","🔔",
];

export function NoteEditorDialog({
  open,
  onOpenChange,
  editingNote,
  onSubmit,
  onDelete,
}: NoteEditorDialogProps) {
  const isEditing = !!editingNote;
  const [title, setTitle] = useState(editingNote?.title ?? "");
  const [content, setContent] = useState(editingNote?.content ?? "");
  const [steps, setSteps] = useState<NoteStep[]>(editingNote?.steps ?? []);
  const [emoji, setEmoji] = useState(editingNote?.emoji ?? "");
  const [color, setColor] = useState(editingNote?.color ?? PRESET_COLORS[0]);
  const [pinned, setPinned] = useState(editingNote?.pinned ?? false);
  const [newStepText, setNewStepText] = useState("");
  const newStepInputRef = useRef<HTMLInputElement>(null);

  function addStep() {
    const text = newStepText.trim();
    if (!text) return;
    setSteps((prev) => [...prev, { id: makeId("s"), text, done: false }]);
    setNewStepText("");
    newStepInputRef.current?.focus();
  }

  function toggleStep(id: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      steps,
      emoji: emoji.trim(),
      color,
      pinned,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar anotação" : "Nova anotação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="note-title" className="text-foreground/70 text-xs uppercase tracking-wide">
              Título
            </Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Primeiro contato com cliente novo"
              autoFocus
              required
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
          </div>

          {/* Emoji + Cor + Pin */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Ícone</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="📞"
                maxLength={4}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Cor</Label>
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded border-2 transition-all ${
                      color === c ? "border-blue-500 scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ background: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Fixar</Label>
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`h-9 px-3 rounded-md border text-sm transition-colors ${
                  pinned
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-muted/20 border-border text-foreground/65 hover:text-foreground/70"
                }`}
                title="Fixar no topo"
              >
                📌
              </button>
            </div>
          </div>

          {/* Emoji presets */}
          <div className="flex flex-wrap gap-1.5">
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

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="note-content" className="text-foreground/70 text-xs uppercase tracking-wide">
              Conteúdo / Descrição
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o contexto, objetivo, dicas..."
              rows={3}
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 resize-none"
            />
          </div>

          {/* Checklist de passos */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">
              Passo a passo ({steps.length} {steps.length === 1 ? "passo" : "passos"})
            </Label>

            {/* Lista de passos */}
            <div className="space-y-1.5">
              {steps.length === 0 && (
                <p className="text-xs text-foreground/55 italic py-2">
                  Nenhum passo ainda. Adicione abaixo.
                </p>
              )}
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/20 border border-border group"
                >
                  <span className="text-[10px] text-foreground/55 w-4 text-center">{i + 1}.</span>
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      step.done
                        ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-300"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    {step.done && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-xs ${
                      step.done ? "text-foreground/55 line-through" : "text-foreground/80"
                    }`}
                  >
                    {step.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="opacity-0 group-hover:opacity-100 text-foreground/55 hover:text-red-400 transition-all"
                    aria-label="Remover passo"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar novo passo */}
            <div className="flex gap-2">
              <input
                ref={newStepInputRef}
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addStep();
                  }
                }}
                placeholder="Novo passo do passo a passo..."
                className="flex-1 h-8 px-3 rounded-md bg-muted/30 border border-border text-white text-xs placeholder:text-foreground/55 focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={addStep}
                disabled={!newStepText.trim()}
                className="h-8 px-3 rounded-md bg-accent hover:bg-accent border border-border text-foreground/70 hover:text-foreground text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Passo
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingNote && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir anotação "${editingNote.title}"?`)) {
                    onDelete(editingNote.id);
                    onOpenChange(false);
                  }
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Excluir
              </Button>
            )}
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
              {isEditing ? "Salvar" : "Criar anotação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
