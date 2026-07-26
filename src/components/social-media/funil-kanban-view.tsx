"use client";

import { useMemo, useState } from "react";
import { useProspects } from "@/hooks/use-prospects";
import { useToast } from "@/hooks/use-toast";
import {
  STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  type FunnelStage,
  type Prospect,
} from "@/lib/prospects";
import { ProspectEditorDialog } from "./prospect-editor-dialog";

export function FunilKanbanView() {
  const {
    prospects,
    addProspect,
    updateProspect,
    removeProspect,
    moveProspect,
    resetAll,
  } = useProspects();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defaultStage, setDefaultStage] = useState<FunnelStage>("novo");

  const editingProspect = useMemo(
    () => prospects.find((p) => p.id === editingId) ?? null,
    [prospects, editingId]
  );

  function openNew(stage: FunnelStage = "novo") {
    setDefaultStage(stage);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSubmit(data: {
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
  }) {
    if (editingId) {
      updateProspect(editingId, data);
      toast({ title: "Prospect atualizado", description: data.name });
    } else {
      addProspect(data);
      toast({ title: "Prospect criado", description: data.name });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const p = prospects.find((x) => x.id === id);
    removeProspect(id);
    toast({
      title: "Prospect excluído",
      description: p?.name,
      variant: "destructive",
    });
  }

  function handleReset() {
    if (confirm("Restaurar prospects de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Prospects restaurados" });
    }
  }

  const byStage = useMemo(() => {
    const map: Record<FunnelStage, Prospect[]> = {
      novo: [],
      contato: [],
      reuniao: [],
      proposta: [],
      fechado: [],
    };
    for (const p of prospects) {
      map[p.stage].push(p);
    }
    return map;
  }, [prospects]);

  const totalValue = useMemo(
    () => prospects.reduce((sum, p) => sum + (p.value ?? 0), 0),
    [prospects]
  );
  const wonValue = useMemo(
    () => prospects.filter((p) => p.stage === "fechado").reduce((sum, p) => sum + (p.value ?? 0), 0),
    [prospects]
  );

  function formatBRL(v?: number): string {
    if (v === undefined || v === null) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  function formatDate(d?: string): string {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Header do Funil */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📊</span>
            <h2 className="text-base font-semibold text-foreground">Funil de vendas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Arraste os cards entre as colunas para mudar de etapa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pipeline</p>
              <p className="text-sm font-semibold text-foreground">{formatBRL(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fechado</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatBRL(wonValue)}</p>
            </div>
          </div>
          <button
            onClick={() => openNew("novo")}
            className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Novo prospect
          </button>
        </div>
      </div>

      {/* Kanban — 5 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAGES.map((stage) => {
          const items = byStage[stage.id];
          const stageValue = items.reduce((sum, p) => sum + (p.value ?? 0), 0);
          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-xl bg-card border border-border min-h-[200px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) {
                  moveProspect(id, stage.id);
                  toast({
                    title: "Prospect movido",
                    description: `→ ${stage.label}`,
                  });
                }
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b"
                style={{
                  background: `${stage.color}25`,
                  borderColor: `${stage.color}40`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: stage.color }}
                  />
                  <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{items.length}</span>
                </div>
                {stageValue > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">{formatBRL(stageValue)}</span>
                )}
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
                {items.length === 0 ? (
                  <button
                    onClick={() => openNew(stage.id)}
                    className="w-full py-6 rounded-lg border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary text-xs font-medium transition-colors"
                  >
                    + Adicionar
                  </button>
                ) : (
                  <>
                    {items.map((p) => (
                      <ProspectCard
                        key={p.id}
                        prospect={p}
                        onClick={() => openEdit(p.id)}
                      />
                    ))}
                    <button
                      onClick={() => openNew(stage.id)}
                      className="w-full py-2 rounded-lg border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary text-xs font-medium transition-colors"
                    >
                      + Adicionar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <p className="text-[11px] text-muted-foreground">
          {prospects.length} prospects · Arraste os cards entre as colunas para mudar de etapa
        </p>
        <button
          onClick={handleReset}
          className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
        >
          Restaurar demo
        </button>
      </div>

      <ProspectEditorDialog
        key={`pros-${dialogOpen}-${editingId ?? "new"}-${defaultStage}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        editingProspect={editingProspect}
        defaultStage={defaultStage}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function ProspectCard({
  prospect,
  onClick,
}: {
  prospect: Prospect;
  onClick: () => void;
}) {
  function formatBRL(v?: number): string {
    if (v === undefined || v === null) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  function formatDate(d?: string): string {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", prospect.id);
      }}
      onClick={onClick}
      className="group cursor-pointer rounded-lg bg-card border border-border p-2.5 hover:border-foreground/25 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-2">
        <div
          className="h-8 w-8 rounded-md flex items-center justify-center text-base shrink-0 ring-1 ring-black/5 dark:ring-white/10"
          style={{
            background: `linear-gradient(135deg, ${prospect.color} 0%, ${prospect.color}dd 100%)`,
            color: "#ffffff",
          }}
        >
          {prospect.emoji || prospect.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground line-clamp-1">{prospect.name}</p>
          {prospect.handle && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">{prospect.handle}</p>
          )}
        </div>
      </div>

      {prospect.value !== undefined && (
        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
          {formatBRL(prospect.value)}
        </p>
      )}

      {(prospect.email || prospect.phone) && (
        <div className="mt-2 space-y-0.5">
          {prospect.email && (
            <a
              href={`mailto:${prospect.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary dark:hover:text-blue-400 transition-colors line-clamp-1"
              title={prospect.email}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="truncate">{prospect.email}</span>
            </a>
          )}
          {prospect.phone && (
            <a
              href={`tel:${prospect.phone.replace(/[^\d]/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary dark:hover:text-blue-400 transition-colors line-clamp-1"
              title={prospect.phone}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.36 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="truncate">{prospect.phone}</span>
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        {prospect.source && (
          <span className="text-[10px] text-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
            {prospect.source}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {formatDate(prospect.lastContact)}
        </span>
      </div>

      {prospect.notes && (
        <p className="text-[10px] text-muted-foreground italic mt-1.5 line-clamp-2 leading-snug">
          {prospect.notes}
        </p>
      )}
    </div>
  );
}
