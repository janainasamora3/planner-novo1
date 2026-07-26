"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientsCrm } from "@/hooks/use-clients-crm";
import { useServiceTypes } from "@/hooks/use-service-types";
import { useStatusColors } from "@/hooks/use-status-colors";
import { useToast } from "@/hooks/use-toast";
import {
  FREQUENCY_LABELS,
  STATUS_COLORS_DEFAULT,
  STATUS_LABELS,
  type Client,
  type ClientStatus,
} from "@/lib/clients-crm";
import { ClientCrmEditorDialog } from "./client-crm-editor-dialog";
import { StatusColorsDialog } from "./status-colors-dialog";
import { cn, readableTextColor } from "@/lib/utils";

type Filter = "todos" | ClientStatus;

const FILTERS: { id: Filter; status?: ClientStatus; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ativo", status: "ativo", label: "Ativo" },
  { id: "pausado", status: "pausado", label: "Pausado" },
  { id: "inativo", status: "inativo", label: "Inativo" },
  { id: "lead", status: "lead", label: "Lead" },
];

function formatPeriod(c: Client): string {
  const start = c.startDate ? formatBR(c.startDate) : "";
  const end = c.endDate ? formatBR(c.endDate) : "";
  if (start && end) return `${start} → ${end}`;
  if (start) return `${start} → agora`;
  if (end) return `até ${end}`;
  return "—";
}

function formatBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatBRL(v?: number): string {
  if (!v) return "—";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function CrmClientesView() {
  const { clients, addClient, updateClient, removeClient, resetAll } = useClientsCrm();
  const { services: serviceTypes } = useServiceTypes();
  const { colors: statusColors } = useStatusColors();
  const { toast } = useToast();

  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"lista" | "cards">("lista");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [statusColorsOpen, setStatusColorsOpen] = useState(false);

  // Resolved status colors (fall back to defaults if not customized)
  const resolvedColors = useMemo(() => {
    const out: Record<ClientStatus, string> = { ...STATUS_COLORS_DEFAULT };
    (Object.keys(statusColors) as ClientStatus[]).forEach((k) => {
      const v = statusColors[k];
      if (v && v.startsWith("#")) out[k] = v;
    });
    return out;
  }, [statusColors]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      todos: clients.length,
      ativo: 0,
      pausado: 0,
      inativo: 0,
      lead: 0,
    };
    for (const cl of clients) c[cl.status]++;
    return c;
  }, [clients]);

  // MRR = soma dos valores mensais dos clientes ativos
  const mrr = useMemo(
    () =>
      clients
        .filter((c) => c.status === "ativo")
        .reduce((sum, c) => sum + (c.value ?? 0), 0),
    [clients]
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter !== "todos" && c.status !== filter) return false;
      if (s) {
        const hay = `${c.name} ${c.handle} ${c.responsible ?? ""} ${c.email ?? ""} ${c.niche ?? ""} ${c.notes ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [clients, filter, search]);

  const editingClient = useMemo(
    () => clients.find((c) => c.id === editingClientId) ?? null,
    [clients, editingClientId]
  );

  function openNew() {
    setEditingClientId(null);
    setEditorOpen(true);
  }
  function openEdit(id: string) {
    setEditingClientId(id);
    setEditorOpen(true);
  }

  function handleSubmit(data: Omit<Client, "id" | "createdAt" | "updatedAt">) {
    if (editingClientId) {
      updateClient(editingClientId, data);
      toast({ title: "Cliente atualizado", description: data.name });
    } else {
      addClient(data);
      toast({ title: "Cliente criado", description: data.name });
    }
    setEditingClientId(null);
  }

  function handleDelete(id: string) {
    removeClient(id);
    toast({ title: "Cliente excluído", variant: "destructive" });
  }

  function handleReset() {
    if (confirm("Restaurar clientes de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Clientes restaurados" });
    }
  }

  // ---------- List view (tabela) ----------
  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤝</span>
              <h2 className="text-base font-bold text-foreground">CRM Clientes</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {clients.length} {clients.length === 1 ? "cliente" : "clientes"} · Gerencie contratos, serviços e pagamentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusColorsOpen(true)}
              className="h-8 px-3 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Personalizar cores dos status"
            >
              🎨 Cores
            </button>
            {/* Toggle Lista / Cards */}
            <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5 h-8">
              <button
                onClick={() => setViewMode("lista")}
                className={cn(
                  "h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors",
                  viewMode === "lista"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Visualizar como tabela"
                aria-label="Visualização em lista"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Lista
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors",
                  viewMode === "cards"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Visualizar como cards"
                aria-label="Visualização em cards"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Cards
              </button>
            </div>
            <button
              onClick={openNew}
              className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Nova
            </button>
          </div>
        </div>

        {/* Resumo MRR + Total de clientes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="MRR (ativos)"
            value={formatBRL(mrr)}
            accent="emerald"
            hint="Soma dos valores mensais"
          />
          <SummaryCard
            label="Total de clientes"
            value={String(clients.length)}
            accent="blue"
            hint={`${counts.ativo} ativos · ${counts.pausado + counts.inativo + counts.lead} outros`}
          />
          <SummaryCard
            label="Pipeline potencial"
            value={formatBRL(clients.reduce((s, c) => s + (c.value ?? 0), 0))}
            accent="violet"
            hint="Soma de todos os valores"
          />
          <SummaryCard
            label="Leads em aberto"
            value={String(counts.lead)}
            accent="amber"
            hint="Aguardando conversão"
          />
        </div>

        {/* Filtros por status + busca */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const isActive = filter === f.id;
              const color = f.status ? resolvedColors[f.status] : null;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border transition-all",
                    isActive
                      ? "text-white border-transparent shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                  )}
                  style={
                    isActive && color
                      ? { background: color, borderColor: color }
                      : isActive
                        ? { background: "var(--foreground)", borderColor: "var(--foreground)" }
                        : undefined
                  }
                >
                  {color && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: color }}
                    />
                  )}
                  {f.label}
                  <span
                    className={cn(
                      "text-[10px] px-1 rounded font-bold",
                      isActive ? "bg-black/15" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {counts[f.id]}
                  </span>
                </button>
              );
            })}
          </div>

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
              placeholder="Buscar cliente, @handle, email..."
              className="h-8 pl-9 text-xs"
            />
          </div>
        </div>

        {/* Lista de clientes — tabela OU cards conforme viewMode */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <div className="text-4xl mb-3 opacity-40">🤝</div>
            <p className="text-muted-foreground text-sm mb-4">
              {clients.length === 0
                ? 'Nenhum cliente ainda. Crie o primeiro com o botão "Nova".'
                : "Nenhum cliente encontrado com esses filtros."}
            </p>
            {clients.length === 0 ? (
              <Button size="sm" onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                + Nova
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setFilter("todos"); setSearch(""); }}
                className="text-muted-foreground"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : viewMode === "lista" ? (
          <ClientsTable
            clients={filtered}
            serviceTypes={serviceTypes}
            statusColors={resolvedColors}
            onOpen={openEdit}
            onEdit={openEdit}
          />
        ) : (
          <ClientsCardsGrid
            clients={filtered}
            serviceTypes={serviceTypes}
            statusColors={resolvedColors}
            onOpen={openEdit}
            onEdit={openEdit}
            onNew={openNew}
          />
        )}

        {/* Rodapé com restaurar demo */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            {filtered.length} de {clients.length} clientes exibidos
          </p>
          <button
            onClick={handleReset}
            className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
          >
            ↺ Restaurar demo
          </button>
        </div>
      </div>

      <ClientCrmEditorDialog
        key={`crm-${editorOpen}-${editingClientId ?? "new"}`}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditingClientId(null);
        }}
        editingClient={editingClient}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      <StatusColorsDialog
        open={statusColorsOpen}
        onOpenChange={setStatusColorsOpen}
      />
    </div>
  );
}

// ============ Summary Card ============

function SummaryCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "emerald" | "blue" | "violet" | "amber";
}) {
  const accentMap = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>
      <p className={cn("text-lg font-bold mt-0.5", accentMap[accent])}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</p>
      )}
    </div>
  );
}

// ============ Clients Table ============

function ClientsTable({
  clients,
  serviceTypes,
  statusColors,
  onOpen,
  onEdit,
}: {
  clients: Client[];
  serviceTypes: import("@/lib/service-types").ServiceTypeItem[];
  statusColors: Record<ClientStatus, string>;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-[calc(100vh-380px)] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b border-border">
              <Th>Cliente</Th>
              <Th>Status</Th>
              <Th>Período</Th>
              <Th className="text-right">Valor</Th>
              <Th>Responsável</Th>
              <Th>Contato</Th>
              <Th>Nicho</Th>
              <Th>Serviços</Th>
              <Th>Freq.</Th>
              <Th className="text-center">Contr.</Th>
              <Th className="text-center">Resc.</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const services = serviceTypes.filter((s) => c.serviceTypeIds.includes(s.id));
              const statusColor = statusColors[c.status];
              const statusText = readableTextColor(statusColor);
              return (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => onOpen(c.id)}
                >
                  {/* Cliente — avatar + nome + @handle */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${c.color} 0%, ${c.color}dd 100%)`,
                          color: "#ffffff",
                        }}
                      >
                        {c.emoji || c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                          {c.name}
                        </p>
                        {c.handle && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {c.handle}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status — badge colorido */}
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        background: statusColor,
                        color: statusText,
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: statusText }}
                      />
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>

                  {/* Período */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatPeriod(c)}
                  </td>

                  {/* Valor */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    {c.value ? (
                      <span className="text-xs font-bold text-foreground">
                        {formatBRL(c.value)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Responsável */}
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                    {c.responsible ?? "—"}
                  </td>

                  {/* Contato */}
                  <td className="px-3 py-2.5">
                    {c.email || c.whatsapp ? (
                      <div className="flex flex-col gap-0.5">
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-primary hover:underline truncate max-w-[160px]"
                            title={c.email}
                          >
                            {c.email}
                          </a>
                        )}
                        {c.whatsapp && (
                          <a
                            href={`https://wa.me/55${c.whatsapp.replace(/[^\d]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-muted-foreground hover:text-primary truncate max-w-[160px]"
                            title={c.whatsapp}
                          >
                            {c.whatsapp}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Nicho */}
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                    {c.niche ?? "—"}
                  </td>

                  {/* Serviços */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                      {services.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      ) : (
                        services.slice(0, 3).map((s) => {
                          const bgColor = s.color || "#3f3f46";
                          return (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                background: `${bgColor}1A`,
                                color: bgColor,
                                border: `1px solid ${bgColor}40`,
                              }}
                              title={s.label}
                            >
                              {s.emoji ?? "•"} {s.label}
                            </span>
                          );
                        })
                      )}
                      {services.length > 3 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{services.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Frequência */}
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                    {c.postFrequency ? FREQUENCY_LABELS[c.postFrequency] ?? c.postFrequency : "—"}
                  </td>

                  {/* Contrato */}
                  <td className="px-3 py-2.5 text-center">
                    {c.contractFileName ? (
                      <a
                        href={c.contractFile}
                        download={c.contractFileName}
                        onClick={(e) => e.stopPropagation()}
                        className="text-foreground hover:text-primary inline-flex"
                        title={c.contractFileName}
                      >
                        📎
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Rescisão */}
                  <td className="px-3 py-2.5 text-center">
                    {c.terminationContractFileName ? (
                      <a
                        href={c.terminationContractFile}
                        download={c.terminationContractFileName}
                        onClick={(e) => e.stopPropagation()}
                        className="text-foreground hover:text-primary inline-flex"
                        title={c.terminationContractFileName}
                      >
                        📄
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(c.id); }}
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                        aria-label="Editar"
                        title="Editar cliente"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[10px] uppercase tracking-wide font-bold text-foreground/70 dark:text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

// =================== CARDS GRID VIEW ===================

function ClientsCardsGrid({
  clients,
  serviceTypes,
  statusColors,
  onOpen,
  onEdit,
  onNew,
}: {
  clients: Client[];
  serviceTypes: import("@/lib/service-types").ServiceTypeItem[];
  statusColors: Record<ClientStatus, string>;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {clients.map((c) => {
        const services = serviceTypes.filter((s) => c.serviceTypeIds.includes(s.id));
        const statusColor = statusColors[c.status];
        const statusText = readableTextColor(statusColor);
        return (
          <div
            key={c.id}
            onClick={() => onOpen(c.id)}
            className="group relative flex flex-col items-center justify-start rounded-xl bg-card border border-border p-4 transition-all duration-200 hover:border-foreground/20 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
          >
            {/* Botão editar (aparece no hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(c.id);
              }}
              className="absolute top-2 right-2 h-7 w-7 rounded-md bg-muted/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Editar cliente"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Badge de status no topo esquerdo */}
            <span
              className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded z-10"
              style={{
                background: statusColor,
                color: statusText,
              }}
            >
              <span
                className="inline-block h-1 w-1 rounded-full"
                style={{ background: statusText }}
              />
              {STATUS_LABELS[c.status]}
            </span>

            {/* Avatar circular com gradiente vivo + emoji */}
            <div
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shrink-0 mb-3 mt-4 ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${c.color} 0%, ${c.color}dd 100%)`,
                color: "#ffffff",
              }}
            >
              {c.emoji || c.name.slice(0, 2).toUpperCase()}
            </div>

            {/* Nome */}
            <p className="text-sm font-semibold text-foreground text-center px-2 line-clamp-1">
              {c.name}
            </p>

            {/* @handle */}
            {c.handle && (
              <p className="text-[11px] text-muted-foreground text-center px-2 line-clamp-1">
                {c.handle}
              </p>
            )}

            {/* Nicho */}
            {c.niche && (
              <p className="text-[10px] text-muted-foreground/80 text-center px-2 mt-1 line-clamp-1">
                {c.niche}
              </p>
            )}

            {/* Valor + período */}
            <div className="mt-2 pt-2 border-t border-border w-full text-center">
              {c.value ? (
                <p className="text-sm font-bold text-foreground">
                  {formatBRL(c.value)}
                  <span className="text-[10px] text-muted-foreground font-normal">/mês</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">— valor</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {formatPeriod(c)}
              </p>
            </div>

            {/* Serviços */}
            {services.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-2 justify-center">
                {services.slice(0, 3).map((s) => {
                  const bg = s.color || "#3f3f46";
                  return (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded"
                      style={{
                        background: `${bg}1A`,
                        color: bg,
                        border: `1px solid ${bg}40`,
                      }}
                      title={s.label}
                    >
                      {s.emoji ?? "•"} {s.label}
                    </span>
                  );
                })}
                {services.length > 3 && (
                  <span className="text-[9px] text-muted-foreground self-center">
                    +{services.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Card "+ Nova" */}
      <button
        onClick={onNew}
        className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent aspect-square w-full transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/[0.03]"
      >
        <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground group-hover:text-blue-500 transition-colors">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-[11px] text-muted-foreground group-hover:text-blue-500 transition-colors">
          Nova página
        </span>
      </button>
    </div>
  );
}
