"use client";

import { useMemo, useState } from "react";
import { useProspects } from "@/hooks/use-prospects";
import { useToast } from "@/hooks/use-toast";
import {
  STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  type FunnelStage,
  type Prospect,
} from "@/lib/prospects";
import { ProspectEditorDialog } from "./prospect-editor-dialog";

type SortField = "name" | "value" | "stage" | "lastContact";
type SortDir = "asc" | "desc";

export function ContatosListView() {
  const { prospects, addProspect, updateProspect, removeProspect } = useProspects();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<FunnelStage | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const editingProspect = useMemo(
    () => prospects.find((p) => p.id === editingId) ?? null,
    [prospects, editingId]
  );

  const filteredAndSorted = useMemo(() => {
    let list = [...prospects];

    // Busca
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          (p.phone ?? "").toLowerCase().includes(q)
      );
    }

    // Filtro de etapa
    if (stageFilter !== "all") {
      list = list.filter((p) => p.stage === stageFilter);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "value") cmp = (a.value ?? 0) - (b.value ?? 0);
      else if (sortField === "stage") {
        const order: Record<FunnelStage, number> = { novo: 1, contato: 2, reuniao: 3, proposta: 4, fechado: 5 };
        cmp = order[a.stage] - order[b.stage];
      } else if (sortField === "lastContact") {
        cmp = (a.lastContact ?? "").localeCompare(b.lastContact ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [prospects, search, stageFilter, sortField, sortDir]);

  function openNew() {
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

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function formatBRL(v?: number): string {
    if (v === undefined || v === null) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  function formatDate(d?: string): string {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h2 className="text-base font-semibold text-foreground">Lista de contatos</h2>
          </div>
          <p className="text-xs text-foreground/65">
            {filteredAndSorted.length} de {prospects.length} prospects
          </p>
        </div>
        <button
          onClick={openNew}
          className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Novo prospect
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/55"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, telefone..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/30 border border-border text-foreground text-sm placeholder:text-foreground/55 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Filtro de etapa */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as FunnelStage | "all")}
          className="h-9 px-3 rounded-lg bg-muted/30 border border-border text-foreground text-sm focus:outline-none focus:border-blue-500/50"
        >
          <option value="all" className="bg-card">Todas as etapas</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id} className="bg-card">{s.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th
                  className="text-left px-4 py-2.5 text-[11px] font-medium text-foreground/50 uppercase tracking-wide cursor-pointer hover:text-foreground/80 select-none"
                  onClick={() => toggleSort("name")}
                >
                  Nome {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-foreground/50 uppercase tracking-wide">
                  Contato
                </th>
                <th
                  className="text-left px-4 py-2.5 text-[11px] font-medium text-foreground/50 uppercase tracking-wide cursor-pointer hover:text-foreground/80 select-none"
                  onClick={() => toggleSort("stage")}
                >
                  Etapa {sortField === "stage" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-right px-4 py-2.5 text-[11px] font-medium text-foreground/50 uppercase tracking-wide cursor-pointer hover:text-foreground/80 select-none"
                  onClick={() => toggleSort("value")}
                >
                  Valor {sortField === "value" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-foreground/50 uppercase tracking-wide">
                  Origem
                </th>
                <th
                  className="text-left px-4 py-2.5 text-[11px] font-medium text-foreground/50 uppercase tracking-wide cursor-pointer hover:text-foreground/80 select-none"
                  onClick={() => toggleSort("lastContact")}
                >
                  Últ. contato {sortField === "lastContact" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-foreground/55 text-sm">
                    {prospects.length === 0
                      ? "Nenhum prospect ainda. Crie o primeiro com o botão \"Novo prospect\"."
                      : "Nenhum prospect encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border hover:bg-muted/20 cursor-pointer transition-colors group"
                    onClick={() => openEdit(p.id)}
                  >
                    {/* Nome + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 rounded-md flex items-center justify-center text-sm shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${p.color} 0%, #0a0a0a 100%)`,
                            color: "#ffffff",
                          }}
                        >
                          {p.emoji || p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground/90 truncate">{p.name}</p>
                          {p.handle && (
                            <p className="text-[10px] text-foreground/65 truncate">{p.handle}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Contato */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] text-foreground/50 hover:text-blue-400 transition-colors"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="truncate max-w-[180px]">{p.email}</span>
                          </a>
                        )}
                        {p.phone && (
                          <a
                            href={`tel:${p.phone.replace(/[^\d]/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] text-foreground/50 hover:text-blue-400 transition-colors"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.36 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{p.phone}</span>
                          </a>
                        )}
                        {!p.email && !p.phone && <span className="text-[11px] text-foreground/20">—</span>}
                      </div>
                    </td>
                    {/* Etapa */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${STAGE_COLORS[p.stage]}30`,
                          color: STAGE_COLORS[p.stage],
                          border: `1px solid ${STAGE_COLORS[p.stage]}60`,
                        }}
                      >
                        {STAGE_LABELS[p.stage]}
                      </span>
                    </td>
                    {/* Valor */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-emerald-400">
                        {formatBRL(p.value)}
                      </span>
                    </td>
                    {/* Origem */}
                    <td className="px-4 py-3">
                      {p.source ? (
                        <span className="text-[11px] text-foreground/50 bg-accent px-1.5 py-0.5 rounded">
                          {p.source}
                        </span>
                      ) : (
                        <span className="text-[11px] text-foreground/20">—</span>
                      )}
                    </td>
                    {/* Últ. contato */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-foreground/50">{formatDate(p.lastContact)}</span>
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Excluir prospect "${p.name}"?`)) handleDelete(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-md text-foreground/65 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
                        aria-label="Excluir"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProspectEditorDialog
        key={`pros-${dialogOpen}-${editingId ?? "new"}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        editingProspect={editingProspect}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
