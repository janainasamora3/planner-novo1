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
import { useToast } from "@/hooks/use-toast";
import { useFinance } from "@/hooks/use-finance";
import { cn } from "@/lib/utils";
import {
  useSavingsGoals,
  useFixedExpenses,
  useFinanceCategories,
  type SavingsGoal,
  type FixedExpense,
  type FinanceCategory,
} from "@/hooks/use-finance-extras";

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatShortBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_LONG = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function daysUntil(targetISO: string): number {
  if (!targetISO) return 0;
  const target = new Date(targetISO + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
}
function monthsUntil(targetISO: string): number {
  if (!targetISO) return 0;
  const target = new Date(targetISO + "T00:00:00");
  const today = new Date();
  return Math.max(0, (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()));
}

// =================== Componente principal (3 seções) ===================
export function FinanceExtras() {
  const [activeSection, setActiveSection] = useState<"goals" | "fixed" | "categories">("goals");
  return (
    <div className="space-y-4 mt-6">
      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setActiveSection("goals")} className={cn("px-4 py-2 text-xs font-medium border-b-2 transition-colors", activeSection === "goals" ? "border-emerald-500 text-emerald-500" : "border-transparent text-muted-foreground hover:text-foreground")}>🎯 Metas de Economia</button>
        <button onClick={() => setActiveSection("fixed")} className={cn("px-4 py-2 text-xs font-medium border-b-2 transition-colors", activeSection === "fixed" ? "border-amber-500 text-amber-500" : "border-transparent text-muted-foreground hover:text-foreground")}>🔁 Saídas Fixas</button>
        <button onClick={() => setActiveSection("categories")} className={cn("px-4 py-2 text-xs font-medium border-b-2 transition-colors", activeSection === "categories" ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground hover:text-foreground")}>🏷️ Categorias</button>
      </div>
      {activeSection === "goals" && <GoalsSection />}
      {activeSection === "fixed" && <FixedExpensesSection />}
      {activeSection === "categories" && <CategoriesSection />}
    </div>
  );
}

// =================== Metas de Economia ===================
function GoalsSection() {
  const { goals, addGoal, updateGoal, removeGoal, addContribution } = useSavingsGoals();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingGoal = goals.find((g) => g.id === editingId) ?? null;

  function handleSubmit(data: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt">) {
    if (editingId) { updateGoal(editingId, data); toast({ title: "Meta atualizada", description: data.title }); }
    else { addGoal(data); toast({ title: "Meta criada", description: data.title }); }
    setEditingId(null);
  }
  function handleDelete(id: string) { const g = goals.find((x) => x.id === id); removeGoal(id); toast({ title: "Meta excluída", description: g?.title, variant: "destructive" }); setEditorOpen(false); setEditingId(null); }
  function handleAddContribution(goalId: string, amount: number) { addContribution(goalId, amount); toast({ title: `+ ${formatBRL(amount)} adicionados!` }); }
  function handleAddCustomContribution(goalId: string) { const v = prompt("Quanto adicionar? (R$)"); if (!v) return; const n = parseFloat(v.replace(",", ".")); if (!n || n <= 0) return; handleAddContribution(goalId, n); }

  const stats = useMemo(() => {
    const total = goals.length; const totalTarget = goals.reduce((a, g) => a + g.targetValue, 0); const totalSaved = goals.reduce((a, g) => a + g.savedValue, 0);
    const completed = goals.filter((g) => g.targetValue > 0 && g.savedValue >= g.targetValue).length;
    return { total, totalTarget, totalSaved, completed };
  }, [goals]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-lg p-2 text-center"><div className="text-base font-bold text-foreground">{stats.total}</div><div className="text-[9px] text-muted-foreground uppercase">Metas</div></div>
        <div className="bg-card border border-border rounded-lg p-2 text-center"><div className="text-base font-bold text-emerald-600">{formatBRL(stats.totalSaved)}</div><div className="text-[9px] text-muted-foreground uppercase">Guardado</div></div>
        <div className="bg-card border border-border rounded-lg p-2 text-center"><div className="text-base font-bold text-amber-600">{formatBRL(Math.max(0, stats.totalTarget - stats.totalSaved))}</div><div className="text-[9px] text-muted-foreground uppercase">Falta</div></div>
        <div className="bg-card border border-border rounded-lg p-2 text-center"><div className="text-base font-bold text-emerald-500">{stats.completed}</div><div className="text-[9px] text-muted-foreground uppercase">Concluídas</div></div>
      </div>
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold">🎯 Metas de Economia</h3><Button size="sm" onClick={() => { setEditingId(null); setEditorOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Nova meta</Button></div>
      {goals.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card"><div className="text-4xl mb-2 opacity-40">🎯</div><p className="text-sm text-muted-foreground">Nenhuma meta ainda.</p><Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditorOpen(true); }} className="mt-2 text-emerald-500">+ Criar primeira meta</Button></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((goal) => {
            const remaining = Math.max(0, goal.targetValue - goal.savedValue); const progress = goal.targetValue > 0 ? Math.min(100, (goal.savedValue / goal.targetValue) * 100) : 0; const isComplete = goal.targetValue > 0 && goal.savedValue >= goal.targetValue;
            const daysLeft = goal.deadline ? daysUntil(goal.deadline) : 0; const monthsLeft = goal.deadline ? monthsUntil(goal.deadline) : 0; const remainingMonths = Math.max(1, monthsLeft);
            const neededPerMonth = goal.type === "deadline" && remaining > 0 ? remaining / remainingMonths : 0;
            return (
              <div key={goal.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2"><div className="h-10 w-10 rounded-md flex items-center justify-center text-lg shrink-0" style={{ background: `linear-gradient(135deg, ${goal.color} 0%, #0a0a0a 100%)` }}>{goal.emoji || "🎯"}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold truncate">{goal.title}</h4><p className="text-[10px] text-muted-foreground">{goal.type === "deadline" && goal.deadline && `📅 até ${formatShortBR(goal.deadline)}`}{goal.type === "monthly" && goal.monthlyTarget && `🔁 ${formatBRL(goal.monthlyTarget)}/mês`}{goal.type === "open" && "♾️ Sem prazo"}</p></div>{isComplete && <span className="text-emerald-500 text-lg">✅</span>}</div>
                <div className="space-y-1"><div className="flex items-center justify-between text-[10px]"><span className="text-emerald-600 font-bold">{formatBRL(goal.savedValue)}</span><span className="text-muted-foreground">/ {formatBRL(goal.targetValue)}</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full transition-all", isComplete ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${progress}%` }} /></div><div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">{progress.toFixed(0)}%</span>{remaining > 0 && <span className="text-amber-600 font-bold">Faltam {formatBRL(remaining)}</span>}</div></div>
                {goal.type === "deadline" && goal.deadline && remaining > 0 && (<div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 space-y-0.5"><p>📊 Cálculo automático:</p>{daysLeft > 0 ? (<><p>• Faltam <strong>{daysLeft} dias</strong> ({monthsLeft} meses)</p><p>• Guarde <strong className="text-emerald-600">{formatBRL(neededPerMonth)}/mês</strong></p></>) : <p className="text-amber-600">⚠️ Prazo vencido!</p>}</div>)}
                {goal.type === "monthly" && goal.monthlyTarget && (<div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2"><p>📊 Meta mensal: <strong className="text-emerald-600">{formatBRL(goal.monthlyTarget)}</strong></p></div>)}
                {remaining > 0 && (<div className="flex gap-1 flex-wrap">{[50, 100, 500].map((v) => (<button key={v} onClick={() => handleAddContribution(goal.id, v)} className="flex-1 h-7 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 text-[10px] font-bold transition-colors">+ {formatBRL(v)}</button>))}<button onClick={() => handleAddCustomContribution(goal.id)} className="flex-1 h-7 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 text-[10px] font-bold transition-colors">+ Outro</button></div>)}
                <div className="flex gap-2 pt-1"><button onClick={() => { setEditingId(goal.id); setEditorOpen(true); }} className="flex-1 h-7 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-medium transition-colors">✏️ Editar</button><button onClick={() => { if (confirm(`Excluir meta "${goal.title}"?`)) handleDelete(goal.id); }} className="h-7 px-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[10px] font-medium transition-colors">🗑️</button></div>
              </div>
            );
          })}
        </div>
      )}
      {editorOpen && <GoalEditor goal={editingGoal} onClose={() => { setEditorOpen(false); setEditingId(null); }} onSubmit={handleSubmit} onDelete={editingId ? () => handleDelete(editingId) : undefined} />}
    </div>
  );
}

// =================== Editor de Meta ===================
function GoalEditor({ goal, onClose, onSubmit, onDelete }: { goal?: SavingsGoal | null; onClose: () => void; onSubmit: (data: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt">) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(goal?.title ?? ""); const [emoji, setEmoji] = useState(goal?.emoji ?? "🎯"); const [color, setColor] = useState(goal?.color ?? "#16a34a");
  const [targetValue, setTargetValue] = useState(goal?.targetValue?.toString() ?? ""); const [savedValue, setSavedValue] = useState(goal?.savedValue?.toString() ?? "");
  const [type, setType] = useState<SavingsGoal["type"]>(goal?.type ?? "open"); const [deadline, setDeadline] = useState(goal?.deadline ?? ""); const [monthlyTarget, setMonthlyTarget] = useState(goal?.monthlyTarget?.toString() ?? "");
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return; onSubmit({ title: title.trim(), emoji: emoji.trim() || undefined, color, targetValue: targetValue ? parseFloat(targetValue.replace(",", ".")) : 0, savedValue: savedValue ? parseFloat(savedValue.replace(",", ".")) : 0, type, deadline: type === "deadline" ? deadline : undefined, monthlyTarget: type === "monthly" && monthlyTarget ? parseFloat(monthlyTarget.replace(",", ".")) : undefined }); onClose(); }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="bg-card border-border text-foreground max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{goal ? "Editar meta" : "Nova meta de economia"}</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Título *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Viagem, Reserva, Carro..." autoFocus required className="h-9 bg-muted/30 border-border" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Emoji</label><Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="h-9 bg-muted/30 border-border" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Cor</label><div className="flex items-center gap-2 h-9"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" /><span className="text-xs font-mono text-muted-foreground">{color}</span></div></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Valor da meta (R$) *</label><Input type="number" step="0.01" min="0" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="5000" required className="h-9 bg-muted/30 border-border tabular-nums" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Já guardei (R$)</label><Input type="number" step="0.01" min="0" value={savedValue} onChange={(e) => setSavedValue(e.target.value)} placeholder="0" className="h-9 bg-muted/30 border-border tabular-nums" /></div></div>
        <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Tipo de meta</label><div className="grid grid-cols-3 gap-1.5">{([["deadline","📅 Com prazo"],["monthly","🔁 Mensal"],["open","♾️ Sem prazo"]] as const).map((opt) => (<button key={opt[0]} type="button" onClick={() => setType(opt[0])} className={cn("h-9 rounded-md text-[10px] font-bold border transition-all", type === opt[0] ? "bg-emerald-600 text-white border-emerald-600 scale-105" : "bg-background text-muted-foreground border-border hover:bg-accent")}>{opt[1]}</button>))}</div></div>
        {type === "deadline" && (<div><label className="text-[10px] uppercase text-muted-foreground font-bold">Prazo final</label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-9 text-sm bg-muted/30 border-border" /></div>)}
        {type === "monthly" && (<div><label className="text-[10px] uppercase text-muted-foreground font-bold">Quanto guardar por mês (R$)</label><Input type="number" step="0.01" min="0" value={monthlyTarget} onChange={(e) => setMonthlyTarget(e.target.value)} placeholder="500" className="h-9 text-sm bg-muted/30 border-border tabular-nums" /></div>)}
        <DialogFooter className="gap-2">{onDelete && <Button type="button" variant="ghost" onClick={() => { if (confirm("Excluir esta meta?")) onDelete(); }} className="text-destructive hover:text-destructive">Excluir</Button>}<Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!title.trim() || !targetValue} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0">{goal ? "Salvar" : "Criar meta"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  );
}

// =================== Saídas Fixas ===================
function FixedExpensesSection() {
  const { fixedExpenses, addFixed, updateFixed, removeFixed, togglePaid } = useFixedExpenses();
  const { addTransaction } = useFinance();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingFixed = fixedExpenses.find((f) => f.id === editingId) ?? null;
  const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();

  function handleSubmit(data: Omit<FixedExpense, "id" | "createdAt" | "updatedAt">) { if (editingId) { updateFixed(editingId, data); toast({ title: "Saída fixa atualizada", description: data.description }); } else { addFixed(data); toast({ title: "Saída fixa adicionada", description: data.description }); } setEditingId(null); }
  function handleDelete(id: string) { const f = fixedExpenses.find((x) => x.id === id); removeFixed(id); toast({ title: "Saída fixa excluída", description: f?.description, variant: "destructive" }); setEditorOpen(false); setEditingId(null); }

  function handleTogglePaid(id: string) {
    const fx = fixedExpenses.find((x) => x.id === id);
    const isPaid = fx?.paidThisMonth?.month === currentMonth && fx?.paidThisMonth?.year === currentYear;
    togglePaid(id, currentMonth, currentYear);
    if (!isPaid && fx) {
      // Usa data LOCAL (não UTC) pra evitar erro de fuso horário
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      addTransaction({ type: "saida", description: `${fx.description} (conta fixa)`, value: fx.value, date: today, paymentMethod: "pix", status: "pago", client: "—", service: fx.category || "Conta fixa", notes: `Conta fixa — dia de vencimento ${fx.dueDay}. Pagamento registrado automaticamente.` });
      toast({ title: "✅ Marcado como pago + adicionado à tabela", description: `${fx.description} (${formatBRL(fx.value)}) foi adicionada às transações` });
    } else { toast({ title: "Desmarcado como pago", description: fx?.description }); }
  }

  const stats = useMemo(() => {
    const total = fixedExpenses.reduce((a, f) => a + f.value, 0);
    const paid = fixedExpenses.filter((f) => f.paidThisMonth?.month === currentMonth && f.paidThisMonth?.year === currentYear).reduce((a, f) => a + f.value, 0);
    const pending = total - paid; const pendingCount = fixedExpenses.filter((f) => !(f.paidThisMonth?.month === currentMonth && f.paidThisMonth?.year === currentYear)).length;
    return { total, paid, pending, pendingCount, count: fixedExpenses.length };
  }, [fixedExpenses, currentMonth, currentYear]);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-amber-500/10 to-card border border-amber-500/30 rounded-xl p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold mb-2">{MONTHS_LONG[currentMonth]} {currentYear}</p><div className="grid grid-cols-3 gap-3"><div><div className="text-xs text-muted-foreground">Total</div><div className="text-lg font-bold text-foreground">{formatBRL(stats.total)}</div></div><div><div className="text-xs text-muted-foreground">Pago</div><div className="text-lg font-bold text-emerald-600">{formatBRL(stats.paid)}</div></div><div><div className="text-xs text-muted-foreground">Pendente</div><div className="text-lg font-bold text-amber-600">{formatBRL(stats.pending)}</div></div></div>{stats.pendingCount > 0 && <p className="text-[11px] text-amber-600 mt-2 font-medium">⚠️ {stats.pendingCount} {stats.pendingCount === 1 ? "conta pendente" : "contas pendentes"} este mês</p>}</div>
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold">🔁 Saídas Fixas</h3><Button size="sm" onClick={() => { setEditingId(null); setEditorOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white border-0">+ Nova conta fixa</Button></div>
      {fixedExpenses.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card"><div className="text-4xl mb-2 opacity-40">🔁</div><p className="text-sm text-muted-foreground">Nenhuma saída fixa cadastrada.</p><p className="text-[11px] text-muted-foreground mt-1">Adicione contas recorrentes como aluguel, internet, luz...</p><Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditorOpen(true); }} className="mt-3 text-amber-500">+ Adicionar primeira conta</Button></div>
      ) : (
        <div className="space-y-2">{fixedExpenses.slice().sort((a, b) => a.dueDay - b.dueDay).map((fx) => {
          const isPaid = fx.paidThisMonth?.month === currentMonth && fx.paidThisMonth?.year === currentYear; const today = now.getDate(); const isOverdue = !isPaid && fx.dueDay < today; const isDueSoon = !isPaid && fx.dueDay >= today && fx.dueDay <= today + 3;
          return (<div key={fx.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", isPaid ? "bg-emerald-500/5 border-emerald-500/30" : isOverdue ? "bg-red-500/5 border-red-500/30" : isDueSoon ? "bg-amber-500/5 border-amber-500/30" : "bg-card border-border")}>
            <button onClick={() => handleTogglePaid(fx.id)} className={cn("h-8 w-8 rounded-md border-2 flex items-center justify-center text-sm shrink-0 transition-colors", isPaid ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background hover:border-emerald-500/50")} title={isPaid ? "Desmarcar como pago" : "Marcar como pago"}>{isPaid ? "✓" : ""}</button>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className={cn("text-sm font-bold", isPaid && "line-through text-muted-foreground")}>{fx.description}</p>{isOverdue && <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold">⚠️ VENCIDA</span>}{isDueSoon && <span className="text-[9px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-bold">⏰ VENCE EM BREVE</span>}{isPaid && <span className="text-[9px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold">✅ PAGO</span>}</div><p className="text-[11px] text-muted-foreground mt-0.5">Vence dia {fx.dueDay}{fx.category && ` · ${fx.category}`}</p></div>
            <div className="text-right shrink-0"><p className="text-sm font-bold tabular-nums text-foreground">{formatBRL(fx.value)}</p></div>
            <div className="flex gap-1 shrink-0"><button onClick={() => { setEditingId(fx.id); setEditorOpen(true); }} className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-1" title="Editar">✏️</button><button onClick={() => { if (confirm(`Excluir "${fx.description}"?`)) handleDelete(fx.id); }} className="text-muted-foreground hover:text-destructive text-xs px-1.5 py-1" title="Excluir">🗑️</button></div>
          </div>);
        })}</div>
      )}
      {editorOpen && <FixedEditor fixed={editingFixed} onClose={() => { setEditorOpen(false); setEditingId(null); }} onSubmit={handleSubmit} onDelete={editingId ? () => handleDelete(editingId) : undefined} />}
    </div>
  );
}

// =================== Editor de Saída Fixa ===================
function FixedEditor({ fixed, onClose, onSubmit, onDelete }: { fixed?: FixedExpense | null; onClose: () => void; onSubmit: (data: Omit<FixedExpense, "id" | "createdAt" | "updatedAt">) => void; onDelete?: () => void }) {
  const [description, setDescription] = useState(fixed?.description ?? ""); const [value, setValue] = useState(fixed?.value?.toString() ?? ""); const [dueDay, setDueDay] = useState(fixed?.dueDay?.toString() ?? "1"); const [category, setCategory] = useState(fixed?.category ?? "");
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!description.trim()) return; const day = parseInt(dueDay); if (!day || day < 1 || day > 31) return; onSubmit({ description: description.trim(), value: value ? parseFloat(value.replace(",", ".")) : 0, dueDay: day, category: category.trim() || undefined, paidThisMonth: fixed?.paidThisMonth ?? null, paymentHistory: fixed?.paymentHistory ?? [] }); onClose(); }
  return (<Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="bg-card border-border text-foreground max-w-md"><DialogHeader><DialogTitle>{fixed ? "Editar saída fixa" : "Nova saída fixa"}</DialogTitle></DialogHeader><form onSubmit={handleSubmit} className="space-y-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Descrição *</label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Aluguel, Internet, Luz..." autoFocus required className="h-9 bg-muted/30 border-border" /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Valor (R$) *</label><Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="1500" required className="h-9 bg-muted/30 border-border tabular-nums" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Dia do vencimento *</label><Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="10" required className="h-9 bg-muted/30 border-border tabular-nums" /></div></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria (opcional)</label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Moradia, Transporte..." className="h-9 bg-muted/30 border-border" /></div><DialogFooter className="gap-2">{onDelete && <Button type="button" variant="ghost" onClick={() => { if (confirm("Excluir esta saída fixa?")) onDelete(); }} className="text-destructive hover:text-destructive">Excluir</Button>}<Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!description.trim() || !value} className="bg-amber-600 hover:bg-amber-500 text-white border-0">{fixed ? "Salvar" : "Adicionar"}</Button></DialogFooter></form></DialogContent></Dialog>);
}

// =================== Categorias personalizáveis ===================
function CategoriesSection() {
  const { categories, addCategory, updateCategory, removeCategory, resetCategories } = useFinanceCategories();
  const { toast } = useToast();
  const [newName, setNewName] = useState(""); const [newEmoji, setNewEmoji] = useState("📌"); const [newColor, setNewColor] = useState("#3f3f46"); const [newType, setNewType] = useState<"entrada" | "saida">("saida");
  function handleAdd() { if (!newName.trim()) return; addCategory({ name: newName.trim(), emoji: newEmoji.trim() || undefined, color: newColor, defaultType: newType }); setNewName(""); setNewEmoji("📌"); setNewColor("#3f3f46"); toast({ title: "Categoria criada", description: newName }); }
  function handleDelete(id: string) { const cat = categories.find((c) => c.id === id); removeCategory(id); toast({ title: "Categoria excluída", description: cat?.name, variant: "destructive" }); }
  function handleReset() { if (!confirm("Restaurar categorias padrão? Suas categorias personalizadas serão perdidas.")) return; resetCategories(); toast({ title: "Categorias restauradas" }); }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold">🏷️ Categorias Personalizáveis</h3><p className="text-[11px] text-muted-foreground mt-0.5">Use nas suas transações para organizar entradas e saídas</p></div><Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">Restaurar padrão</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{categories.map((cat) => (<div key={cat.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border group"><span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm shrink-0" style={{ background: cat.color, color: "#fff" }}>{cat.emoji || "•"}</span><Input value={cat.name} onChange={(e) => updateCategory(cat.id, { name: e.target.value })} className="h-7 text-sm bg-transparent border-none flex-1" /><select value={cat.defaultType ?? ""} onChange={(e) => updateCategory(cat.id, { defaultType: (e.target.value || undefined) as "entrada" | "saida" | undefined })} className="h-7 text-[10px] bg-muted/30 border border-border rounded px-1"><option value="">Ambos</option><option value="entrada">Entrada</option><option value="saida">Saída</option></select><input type="color" value={cat.color} onChange={(e) => updateCategory(cat.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" /><button onClick={() => { if (confirm(`Excluir categoria "${cat.name}"?`)) handleDelete(cat.id); }} className="text-muted-foreground hover:text-destructive text-xs">🗑️</button></div>))}</div>
      <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2"><p className="text-[10px] uppercase text-muted-foreground font-bold">Nova categoria</p><div className="flex items-center gap-2 flex-wrap"><Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={4} className="h-8 w-14 text-center bg-muted/30 border-border" /><Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} placeholder="Nome da categoria..." className="h-8 flex-1 min-w-[150px] text-sm bg-muted/30 border-border" /><select value={newType} onChange={(e) => setNewType(e.target.value as "entrada" | "saida")} className="h-8 text-xs bg-muted/30 border border-border rounded px-2"><option value="saida">Saída</option><option value="entrada">Entrada</option></select><input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" /><Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8">+</Button></div></div>
    </div>
  );
}
