"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useServiceTypes } from "@/hooks/use-service-types";
import { useToast } from "@/hooks/use-toast";
import { PRESET_EMOJIS, PRESET_COLORS_EXTENDED } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ServiceTypeItem } from "@/lib/service-types";
import { cn, readableTextColor } from "@/lib/utils";

interface ServiceTypeManagerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  className?: string;
}

export function ServiceTypeManager({
  selectedIds,
  onChange,
  label = "Serviços",
  className,
}: ServiceTypeManagerProps) {
  const { services, addService, updateService, removeService, resetAll } = useServiceTypes();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTypeItem | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds]
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function openCreate() {
    setEditingService(null);
    setOpen(false);
    setModalOpen(true);
  }

  function openEdit(s: ServiceTypeItem) {
    setEditingService(s);
    setOpen(false);
    setModalOpen(true);
  }

  function handleReset() {
    resetAll();
    toast({ title: "Serviços restaurados" });
  }

  function handleDelete(s: ServiceTypeItem) {
    if (confirm(`Excluir o serviço "${s.label}"?`)) {
      removeService(s.id);
      onChange(selectedIds.filter((x) => x !== s.id));
      toast({ title: "Serviço excluído", variant: "destructive" });
    }
  }

  return (
    <div className={cn("space-y-2 relative", className)}>
      {label && (
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full min-h-9 px-3 py-1.5 rounded-md border border-input bg-transparent text-sm text-left flex flex-wrap items-center gap-1.5 transition-colors hover:bg-accent",
          open && "ring-2 ring-ring/50"
        )}
      >
        {selectedServices.length === 0 ? (
          <span className="text-muted-foreground py-0.5">Selecionar serviços...</span>
        ) : (
          <>
            {selectedServices.slice(0, 3).map((s) => {
              const bg = s.color || "#3f3f46";
              return (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    background: bg,
                    color: readableTextColor(bg),
                  }}
                >
                  {s.emoji && <span className="text-[10px]">{s.emoji}</span>}
                  {s.label}
                </span>
              );
            })}
            {selectedServices.length > 3 && (
              <span className="text-[11px] text-muted-foreground">
                +{selectedServices.length - 3}
              </span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground">▾</span>
          </>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="z-50 absolute top-full left-0 right-0 mt-1 min-w-full max-w-md rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
            <span className="text-xs text-muted-foreground">
              {selectedIds.length} selecionado{selectedIds.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                title="Restaurar padrão"
              >
                ↺ Restaurar
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                + Novo
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {services.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhum serviço cadastrado.
              </div>
            ) : (
              services.map((s) => {
                const checked = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/50 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors",
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border bg-background"
                        )}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      {s.emoji && <span className="text-sm">{s.emoji}</span>}
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: s.color || "#3f3f46" }}
                      />
                      <span className="text-sm">{s.label}</span>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent text-xs"
                        aria-label={`Editar ${s.label}`}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                        aria-label={`Excluir ${s.label}`}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <ServiceModal
        key={editingService?.id ?? "new"}
        open={modalOpen}
        editing={editingService}
        onOpenChange={setModalOpen}
        onSave={(data) => {
          if (editingService) {
            updateService(editingService.id, data);
            toast({ title: "Serviço atualizado", description: data.label });
          } else {
            const created = addService(data);
            if (created) {
              onChange([...selectedIds, created.id]);
            }
            toast({ title: "Serviço criado", description: data.label });
          }
          setModalOpen(false);
        }}
      />
    </div>
  );
}

function ServiceModal({
  open,
  editing,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: ServiceTypeItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { label: string; emoji?: string; color?: string }) => void;
}) {
  const [label, setLabel] = useState(editing?.label ?? "");
  const [emoji, setEmoji] = useState(editing?.emoji ?? "");
  const [color, setColor] = useState(editing?.color ?? "#1e3a8a");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      emoji: emoji.trim() || undefined,
      color,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center py-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md"
              style={{
                background: color,
                color: readableTextColor(color),
              }}
            >
              {emoji && <span>{emoji}</span>}
              {label || "Nome do serviço"}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Gestão de tráfego"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ícone (opcional)</Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎯"
              maxLength={4}
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_EMOJIS.slice(0, 16).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="h-7 w-7 rounded-md bg-muted hover:bg-accent text-sm flex items-center justify-center"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cor</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS_EXTENDED.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-md border-2 transition-all",
                    color?.toLowerCase() === c.toLowerCase()
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Personalizada
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>
              <code className="text-[10px] text-muted-foreground font-mono uppercase ml-auto">
                {color}
              </code>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
