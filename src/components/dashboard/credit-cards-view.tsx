"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn, readableTextColor } from "@/lib/utils";
import {
  useCreditCards,
  type CreditCard,
  type CreditInvoiceItem,
} from "@/hooks/use-credit-loans";

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const CARD_COLORS = [
  "#2563eb", "#7c3aed", "#dc2626", "#ea580c",
  "#d97706", "#16a34a", "#0891b2", "#db2777",
  "#1e3a8a", "#0a0a0a",
];

const CARD_EMOJIS = ["💳", "🏛️", "🏪", "✈️", "🎁", "⭐", "🚀", "💎"];

const BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "Amex" },
  { value: "hipercard", label: "Hipercard" },
  { value: "nubank", label: "Nubank" },
  { value: "outro", label: "Outro" },
];

export function CreditCardsView() {
  const { cards, addCard, updateCard, removeCard, addItem, updateItem, removeItem, payNextInstallment } = useCreditCards();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  function handleSubmit(data: Omit<CreditCard, "id" | "items" | "createdAt" | "updatedAt">) {
    if (editingId) {
      updateCard(editingId, data);
      toast({ title: "Cartão atualizado", description: data.name });
    } else {
      addCard(data);
      toast({ title: "Cartão criado!", description: data.name });
    }
    setEditingId(null);
    setEditorOpen(false);
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este cartão e todas as suas faturas?")) return;
    removeCard(id);
    if (openCardId === id) setOpenCardId(null);
    toast({ title: "Cartão excluído", variant: "destructive" });
  }

  // Totais
  const totals = useMemo(() => {
    const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
    let totalCurrentInvoice = 0;
    let totalRemaining = 0;
    cards.forEach((c) => {
      c.items.forEach((i) => {
        const remainingInstallments = Math.max(0, i.installments - i.currentInstallment + 1);
        const installmentValue = i.installments > 0 ? i.value / i.installments : i.value;
        // Current invoice = this month's installment of all items
        totalCurrentInvoice += installmentValue;
        // Remaining = total still to pay
        totalRemaining += installmentValue * remainingInstallments;
      });
    });
    return { totalLimit, totalCurrentInvoice, totalRemaining };
  }, [cards]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">💳</span>
            <h2 className="text-base font-bold text-foreground">Faturas de Cartão</h2>
          </div>
          <p className="text-xs text-muted-foreground">{cards.length} cartão(ões) · Controle de parcelas</p>
        </div>
        <Button
          onClick={() => { setEditingId(null); setEditorOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white border-0"
        >
          + Novo cartão
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Limite total</p>
          <p className="text-lg font-bold text-foreground">{formatBRL(totals.totalLimit)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Fatura atual (parcela/mês)</p>
          <p className="text-lg font-bold text-amber-600">{formatBRL(totals.totalCurrentInvoice)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total restante a pagar</p>
          <p className="text-lg font-bold text-red-600">{formatBRL(totals.totalRemaining)}</p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <div className="text-5xl mb-3 opacity-40">💳</div>
          <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado. Clique em "+ Novo cartão".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <CreditCardBlock
              key={card.id}
              card={card}
              isOpen={openCardId === card.id}
              onToggle={() => setOpenCardId(openCardId === card.id ? null : card.id)}
              onEdit={() => { setEditingId(card.id); setEditorOpen(true); }}
              onDelete={() => handleDelete(card.id)}
              onAddItem={(data) => addItem(card.id, data)}
              onUpdateItem={(itemId, patch) => updateItem(card.id, itemId, patch)}
              onRemoveItem={(itemId) => removeItem(card.id, itemId)}
              onPayNext={(itemId) => payNextInstallment(card.id, itemId)}
            />
          ))}
        </div>
      )}

      {editorOpen && (
        <CreditCardEditor
          open={editorOpen}
          editingCard={cards.find((c) => c.id === editingId) ?? null}
          onOpenChange={(o) => { setEditorOpen(o); if (!o) setEditingId(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function CreditCardBlock({
  card, isOpen, onToggle, onEdit, onDelete,
  onAddItem, onUpdateItem, onRemoveItem, onPayNext,
}: {
  card: CreditCard;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: (data: Omit<CreditInvoiceItem, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateItem: (itemId: string, patch: Partial<Omit<CreditInvoiceItem, "id">>) => void;
  onRemoveItem: (itemId: string) => void;
  onPayNext: (itemId: string) => void;
}) {
  const textColor = readableTextColor(card.color);
  const summary = useMemo(() => {
    let current = 0;
    let remaining = 0;
    card.items.forEach((i) => {
      const instValue = i.installments > 0 ? i.value / i.installments : i.value;
      current += instValue;
      const remainingInst = Math.max(0, i.installments - i.currentInstallment + 1);
      remaining += instValue * remainingInst;
    });
    return { current, remaining };
  }, [card.items]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Card "credit card" visual */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left relative"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, #0a0a0a 100%)`,
          color: textColor,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xl mb-0.5">{card.emoji || "💳"}</div>
            <h3 className="text-sm font-bold">{card.name}</h3>
            {card.brand && <p className="text-[10px] opacity-70 uppercase">{card.brand}</p>}
          </div>
          <div className="text-right text-[10px] opacity-80">
            <div>Fecha dia {card.closingDay}</div>
            <div>Vence dia {card.dueDay}</div>
            <div>Limite: {formatBRL(card.limit)}</div>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] opacity-70 uppercase tracking-wide">Fatura atual</div>
            <div className="text-lg font-bold">{formatBRL(summary.current)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-70 uppercase tracking-wide">Restante</div>
            <div className="text-lg font-bold">{formatBRL(summary.remaining)}</div>
          </div>
        </div>
        {card.lastFour && (
          <div className="absolute bottom-2 right-3 text-[11px] font-mono opacity-80">•••• {card.lastFour}</div>
        )}
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-muted/20">
        <button
          onClick={onToggle}
          className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {isOpen ? "▲ Recolher" : "▼ Ver faturas"}
        </button>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">✏️ Editar</button>
          <button onClick={onDelete} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">🗑️ Excluir</button>
        </div>
      </div>

      {/* Items list */}
      {isOpen && (
        <InvoiceItemsList
          items={card.items}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
          onPayNext={onPayNext}
        />
      )}
    </div>
  );
}

function InvoiceItemsList({
  items, onAddItem, onUpdateItem, onRemoveItem, onPayNext,
}: {
  items: CreditInvoiceItem[];
  onAddItem: (data: Omit<CreditInvoiceItem, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateItem: (itemId: string, patch: Partial<Omit<CreditInvoiceItem, "id">>) => void;
  onRemoveItem: (itemId: string) => void;
  onPayNext: (itemId: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [installments, setInstallments] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function handleAdd() {
    const v = parseFloat(value.replace(",", "."));
    const inst = parseInt(installments, 10);
    if (!description.trim() || !v || v <= 0 || !inst || inst < 1) return;
    onAddItem({
      description: description.trim(),
      value: v,
      installments: inst,
      currentInstallment: 1,
      date,
    });
    setDescription(""); setValue(""); setInstallments("1");
    setDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
  }

  return (
    <div className="p-3 space-y-2 bg-background">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 italic">
          Nenhuma compra parcelada. Clique em "+ Nova compra".
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const instValue = item.installments > 0 ? item.value / item.installments : item.value;
            const remainingInst = Math.max(0, item.installments - item.currentInstallment + 1);
            const remainingValue = instValue * remainingInst;
            const isPaidOff = item.currentInstallment >= item.installments;
            const progress = item.installments > 0 ? (item.currentInstallment - 1) / item.installments : 1;
            return (
              <div
                key={item.id}
                className={cn(
                  "p-2.5 rounded-lg border bg-card",
                  isPaidOff ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Compra: {formatBRL(item.value)} · {formatDate(item.date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-foreground">
                      {item.currentInstallment}/{item.installments}x
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatBRL(instValue)}/parcela</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden my-1.5">
                  <div
                    className={cn("h-full transition-all", isPaidOff ? "bg-emerald-500" : "bg-blue-500")}
                    style={{ width: `${Math.min(100, progress * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {isPaidOff ? (
                      <span className="text-emerald-600 font-bold">✓ Quitado</span>
                    ) : (
                      <>
                        Faltam <span className="text-amber-600 font-bold">{remainingInst}x</span> ={" "}
                        <span className="text-red-600 font-bold">{formatBRL(remainingValue)}</span>
                      </>
                    )}
                  </span>
                  <div className="flex gap-1">
                    {!isPaidOff && (
                      <button
                        onClick={() => onPayNext(item.id)}
                        className="px-1.5 py-0.5 rounded text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        title="Pagar próxima parcela"
                      >
                        ✓ Pagar parcela
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm("Excluir esta compra?")) onRemoveItem(item.id); }}
                      className="px-1.5 py-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
          <div className="text-[10px] uppercase text-muted-foreground font-bold">Nova compra parcelada</div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (ex: Notebook, Celular...)"
            className="h-8 text-sm"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Valor total (R$)"
              className="h-8 text-sm"
              inputMode="decimal"
            />
            <Input
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="N° parcelas"
              className="h-8 text-sm"
              inputMode="numeric"
            />
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!description.trim() || !value}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              + Adicionar
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-2 rounded-lg border border-dashed border-border hover:border-foreground/40 hover:bg-muted/20 text-xs text-muted-foreground transition-colors"
        >
          + Nova compra parcelada
        </button>
      )}
    </div>
  );
}

function CreditCardEditor({
  open, editingCard, onOpenChange, onSubmit,
}: {
  open: boolean;
  editingCard: CreditCard | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: Omit<CreditCard, "id" | "items" | "createdAt" | "updatedAt">) => void;
}) {
  const [name, setName] = useState(editingCard?.name ?? "");
  const [lastFour, setLastFour] = useState(editingCard?.lastFour ?? "");
  const [brand, setBrand] = useState(editingCard?.brand ?? "");
  const [closingDay, setClosingDay] = useState(String(editingCard?.closingDay ?? 1));
  const [dueDay, setDueDay] = useState(String(editingCard?.dueDay ?? 10));
  const [limit, setLimit] = useState(String(editingCard?.limit ?? ""));
  const [color, setColor] = useState(editingCard?.color ?? CARD_COLORS[0]);
  const [emoji, setEmoji] = useState(editingCard?.emoji ?? "💳");

  // Reset state when dialog opens for a different card
  useMemo(() => {
    setName(editingCard?.name ?? "");
    setLastFour(editingCard?.lastFour ?? "");
    setBrand(editingCard?.brand ?? "");
    setClosingDay(String(editingCard?.closingDay ?? 1));
    setDueDay(String(editingCard?.dueDay ?? 10));
    setLimit(String(editingCard?.limit ?? ""));
    setColor(editingCard?.color ?? CARD_COLORS[0]);
    setEmoji(editingCard?.emoji ?? "💳");
  }, [editingCard]);

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      lastFour: lastFour.replace(/\D/g, "").slice(0, 4) || undefined,
      brand: brand || undefined,
      closingDay: Math.min(31, Math.max(1, parseInt(closingDay, 10) || 1)),
      dueDay: Math.min(31, Math.max(1, parseInt(dueDay, 10) || 10)),
      limit: parseFloat(limit.replace(",", ".")) || 0,
      color,
      emoji,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCard ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome do cartão *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Itaú..." className="mt-1" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Últimos 4 dígitos</label>
              <Input
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                className="mt-1 font-mono"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bandeira</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Fecha dia</label>
              <Input
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="mt-1"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Vence dia</label>
              <Input
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="mt-1"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Limite (R$)</label>
              <Input
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="5000"
                className="mt-1"
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Emoji</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {CARD_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center text-base border transition-all",
                    emoji === e ? "border-foreground scale-110 bg-muted" : "border-border hover:bg-accent"
                  )}
                >{e}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Cor</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-md border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0"
          >
            {editingCard ? "Salvar" : "Criar cartão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
