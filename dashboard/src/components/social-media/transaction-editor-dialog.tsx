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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_OPTIONS,
  STATUS_OPTIONS,
  TYPE_COLORS,
  TYPE_LABELS,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

interface TransactionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
  onSubmit: (data: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: (id: string) => void;
}

export function TransactionEditorDialog({
  open,
  onOpenChange,
  editingTransaction,
  defaultType = "entrada",
  onSubmit,
  onDelete,
}: TransactionEditorDialogProps) {
  const isEditing = !!editingTransaction;
  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type ?? defaultType
  );
  const [description, setDescription] = useState(editingTransaction?.description ?? "");
  const [value, setValue] = useState<string>(
    editingTransaction?.value !== undefined ? String(editingTransaction.value) : ""
  );
  const [date, setDate] = useState(
    editingTransaction?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [client, setClient] = useState(editingTransaction?.client ?? "");
  const [service, setService] = useState(editingTransaction?.service ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    editingTransaction?.paymentMethod ?? "pix"
  );
  const [status, setStatus] = useState<TransactionStatus>(
    editingTransaction?.status ?? "pago"
  );
  const [notes, setNotes] = useState(editingTransaction?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    const numValue = value.trim() ? Number(value.replace(/[^\d]/g, "")) : 0;
    onSubmit({
      type,
      description: description.trim(),
      value: Number.isFinite(numValue) ? numValue : 0,
      date,
      paymentMethod,
      status,
      client: client.trim(),
      service: service.trim(),
      notes: notes.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar transação" : "Nova transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Tipo
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["entrada", "saida"] as TransactionType[]).map((t) => {
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "h-10 rounded-md border-2 text-sm font-medium transition-all flex items-center justify-center gap-2",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground border-border bg-background"
                    )}
                    style={
                      isActive
                        ? {
                            background: TYPE_COLORS[t],
                            borderColor: TYPE_COLORS[t],
                          }
                        : undefined
                    }
                  >
                    <span>{t === "entrada" ? "↑" : "↓"}</span>
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Descrição
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mensalidade Café Aurora"
              autoFocus
              required
            />
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Valor (R$)
              </Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="2800"
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Data
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Cliente + Serviço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Cliente
              </Label>
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ex: Café Aurora"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Serviço
              </Label>
              <Input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Ex: Gestão de social media"
              />
            </div>
          </div>

          {/* Pagamento + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Pagamento
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TransactionStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Notas
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a transação"
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            {isEditing && onDelete && editingTransaction && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm("Excluir esta transação?")) {
                    onDelete(editingTransaction.id);
                    onOpenChange(false);
                  }
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <Button type="submit" className="bg-primary text-primary-foreground">
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
