"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import {
  useLoans,
  type Loan,
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

const LOAN_COLORS = [
  "#7c3aed", "#2563eb", "#dc2626", "#ea580c",
  "#d97706", "#16a34a", "#0891b2", "#db2777",
  "#1e3a8a", "#0a0a0a",
];

const LOAN_EMOJIS = ["🏦", "💰", "📈", "🤝", "💸", "⚠️", "📋", "⚖️"];

export function LoansView() {
  const { loans, addLoan, updateLoan, removeLoan, addPayment, removePayment } = useLoans();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openLoanId, setOpenLoanId] = useState<string | null>(null);

  function handleSubmit(data: Omit<Loan, "id" | "payments" | "createdAt" | "updatedAt">) {
    if (editingId) {
      updateLoan(editingId, data);
      toast({ title: "Empréstimo atualizado", description: data.description });
    } else {
      addLoan(data);
      toast({ title: "Empréstimo criado!", description: data.description });
    }
    setEditingId(null);
    setEditorOpen(false);
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este empréstimo e todos os pagamentos?")) return;
    removeLoan(id);
    if (openLoanId === id) setOpenLoanId(null);
    toast({ title: "Empréstimo excluído", variant: "destructive" });
  }

  function handleAddPayment(loanId: string, amount: number, date: string, note?: string) {
    addPayment(loanId, { amount, date, note });
    toast({ title: `+ ${formatBRL(amount)} pago!` });
  }

  const totals = useMemo(() => {
    let totalBorrowed = 0;
    let totalLent = 0;
    let totalPaidBorrow = 0;
    let totalPaidLent = 0;
    loans.forEach((l) => {
      const paid = l.payments.reduce((s, p) => s + p.amount, 0);
      if (l.type === "borrow") {
        totalBorrowed += l.principal;
        totalPaidBorrow += paid;
      } else {
        totalLent += l.principal;
        totalPaidLent += paid;
      }
    });
    return {
      totalBorrowed,
      totalLent,
      remainingBorrow: Math.max(0, totalBorrowed - totalPaidBorrow),
      remainingLent: Math.max(0, totalLent - totalPaidLent),
    };
  }, [loans]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">🏦</span>
            <h2 className="text-base font-bold text-foreground">Empréstimos</h2>
          </div>
          <p className="text-xs text-muted-foreground">Controle o que você pegou ou emprestou</p>
        </div>
        <Button
          onClick={() => { setEditingId(null); setEditorOpen(true); }}
          className="bg-violet-600 hover:bg-violet-500 text-white border-0"
        >
          + Novo empréstimo
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Peguei (total)</p>
          <p className="text-base font-bold text-red-600">{formatBRL(totals.totalBorrowed)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Falta: {formatBRL(totals.remainingBorrow)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Emprestei (total)</p>
          <p className="text-base font-bold text-emerald-600">{formatBRL(totals.totalLent)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">A receber: {formatBRL(totals.remainingLent)}</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <div className="text-5xl mb-3 opacity-40">🏦</div>
          <p className="text-sm text-muted-foreground">Nenhum empréstimo cadastrado. Clique em "+ Novo empréstimo".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              isOpen={openLoanId === loan.id}
              onToggle={() => setOpenLoanId(openLoanId === loan.id ? null : loan.id)}
              onEdit={() => { setEditingId(loan.id); setEditorOpen(true); }}
              onDelete={() => handleDelete(loan.id)}
              onAddPayment={(amount, date, note) => handleAddPayment(loan.id, amount, date, note)}
              onRemovePayment={(paymentId) => removePayment(loan.id, paymentId)}
            />
          ))}
        </div>
      )}

      {editorOpen && (
        <LoanEditor
          open={editorOpen}
          editingLoan={loans.find((l) => l.id === editingId) ?? null}
          onOpenChange={(o) => { setEditorOpen(o); if (!o) setEditingId(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function LoanCard({
  loan, isOpen, onToggle, onEdit, onDelete, onAddPayment, onRemovePayment,
}: {
  loan: Loan;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPayment: (amount: number, date: string, note?: string) => void;
  onRemovePayment: (paymentId: string) => void;
}) {
  const totalPaid = useMemo(() => loan.payments.reduce((s, p) => s + p.amount, 0), [loan.payments]);
  const totalDue = loan.principal; // sem juros por enquanto
  const remaining = Math.max(0, totalDue - totalPaid);
  const progress = totalDue > 0 ? Math.min(1, totalPaid / totalDue) : 0;
  const isBorrow = loan.type === "borrow";
  const isPaidOff = totalPaid >= totalDue && totalDue > 0;

  // Compute estimated installment value if not set
  const installmentValue = loan.installmentValue > 0
    ? loan.installmentValue
    : loan.installments > 0
      ? loan.principal / loan.installments
      : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
        style={{ background: `linear-gradient(135deg, ${loan.color}18 0%, transparent 100%)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <span className="text-2xl shrink-0">{loan.emoji || "🏦"}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground line-clamp-1">{loan.description}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                    isBorrow ? "bg-red-500/15 text-red-500" : "bg-emerald-500/15 text-emerald-500"
                  )}
                >
                  {isBorrow ? "↓ Peguei" : "↑ Emprestei"}
                </span>
                {loan.counterparty && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {isBorrow ? "de" : "para"} <span className="text-foreground font-medium">{loan.counterparty}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Principal</p>
            <p className={cn("text-base font-bold", isBorrow ? "text-red-600" : "text-emerald-600")}>
              {formatBRL(totalDue)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 mb-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Pago: <span className="text-foreground font-bold">{formatBRL(totalPaid)}</span></span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", isPaidOff ? "bg-emerald-500" : "bg-blue-500")}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[10px] text-muted-foreground">
          <span>📊 {loan.installments}x {formatBRL(installmentValue)}</span>
          {loan.interestRate > 0 && <span>📈 {loan.interestRate}% a.m.</span>}
          {loan.startDate && <span>📅 {formatDate(loan.startDate)}</span>}
          {!isPaidOff && <span className="text-amber-600 font-bold">Falta: {formatBRL(remaining)}</span>}
          {isPaidOff && <span className="text-emerald-600 font-bold">✓ Quitado</span>}
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-muted/20">
        <button
          onClick={onToggle}
          className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {isOpen ? "▲ Recolher" : "▼ Ver pagamentos"}
        </button>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">✏️ Editar</button>
          <button onClick={onDelete} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">🗑️ Excluir</button>
        </div>
      </div>

      {isOpen && (
        <PaymentsList
          loan={loan}
          onAddPayment={onAddPayment}
          onRemovePayment={onRemovePayment}
        />
      )}
    </div>
  );
}

function PaymentsList({
  loan, onAddPayment, onRemovePayment,
}: {
  loan: Loan;
  onAddPayment: (amount: number, date: string, note?: string) => void;
  onRemovePayment: (paymentId: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  function handleAdd() {
    const v = parseFloat(amount.replace(",", "."));
    if (!v || v <= 0) return;
    onAddPayment(v, date, note.trim() || undefined);
    setAmount(""); setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
  }

  const sortedPayments = [...loan.payments].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="p-3 space-y-2 bg-background">
      {loan.notes && (
        <div className="text-[11px] text-muted-foreground bg-muted/30 border border-border rounded p-2 italic mb-1">
          📝 {loan.notes}
        </div>
      )}

      {sortedPayments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 italic">Nenhum pagamento registrado.</p>
      ) : (
        <div className="space-y-1">
          {sortedPayments.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded-md bg-card border border-border text-sm group">
              <span className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xs shrink-0">✓</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm">{formatBRL(p.amount)}</p>
                {p.note && <p className="text-[10px] text-muted-foreground line-clamp-1">{p.note}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(p.date)}</span>
              <button
                onClick={() => { if (confirm("Remover este pagamento?")) onRemovePayment(p.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-[10px] px-1"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
          <div className="text-[10px] uppercase text-muted-foreground font-bold">Registrar pagamento</div>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (R$)"
            className="h-8 text-sm"
            inputMode="decimal"
            autoFocus
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 text-sm"
          />
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            className="min-h-[50px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!amount}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0"
            >
              + Registrar
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-2 rounded-lg border border-dashed border-border hover:border-foreground/40 hover:bg-muted/20 text-xs text-muted-foreground transition-colors"
        >
          + Registrar pagamento
        </button>
      )}
    </div>
  );
}

function LoanEditor({
  open, editingLoan, onOpenChange, onSubmit,
}: {
  open: boolean;
  editingLoan: Loan | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: Omit<Loan, "id" | "payments" | "createdAt" | "updatedAt">) => void;
}) {
  const [type, setType] = useState<Loan["type"]>(editingLoan?.type ?? "borrow");
  const [description, setDescription] = useState(editingLoan?.description ?? "");
  const [counterparty, setCounterparty] = useState(editingLoan?.counterparty ?? "");
  const [principal, setPrincipal] = useState(String(editingLoan?.principal ?? ""));
  const [interestRate, setInterestRate] = useState(String(editingLoan?.interestRate ?? ""));
  const [installments, setInstallments] = useState(String(editingLoan?.installments ?? 1));
  const [installmentValue, setInstallmentValue] = useState(String(editingLoan?.installmentValue ?? ""));
  const [startDate, setStartDate] = useState(editingLoan?.startDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(editingLoan?.notes ?? "");
  const [color, setColor] = useState(editingLoan?.color ?? LOAN_COLORS[0]);
  const [emoji, setEmoji] = useState(editingLoan?.emoji ?? "🏦");

  useMemo(() => {
    setType(editingLoan?.type ?? "borrow");
    setDescription(editingLoan?.description ?? "");
    setCounterparty(editingLoan?.counterparty ?? "");
    setPrincipal(String(editingLoan?.principal ?? ""));
    setInterestRate(String(editingLoan?.interestRate ?? ""));
    setInstallments(String(editingLoan?.installments ?? 1));
    setInstallmentValue(String(editingLoan?.installmentValue ?? ""));
    setStartDate(editingLoan?.startDate ?? new Date().toISOString().slice(0, 10));
    setNotes(editingLoan?.notes ?? "");
    setColor(editingLoan?.color ?? LOAN_COLORS[0]);
    setEmoji(editingLoan?.emoji ?? "🏦");
  }, [editingLoan]);

  function handleSubmit() {
    if (!description.trim()) return;
    onSubmit({
      type,
      description: description.trim(),
      counterparty: counterparty.trim(),
      principal: parseFloat(principal.replace(",", ".")) || 0,
      interestRate: parseFloat(interestRate.replace(",", ".")) || 0,
      installments: parseInt(installments, 10) || 1,
      installmentValue: parseFloat(installmentValue.replace(",", ".")) || 0,
      startDate,
      notes: notes.trim() || undefined,
      color,
      emoji,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLoan ? "Editar empréstimo" : "Novo empréstimo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
            <Select value={type} onValueChange={(v) => setType(v as Loan["type"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="borrow">↓ Peguei emprestado (devo pagar)</SelectItem>
                <SelectItem value="lend">↑ Emprestei a alguém (vou receber)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição *</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Empréstimo banco X, João..."
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {type === "borrow" ? "Peguei de (pessoa/banco)" : "Emprestei para (pessoa)"}
            </label>
            <Input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder={type === "borrow" ? "Ex: Banco Itaú, João Silva" : "Ex: Maria, Pedro"}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor principal (R$) *</label>
              <Input
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="5000"
                className="mt-1"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Juros a.m. (%)</label>
              <Input
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="2"
                className="mt-1"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">N° parcelas</label>
              <Input
                value={installments}
                onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ""))}
                placeholder="12"
                className="mt-1"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor da parcela (R$)</label>
              <Input
                value={installmentValue}
                onChange={(e) => setInstallmentValue(e.target.value)}
                placeholder="Auto (se vazio)"
                className="mt-1"
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Data de início</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais, condições..."
              className="min-h-[60px] mt-1 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Emoji</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {LOAN_EMOJIS.map((e) => (
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
              {LOAN_COLORS.map((c) => (
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
            disabled={!description.trim() || !principal}
            className="bg-violet-600 hover:bg-violet-500 text-white border-0"
          >
            {editingLoan ? "Salvar" : "Criar empréstimo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
