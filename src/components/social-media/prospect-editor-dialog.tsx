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
  STAGES,
  type FunnelStage,
  type Prospect,
} from "@/lib/prospects";

interface ProspectEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProspect?: Prospect | null;
  defaultStage?: FunnelStage;
  onSubmit: (data: {
    name: string;
    handle: string;
    email: string;
    phone: string;
    emoji: string;
    color: string;
    stage: FunnelStage;
    value: number | undefined;
    source: string;
    lastContact: string;
    notes: string;
  }) => void;
  onDelete?: (id: string) => void;
  onMove?: (id: string, stage: FunnelStage) => void;
}

const PRESET_COLORS = [
  "#1e3a8a", "#7c2d12", "#14532d", "#1e1b4b",
  "#831843", "#155e75", "#713f12", "#1c1917",
  "#3f3f46", "#166534", "#7f1d1d", "#0a0a0a",
];

const PRESET_EMOJIS = [
  "🍽️","👗","💪","☕","🌸","🍔","🛒","🏠",
  "💅","🎨","📸","🎧","💼","📊","🚀","⭐",
];

const SOURCES = ["Instagram", "Google", "Indicação", "LinkedIn", "Facebook", "Outro"];

export function ProspectEditorDialog({
  open,
  onOpenChange,
  editingProspect,
  defaultStage = "novo",
  onSubmit,
  onDelete,
  onMove,
}: ProspectEditorDialogProps) {
  const isEditing = !!editingProspect;
  const [name, setName] = useState(editingProspect?.name ?? "");
  const [handle, setHandle] = useState(editingProspect?.handle ?? "");
  const [email, setEmail] = useState(editingProspect?.email ?? "");
  const [phone, setPhone] = useState(editingProspect?.phone ?? "");
  const [emoji, setEmoji] = useState(editingProspect?.emoji ?? "");
  const [color, setColor] = useState(editingProspect?.color ?? PRESET_COLORS[0]);
  const [stage, setStage] = useState<FunnelStage>(editingProspect?.stage ?? defaultStage);
  const [value, setValue] = useState<string>(
    editingProspect?.value !== undefined ? String(editingProspect.value) : ""
  );
  const [source, setSource] = useState(editingProspect?.source ?? "");
  const [lastContact, setLastContact] = useState(
    editingProspect?.lastContact ?? new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(editingProspect?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    let h = handle.trim();
    if (h && !h.startsWith("@")) h = "@" + h;
    const numValue = value.trim() ? Number(value.replace(/[^\d]/g, "")) : undefined;
    onSubmit({
      name: name.trim(),
      handle: h,
      email: email.trim(),
      phone: phone.trim(),
      emoji: emoji.trim(),
      color,
      stage,
      value: Number.isFinite(numValue) ? numValue : undefined,
      source,
      lastContact,
      notes: notes.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar prospect" : "Novo prospect"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Nome / Empresa</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Restaurante Sabor"
              autoFocus
              required
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
          </div>

          {/* Handle / Contato */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Contato / @handle</Label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@saborrestaurante ou (11) 99999-9999"
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
            />
          </div>

          {/* Email + Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prospect-email" className="text-foreground/70 text-xs uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="prospect-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospect-phone" className="text-foreground/70 text-xs uppercase tracking-wide">
                Telefone
              </Label>
              <Input
                id="prospect-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
              />
            </div>
          </div>

          {/* Etapa do funil */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Etapa do funil</Label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border transition-all ${
                    stage === s.id ? "text-white" : "text-foreground/50 hover:text-foreground/80"
                  }`}
                  style={{
                    background: stage === s.id ? s.color : `${s.color}40`,
                    borderColor: stage === s.id ? s.color : `${s.color}80`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valor + Origem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Valor (R$)</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="2500"
                inputMode="numeric"
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Origem</Label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-foreground text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="" className="bg-card">Selecione...</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Última interação */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Última interação</Label>
            <Input
              type="date"
              value={lastContact}
              onChange={(e) => setLastContact(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
            />
          </div>

          {/* Emoji + Cor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70 text-xs uppercase tracking-wide">Ícone</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🍽️"
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
          </div>
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

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="prospect-notes" className="text-foreground/70 text-xs uppercase tracking-wide">
              Observações
            </Label>
            <Textarea
              id="prospect-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Histórico de conversas, próximos passos..."
              rows={3}
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            {isEditing && onDelete && editingProspect && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir prospect "${editingProspect.name}"?`)) {
                    onDelete(editingProspect.id);
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
              {isEditing ? "Salvar" : "Criar prospect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
