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
import type { SocialClient } from "@/lib/social-media";

interface ClientEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: SocialClient | null;
  onSubmit: (data: {
    name: string;
    handle: string;
    emoji: string;
    color: string;
    active: boolean;
    startDate: string;
    endDate: string;
  }) => void;
  onDelete?: (id: string) => void;
}

const PRESET_COLORS = [
  "#1e3a8a", "#7c2d12", "#14532d", "#1e1b4b",
  "#831843", "#155e75", "#713f12", "#1c1917",
  "#3f3f46", "#166534", "#7f1d1d", "#0a0a0a",
];

const PRESET_EMOJIS = [
  "☕","🌸","🍔","💅","👗","🎨","📸","🎧",
  "🛍️","🏠","✂️","💄","🍪","🍷","🎯","🚀",
];

export function ClientEditorDialog({
  open,
  onOpenChange,
  editingClient,
  onSubmit,
  onDelete,
}: ClientEditorDialogProps) {
  const isEditing = !!editingClient;
  const [name, setName] = useState(editingClient?.name ?? "");
  const [handle, setHandle] = useState(editingClient?.handle ?? "");
  const [emoji, setEmoji] = useState(editingClient?.emoji ?? "");
  const [color, setColor] = useState(editingClient?.color ?? PRESET_COLORS[0]);
  const [active, setActive] = useState(editingClient?.active ?? true);
  const [startDate, setStartDate] = useState(editingClient?.startDate ?? "");
  const [endDate, setEndDate] = useState(editingClient?.endDate ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    let h = handle.trim();
    if (h && !h.startsWith("@")) h = "@" + h;
    onSubmit({
      name: name.trim(),
      handle: h,
      emoji: emoji.trim(),
      color,
      active,
      startDate,
      endDate,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Nome do cliente</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Café Aurora, Studio Bloom..."
              autoFocus
              required
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
          </div>

          {/* Handle */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">@ Handle (opcional)</Label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@cafeaurora"
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Ícone</Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="☕"
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

          {/* Período */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted/30 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-muted/30 border-border text-foreground"
              />
            </div>
          </div>

          {/* Status ativo/inativo */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActive(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  active
                    ? "bg-emerald-600/15 border-emerald-500/50 text-emerald-300"
                    : "bg-muted/20 border-border text-foreground/60 hover:border-foreground/25"
                }`}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => setActive(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  !active
                    ? "bg-accent border-foreground/25 text-white"
                    : "bg-muted/20 border-border text-foreground/60 hover:border-foreground/25"
                }`}
              >
                Inativo
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingClient && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir cliente "${editingClient.name}" e todos os posts relacionados?`)) {
                    onDelete(editingClient.id);
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
              {isEditing ? "Salvar" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
