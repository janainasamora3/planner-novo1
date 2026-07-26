"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useStatusColors } from "@/hooks/use-status-colors";
import {
  STATUS_COLORS_DEFAULT,
  STATUS_LABELS,
  type ClientStatus,
} from "@/lib/clients-crm";
import { PRESET_COLORS_EXTENDED } from "@/lib/presets";
import { readableTextColor } from "@/lib/utils";

const STATUS_ORDER: ClientStatus[] = ["ativo", "pausado", "inativo", "lead"];

const STATUS_EMOJIS: Record<ClientStatus, string> = {
  ativo: "✅",
  pausado: "⏸️",
  inativo: "⛔",
  lead: "🎯",
};

interface StatusColorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusColorsDialog({ open, onOpenChange }: StatusColorsDialogProps) {
  const { colors, setStatusColor, resetAll } = useStatusColors();
  const { toast } = useToast();

  function handleReset() {
    if (confirm("Restaurar cores padrão de status? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Cores restauradas" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🎨</span>
            <span>Cores dos status</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Personalize a cor de cada status de cliente. As mudanças se aplicam
            em todo o CRM (lista, cards, detalhe, filtros).
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {STATUS_ORDER.map((status) => {
            const color = colors[status];
            const isDefault = color.toLowerCase() === STATUS_COLORS_DEFAULT[status].toLowerCase();
            return (
              <div
                key={status}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/40"
              >
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md"
                    style={{
                      background: color,
                      color: readableTextColor(color),
                    }}
                  >
                    <span>{STATUS_EMOJIS[status]}</span>
                    {STATUS_LABELS[status]}
                  </span>
                  {!isDefault && (
                    <span className="text-[9px] text-emerald-500 font-medium">
                      ● personalizada
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-foreground">
                      {STATUS_LABELS[status]}
                    </p>
                    <code className="text-[10px] text-muted-foreground font-mono uppercase">
                      {color}
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS_EXTENDED.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setStatusColor(status, c)}
                        className={`h-6 w-6 rounded-md border-2 transition-all ${
                          color.toLowerCase() === c.toLowerCase()
                            ? "border-primary scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ background: c }}
                        aria-label={`Cor ${c}`}
                        title={c}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Escolher cor personalizada"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Personalizada
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setStatusColor(status, e.target.value)}
                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            Restaurar padrão
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0"
          >
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
