"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";
import {
  PAYMENT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_COLORS,
  TYPE_LABELS,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/finance";
import { TransactionEditorDialog } from "./transaction-editor-dialog";
import { FinanceExtras } from "./finance-extras";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, readableTextColor } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MONTHS_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type TypeFilter = "todos" | TransactionType;

export function FinanceiroView() {
  const { transactions, addTransaction, updateTransaction, removeTransaction, resetAll } = useFinance();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defaultType, setDefaultType] = useState<TransactionType>("entrada");

  // Filtros
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | TransactionStatus>("todos");
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState("");

  const editingTransaction = useMemo(
    () => transactions.find((t) => t.id === editingId) ?? null,
    [transactions, editingId]
  );

  // Anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach((t) => {
      if (t.date) years.add(new Date(t.date + "T00:00:00").getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Categorias únicas (campo `service`)
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.service && t.service.trim()) set.add(t.service);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Transações filtradas (aplica todos os filtros)
  const filteredTx = useMemo(() => {
    const s = search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        // Filtro por tipo
        if (typeFilter !== "todos" && t.type !== typeFilter) return false;
        // Filtro por categoria
        if (categoryFilter !== "todos" && t.service !== categoryFilter) return false;
        // Filtro por status
        if (statusFilter !== "todos" && t.status !== statusFilter) return false;
        // Filtro por mês
        if (monthFilter !== -1) {
          if (!t.date) return false;
          const d = new Date(t.date + "T00:00:00");
          if (d.getMonth() !== monthFilter || d.getFullYear() !== yearFilter) return false;
        }
        // Busca textual
        if (s) {
          const hay = `${t.description} ${t.client} ${t.service} ${t.notes}`.toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, typeFilter, categoryFilter, statusFilter, monthFilter, yearFilter, search]);

  // Somatórios das transações filtradas
  const summary = useMemo(() => {
    const entradas = filteredTx.filter((t) => t.type === "entrada").reduce((s, t) => s + t.value, 0);
    const saidas = filteredTx.filter((t) => t.type === "saida").reduce((s, t) => s + t.value, 0);
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      count: filteredTx.length,
    };
  }, [filteredTx]);

  // Resumo anual (para o card de saldo)
  const yearSummary = useMemo(() => {
    const tx = transactions.filter((t) => {
      if (!t.date) return false;
      return new Date(t.date + "T00:00:00").getFullYear() === yearFilter;
    });
    const entradas = tx.filter((t) => t.type === "entrada").reduce((s, t) => s + t.value, 0);
    const saidas = tx.filter((t) => t.type === "saida").reduce((s, t) => s + t.value, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [transactions, yearFilter]);

  // Dados para o gráfico mensal (12 meses do ano selecionado)
  const monthlyChartData = useMemo(() => {
    return MONTHS_SHORT.map((m, i) => {
      const tx = transactions.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date + "T00:00:00");
        return d.getMonth() === i && d.getFullYear() === yearFilter;
      });
      return {
        month: m,
        Entradas: tx.filter((t) => t.type === "entrada").reduce((s, t) => s + t.value, 0),
        Saídas: tx.filter((t) => t.type === "saida").reduce((s, t) => s + t.value, 0),
      };
    });
  }, [transactions, yearFilter]);

  // Dados para o gráfico de entradas por categoria
  const entriesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => {
        if (t.type !== "entrada") return false;
        if (!t.date) return false;
        const d = new Date(t.date + "T00:00:00");
        if (monthFilter === -1) return d.getFullYear() === yearFilter;
        return d.getMonth() === monthFilter && d.getFullYear() === yearFilter;
      })
      .forEach((t) => {
        const cat = t.service || "Sem categoria";
        map.set(cat, (map.get(cat) ?? 0) + t.value);
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, monthFilter, yearFilter]);

  // Dados para o gráfico de saídas por categoria
  const exitsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => {
        if (t.type !== "saida") return false;
        if (!t.date) return false;
        const d = new Date(t.date + "T00:00:00");
        if (monthFilter === -1) return d.getFullYear() === yearFilter;
        return d.getMonth() === monthFilter && d.getFullYear() === yearFilter;
      })
      .forEach((t) => {
        const cat = t.service || "Sem categoria";
        map.set(cat, (map.get(cat) ?? 0) + t.value);
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, monthFilter, yearFilter]);

  // Cores para pie chart (paleta fixa elegante)
  const PIE_COLORS = [
    "#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#8b5cf6",
    "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6",
  ];

  function openNew(type: TransactionType) {
    setDefaultType(type);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSubmit(data: Omit<Transaction, "id" | "createdAt" | "updatedAt">) {
    if (editingId) {
      updateTransaction(editingId, data);
      toast({ title: "Transação atualizada", description: data.description });
    } else {
      addTransaction(data);
      toast({
        title: `${TYPE_LABELS[data.type]} criada`,
        description: data.description,
      });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    removeTransaction(id);
    toast({ title: "Transação excluída", variant: "destructive" });
  }

  function handleReset() {
    if (confirm("Restaurar transações de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Transações restauradas" });
    }
  }

  function clearFilters() {
    setTypeFilter("todos");
    setCategoryFilter("todos");
    setStatusFilter("todos");
    setMonthFilter(new Date().getMonth());
    setYearFilter(new Date().getFullYear());
    setSearch("");
  }

  const activeFilters =
    typeFilter !== "todos" ||
    categoryFilter !== "todos" ||
    statusFilter !== "todos" ||
    search !== "";

  const periodLabel =
    monthFilter === -1
      ? `Ano ${yearFilter}`
      : `${MONTHS_LONG[monthFilter]} ${yearFilter}`;

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💰</span>
              <h2 className="text-base font-bold text-foreground">Financeiro</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.length} transações · {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => openNew("entrada")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              + Entrada
            </Button>
            <Button
              onClick={() => openNew("saida")}
              className="bg-red-600 hover:bg-red-500 text-white border-0 shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              + Saída
            </Button>
          </div>
        </div>

        {/* Resumo no topo — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Saldo do ano"
            value={formatBRL(yearSummary.saldo)}
            accent={yearSummary.saldo >= 0 ? "emerald" : "red"}
            hint={`${yearSummary.entradas - yearSummary.saidas >= 0 ? "+" : ""}${formatBRL(yearSummary.saldo)}`}
            icon="📊"
          />
          <SummaryCard
            label="Entradas (filtro)"
            value={formatBRL(summary.entradas)}
            accent="emerald"
            hint={`${filteredTx.filter((t) => t.type === "entrada").length} transações`}
            icon="↑"
          />
          <SummaryCard
            label="Saídas (filtro)"
            value={formatBRL(summary.saidas)}
            accent="red"
            hint={`${filteredTx.filter((t) => t.type === "saida").length} transações`}
            icon="↓"
          />
          <SummaryCard
            label="Saldo (filtro)"
            value={formatBRL(summary.saldo)}
            accent={summary.saldo >= 0 ? "emerald" : "red"}
            hint={periodLabel}
            icon="="
          />
        </div>

        {/* Seções extras: Metas de economia, Saídas fixas, Categorias — logo após o resumo */}
        <FinanceExtras />

        {/* Gráfico mensal — Entradas vs Saídas (12 meses) */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Entradas vs Saídas por mês</h3>
              <p className="text-[11px] text-muted-foreground">Ano {yearFilter}</p>
            </div>
            <div className="flex gap-1.5">
              {availableYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearFilter(y)}
                  className={cn(
                    "h-7 px-2.5 rounded-md text-xs font-semibold transition-colors",
                    yearFilter === y
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => formatBRL(v)}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Dois pie charts lado a lado — Entradas por categoria + Saídas por categoria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryPieChart
            title="Entradas por categoria"
            data={entriesByCategory}
            colors={PIE_COLORS}
            emptyMessage="Nenhuma entrada no período"
            totalLabel="Total de entradas"
            totalValue={entriesByCategory.reduce((s, x) => s + x.value, 0)}
          />
          <CategoryPieChart
            title="Saídas por categoria"
            data={exitsByCategory}
            colors={PIE_COLORS}
            emptyMessage="Nenhuma saída no período"
            totalLabel="Total de saídas"
            totalValue={exitsByCategory.reduce((s, x) => s + x.value, 0)}
          />
        </div>

        {/* Filtros avançados */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">Filtros</h3>
            <div className="flex items-center gap-2">
              {/* Seletor de mês */}
              <div className="flex flex-wrap gap-0.5">
                {MONTHS_SHORT.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setMonthFilter(i)}
                    className={cn(
                      "h-6 px-2 rounded text-[10px] font-semibold transition-colors",
                      monthFilter === i
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {m}
                  </button>
                ))}
                <button
                  onClick={() => setMonthFilter(-1)}
                  className={cn(
                    "h-6 px-2.5 rounded text-[10px] font-bold transition-colors",
                    monthFilter === -1
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  ANO
                </button>
              </div>
              {activeFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                >
                  ↺ Limpar
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por tipo */}
            <FilterGroup label="Tipo:">
              <FilterChip
                active={typeFilter === "todos"}
                onClick={() => setTypeFilter("todos")}
                label="Todos"
              />
              <FilterChip
                active={typeFilter === "entrada"}
                onClick={() => setTypeFilter("entrada")}
                label="Entrada"
                color={TYPE_COLORS.entrada}
              />
              <FilterChip
                active={typeFilter === "saida"}
                onClick={() => setTypeFilter("saida")}
                label="Saída"
                color={TYPE_COLORS.saida}
              />
            </FilterGroup>

            {/* Filtro por status */}
            <FilterGroup label="Status:">
              <FilterChip
                active={statusFilter === "todos"}
                onClick={() => setStatusFilter("todos")}
                label="Todos"
              />
              {(["pago", "pendente", "atrasado"] as TransactionStatus[]).map((s) => (
                <FilterChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                  label={STATUS_LABELS[s]}
                  color={STATUS_COLORS[s]}
                />
              ))}
            </FilterGroup>

            {/* Filtro por categoria */}
            {categories.length > 0 && (
              <FilterGroup label="Categoria:">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-7 px-2 rounded-md border border-border bg-card text-xs text-foreground"
                >
                  <option value="todos">Todas</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </FilterGroup>
            )}

            {/* Busca */}
            <div className="relative max-w-xs w-full ml-auto">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar descrição, cliente..."
                className="h-7 pl-9 text-xs"
              />
            </div>
          </div>
        </section>

        {/* Tabela de transações filtradas */}
        <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Transações</h3>
              <p className="text-[11px] text-muted-foreground">
                {filteredTx.length} de {transactions.length} · Saldo:{" "}
                <span className={cn("font-semibold", summary.saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {formatBRL(summary.saldo)}
                </span>
              </p>
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 opacity-40">💰</div>
              <p className="text-muted-foreground text-sm">
                Nenhuma transação encontrada com esses filtros.
              </p>
              {activeFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                  className="mt-3 text-muted-foreground"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/50 sticky top-0 z-10">
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Tipo</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Descrição</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Categoria</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Cliente</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold text-right">Valor</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Data</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Pagamento</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold">Status</TableHead>
                    <TableHead className="text-foreground/70 dark:text-muted-foreground text-[10px] uppercase font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.map((t) => (
                    <TxRow
                      key={t.id}
                      tx={t}
                      onEdit={() => openEdit(t.id)}
                      onDelete={() => handleDelete(t.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            {transactions.length} transações no total · {periodLabel}
          </p>
          <button
            onClick={handleReset}
            className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
          >
            ↺ Restaurar demo
          </button>
        </div>
      </div>

      <TransactionEditorDialog
        key={`fin-${dialogOpen}-${editingId ?? "new"}-${defaultType}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        editingTransaction={editingTransaction}
        defaultType={defaultType}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      {/* Espaço no final da página */}
      <div className="h-20" />
    </div>
  );
}

// ============ Sub-componentes ============

function SummaryCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "emerald" | "red" | "blue" | "violet" | "amber";
  icon?: string;
}) {
  const accentMap = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </p>
        {icon && (
          <span className={cn("text-base font-bold", accentMap[accent])}>{icon}</span>
        )}
      </div>
      <p className={cn("text-lg font-bold", accentMap[accent])}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-1">{hint}</p>
      )}
    </div>
  );
}

function CategoryPieChart({
  title,
  data,
  colors,
  emptyMessage,
  totalLabel,
  totalValue,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  emptyMessage: string;
  totalLabel: string;
  totalValue: number;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{totalLabel}</p>
          <p className="text-sm font-bold text-foreground">{formatBRL(totalValue)}</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-center text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                }}
                formatter={(v: number) => formatBRL(v)}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                layout="vertical"
                align="right"
                verticalAlign="middle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
        {label}
      </span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold border transition-all",
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent"
      )}
      style={
        active && color
          ? { background: color, borderColor: color }
          : active
            ? { background: "var(--foreground)", borderColor: "var(--foreground)" }
            : undefined
      }
    >
      {color && !active && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  );
}

function TxRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeColor = TYPE_COLORS[tx.type];
  const statusColor = STATUS_COLORS[tx.status];
  const statusText = readableTextColor(statusColor);

  return (
    <TableRow className="border-border hover:bg-muted/40">
      <TableCell>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
          style={{
            background: typeColor,
            color: "#ffffff",
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "#ffffff" }}
          />
          {tx.type === "entrada" ? "Entrada" : "Saída"}
        </span>
      </TableCell>
      <TableCell className="text-sm">
        <div className="font-medium text-foreground line-clamp-1 max-w-[260px]">
          {tx.description}
        </div>
        {tx.notes && (
          <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[260px]">
            {tx.notes}
          </span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {tx.service || "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {tx.client && tx.client !== "—" ? tx.client : "—"}
      </TableCell>
      <TableCell
        className="text-right text-sm font-bold whitespace-nowrap"
        style={{ color: typeColor }}
      >
        {tx.type === "entrada" ? "+" : "−"} {formatBRL(tx.value)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(tx.date)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
      </TableCell>
      <TableCell>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
          style={{
            background: statusColor,
            color: statusText,
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: statusText }}
          />
          {STATUS_LABELS[tx.status]}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
            aria-label="Editar"
            title="Editar transação"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
            aria-label="Excluir"
            title="Excluir transação"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function formatBRL(v: number): string {
  if (!v) return "R$ 0";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
