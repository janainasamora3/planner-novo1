"use client";

import { useMemo, useState } from "react";
import { useFuture, type FutureItemInput } from "@/hooks/use-future";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORY_COLORS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  type FutureCategory,
  type FutureItem,
  type FuturePriority,
} from "@/lib/future";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CategoryFilter = "todos" | FutureCategory;

const CATEGORY_FILTERS: { id: CategoryFilter; label: string; emoji?: string; color?: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "curto", label: "Curto prazo", emoji: CATEGORY_EMOJIS.curto, color: CATEGORY_COLORS.curto },
  { id: "medio", label: "Médio prazo", emoji: CATEGORY_EMOJIS.medio, color: CATEGORY_COLORS.medio },
  { id: "longo", label: "Longo prazo", emoji: CATEGORY_EMOJIS.longo, color: CATEGORY_COLORS.longo },
];

export function FuturoView() {
  const {
    items,
    addItem,
    updateItem,
    toggleDone,
    removeItem,
    addStep,
    toggleStep,
    removeStep,
    moveItem,
    resetAll,
  } = useFuture();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todos");
  const [search, setSearch] = useState("");
  const [hideDone, setHideDone] = useState(false);

  const editingItem = useMemo(
    () => items.find((i) => i.id === editingId) ?? null,
    [items, editingId]
  );

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  const filteredItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    return sortedItems.filter((i) => {
      if (categoryFilter !== "todos" && i.category !== categoryFilter) return false;
      if (hideDone && i.done) return false;
      if (s) {
        const hay = `${i.title} ${i.description ?? ""} ${i.owner ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [sortedItems, categoryFilter, hideDone, search]);

  // Agrupa por categoria
  const groupedItems = useMemo(() => {
    const groups: Record<FutureCategory, FutureItem[]> = {
      curto: [],
      medio: [],
      longo: [],
    };
    filteredItems.forEach((i) => {
      const cat = i.category ?? "medio";
      groups[cat].push(i);
    });
    return groups;
  }, [filteredItems]);

  // Progresso geral
  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  // Progresso por categoria
  const progressByCategory = useMemo(() => {
    const out: Record<FutureCategory, { total: number; done: number; pct: number }> = {
      curto: { total: 0, done: 0, pct: 0 },
      medio: { total: 0, done: 0, pct: 0 },
      longo: { total: 0, done: 0, pct: 0 },
    };
    items.forEach((i) => {
      const cat = i.category ?? "medio";
      out[cat].total++;
      if (i.done) out[cat].done++;
    });
    (Object.keys(out) as FutureCategory[]).forEach((c) => {
      out[c].pct = out[c].total > 0 ? (out[c].done / out[c].total) * 100 : 0;
    });
    return out;
  }, [items]);

  function openNew() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSubmit(data: FutureItemInput) {
    if (editingId) {
      // Converte steps do input (sem id/done) para o formato completo
      const patch: Partial<FutureItem> = {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        deadline: data.deadline,
        owner: data.owner,
      };
      if (data.steps) {
        const existing = editingItem?.steps ?? [];
        patch.steps = data.steps.map((s, idx) => ({
          id: existing[idx]?.id ?? `step_${Date.now().toString(36)}_${idx}`,
          text: s.text,
          done: existing[idx]?.done ?? false,
        }));
      }
      updateItem(editingId, patch);
      toast({ title: "Item atualizado", description: data.title });
    } else {
      addItem(data);
      toast({ title: "Item criado", description: data.title });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const item = items.find((i) => i.id === id);
    removeItem(id);
    toast({
      title: "Item excluído",
      description: item?.title,
      variant: "destructive",
    });
  }

  function handleReset() {
    if (confirm("Restaurar itens de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Itens restaurados" });
    }
  }

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🚀</span>
              <h2 className="text-lg font-bold text-foreground">Futuro</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {doneCount}/{items.length} concluídos · Planos e objetivos futuros da agência
            </p>
          </div>
          <Button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Adicionar
          </Button>
        </div>

        {/* Progresso geral */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
              Progresso geral
            </span>
            <span className="text-sm font-bold text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Progresso por categoria */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(progressByCategory) as FutureCategory[]).map((cat) => {
              const p = progressByCategory[cat];
              const color = CATEGORY_COLORS[cat];
              return (
                <div
                  key={cat}
                  className="rounded-lg border border-border p-2"
                  style={{ background: `${color}08` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color }}>
                      <span>{CATEGORY_EMOJIS[cat]}</span>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {p.done}/{p.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p.pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((f) => {
              const isActive = categoryFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border transition-all",
                    isActive
                      ? "text-white border-transparent shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                  )}
                  style={
                    isActive && f.color
                      ? { background: f.color, borderColor: f.color }
                      : isActive
                        ? { background: "var(--foreground)", borderColor: "var(--foreground)" }
                        : undefined
                  }
                >
                  {f.emoji && <span>{f.emoji}</span>}
                  {f.label}
                  {f.id !== "todos" && (
                    <span
                      className={cn(
                        "text-[10px] px-1 rounded font-bold",
                        isActive ? "bg-black/15" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {progressByCategory[f.id as FutureCategory].total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              Ocultar concluídos
            </label>
            <div className="relative max-w-xs w-full">
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
                placeholder="Buscar..."
                className="h-8 pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Lista agrupada por categoria */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <div className="text-5xl mb-3 opacity-40">🚀</div>
            <p className="text-base font-medium text-foreground mb-1">
              {items.length === 0 ? "Nenhum item ainda" : "Nenhum item encontrado"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {items.length === 0
                ? "Adicione o primeiro objetivo da agência."
                : "Tente outros filtros ou limpe a busca."}
            </p>
            {items.length === 0 ? (
              <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                + Adicionar item
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setCategoryFilter("todos"); setSearch(""); setHideDone(false); }}
                className="text-muted-foreground"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(groupedItems) as FutureCategory[]).map((cat) => {
              const group = groupedItems[cat];
              if (group.length === 0) return null;
              const color = CATEGORY_COLORS[cat];
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center justify-center h-6 w-6 rounded text-xs"
                      style={{ background: `${color}20`, color }}
                    >
                      {CATEGORY_EMOJIS[cat]}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${color}15`, color }}
                    >
                      {group.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.map((item, idx) => {
                      const globalIdx = sortedItems.findIndex((i) => i.id === item.id);
                      return (
                        <FutureCard
                          key={item.id}
                          item={item}
                          index={globalIdx}
                          onToggleDone={() => toggleDone(item.id)}
                          onEdit={() => openEdit(item.id)}
                          onDelete={() => handleDelete(item.id)}
                          onMoveUp={globalIdx > 0 ? () => moveItem(item.id, "up") : undefined}
                          onMoveDown={globalIdx < sortedItems.length - 1 ? () => moveItem(item.id, "down") : undefined}
                          onAddStep={(text) => addStep(item.id, text)}
                          onToggleStep={(stepId) => toggleStep(item.id, stepId)}
                          onRemoveStep={(stepId) => removeStep(item.id, stepId)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Dica: clique num item para expandir o plano de ação
          </p>
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
          >
            ↺ Restaurar demo
          </button>
        </div>
      </div>

      <FutureItemDialog
        key={`fut-${dialogOpen}-${editingId ?? "new"}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        editingItem={editingItem}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// ============ Card de item futuro ============

function FutureCard({
  item,
  index,
  onToggleDone,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddStep,
  onToggleStep,
  onRemoveStep,
}: {
  item: FutureItem;
  index: number;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddStep: (text: string) => void;
  onToggleStep: (stepId: string) => void;
  onRemoveStep: (stepId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newStep, setNewStep] = useState("");

  const cat = item.category ?? "medio";
  const catColor = CATEGORY_COLORS[cat];
  const prio = item.priority ?? "media";
  const prioColor = PRIORITY_COLORS[prio];
  const steps = item.steps ?? [];
  const stepsDone = steps.filter((s) => s.done).length;
  const stepsProgress = steps.length > 0 ? (stepsDone / steps.length) * 100 : 0;

  function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    const t = newStep.trim();
    if (!t) return;
    onAddStep(t);
    setNewStep("");
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all overflow-hidden shadow-sm",
        item.done
          ? "border-border/60 opacity-75"
          : "border-border hover:border-primary/30"
      )}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-3 p-3">
        {/* Número */}
        <span
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0",
            item.done
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {item.done ? "✓" : index + 1}
        </span>

        {/* Checkbox */}
        <Checkbox
          checked={item.done}
          onCheckedChange={onToggleDone}
          className="shrink-0"
          aria-label={`Marcar "${item.title}" como concluído`}
        />

        {/* Título + descrição (clicável para expandir) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left min-w-0"
        >
          <span
            className={cn(
              "text-sm font-semibold block truncate",
              item.done
                ? "text-muted-foreground line-through"
                : "text-foreground"
            )}
          >
            {item.title}
          </span>
          {item.description && (
            <span className="text-xs text-muted-foreground block truncate mt-0.5">
              {item.description}
            </span>
          )}
        </button>

        {/* Badge prioridade */}
        <span
          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: `${prioColor}15`, color: prioColor }}
          title={`Prioridade ${PRIORITY_LABELS[prio]}`}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: prioColor }}
          />
          {PRIORITY_LABELS[prio]}
        </span>

        {/* Prazo */}
        {item.deadline && (
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {formatBR(item.deadline)}
          </span>
        )}

        {/* Responsável */}
        {item.owner && item.owner !== "—" && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {item.owner}
          </span>
        )}

        {/* Mini progresso de steps */}
        {steps.length > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium shrink-0">
            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${stepsProgress}%` }}
              />
            </div>
            {stepsDone}/{steps.length}
          </span>
        )}

        {/* Botão expandir */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors shrink-0"
          aria-label={expanded ? "Recolher" : "Expandir"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className={cn("transition-transform", expanded && "rotate-180")}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Conteúdo expandido — plano de ação */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3 bg-muted/20">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <span
                className="inline-flex items-center justify-center h-5 w-5 rounded text-[10px]"
                style={{ background: `${catColor}20`, color: catColor }}
              >
                {CATEGORY_EMOJIS[cat]}
              </span>
              <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
              <span className="text-muted-foreground">· {CATEGORY_DESCRIPTIONS[cat]}</span>
            </span>
            <span className="inline-flex items-center gap-1.5" style={{ color: prioColor }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: prioColor }}
              />
              <span className="font-semibold">Prioridade {PRIORITY_LABELS[prio]}</span>
            </span>
            {item.owner && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item.owner}
              </span>
            )}
            {item.deadline && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Prazo: {formatBR(item.deadline)}
              </span>
            )}
            {item.completedAt && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Concluído em {new Date(item.completedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          {/* Descrição completa */}
          {item.description && (
            <div className="text-sm text-foreground/80 leading-relaxed p-3 rounded-lg bg-background border border-border">
              {item.description}
            </div>
          )}

          {/* Plano de ação — steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                Plano de ação
              </h4>
              {steps.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {stepsDone} de {steps.length} etapas concluídas · {Math.round(stepsProgress)}%
                </span>
              )}
            </div>

            {/* Barra de progresso das etapas */}
            {steps.length > 0 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${stepsProgress}%` }}
                />
              </div>
            )}

            {/* Lista de steps */}
            <div className="space-y-1">
              {steps.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  Nenhuma etapa ainda. Adicione abaixo para criar um plano de ação.
                </p>
              ) : (
                steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors group"
                  >
                    <Checkbox
                      checked={step.done}
                      onCheckedChange={() => onToggleStep(step.id)}
                      className="shrink-0"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        step.done
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {step.text}
                    </span>
                    <button
                      onClick={() => onRemoveStep(step.id)}
                      className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      aria-label="Remover etapa"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Adicionar step */}
            <form onSubmit={handleAddStep} className="mt-2 flex gap-1.5">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Nova etapa do plano de ação..."
                className="h-8 text-sm flex-1"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500 text-white border-0"
                aria-label="Adicionar etapa"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </Button>
            </form>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              {onMoveUp && (
                <button
                  onClick={onMoveUp}
                  className="h-7 px-2 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 transition-colors"
                  title="Mover para cima"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Subir
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={onMoveDown}
                  className="h-7 px-2 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 transition-colors"
                  title="Mover para baixo"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Descer
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="h-7 px-2.5 rounded text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center gap-1 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Editar
              </button>
              <button
                onClick={onDelete}
                className="h-7 px-2.5 rounded text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-1 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Dialog de criar/editar ============

function FutureItemDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: FutureItem | null;
  onSubmit: (data: FutureItemInput) => void;
}) {
  const isEditing = !!editingItem;
  const [title, setTitle] = useState(editingItem?.title ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [category, setCategory] = useState<FutureCategory>(editingItem?.category ?? "medio");
  const [priority, setPriority] = useState<FuturePriority>(editingItem?.priority ?? "media");
  const [deadline, setDeadline] = useState(editingItem?.deadline ?? "");
  const [owner, setOwner] = useState(editingItem?.owner ?? "");
  const [steps, setSteps] = useState(
    editingItem?.steps?.map((s) => s.text).join("\n") ?? ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const stepLines = steps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      deadline,
      owner: owner.trim(),
      steps: stepLines,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar item" : "Novo item do futuro"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Título *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fazer curso avançado de tráfego pago"
              autoFocus
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Descrição
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do objetivo..."
              rows={3}
            />
          </div>

          {/* Grid: categoria + prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Horizonte
              </Label>
              <div className="flex flex-col gap-1">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={cn(
                      "flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-all",
                      category === opt.value
                        ? "border-transparent text-white shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    style={
                      category === opt.value
                        ? { background: CATEGORY_COLORS[opt.value] }
                        : undefined
                    }
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Prioridade
              </Label>
              <div className="flex flex-col gap-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      "flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-all",
                      priority === opt.value
                        ? "border-transparent text-white shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    style={
                      priority === opt.value
                        ? { background: PRIORITY_COLORS[opt.value] }
                        : undefined
                    }
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{
                        background: priority === opt.value ? "#ffffff" : PRIORITY_COLORS[opt.value],
                      }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid: prazo + responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Prazo alvo
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Responsável
              </Label>
              <Input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Quem vai tocar"
              />
            </div>
          </div>

          {/* Plano de ação inicial */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Plano de ação (uma etapa por linha)
            </Label>
            <Textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={"Pesquisar cursos\nRealizar matrícula\nConcluir módulos"}
              rows={4}
            />
            <p className="text-[11px] text-muted-foreground">
              💡 Cada linha vira uma etapa do checklist de execução.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
