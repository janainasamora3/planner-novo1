"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FREQUENCY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Client,
} from "@/lib/clients-crm";
import {
  BRIEFING_TEMPLATE,
  getSectionedCardInfo,
  type CardSection,
  MONTHS,
  WEEKDAYS,
  todayISO,
  weekdayName,
  type Attachment,
  type ContentEntry,
  type PlanningCard,
  TIMELINE_TYPE_OPTIONS,
  TIMELINE_TYPE_COLORS,
  TIMELINE_TYPE_EMOJIS,
  TIMELINE_TYPE_LABELS,
} from "@/lib/client-detail";
import { useClientDetail } from "@/hooks/use-client-detail";
import { useServiceTypes } from "@/hooks/use-service-types";
import { ServiceTypeManager } from "./service-type-manager";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AttachmentsList } from "@/components/ui/attachments-list";
import { DateInput } from "@/components/ui/date-input";
import { cn, readableTextColor } from "@/lib/utils";

interface ClientDetailTabsProps {
  client: Client;
  onBack?: () => void;
  onEditClient?: () => void;
  onUpdateClient?: (id: string, patch: Record<string, unknown>) => void;
}

const TAB_DEFS = [
  { id: "perfil", label: "Perfil", emoji: "👤" },
  { id: "etapas", label: "Etapas", emoji: "✅" },
  { id: "planejamento", label: "Planejamento", emoji: "🗂️" },
  { id: "calendario", label: "Calendário", emoji: "📅" },
  { id: "instagram", label: "Instagram", emoji: "📷" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼" },
  { id: "youtube", label: "YouTube", emoji: "🎬" },
  { id: "metricas", label: "Métricas", emoji: "📊" },
  { id: "documentos", label: "Documentos", emoji: "📎" },
  { id: "historico", label: "Histórico", emoji: "⏱️" },
] as const;

type TabId = (typeof TAB_DEFS)[number]["id"];

export function ClientDetailTabs({
  client,
  onBack,
  onEditClient,
  onUpdateClient,
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const { services: serviceTypes } = useServiceTypes();
  const detailHook = useClientDetail(client.id);

  useEffect(() => {
    if (client.id) detailHook.getOrCreate(client.id);
  }, [client.id, detailHook]);

  const detail = detailHook.detail;

  return (
    <div className="flex flex-col h-full">
      {/* Header — mais rico com avatar grande + status + ações */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onBack?.()}
              className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              aria-label="Voltar"
              title="Voltar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-2xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${client.color} 0%, ${client.color}dd 100%)`,
                color: "#ffffff",
              }}
            >
              {client.emoji || client.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold text-foreground truncate">{client.name}</h2>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                  style={{
                    background: STATUS_COLORS[client.status] ?? "#6b7280",
                    color: "#ffffff",
                  }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
                  {STATUS_LABELS[client.status] ?? "—"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {client.handle && <span>@{client.handle.replace(/^@/, "")}</span>}
                {client.responsible && (
                  <span className="inline-flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {client.responsible}
                  </span>
                )}
                {client.value ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    R$ {client.value.toLocaleString("pt-BR")}/mês
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEditClient?.()} className="text-muted-foreground hover:text-foreground shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Editar
          </Button>
        </div>
      </div>

      {/* Tabs com emojis + contadores */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="flex-1 flex flex-col gap-0">
        <div className="border-b border-border px-4 sm:px-6 overflow-x-auto bg-card">
          <TabsList className="bg-transparent h-auto p-0 gap-1 rounded-none">
            {TAB_DEFS.map((t) => {
              const count = getTabCount(t.id, detail);
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-3 text-xs sm:text-sm gap-1.5 whitespace-nowrap"
                >
                  <span className="text-sm">{t.emoji}</span>
                  <span>{t.label}</span>
                  {count !== null && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto bg-background">
          <TabsContent value="perfil" className="mt-0 p-4 sm:p-6">
            {detail && (
              <PerfilTab
                key={`${client.id}|${detail.drive ?? ""}|${detail.logosLink ?? ""}`}
                client={client}
                detail={detail}
                serviceTypes={serviceTypes}
                onUpdateProfile={detailHook.updateProfile}
                onUpdateClient={onUpdateClient}
              />
            )}
          </TabsContent>
          <TabsContent value="etapas" className="mt-0 p-4 sm:p-6">
            {detail && (
              <EtapasTab
                clientId={client.id}
                stages={detail.stages}
                onToggle={detailHook.toggleStage}
                onUpdateContent={detailHook.updateStageContent}
                onAddFile={detailHook.addStageFile}
                onRemoveFile={detailHook.removeStageFile}
                onAddStage={detailHook.addStage}
                onRemoveStage={detailHook.removeStage}
                onUpdateStage={detailHook.updateStage}
              />
            )}
          </TabsContent>
          <TabsContent value="planejamento" className="mt-0 p-4 sm:p-6">
            {detail && (
              <PlanejamentoTab
                clientId={client.id}
                planning={detail.planning}
                onUpdate={detailHook.updatePlanningCard}
                onAdd={detailHook.addPlanningCard}
                onRemove={detailHook.removePlanningCard}
                onReorder={detailHook.reorderPlanningCard}
              />
            )}
          </TabsContent>
          <TabsContent value="calendario" className="mt-0 p-4 sm:p-6">
            {detail && <CalendarioTab detail={detail} />}
          </TabsContent>
          <TabsContent value="instagram" className="mt-0 p-4 sm:p-6">
            {detail && (
              <ContentTab
                title="Instagram"
                clientId={client.id}
                platform="instagram"
                entries={detail.instagram}
                onAdd={detailHook.addContentEntry}
                onUpdate={detailHook.updateContentEntry}
                onRemove={detailHook.removeContentEntry}
              />
            )}
          </TabsContent>
          <TabsContent value="linkedin" className="mt-0 p-4 sm:p-6">
            {detail && (
              <ContentTab
                title="LinkedIn"
                clientId={client.id}
                platform="linkedin"
                entries={detail.linkedin}
                onAdd={detailHook.addContentEntry}
                onUpdate={detailHook.updateContentEntry}
                onRemove={detailHook.removeContentEntry}
              />
            )}
          </TabsContent>
          <TabsContent value="youtube" className="mt-0 p-4 sm:p-6">
            {detail && (
              <ContentTab
                title="YouTube"
                clientId={client.id}
                platform="youtube"
                entries={detail.youtube}
                onAdd={detailHook.addContentEntry}
                onUpdate={detailHook.updateContentEntry}
                onRemove={detailHook.removeContentEntry}
              />
            )}
          </TabsContent>
          <TabsContent value="metricas" className="mt-0 p-4 sm:p-6">
            {detail && (
              <MetricasTab
                clientId={client.id}
                metrics={detail.metrics ?? []}
                onAdd={detailHook.addMetric}
                onRemove={detailHook.removeMetric}
              />
            )}
          </TabsContent>
          <TabsContent value="documentos" className="mt-0 p-4 sm:p-6">
            {detail && (
              <DocumentosTab
                clientId={client.id}
                documents={detail.documents ?? []}
                onAdd={detailHook.addDocument}
                onRemove={detailHook.removeDocument}
              />
            )}
          </TabsContent>
          <TabsContent value="historico" className="mt-0 p-4 sm:p-6">
            {detail && (
              <HistoricoTab
                clientId={client.id}
                timeline={detail.timeline ?? []}
                onAdd={detailHook.addTimelineEntry}
                onRemove={detailHook.removeTimelineEntry}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/** Retorna contagem para exibir no badge da tab, ou null se não aplicável. */
function getTabCount(
  tabId: string,
  detail: import("@/lib/client-detail").ClientDetail | null
): number | null {
  if (!detail) return null;
  switch (tabId) {
    case "etapas":
      return detail.stages?.length ?? 0;
    case "planejamento":
      return detail.planning?.length ?? 0;
    case "instagram":
      return detail.instagram?.length ?? 0;
    case "linkedin":
      return detail.linkedin?.length ?? 0;
    case "youtube":
      return detail.youtube?.length ?? 0;
    case "metricas":
      return detail.metrics?.length ?? 0;
    case "documentos":
      return detail.documents?.length ?? 0;
    case "historico":
      return detail.timeline?.length ?? 0;
    default:
      return null;
  }
}

// =================== TAB 1: PERFIL ===================

function PerfilTab({
  client,
  detail,
  serviceTypes,
  onUpdateProfile,
  onUpdateClient,
}: {
  client: Client;
  detail: import("@/lib/client-detail").ClientDetail;
  serviceTypes: import("@/lib/service-types").ServiceTypeItem[];
  onUpdateProfile: (clientId: string, patch: Partial<Pick<import("@/lib/client-detail").ClientDetail, "drive" | "logosLink">>) => void;
  onUpdateClient?: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [drive, setDrive] = useState(detail.drive ?? "");
  const [logosLink, setLogosLink] = useState(detail.logosLink ?? "");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function saveDrive() {
    if (drive !== (detail.drive ?? "")) onUpdateProfile(client.id, { drive });
  }
  function saveLogos() {
    if (logosLink !== (detail.logosLink ?? "")) onUpdateProfile(client.id, { logosLink: logosLink });
  }

  function startEdit(field: string, currentValue: string) {
    setEditingField(field);
    setDraft(currentValue);
  }

  function saveEdit(field: string) {
    if (onUpdateClient && draft !== (String(client[field as keyof typeof client] ?? ""))) {
      onUpdateClient(client.id, { [field]: draft });
    }
    setEditingField(null);
  }

  function cancelEdit() {
    setEditingField(null);
  }

  const clientServices = serviceTypes.filter((s) => (client.serviceTypeIds ?? []).includes(s.id));
  const currentStatus = client.status ?? "ativo";

  function renderEditableRow(label: string, field: string, value: string | undefined, type: "text" | "date" | "textarea" = "text") {
    const isEditing = editingField === field;
    const displayValue = type === "date" && value ? formatBR(value) : (value || "—");

    return (
      <div className="flex items-start justify-between gap-3 py-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0 pt-1.5 w-28">{label}</span>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-1">
              {type === "textarea" ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  rows={2}
                  className="flex-1 text-sm bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary/50 resize-none"
                />
              ) : type === "date" ? (
                <DateInput
                  value={draft}
                  onChange={(iso) => setDraft(iso)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(field);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1"
                />
              ) : (
                <input
                  type={type}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(field);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 h-8 text-sm bg-background border border-border rounded px-2 text-foreground focus:outline-none focus:border-primary/50"
                />
              )}
              <button onClick={() => saveEdit(field)} className="h-8 w-8 rounded text-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={cancelEdit} className="h-8 w-8 rounded text-muted-foreground hover:bg-muted flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group min-w-0">
              <span className="text-sm text-foreground truncate flex-1">{displayValue}</span>
              {onUpdateClient && (
                <button
                  onClick={() => startEdit(field, String(value ?? ""))}
                  className="h-6 w-6 rounded text-muted-foreground/90 hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Editar"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Informações principais */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-1">
        <div className="flex items-center justify-between py-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground w-28">Status</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              background: STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS] ?? "#6b7280",
              color: "#ffffff",
            }}
          >
            {STATUS_LABELS[currentStatus as keyof typeof STATUS_LABELS] ?? "—"}
          </span>
        </div>

        {renderEditableRow("Handle", "handle", client.handle)}
        {renderEditableRow("Início", "startDate", client.startDate, "date")}
        {renderEditableRow("Fim", "endDate", client.endDate, "date")}
        {renderEditableRow("Responsável", "responsible", client.responsible)}
        {renderEditableRow("Email", "email", client.email)}
        {renderEditableRow("WhatsApp", "whatsapp", client.whatsapp)}
        {renderEditableRow("Nicho", "niche", client.niche)}
        {renderEditableRow("Valor (R$)", "value", client.value ? String(client.value) : undefined)}
        {/* Frequência — dropdown editável */}
        <div className="flex items-start justify-between gap-3 py-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0 pt-1.5 w-28">Frequência</span>
          <div className="flex-1 min-w-0">
            {editingField === "postFrequency" ? (
              <div className="flex gap-1">
                <select
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("postFrequency");
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 h-8 text-sm bg-background border border-border rounded px-2 text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="">— Selecionar —</option>
                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <button onClick={() => saveEdit("postFrequency")} className="h-8 w-8 rounded text-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={cancelEdit} className="h-8 w-8 rounded text-muted-foreground hover:bg-muted flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group min-w-0">
                <span className="text-sm text-foreground truncate flex-1">
                  {client.postFrequency ? FREQUENCY_LABELS[client.postFrequency as keyof typeof FREQUENCY_LABELS] ?? client.postFrequency : "—"}
                </span>
                {onUpdateClient && (
                  <button
                    onClick={() => startEdit("postFrequency", client.postFrequency ?? "")}
                    className="h-6 w-6 rounded text-muted-foreground/90 hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Editar"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Serviços — usa ServiceTypeManager (permite adicionar/editar/remover tipos) */}
      <ServiceTypeManager
        selectedIds={client.serviceTypeIds ?? []}
        onChange={(ids) => onUpdateClient?.(client.id, { serviceTypeIds: ids })}
      />

      {/* Links externos */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Links externos</p>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground/90">Pasta Drive (URL)</Label>
          <div className="flex gap-2">
            <Input value={drive} onChange={(e) => setDrive(e.target.value)} onBlur={saveDrive} placeholder="https://drive.google.com/..." />
            <Button variant="outline" size="sm" onClick={saveDrive}>Salvar</Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground/90">Logos / Branding (URL)</Label>
          <div className="flex gap-2">
            <Input value={logosLink} onChange={(e) => setLogosLink(e.target.value)} onBlur={saveLogos} placeholder="https://..." />
            <Button variant="outline" size="sm" onClick={saveLogos}>Salvar</Button>
          </div>
        </div>
      </div>

      {/* Notas editáveis */}
      <div className="space-y-1">
        {renderEditableRow("Notas", "notes", client.notes, "textarea")}
      </div>
    </div>
  );
}

// =================== TAB 2: ETAPAS ===================

function EtapasTab({
  clientId,
  stages,
  onToggle,
  onUpdateContent,
  onAddFile,
  onRemoveFile,
  onAddStage,
  onRemoveStage,
  onUpdateStage,
}: {
  clientId: string;
  stages: import("@/lib/client-detail").ClientStage[];
  onToggle: (clientId: string, stageId: string) => void;
  onUpdateContent: (clientId: string, stageId: string, content: string) => void;
  onAddFile: (clientId: string, stageId: string, file: import("@/lib/client-detail").StageFile) => void;
  onRemoveFile: (clientId: string, stageId: string, fileId: string) => void;
  onAddStage: (clientId: string, label: string) => import("@/lib/client-detail").ClientStage | null;
  onRemoveStage: (clientId: string, stageId: string) => void;
  onUpdateStage: (
    clientId: string,
    stageId: string,
    patch: Partial<Pick<import("@/lib/client-detail").ClientStage, "label" | "order">>
  ) => void;
}) {
  const sorted = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);
  const [selectedId, setSelectedId] = useState<string | null>(sorted[0]?.id ?? null);
  const initialSelected = sorted.find((s) => s.id === selectedId) ?? sorted[0] ?? null;
  const [draft, setDraft] = useState(initialSelected?.content ?? "");
  const [labelDraft, setLabelDraft] = useState(initialSelected?.label ?? "");
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const selected = sorted.find((s) => s.id === selectedId) ?? sorted[0] ?? null;

  function saveDraft() {
    if (!selected) return;
    if (draft !== (selected.content ?? "")) {
      onUpdateContent(clientId, selected.id, draft);
    }
  }

  function selectStage(id: string) {
    saveDraft();
    setSelectedId(id);
    const next = sorted.find((s) => s.id === id);
    setDraft(next?.content ?? "");
    setLabelDraft(next?.label ?? "");
    setIsEditingLabel(false);
  }

  function handleAddStage() {
    const newStage = onAddStage(clientId, "Nova etapa");
    if (newStage) {
      setSelectedId(newStage.id);
      setDraft("");
      setLabelDraft(newStage.label);
      setIsEditingLabel(true);
    }
  }

  function handleRemoveStage(stageId: string, label: string) {
    if (!confirm(`Excluir a etapa "${label}"?`)) return;
    const idx = sorted.findIndex((s) => s.id === stageId);
    onRemoveStage(clientId, stageId);
    const remaining = sorted.filter((s) => s.id !== stageId);
    const nextSelect =
      remaining[idx] ?? remaining[idx - 1] ?? remaining[0] ?? null;
    setSelectedId(nextSelect?.id ?? null);
    setDraft(nextSelect?.content ?? "");
    setLabelDraft(nextSelect?.label ?? "");
  }

  function saveLabelEdit() {
    if (!selected) return;
    const trimmed = labelDraft.trim();
    if (trimmed && trimmed !== selected.label) {
      onUpdateStage(clientId, selected.id, { label: trimmed });
    } else {
      setLabelDraft(selected.label);
    }
    setIsEditingLabel(false);
  }

  function moveStage(direction: "up" | "down") {
    if (!selected) return;
    const idx = sorted.findIndex((s) => s.id === selected.id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const target = sorted[targetIdx];
    onUpdateStage(clientId, selected.id, { order: target.order });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande (máx 5MB).");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        onAddFile(clientId, selected.id, {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          data,
          size: file.size,
        });
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Erro ao ler arquivo.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Erro ao processar arquivo.");
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Nenhuma etapa configurada.</p>
        <Button size="sm" onClick={handleAddStage} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
          + Nova etapa
        </Button>
      </div>
    );
  }

  const selectedIndex = sorted.findIndex((s) => s.id === selected.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      <aside className="space-y-1">
        {sorted.map((s) => (
          <div
            key={s.id}
            className={cn(
              "group relative w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
              s.id === selected.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-foreground"
            )}
            onClick={() => selectStage(s.id)}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggle(clientId, s.id);
              }}
              className={cn(
                "h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 cursor-pointer transition-colors",
                s.done
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "border-muted-foreground/40 hover:border-muted-foreground"
              )}
            >
              {s.done ? "✓" : s.order}
            </span>
            <span className={cn("flex-1 truncate", s.done && "line-through text-muted-foreground")}>
              {s.label}
            </span>
            {(s.files?.length ?? 0) > 0 && (
              <span className="text-[9px] bg-primary/20 text-primary px-1 rounded shrink-0">
                {s.files!.length}📄
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStage(s.id, s.label);
              }}
              className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0 transition-opacity"
              title="Excluir etapa"
              aria-label="Excluir etapa"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}

        <button
          onClick={handleAddStage}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-dashed border-border hover:border-primary/50 hover:bg-primary/[0.03] text-muted-foreground hover:text-primary transition-colors"
        >
          <span className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center border-2 border-current text-xs leading-none">
            +
          </span>
          <span>Nova etapa</span>
        </button>
      </aside>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-muted-foreground text-sm shrink-0">{selected.order}.</span>
            {isEditingLabel ? (
              <input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={saveLabelEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveLabelEdit();
                  if (e.key === "Escape") {
                    setLabelDraft(selected.label);
                    setIsEditingLabel(false);
                  }
                }}
                autoFocus
                className="flex-1 h-9 text-base font-semibold bg-background border border-border rounded px-2 text-foreground focus:outline-none focus:border-primary/50"
              />
            ) : (
              <h3
                className="text-base font-semibold cursor-text flex-1 truncate group"
                onClick={() => {
                  setLabelDraft(selected.label);
                  setIsEditingLabel(true);
                }}
                title="Clique para renomear"
              >
                {selected.label}
                <span className="ml-2 text-[10px] text-muted-foreground/75 opacity-0 group-hover:opacity-100 transition-opacity">
                  ✏️ renomear
                </span>
              </h3>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => moveStage("up")}
              disabled={selectedIndex === 0}
              className="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Mover para cima"
              aria-label="Mover para cima"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => moveStage("down")}
              disabled={selectedIndex === sorted.length - 1}
              className="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Mover para baixo"
              aria-label="Mover para baixo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <Button
              variant={selected.done ? "secondary" : "default"}
              size="sm"
              onClick={() => onToggle(clientId, selected.id)}
              className={selected.done ? "" : "bg-blue-600 hover:bg-blue-500 text-white border-0"}
            >
              {selected.done ? "✓ Concluída" : "Marcar"}
            </Button>
            <button
              onClick={() => handleRemoveStage(selected.id, selected.label)}
              className="h-8 w-8 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
              title="Excluir etapa"
              aria-label="Excluir etapa"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Anotações</Label>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveDraft}
            placeholder={`Anotações sobre ${selected.label.toLowerCase()}...`}
            rows={6}
          />
          <p className="text-[11px] text-muted-foreground">
            Salvo automaticamente ao perder o foco ou trocar de etapa.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Arquivos anexados</Label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx"
          />
          <div className="space-y-1.5">
            {(selected.files ?? []).map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 p-2 rounded-md bg-card border border-border group"
              >
                <a
                  href={f.data}
                  download={f.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 flex-1 min-w-0 text-primary hover:underline"
                >
                  <span className="text-sm">📎</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                </a>
                <button
                  onClick={() => onRemoveFile(clientId, selected.id, f.id)}
                  className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                  title="Remover"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/[0.03] text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              {uploading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Anexar arquivo (PDF, imagem, doc — máx 5MB)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== TAB 3: PLANEJAMENTO (cards grandes com capa) ===================

function PlanejamentoTab({
  clientId,
  planning,
  onUpdate,
  onAdd,
  onRemove,
  onReorder,
}: {
  clientId: string;
  planning: PlanningCard[];
  onUpdate: (clientId: string, cardId: string, patch: Partial<Omit<PlanningCard, "id">>) => void;
  onAdd: (clientId: string, card: Omit<PlanningCard, "id">) => void;
  onRemove: (clientId: string, cardId: string) => void;
  onReorder: (clientId: string, fromId: string, toId: string) => void;
}) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const selectedCard = planning.find((p) => p.id === selectedCardId) ?? null;

  function handleAdd() {
    if (!newTitle.trim()) return;
    onAdd(clientId, { title: newTitle.trim(), content: "", color: "#1e3a8a" });
    setNewTitle("");
  }

  // Drag & drop handlers
  function handleDragStart(e: React.DragEvent, cardId: string) {
    setDraggingId(cardId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId);
  }
  function handleDragOver(e: React.DragEvent, cardId: string) {
    if (!draggingId || draggingId === cardId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== cardId) setDragOverId(cardId);
  }
  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    onReorder(clientId, draggingId, targetId);
    setDraggingId(null);
    setDragOverId(null);
  }
  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  async function handleCoverUpload(cardId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Imagem muito grande (máx 3MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 600;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        onUpdate(clientId, cardId, { coverImage: compressed });
      };
      img.src = data;
    };
    reader.readAsDataURL(file);
    if (fileInputRefs.current[cardId]) fileInputRefs.current[cardId]!.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {planning.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={(e) => handleDragOver(e, card.id)}
            onDrop={(e) => handleDrop(e, card.id)}
            onDragEnd={handleDragEnd}
            onClick={() => setSelectedCardId(card.id)}
            className={cn(
              "group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:-translate-y-1 hover:shadow-lg",
              draggingId === card.id && "opacity-40",
              dragOverId === card.id && draggingId !== card.id && "ring-4 ring-primary/50 scale-105",
              "active:cursor-grabbing"
            )}
            style={{ borderColor: `${card.color}80` }}
          >
            <div
              className="aspect-[4/3] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
              }}
            >
              {card.coverImage ? (
                <img src={card.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center px-2">
                  <span className="text-base sm:text-lg font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-tight line-clamp-3">
                    {card.title}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <input
                  ref={(el) => { fileInputRefs.current[card.id] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverUpload(card.id, e)}
                  className="hidden"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRefs.current[card.id]?.click();
                  }}
                  className="h-8 px-3 rounded-lg bg-white/90 text-black text-xs font-medium flex items-center gap-1.5 hover:bg-white"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Trocar capa
                </button>
              </div>
              {/* Botão excluir — sempre visível no canto superior direito */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remover "${card.title}"?`)) onRemove(clientId, card.id);
                }}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white hover:bg-red-500/80 flex items-center justify-center transition-colors"
                title="Excluir card"
                aria-label="Excluir card"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
              {/* Indicador de drag — sempre visível no canto superior esquerdo */}
              <div
                className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-grab active:cursor-grabbing"
                title="Arraste para reordenar"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6h8M8 12h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="px-2.5 py-2 bg-card border-t border-border flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0 ring-1 ring-black/10"
                style={{ background: card.color }}
              />
              <span className="text-xs font-semibold text-foreground truncate">{card.title}</span>
              {card.content && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Tem conteúdo" />
              )}
            </div>
          </div>
        ))}

        <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 aspect-[4/3] hover:border-primary/40 transition-colors">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Novo card..."
            className="w-full max-w-[120px] text-center text-xs bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground/75 focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"
          >
            + Adicionar
          </button>
        </div>
      </div>

      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedCardId(null)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative h-32 overflow-hidden rounded-t-xl"
              style={{
                background: `linear-gradient(135deg, ${selectedCard.color} 0%, ${selectedCard.color}dd 100%)`,
              }}
            >
              {selectedCard.coverImage && (
                <img src={selectedCard.coverImage} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                onClick={() => setSelectedCardId(null)}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                <input
                  value={selectedCard.title}
                  onChange={(e) => onUpdate(clientId, selectedCard.id, { title: e.target.value })}
                  className="bg-black/30 backdrop-blur-sm text-white text-lg font-bold outline-none border-b-2 border-white/40 focus:border-white px-2 py-0.5 rounded"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                />
                <input
                  type="color"
                  value={selectedCard.color}
                  onChange={(e) => onUpdate(clientId, selectedCard.id, { color: e.target.value })}
                  className="h-7 w-7 cursor-pointer rounded border border-white/40 bg-transparent p-0"
                  title="Mudar cor do card"
                />
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Verifica se é um card com seções internas (Briefing, Tom de voz) */}
              {(() => {
                const info = getSectionedCardInfo(selectedCard.title);
                if (info) {
                  return (
                    <SectionsEditor
                      card={selectedCard}
                      sections={info.sections}
                      onUpdateSection={(sectionId, value) => {
                        const nextSections = {
                          ...(selectedCard.sections ?? {}),
                          [sectionId]: value,
                        };
                        onUpdate(clientId, selectedCard.id, { sections: nextSections });
                      }}
                      onAddAttachment={(sectionId, attachment) => {
                        const current = selectedCard.sectionAttachments ?? {};
                        const list = current[sectionId] ?? [];
                        const next = {
                          ...current,
                          [sectionId]: [...list, attachment],
                        };
                        onUpdate(clientId, selectedCard.id, { sectionAttachments: next });
                      }}
                      onRemoveAttachment={(sectionId, attachmentId) => {
                        const current = selectedCard.sectionAttachments ?? {};
                        const list = current[sectionId] ?? [];
                        const next = {
                          ...current,
                          [sectionId]: list.filter((a) => a.id !== attachmentId),
                        };
                        onUpdate(clientId, selectedCard.id, { sectionAttachments: next });
                      }}
                      onRestoreAll={() => {
                        if (confirm(`Restaurar o template original de TODAS as seções de ${info.title}? Suas alterações serão perdidas.`)) {
                          const restored: Record<string, string> = {};
                          for (const s of info.sections) {
                            restored[s.id] = s.defaultContent;
                          }
                          onUpdate(clientId, selectedCard.id, { sections: restored });
                        }
                      }}
                      onUpdateCard={(patch) => onUpdate(clientId, selectedCard.id, patch)}
                    />
                  );
                }
                // Card normal: RichTextEditor para conteúdo livre
                return (
                  <>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Conteúdo</Label>
                    <RichTextEditor
                      value={selectedCard.content}
                      onChange={(html) => onUpdate(clientId, selectedCard.id, { content: html })}
                      placeholder="Escreva aqui as informações deste card..."
                      minHeight={240}
                    />
                  </>
                );
              })()}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={(el) => { fileInputRefs.current[selectedCard.id + "_modal"] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverUpload(selectedCard.id, e)}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current[selectedCard.id + "_modal"]?.click()}
                >
                  📷 Trocar capa
                </Button>
                {selectedCard.coverImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate(clientId, selectedCard.id, { coverImage: undefined })}
                    className="text-destructive hover:text-destructive"
                  >
                    Remover capa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================== TAB 4: CALENDÁRIO ===================

function CalendarioTab({ detail }: { detail: import("@/lib/client-detail").ClientDetail }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const allEntries: Array<ContentEntry & { platform: string }> = useMemo(() => {
    return [
      ...detail.instagram.map((e) => ({ ...e, platform: "IG" })),
      ...detail.linkedin.map((e) => ({ ...e, platform: "IN" })),
      ...detail.youtube.map((e) => ({ ...e, platform: "YT" })),
    ];
  }, [detail]);

  function entriesForDate(dateISO: string) {
    return allEntries.filter((e) => e.date === dateISO);
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  }

  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const start = new Date(year, month, 1 - startDay);
  const todayStr = todayISO();
  const cells: { iso: string; day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ iso, day: d.getDate(), inMonth: d.getMonth() === month });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {MONTHS[month]} <span className="text-muted-foreground font-normal">{year}</span>
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth}>‹</Button>
          <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth()); }}>Hoje</Button>
          <Button variant="ghost" size="sm" onClick={nextMonth}>›</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium uppercase text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const entries = entriesForDate(cell.iso);
          const isToday = cell.iso === todayStr;
          return (
            <div
              key={cell.iso}
              className={cn(
                "min-h-16 p-1 rounded-md border text-xs",
                !cell.inMonth && "opacity-35",
                "border-border bg-card"
              )}
            >
              <div className={cn(
                "text-right text-[10px] mb-0.5",
                isToday ? "font-bold text-primary" : "text-muted-foreground"
              )}>
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {entries.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="text-[9px] px-1 py-0.5 rounded truncate"
                    style={{
                      background: e.posted ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                      color: e.posted ? "#10b981" : "#f59e0b",
                    }}
                    title={`${e.platform} · ${e.headline}`}
                  >
                    {e.platform} · {e.headline}
                  </div>
                ))}
                {entries.length > 3 && (
                  <div className="text-[9px] text-muted-foreground">+{entries.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Agendado
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Publicado
        </div>
      </div>
    </div>
  );
}

// =================== TAB 5-7: CONTENT (Instagram/LinkedIn/YouTube) ===================

function ContentTab({
  title,
  clientId,
  platform,
  entries,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  clientId: string;
  platform: "instagram" | "linkedin" | "youtube";
  entries: ContentEntry[];
  onAdd: (clientId: string, platform: "instagram" | "linkedin" | "youtube", entry: Omit<ContentEntry, "id">) => void;
  onUpdate: (clientId: string, platform: "instagram" | "linkedin" | "youtube", entryId: string, patch: Partial<Omit<ContentEntry, "id">>) => void;
  onRemove: (clientId: string, platform: "instagram" | "linkedin" | "youtube", entryId: string) => void;
}) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  function handleAdd() {
    onAdd(clientId, platform, {
      date: todayISO(),
      day: weekdayName(todayISO()),
      headline: "Novo post",
      task: "",
      person: "",
      deliveryDate: todayISO(),
      posted: false,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button size="sm" onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
          + Novo post
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-dashed border-border">
          <div className="text-3xl mb-2 opacity-50">📭</div>
          <p className="text-sm text-muted-foreground">Nenhum post agendado para {title.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border bg-card p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => onUpdate(clientId, platform, entry.id, { date: e.target.value, day: weekdayName(e.target.value) })}
                    className="h-8 w-36 text-xs"
                  />
                  <Input
                    value={entry.headline}
                    onChange={(e) => onUpdate(clientId, platform, entry.id, { headline: e.target.value })}
                    placeholder="Headline / tema"
                    className="h-8 flex-1 min-w-[180px] text-sm"
                  />
                  <Input
                    value={entry.person}
                    onChange={(e) => onUpdate(clientId, platform, entry.id, { person: e.target.value })}
                    placeholder="Responsável"
                    className="h-8 w-32 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdate(clientId, platform, entry.id, { posted: !entry.posted })}
                    className={cn(
                      "h-7 px-2 rounded text-xs font-medium",
                      entry.posted
                        ? "bg-emerald-500/20 text-emerald-500"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {entry.posted ? "✓ Publicado" : "Marcar publicado"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Excluir este post?")) onRemove(clientId, platform, entry.id);
                    }}
                    className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <Input
                value={entry.task}
                onChange={(e) => onUpdate(clientId, platform, entry.id, { task: e.target.value })}
                placeholder="Tarefa / descrição"
                className="h-8 text-xs"
              />
              <div className="flex items-center gap-2">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Entrega:</Label>
                <Input
                  type="date"
                  value={entry.deliveryDate}
                  onChange={(e) => onUpdate(clientId, platform, entry.id, { deliveryDate: e.target.value })}
                  className="h-7 w-36 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =================== Sections Editor (Briefing, Tom de voz, Monetização) ===================

function SectionsEditor({
  card,
  sections,
  onUpdateSection,
  onAddAttachment,
  onRemoveAttachment,
  onRestoreAll,
  onUpdateCard,
}: {
  card: PlanningCard;
  sections: CardSection[];
  onUpdateSection: (sectionId: string, value: string) => void;
  onAddAttachment: (sectionId: string, attachment: Attachment) => void;
  onRemoveAttachment: (sectionId: string, attachmentId: string) => void;
  onRestoreAll: () => void;
  onUpdateCard: (patch: Partial<PlanningCard>) => void;
}) {
  // Usa sectionDefs customizadas se existirem, senão usa as padrão
  const effectiveSections = card.sectionDefs ?? sections;
  const [activeSection, setActiveSection] = useState<string>(effectiveSections[0]?.id ?? "");
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const sectionValues = card.sections ?? {};
  const attachments = card.sectionAttachments ?? {};
  const current = effectiveSections.find((s) => s.id === activeSection) ?? effectiveSections[0];
  const currentValue = sectionValues[current?.id ?? ""] ?? current?.defaultContent ?? "";
  const currentAttachments = attachments[current?.id ?? ""] ?? [];

  // Helper para atualizar as sectionDefs
  function updateSectionDefs(next: CardSection[]) {
    onUpdateCard({ sectionDefs: next });
  }

  // Drag-and-drop handlers para reordenar seções
  function handleSectionDragStart(e: React.DragEvent, sectionId: string) {
    setDraggingSectionId(sectionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
  }
  function handleSectionDragOver(e: React.DragEvent, sectionId: string) {
    if (!draggingSectionId || draggingSectionId === sectionId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSectionId !== sectionId) setDragOverSectionId(sectionId);
  }
  function handleSectionDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingSectionId || draggingSectionId === targetId) {
      setDraggingSectionId(null);
      setDragOverSectionId(null);
      return;
    }
    const list = [...effectiveSections];
    const fromIdx = list.findIndex((s) => s.id === draggingSectionId);
    const toIdx = list.findIndex((s) => s.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingSectionId(null);
      setDragOverSectionId(null);
      return;
    }
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    updateSectionDefs(list);
    setDraggingSectionId(null);
    setDragOverSectionId(null);
  }
  function handleSectionDragEnd() {
    setDraggingSectionId(null);
    setDragOverSectionId(null);
  }

  // Editar seção (label + emoji)
  function startEditSection(section: CardSection) {
    setEditingSectionId(section.id);
    setEditLabel(section.label);
    setEditEmoji(section.emoji ?? "");
  }
  function saveEditSection() {
    if (!editingSectionId) return;
    const next = effectiveSections.map((s) =>
      s.id === editingSectionId
        ? { ...s, label: editLabel.trim() || s.label, emoji: editEmoji.trim() || undefined }
        : s
    );
    updateSectionDefs(next);
    setEditingSectionId(null);
  }

  // Criar nova seção
  function handleCreateSection() {
    const label = newLabel.trim();
    if (!label) return;
    const id = `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const newSection: CardSection = {
      id,
      label,
      emoji: newEmoji.trim() || undefined,
      defaultContent: "",
    };
    const next = [...effectiveSections, newSection];
    updateSectionDefs(next);
    // Inicializa conteúdo vazio para a nova seção
    onUpdateSection(id, "");
    setActiveSection(id);
    setNewLabel("");
    setNewEmoji("");
    setShowNewSectionForm(false);
  }

  // Excluir seção
  function handleDeleteSection(sectionId: string) {
    const section = effectiveSections.find((s) => s.id === sectionId);
    if (!section) return;
    if (effectiveSections.length <= 1) {
      alert("Não é possível excluir a última seção.");
      return;
    }
    if (!confirm(`Excluir a seção "${section.label}"? O conteúdo será perdido.`)) return;
    const next = effectiveSections.filter((s) => s.id !== sectionId);
    updateSectionDefs(next);
    // Limpa conteúdo e anexos da seção excluída
    const newSections = { ...sectionValues };
    delete newSections[sectionId];
    const newAttachments = { ...attachments };
    delete newAttachments[sectionId];
    onUpdateCard({ sections: newSections, sectionAttachments: newAttachments });
    if (activeSection === sectionId) {
      setActiveSection(next[0]?.id ?? "");
    }
  }

  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Seções
        </Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewSectionForm((v) => !v)}
            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-7 text-xs"
          >
            + Nova seção
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestoreAll}
            className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-7 text-xs"
          >
            ↻ Restaurar tudo
          </Button>
        </div>
      </div>

      {/* Form de nova seção */}
      {showNewSectionForm && (
        <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
          <Input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="🎯"
            maxLength={4}
            className="h-7 w-12 text-sm text-center"
          />
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nome da nova seção"
            className="h-7 flex-1 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateSection();
              if (e.key === "Escape") setShowNewSectionForm(false);
            }}
          />
          <Button
            size="sm"
            onClick={handleCreateSection}
            disabled={!newLabel.trim()}
            className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white border-0 text-xs"
          >
            Criar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewSectionForm(false)}
            className="h-7 text-xs text-muted-foreground"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Abas das seções — scroll horizontal com setas + drag-and-drop */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (tabsScrollRef.current) {
              tabsScrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
            }
          }}
          className="h-7 w-7 shrink-0 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors"
          title="Rolar para esquerda"
          aria-label="Rolar para esquerda"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div
          ref={tabsScrollRef}
          className="sections-tabs-scroll flex gap-1 overflow-x-auto border-b border-border pb-0.5 flex-1"
        >
          {effectiveSections.map((section) => {
            const isActive = section.id === activeSection;
            const hasContent = (sectionValues[section.id] ?? "").trim() !== "";
            const isDefault = (sectionValues[section.id] ?? "") === section.defaultContent;
            const sectionAttachments = attachments[section.id] ?? [];
            const isEditing = editingSectionId === section.id;
            const isDragging = draggingSectionId === section.id;
            const isDragOver = dragOverSectionId === section.id && draggingSectionId !== section.id;
            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleSectionDragStart(e, section.id)}
                onDragOver={(e) => handleSectionDragOver(e, section.id)}
                onDrop={(e) => handleSectionDrop(e, section.id)}
                onDragEnd={handleSectionDragEnd}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-2 rounded-t-md text-xs whitespace-nowrap border-b-2 transition-all shrink-0 group",
                  isActive
                    ? "border-primary text-foreground bg-muted/40 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  isDragging && "opacity-40",
                  isDragOver && "ring-2 ring-primary/50"
                )}
              >
                {/* Handle de drag */}
                <span className="cursor-grab active:cursor-grabbing text-muted-foreground/60 group-hover:text-muted-foreground">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M8 6h8M8 12h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                {isEditing ? (
                  <>
                    <input
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      maxLength={4}
                      className="w-8 text-sm bg-transparent border-b border-border text-center focus:outline-none focus:border-primary"
                      placeholder="🎯"
                    />
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="bg-transparent border-b border-border text-xs focus:outline-none focus:border-primary w-32"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditSection();
                        if (e.key === "Escape") setEditingSectionId(null);
                      }}
                    />
                    <button
                      onClick={saveEditSection}
                      className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded p-0.5"
                      title="Salvar"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="text-muted-foreground hover:bg-muted rounded p-0.5"
                      title="Cancelar"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className="flex items-center gap-1"
                    >
                      {section.emoji && <span className="text-sm">{section.emoji}</span>}
                      <span>{section.label}</span>
                    </button>
                    {hasContent && !isDefault && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Editado" />
                    )}
                    {sectionAttachments.length > 0 && (
                      <span
                        className="h-3.5 min-w-3.5 px-1 rounded-full bg-blue-500/30 text-blue-500 text-[9px] font-semibold flex items-center justify-center"
                        title={`${sectionAttachments.length} anexo(s)`}
                      >
                        {sectionAttachments.length}
                      </span>
                    )}
                    {/* Botões editar + excluir (aparecem no hover) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditSection(section); }}
                      className="h-6 w-6 rounded-md text-foreground/80 hover:text-primary hover:bg-primary/10 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/30"
                      title="Editar nome"
                      aria-label="Editar nome"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                      className="h-6 w-6 rounded-md text-foreground/80 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-destructive/30"
                      title="Excluir seção"
                      aria-label="Excluir seção"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            if (tabsScrollRef.current) {
              tabsScrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
            }
          }}
          className="h-7 w-7 shrink-0 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors"
          title="Rolar para direita"
          aria-label="Rolar para direita"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {current.emoji} <span className="font-medium text-foreground">{current.label}</span>
          </p>
          {current.type !== "table" && (
            <button
              onClick={() => {
                if (confirm(`Restaurar apenas a seção "${current.label}"?`)) {
                  onUpdateSection(current.id, current.defaultContent);
                }
              }}
              className="text-[11px] text-blue-500 hover:text-blue-400 transition-colors"
            >
              ↻ restaurar esta seção
            </button>
          )}
        </div>

        {/* Renderiza TableEditor para seções tipo tabela, RichTextEditor para as demais */}
        {current.type === "table" && current.tableColumns ? (
          <TableEditor
            columns={current.tableColumns}
            data={(() => {
              try {
                return JSON.parse(currentValue || "[]");
              } catch {
                return [];
              }
            })()}
            onChange={(rows) => onUpdateSection(current.id, JSON.stringify(rows))}
          />
        ) : (
          <RichTextEditor
            value={currentValue}
            onChange={(html) => onUpdateSection(current.id, html)}
            placeholder={`Conteúdo de ${current.label}...`}
            minHeight={260}
          />
        )}

        <div className="pt-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
            📎 Anexos desta seção
          </p>
          <AttachmentsList
            attachments={currentAttachments}
            onAdd={(att) => onAddAttachment(current.id, att)}
            onRemove={(id) => onRemoveAttachment(current.id, id)}
            maxSizeMB={5}
          />
        </div>
      </div>
    </div>
  );
}

// =================== TABLE EDITOR (for structured tables like Provas Sociais) ===================

function TableEditor({
  columns,
  data,
  onChange,
}: {
  columns: string[];
  data: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
}) {
  function updateCell(rowIndex: number, column: string, value: string) {
    const next = [...data];
    next[rowIndex] = { ...next[rowIndex], [column]: value };
    onChange(next);
  }
  function addRow() {
    const newRow: Record<string, string> = {};
    for (const col of columns) {
      newRow[col] = col === "Status" ? "Ainda não usada" : col === "Material" ? "N/A" : "";
    }
    onChange([...data, newRow]);
  }
  function removeRow(rowIndex: number) {
    onChange(data.filter((_, i) => i !== rowIndex));
  }

  const STATUS_OPTIONS = ["Ainda não usada", "Usada recentemente", "Usada a muito tempo", "Já usada"];
  const STATUS_COLORS: Record<string, string> = {
    "Ainda não usada": "#16a34a",
    "Usada recentemente": "#2563eb",
    "Usada a muito tempo": "#f59e0b",
    "Já usada": "#dc2626",
  };

  return (
    <div className="space-y-2">
      {/* Legenda de status */}
      <div className="flex flex-wrap gap-2 mb-2">
        {STATUS_OPTIONS.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              background: `${STATUS_COLORS[status]}15`,
              color: STATUS_COLORS[status],
              border: `1px solid ${STATUS_COLORS[status]}30`,
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
            {status}
          </span>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-2 text-left text-[10px] uppercase tracking-wide font-bold text-foreground/70 dark:text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-xs text-muted-foreground py-6">
                  Nenhuma prova social registrada ainda.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors group">
                  {columns.map((col) => (
                    <td key={col} className="px-1.5 py-1">
                      {col === "Status" ? (
                        <select
                          value={row[col] ?? ""}
                          onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                          className="w-full h-7 text-xs bg-transparent border border-border rounded px-1 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                          style={{
                            color: STATUS_COLORS[row[col] ?? ""] ?? "inherit",
                            fontWeight: 600,
                          }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} style={{ color: "inherit", fontWeight: "normal" }}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row[col] ?? ""}
                          onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                          placeholder={col === "Material" ? "N/A" : "..."}
                          className="w-full h-7 text-xs bg-transparent border border-transparent hover:border-border focus:border-primary/50 rounded px-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-background transition-colors"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center">
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="h-6 w-6 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir linha"
                      aria-label="Excluir linha"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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

      {/* Botão adicionar linha */}
      <button
        onClick={addRow}
        className="h-8 px-3 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center gap-1.5 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Adicionar linha
      </button>
    </div>
  );
}

// =================== TAB: MÉTRICAS ===================

function MetricasTab({
  clientId,
  metrics,
  onAdd,
  onRemove,
}: {
  clientId: string;
  metrics: import("@/lib/client-detail").MetricEntry[];
  onAdd: (clientId: string, metric: Omit<import("@/lib/client-detail").MetricEntry, "id" | "createdAt">) => void;
  onRemove: (clientId: string, metricId: string) => void;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [platform, setPlatform] = useState("Geral");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const v = parseFloat(value.replace(",", "."));
    if (!n || isNaN(v)) return;
    onAdd(clientId, {
      month,
      name: n,
      value: v,
      unit: unit.trim() || undefined,
      platform: platform.trim() || undefined,
    });
    setName("");
    setValue("");
    setUnit("");
  }

  // Agrupa por plataforma
  const byPlatform = useMemo(() => {
    const groups = new Map<string, import("@/lib/client-detail").MetricEntry[]>();
    metrics.forEach((m) => {
      const p = m.platform ?? "Geral";
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p)!.push(m);
    });
    return Array.from(groups.entries());
  }, [metrics]);

  return (
    <div className="max-w-3xl space-y-4">
      {/* Form de adicionar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-3">📊 Adicionar métrica</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome (Seguidores)"
            className="text-sm col-span-2 sm:col-span-1"
            required
          />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valor (1200)"
            type="text"
            className="text-sm"
            required
          />
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unidade (%)"
            className="text-sm"
          />
          <Input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Plataforma"
            className="text-sm"
          />
          <Input
            type="month"
            value={month.slice(0, 7)}
            onChange={(e) => setMonth(`${e.target.value}-01`)}
            className="text-sm"
          />
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 col-span-2 sm:col-span-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Adicionar
          </Button>
        </form>
      </div>

      {/* Lista de métricas por plataforma */}
      {metrics.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-4xl mb-2 opacity-40">📊</div>
          <p className="text-sm text-muted-foreground">Nenhuma métrica registrada ainda.</p>
        </div>
      ) : (
        byPlatform.map(([platform, items]) => (
          <div key={platform} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
              <h4 className="text-xs uppercase tracking-wide font-bold text-foreground">{platform}</h4>
            </div>
            <div className="divide-y divide-border">
              {items
                .slice()
                .sort((a, b) => (a.month < b.month ? 1 : -1))
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.month + "T00:00:00").toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground tabular-nums">
                        {m.value.toLocaleString("pt-BR")}
                        {m.unit && <span className="text-xs text-muted-foreground ml-0.5">{m.unit}</span>}
                      </span>
                      <button
                        onClick={() => onRemove(clientId, m.id)}
                        className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        aria-label="Excluir métrica"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// =================== TAB: DOCUMENTOS ===================

function DocumentosTab({
  clientId,
  documents,
  onAdd,
  onRemove,
}: {
  clientId: string;
  documents: import("@/lib/client-detail").Attachment[];
  onAdd: (clientId: string, doc: Omit<import("@/lib/client-detail").Attachment, "id" | "createdAt">) => void;
  onRemove: (clientId: string, docId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 5MB.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      onAdd(clientId, {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data: dataUrl,
      });
    } catch (err) {
      alert("Erro ao ler arquivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileEmoji(mime: string): string {
    if (mime.startsWith("image/")) return "🖼️";
    if (mime === "application/pdf") return "📄";
    if (mime.includes("word") || mime.includes("document")) return "📝";
    if (mime.includes("sheet") || mime.includes("excel")) return "📊";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "📑";
    if (mime.startsWith("video/")) return "🎬";
    if (mime.startsWith("audio/")) return "🎵";
    return "📎";
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Upload */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">📎 Documentos do cliente</h3>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            disabled={uploading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {uploading ? "Enviando..." : "Enviar arquivo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFile}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          💡 Contratos, briefings, propostas, briefings assinados. Máx 5MB por arquivo.
        </p>
      </div>

      {/* Lista de documentos */}
      {documents.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-4xl mb-2 opacity-40">📎</div>
          <p className="text-sm text-muted-foreground">Nenhum documento anexado ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 group">
              <span className="text-2xl shrink-0">{fileEmoji(doc.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(doc.size)} · {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <a
                href={doc.data}
                download={doc.name}
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0"
                title="Baixar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <button
                onClick={() => onRemove(clientId, doc.id)}
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                aria-label="Excluir"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =================== TAB: HISTÓRICO ===================

function HistoricoTab({
  clientId,
  timeline,
  onAdd,
  onRemove,
}: {
  clientId: string;
  timeline: import("@/lib/client-detail").TimelineEntry[];
  onAdd: (clientId: string, entry: Omit<import("@/lib/client-detail").TimelineEntry, "id" | "createdAt">) => void;
  onRemove: (clientId: string, entryId: string) => void;
}) {
  const [type, setType] = useState<import("@/lib/client-detail").TimelineEntry["type"]>("reuniao");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAdd(clientId, {
      type,
      title: t,
      description: description.trim() || undefined,
      date,
    });
    setTitle("");
    setDescription("");
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Form de adicionar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-3">⏱️ Registrar evento</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {TIMELINE_TYPE_OPTIONS.map((opt) => {
              const isActive = type === opt.value;
              const color = TIMELINE_TYPE_COLORS[opt.value];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-semibold border transition-all",
                    isActive ? "text-white border-transparent shadow-sm" : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                  )}
                  style={isActive ? { background: color, borderColor: color } : undefined}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do evento"
              className="text-sm sm:col-span-2"
              required
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm"
            />
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional) — decisões, próximos passos..."
            rows={2}
            className="text-sm"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Adicionar ao histórico
          </Button>
        </form>
      </div>

      {/* Timeline */}
      {timeline.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-4xl mb-2 opacity-40">⏱️</div>
          <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">Linha do tempo</h3>
          <div className="space-y-3">
            {timeline.map((entry) => {
              const color = TIMELINE_TYPE_COLORS[entry.type];
              const emoji = TIMELINE_TYPE_EMOJIS[entry.type];
              const label = TIMELINE_TYPE_LABELS[entry.type];
              return (
                <div key={entry.id} className="flex gap-3 group">
                  {/* Linha + emoji */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-base ring-2 ring-background shadow-sm"
                      style={{ background: `${color}20` }}
                    >
                      {emoji}
                    </div>
                    <div className="w-px flex-1 bg-border mt-1" />
                  </div>
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{entry.title}</p>
                        <span
                          className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: `${color}20`, color }}
                        >
                          {label}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemove(clientId, entry.id)}
                        className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label="Excluir"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1">
                      {new Date(entry.date + "T00:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-foreground/80 leading-relaxed">{entry.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =================== Helpers ===================

function formatBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
