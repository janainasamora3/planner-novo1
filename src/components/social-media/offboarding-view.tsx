"use client";

import { useMemo, useState } from "react";
import { useOffboarding } from "@/hooks/use-offboarding";
import {
  useClientOffboarding,
  useAllClientOffboarding,
} from "@/hooks/use-client-offboarding";
import { useClientsCrm } from "@/hooks/use-clients-crm";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_OFFBOARDING_ITEMS, type OffboardingItem } from "@/lib/offboarding";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn, readableTextColor } from "@/lib/utils";

const TEMPLATE_ITEMS = DEFAULT_OFFBOARDING_ITEMS;

export function OffboardingView() {
  // Template (títulos, blocos de conteúdo) — editável globalmente
  const {
    items: templateItems,
    updateContentBlock,
    updateTitle,
    updateDateAnnotation: updateTemplateDate,
    resetAll: resetTemplate,
  } = useOffboarding();
  const { toast } = useToast();

  const { clients: allClients } = useClientsCrm();
  const { summaries } = useAllClientOffboarding();

  // Filtra leads — Offboarding só mostra clientes reais (ativo, pausado, inativo).
  // Leads não fecharam contrato, então não faz sentido ter checklist de saída.
  const clients = useMemo(
    () => allClients.filter((c) => c.status !== "lead"),
    [allClients]
  );

  // Cliente selecionado para o checklist detalhado
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const {
    items: clientItems,
    toggleDone,
    markSent,
    unmarkSent,
    updateDate,
    resetClient,
  } = useClientOffboarding(selectedClientId);

  const sortedTemplate = useMemo(
    () => [...templateItems].sort((a, b) => a.order - b.order),
    [templateItems]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  // Clientes filtrados pela busca
  const filteredClients = useMemo(() => {
    const s = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (s) {
        const hay = `${c.name} ${c.handle} ${c.niche ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [clients, search]);

  // Resumo geral — só conta clientes que NÃO são leads
  const validClientIds = useMemo(() => new Set(clients.map((c) => c.id)), [clients]);
  const validSummaries = useMemo(
    () => summaries.filter((s) => validClientIds.has(s.clientId)),
    [summaries, validClientIds]
  );
  const totalClientsInOffboarding = validSummaries.length;
  const completeCount = validSummaries.filter((s) => s.isComplete).length;
  const inProgressCount = totalClientsInOffboarding - completeCount;

  // Próximos envios: itens com dateAnnotation nos próximos 7 dias (ou atrasados)
  const upcomingSends = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const list: {
      clientId: string;
      clientName: string;
      itemTitle: string;
      date: string;
      isOverdue: boolean;
    }[] = [];

    validSummaries.forEach((s) => {
      if (s.isComplete || !s.nextPendingDate || !s.nextPendingItem) return;
      const client = clients.find((c) => c.id === s.clientId);
      if (!client) return;
      const date = new Date(s.nextPendingDate + "T00:00:00");
      const isOverdue = date < today;
      const inNext7 = date <= sevenDaysLater;
      if (isOverdue || inNext7) {
        list.push({
          clientId: s.clientId,
          clientName: client.name,
          itemTitle: s.nextPendingItem.title,
          date: s.nextPendingDate,
          isOverdue,
        });
      }
    });

    return list.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [validSummaries, clients]);

  function handleCopy(text: string, label: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(fillTemplate(text, selectedClient))
        .then(() => {
          toast({ title: "Copiado!", description: label });
        })
        .catch(() => {
          toast({ title: "Não foi possível copiar", variant: "destructive" });
        });
    }
  }

  function handleMarkSent(itemId: string, title: string) {
    if (!selectedClientId) return;
    markSent(itemId);
    toast({
      title: "Marcado como enviado",
      description: title,
    });
  }

  function handleUnmarkSent(itemId: string, title: string) {
    if (!selectedClientId) return;
    unmarkSent(itemId);
    toast({
      title: "Marca de enviado removida",
      description: title,
      variant: "destructive",
    });
  }

  function handleResetClient() {
    if (!selectedClientId) return;
    if (confirm("Resetar offboarding deste cliente? O progresso será perdido.")) {
      resetClient();
      toast({ title: "Offboarding resetado para este cliente" });
    }
  }

  function handleResetTemplate() {
    if (confirm("Restaurar templates de offboarding padrão? Mensagens e títulos voltam ao original.")) {
      resetTemplate();
      toast({ title: "Templates restaurados" });
    }
  }

  // Progresso do cliente selecionado
  const selectedDoneCount = clientItems.filter((i) => i.done).length;
  const selectedSentCount = clientItems.filter((i) => i.sent).length;
  const selectedProgress = clientItems.length > 0
    ? (selectedDoneCount / clientItems.length) * 100
    : 0;

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">👋</span>
              <h2 className="text-base font-bold text-foreground">Offboarding</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalClientsInOffboarding === 0
                ? "Checklist de saída de clientes · Selecione um cliente para começar"
                : `${totalClientsInOffboarding} clientes em offboarding · ${inProgressCount} em andamento · ${completeCount} concluídos`}
            </p>
          </div>
        </div>

        {/* Resumo no topo — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Em offboarding"
            value={String(totalClientsInOffboarding)}
            accent="blue"
            hint="Clientes com checklist iniciado"
            icon="👥"
          />
          <SummaryCard
            label="Em andamento"
            value={String(inProgressCount)}
            accent="amber"
            hint="Pendências a concluir"
            icon="⏳"
          />
          <SummaryCard
            label="Concluídos"
            value={String(completeCount)}
            accent="emerald"
            hint="Checklist 100% finalizado"
            icon="✅"
          />
          <SummaryCard
            label="Próximos envios"
            value={String(upcomingSends.length)}
            accent="violet"
            hint="Vencem nos próximos 7 dias"
            icon="📅"
          />
        </div>

        {/* Próximos envios (se houver) */}
        {upcomingSends.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">
              📅 Próximos envios e tarefas
            </h3>
            <div className="space-y-1.5">
              {upcomingSends.slice(0, 6).map((u) => (
                <button
                  key={`${u.clientId}-${u.itemTitle}`}
                  onClick={() => setSelectedClientId(u.clientId)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center h-6 w-6 rounded text-[10px] font-bold shrink-0",
                        u.isOverdue
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {u.isOverdue ? "!" : "→"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {u.clientName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {u.itemTitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded",
                      u.isOverdue
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {u.isOverdue ? "Atrasado · " : ""}
                    {formatBR(u.date)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Layout principal: lista de clientes à esquerda + checklist à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Coluna esquerda — seletor de cliente */}
          <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Clientes</h3>
              <label className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyPending}
                  onChange={(e) => setShowOnlyPending(e.target.checked)}
                  className="h-3 w-3 accent-blue-600"
                />
                Só pendentes
              </label>
            </div>

            {/* Busca */}
            <div className="relative mb-3">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Lista de clientes com progresso */}
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {filteredClients.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">
                  Nenhum cliente encontrado.
                </p>
              ) : (
                filteredClients.map((c) => {
                  const summary = validSummaries.find((s) => s.clientId === c.id);
                  const isSelected = selectedClientId === c.id;
                  const isInOffboarding = !!summary;
                  const progress = summary?.progress ?? 0;
                  const doneCount = summary?.doneCount ?? 0;
                  const total = summary?.total ?? TEMPLATE_ITEMS.length;

                  if (showOnlyPending && summary?.isComplete) return null;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted/40"
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${c.color} 0%, ${c.color}dd 100%)`,
                          color: "#ffffff",
                        }}
                      >
                        {c.emoji || c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                summary?.isComplete
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground font-medium whitespace-nowrap">
                            {doneCount}/{total}
                          </span>
                        </div>
                      </div>
                      {isInOffboarding && summary?.isComplete && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Coluna direita — checklist do cliente selecionado */}
          <section>
            {!selectedClient ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                <div className="text-4xl mb-3 opacity-40">👋</div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Selecione um cliente
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Escolha um cliente na lista ao lado para visualizar e gerenciar o checklist de offboarding específico dele.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header do cliente selecionado */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-10 w-10 rounded-full flex items-center justify-center text-base shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${selectedClient.color} 0%, ${selectedClient.color}dd 100%)`,
                          color: "#ffffff",
                        }}
                      >
                        {selectedClient.emoji || selectedClient.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {selectedClient.name}
                        </p>
                        {selectedClient.handle && (
                          <p className="text-[11px] text-muted-foreground">
                            {selectedClient.handle}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleResetClient}
                      className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                      title="Resetar offboarding deste cliente"
                    >
                      ↺ Resetar
                    </button>
                  </div>

                  {/* Progresso */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                      Progresso
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {selectedDoneCount}/{clientItems.length} concluídos · {selectedSentCount} enviados · {Math.round(selectedProgress)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${selectedProgress}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {sortedTemplate.map((tplItem, index) => {
                    const clientItem = clientItems.find(
                      (i) => i.itemId === tplItem.id
                    ) ?? {
                      itemId: tplItem.id,
                      done: false,
                      dateAnnotation: "",
                      sent: false,
                    };

                    return (
                      <OffboardingCard
                        key={tplItem.id}
                        template={tplItem}
                        index={index}
                        clientItem={clientItem}
                        client={selectedClient}
                        onToggleDone={() => toggleDone(tplItem.id)}
                        onMarkSent={() => handleMarkSent(tplItem.id, tplItem.title)}
                        onUnmarkSent={() => handleUnmarkSent(tplItem.id, tplItem.title)}
                        onUpdateDate={(v) => updateDate(tplItem.id, v)}
                        onCopy={(text, label) => handleCopy(text, label)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            Os templates de mensagem são compartilhados entre todos os clientes.
            {" "}
            <button
              onClick={handleResetTemplate}
              className="underline hover:text-foreground"
            >
              Restaurar templates padrão
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ Sub-componentes ============

function OffboardingCard({
  template,
  index,
  clientItem,
  client,
  onToggleDone,
  onMarkSent,
  onUnmarkSent,
  onUpdateDate,
  onCopy,
}: {
  template: OffboardingItem;
  index: number;
  clientItem: {
    done: boolean;
    dateAnnotation: string;
    sent: boolean;
    sentAt?: number;
  };
  client: { name: string; handle?: string } | null;
  onToggleDone: () => void;
  onMarkSent: () => void;
  onUnmarkSent: () => void;
  onUpdateDate: (v: string) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = (template.contentBlocks?.length ?? 0) > 0;
  const hasDate = template.hasDateAnnotation === true || hasContent;
  const isAutoExpandable = hasContent || hasDate;

  // Auto-expande se tiver conteúdo e estiver marcado como enviado
  const showSentBadge = clientItem.sent;
  const sentDate = clientItem.sentAt
    ? new Date(clientItem.sentAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all overflow-hidden",
        clientItem.done
          ? "border-border/60 opacity-80"
          : "border-border hover:border-primary/30"
      )}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-3 p-3">
        {/* Número ou check */}
        <span
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0",
            clientItem.sent
              ? "bg-emerald-500 text-white"
              : clientItem.done
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
          )}
        >
          {clientItem.sent ? "✓" : clientItem.done ? "✓" : index + 1}
        </span>

        {/* Checkbox */}
        <Checkbox
          checked={clientItem.done}
          onCheckedChange={onToggleDone}
          className="shrink-0"
          aria-label={`Marcar "${template.title}" como concluído`}
        />

        {/* Título (clicável para expandir) */}
        <button
          onClick={() => isAutoExpandable && setExpanded(!expanded)}
          className="flex-1 text-left min-w-0"
        >
          <span
            className={cn(
              "text-sm font-medium block truncate",
              clientItem.done
                ? "text-muted-foreground line-through"
                : "text-foreground"
            )}
          >
            {template.title}
          </span>
        </button>

        {/* Badge "Enviado" */}
        {showSentBadge && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white shrink-0"
            title={`Enviado em ${sentDate}`}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
            Enviado
          </span>
        )}

        {/* Data */}
        {hasDate && (
          <Input
            type="date"
            value={clientItem.dateAnnotation}
            onChange={(e) => onUpdateDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-7 w-[140px] text-xs shrink-0",
              clientItem.dateAnnotation && "font-semibold"
            )}
            title="Data de envio ou execução"
          />
        )}

        {/* Botão expandir */}
        {isAutoExpandable && (
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
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Conteúdo expandido */}
      {expanded && hasContent && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {template.contentBlocks!.map((block) => {
            const filledText = fillTemplate(block.text, client);
            return (
              <div key={block.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {block.label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(block.text, block.label)}
                      className="h-7 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copiar
                    </Button>
                    {clientItem.sent ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onUnmarkSent}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:bg-muted"
                      >
                        ↺ Desmarcar envio
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={onMarkSent}
                        className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Marcar enviado
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  value={filledText}
                  readOnly
                  rows={Math.min(12, Math.max(4, filledText.split("\n").length + 1))}
                  className="text-xs font-mono resize-y bg-muted/30"
                />
                {clientItem.sent && clientItem.sentAt && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Enviado em {sentDate}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

/**
 * Preenche os placeholders [NOME] e [EMPRESA] do template com dados do cliente.
 */
function fillTemplate(
  text: string,
  client: { name: string; handle?: string } | null
): string {
  if (!client) return text;
  return text
    .replace(/\[NOME\]/g, client.name)
    .replace(/\[EMPRESA\]/g, client.name)
    .replace(/\[HANDLE\]/g, client.handle ?? "");
}

function formatBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
