"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { FinanceiroView } from "@/components/social-media/financeiro-view";
import { CrmEquipeView } from "@/components/social-media/crm-equipe-view";
import { ProspecaoCRM } from "@/components/social-media/prospecao-crm";
import { FuturoView } from "@/components/social-media/futuro-view";
import { OffboardingView } from "@/components/social-media/offboarding-view";
import { LinksView } from "@/components/social-media/links-view";
import { BancoHeadlineView } from "@/components/social-media/banco-headline-view";
import { useEnterpriseData } from "@/hooks/use-enterprise-data";
import { useEnterpriseProducts, type CatalogProduct } from "@/hooks/use-enterprise-products";
import { PrecificacaoPanel } from "@/components/social-media/precificacao-panel";
import type { PageCard } from "@/lib/pages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EnterpriseManagerProps {
  page: PageCard;
  onClose: () => void;
}

// Tipos de dados para cada aba customizada
interface SimpleTask { id: string; text: string; done: boolean; }
interface InventoryItem { id: string; name: string; quantity: string; unit: string; minStock: string; price: string; notes: string; category: string; }
interface ServiceItem { id: string; name: string; delivery: string; price: string; duration: string; info: string; category: string; }
interface MetricItem { id: string; name: string; value: string; unit: string; date: string; target: string; previous: string; category: string; notes: string; }
interface EventItem { id: string; title: string; date: string; type: string; notes: string; }
interface GoalItem { id: string; title: string; deadline: string; progress: number; notes: string; priority: string; category: string; stepByStep: { id: string; title: string; description: string; done: boolean }[]; }
interface ProjectItem { id: string; name: string; status: string; deadline: string; responsible: string; notes: string; progress: number; priority: string; category: string; description: string; stepByStep: { id: string; title: string; description: string; done: boolean }[]; }
interface ProcessItem { id: string; name: string; steps: string; owner: string; frequency: string; notes: string; status: string; lastRun: string; checklist: { id: string; text: string; done: boolean }[]; stepByStep: { id: string; title: string; description: string; done: boolean }[]; }
interface MarketingItem { id: string; campaign: string; platform: string; budget: string; status: string; results: string; startDate: string; endDate: string; category: string; notes: string; }
interface MeetingItem { id: string; title: string; date: string; participants: string; agenda: string; decisions: string; time: string; location: string; status: string; actionItems: { id: string; text: string; done: boolean }[]; }
interface CustomTab { id: string; label: string; emoji: string; type: string; }

type EnterpriseTabId = string;

const DEFAULT_TABS: { id: string; label: string; emoji: string; color: string; type: "builtin" | "custom" }[] = [
  { id: "tarefas", label: "Tarefas", emoji: "✅", color: "#7c2d12", type: "builtin" },
  { id: "prospecao", label: "Prospecção", emoji: "🎯", color: "#1e3a8a", type: "builtin" },
  { id: "crm-equipe", label: "CRM Equipe", emoji: "👥", color: "#14532d", type: "builtin" },
  { id: "crm-clientes", label: "CRM Clientes", emoji: "🤝", color: "#7c2d12", type: "builtin" },
  { id: "financeiro", label: "Financeiro", emoji: "💰", color: "#166534", type: "builtin" },
  { id: "estoque", label: "Estoque", emoji: "📦", color: "#1e1b4b", type: "builtin" },
  { id: "futuro", label: "Futuro", emoji: "🚀", color: "#1e1b4b", type: "builtin" },
  { id: "offboarding", label: "Offboarding", emoji: "👋", color: "#7f1d1d", type: "builtin" },
  { id: "links", label: "Links", emoji: "🔗", color: "#155e75", type: "builtin" },
  { id: "headlines", label: "Headlines", emoji: "📋", color: "#713f12", type: "builtin" },
  { id: "metricas", label: "Métricas", emoji: "📊", color: "#0f766e", type: "builtin" },
  { id: "produtos", label: "Produtos", emoji: "🏷️", color: "#6b7280", type: "builtin" },
  { id: "eventos", label: "Datas/Eventos", emoji: "📅", color: "#2563eb", type: "builtin" },
  { id: "metas", label: "Metas", emoji: "🏁", color: "#16a34a", type: "builtin" },
  { id: "projetos", label: "Projetos", emoji: "📁", color: "#7c3aed", type: "builtin" },
  { id: "processos", label: "Processos", emoji: "⚙️", color: "#0891b2", type: "builtin" },
  { id: "marketing", label: "Marketing", emoji: "📢", color: "#db2777", type: "builtin" },
  { id: "reunioes", label: "Reuniões", emoji: "🗓️", color: "#ea580c", type: "builtin" },
  { id: "precificacao", label: "Precificação", emoji: "💰", color: "#0d9488", type: "builtin" },
];

const TAB_TEMPLATES: { label: string; emoji: string; type: string; description: string }[] = [
  { label: "Checklist", emoji: "✅", type: "checklist", description: "Lista de tarefas com checkboxes" },
  { label: "Anotações", emoji: "📝", type: "notes", description: "Bloco de anotações livre" },
  { label: "Tabela", emoji: "📊", type: "table", description: "Tabela editável com colunas customizáveis" },
  { label: "Links", emoji: "🔗", type: "links", description: "Lista de links organizados" },
  { label: "Contatos", emoji: "📇", type: "contacts", description: "Lista de contatos com nome, telefone e email" },
  { label: "Financeiro simples", emoji: "💵", type: "simple-finance", description: "Entradas e saídas com saldo automático" },
  { label: "Ideias", emoji: "💡", type: "ideas", description: "Brainstorm com título, descrição e status" },
  { label: "Hábitos", emoji: "🔄", type: "habits", description: "Hábitos para acompanhar diariamente" },
  { label: "Estoque simples", emoji: "📦", type: "simple-inventory", description: "Itens com quantidade e observação" },
  { label: "Agenda", emoji: "📆", type: "agenda", description: "Compromissos com data e horário" },
  { label: "Metas pessoais", emoji: "🎯", type: "personal-goals", description: "Metas com progresso e prioridade" },
  { label: "Avaliações", emoji: "⭐", type: "reviews", description: "Avaliações com nota e comentário" },
];

function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function EnterpriseManager({ page, onClose }: EnterpriseManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("tarefas");
  const [showAddTab, setShowAddTab] = useState(false);
  const [tabMenuOpen, setTabMenuOpen] = useState<string | null>(null);
  const [renamingTab, setRenamingTab] = useState<{ id: string; label: string; emoji: string } | null>(null);

  // Tabs customizadas
  const { data: customTabs, setData: setCustomTabs } = useEnterpriseData<CustomTab[]>(
    page.id, "customTabs", []
  );

  // Ordem das tabs (persistida por empresa) — IDs na ordem em que aparecem
  const { data: tabOrder, setData: setTabOrder } = useEnterpriseData<string[]>(
    page.id, "tabOrder", []
  );

  // Lista completa (builtin + custom) — combina default com tabs customizadas
  const allTabsRaw = useMemo(() => [
    ...DEFAULT_TABS,
    ...customTabs.map(t => ({ ...t, color: "#475569", type: "custom" as const })),
  ], [customTabs]);

  // Aplica a ordem salva — tabs em `tabOrder` aparecem primeiro na ordem salva,
  // tabs não listadas (ex: novas builtin) aparecem depois na ordem original.
  const allTabs = useMemo(() => {
    if (!Array.isArray(tabOrder) || tabOrder.length === 0) return allTabsRaw;
    const orderMap = new Map<string, number>();
    tabOrder.forEach((id, i) => orderMap.set(id, i));
    return [...allTabsRaw].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999 + allTabsRaw.indexOf(a);
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999 + allTabsRaw.indexOf(b);
      return ai - bi;
    });
  }, [allTabsRaw, tabOrder]);

  // Drag state para reordenar tabs
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  function handleTabDragStart(e: React.DragEvent, tabId: string) {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tabId);
  }
  function handleTabDragOver(e: React.DragEvent, tabId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedTabId && draggedTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  }
  function handleTabDrop(targetTabId: string) {
    if (!draggedTabId || draggedTabId === targetTabId) {
      setDraggedTabId(null);
      setDragOverTabId(null);
      return;
    }
    // Constrói nova ordem a partir da ordem atual visível
    const currentOrder = allTabs.map(t => t.id);
    const fromIdx = currentOrder.indexOf(draggedTabId);
    const toIdx = currentOrder.indexOf(targetTabId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...currentOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedTabId);
    setTabOrder(newOrder);
    setDraggedTabId(null);
    setDragOverTabId(null);
  }
  function handleTabDragEnd() {
    setDraggedTabId(null);
    setDragOverTabId(null);
  }

  function addCustomTab(label: string, emoji: string, type: string) {
    const newTab: CustomTab = { id: makeId("tab"), label, emoji, type };
    setCustomTabs([...customTabs, newTab]);
    setActiveTab(newTab.id);
    setShowAddTab(false);
  }
  function removeCustomTab(tabId: string) {
    setCustomTabs(customTabs.filter((t) => t.id !== tabId));
    // Se a aba ativa foi removida, volta para a primeira aba
    if (activeTab === tabId) {
      setActiveTab(DEFAULT_TABS[0].id);
    }
  }
  function renameCustomTab(tabId: string, label: string, emoji: string) {
    setCustomTabs(customTabs.map((t) => (t.id === tabId ? { ...t, label, emoji } : t)));
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#1e3a8a"} 0%, ${page.color ?? "#1e3a8a"}dd 100%)`, color: "#fff" }}>
              {page.emoji || page.title.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground">{page.title}</h1>
              <p className="text-xs text-muted-foreground">Gestão empresarial</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FontScaleControl />
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Menu cards */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 sections-tabs-scroll">
          {allTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDragged = draggedTabId === tab.id;
            const isDragOver = dragOverTabId === tab.id;
            const isCustom = tab.type === "custom";
            return (
              <div
                key={tab.id}
                draggable
                onDragStart={(e) => handleTabDragStart(e, tab.id)}
                onDragOver={(e) => handleTabDragOver(e, tab.id)}
                onDrop={() => handleTabDrop(tab.id)}
                onDragEnd={handleTabDragEnd}
                onClick={() => { setActiveTab(tab.id); setTabMenuOpen(null); }}
                className={cn(
                  "group flex flex-col items-center justify-center gap-1 w-[80px] h-[72px] rounded-lg border transition-all shrink-0 cursor-grab active:cursor-grabbing relative",
                  isActive ? "border-transparent text-white shadow-md scale-105" : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent",
                  isDragged && "opacity-40",
                  isDragOver && "ring-2 ring-blue-500 ring-offset-1 ring-offset-card"
                )}
                style={isActive ? { background: tab.color } : undefined}
                title="Arraste para reordenar"
              >
                <span className="text-xl">{tab.emoji}</span>
                <span className="text-[10px] font-semibold text-center leading-tight">{tab.label}</span>
                {/* Botão de opções para abas customizáveis — abre um Dialog (não dropdown, para evitar clip do overflow) */}
                {isCustom && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setTabMenuOpen(tab.id); }}
                    className={cn(
                      "absolute top-0.5 right-0.5 h-4 w-4 rounded-full flex items-center justify-center transition-opacity z-10",
                      isActive ? "bg-white/20 text-white opacity-80 hover:opacity-100" : "bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-foreground/10"
                    )}
                    title="Opções da aba"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                  </button>
                )}
              </div>
            );
          })}
          {/* Botão + Nova aba */}
          <button onClick={() => setShowAddTab(true)}
            className="flex flex-col items-center justify-center gap-1 w-[80px] h-[72px] rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="text-[10px] font-semibold">Nova aba</span>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">💡 Dica: arraste os cards para reordenar · Abas customizadas têm menu de opções (⋮)</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        {/* Built-in tabs */}
        {activeTab === "tarefas" && <TarefasPanel pageId={page.id} />}
        {activeTab === "prospecao" && <ProspecaoCRM />}
        {activeTab === "crm-equipe" && <CrmEquipeView />}
        {activeTab === "crm-clientes" && <CrmClientesPanel pageId={page.id} />}
        {activeTab === "financeiro" && <FinanceiroView />}
        {activeTab === "estoque" && <EstoquePanel pageId={page.id} />}
        {activeTab === "futuro" && <FuturoView />}
        {activeTab === "offboarding" && <OffboardingView />}
        {activeTab === "links" && <LinksView />}
        {activeTab === "headlines" && <BancoHeadlineView />}
        {activeTab === "metricas" && <MetricasPanel pageId={page.id} />}
        {activeTab === "produtos" && <ProdutosPanel pageId={page.id} />}
        {activeTab === "eventos" && <EventosPanel pageId={page.id} />}
        {activeTab === "metas" && <MetasPanel pageId={page.id} />}
        {activeTab === "projetos" && <ProjetosPanel pageId={page.id} />}
        {activeTab === "processos" && <ProcessosPanel pageId={page.id} />}
        {activeTab === "marketing" && <MarketingPanel pageId={page.id} />}
        {activeTab === "reunioes" && <ReunioesPanel pageId={page.id} />}
        {activeTab === "precificacao" && <PrecificacaoPanel pageId={page.id} />}
        {/* Custom tabs */}
        {customTabs.map((tab) => {
          if (activeTab !== tab.id) return null;
          if (tab.type === "checklist") return <CustomChecklistPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "notes") return <CustomNotesPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "table") return <CustomTablePanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "links") return <CustomLinksPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "contacts") return <CustomContactsPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "simple-finance") return <CustomSimpleFinancePanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "ideas") return <CustomIdeasPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "habits") return <CustomHabitsPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "simple-inventory") return <CustomSimpleInventoryPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "agenda") return <CustomAgendaPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "personal-goals") return <CustomPersonalGoalsPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          if (tab.type === "reviews") return <CustomReviewsPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
          return <CustomNotesPanel key={tab.id} pageId={page.id} tabId={tab.id} />;
        })}
      </div>

      {/* Dialog: Nova aba */}
      {showAddTab && <AddTabDialog onClose={() => setShowAddTab(false)} onAdd={addCustomTab} />}
      {/* Dialog: Renomear aba */}
      {renamingTab && (
        <RenameTabDialog
          initialLabel={renamingTab.label}
          initialEmoji={renamingTab.emoji}
          onClose={() => setRenamingTab(null)}
          onSave={(label, emoji) => { renameCustomTab(renamingTab.id, label, emoji); setRenamingTab(null); }}
        />
      )}
      {/* Dialog: Opções da aba (Renomear / Excluir) — renderiza em portal, sem ser clipado pelo overflow */}
      {tabMenuOpen && (() => {
        const tab = allTabs.find((t) => t.id === tabMenuOpen);
        if (!tab) return null;
        return (
          <Dialog open onOpenChange={(o) => !o && setTabMenuOpen(null)}>
            <DialogContent className="bg-card text-card-foreground border-border max-w-xs p-0 overflow-hidden">
              <DialogHeader className="px-4 pt-4 pb-2">
                <DialogTitle className="text-sm flex items-center gap-2">
                  <span className="text-lg">{tab.emoji}</span>
                  {tab.label}
                </DialogTitle>
              </DialogHeader>
              <div className="p-2">
                <button
                  onClick={() => { setRenamingTab({ id: tab.id, label: tab.label, emoji: tab.emoji }); setTabMenuOpen(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-md hover:bg-accent transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Renomear aba
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir a aba "${tab.label}"? Os dados salvos nesta aba serão perdidos.`)) {
                      removeCustomTab(tab.id);
                      setTabMenuOpen(null);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Excluir aba
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}

// =================== Add Tab Dialog ===================
function AddTabDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (label: string, emoji: string, type: string) => void }) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [type, setType] = useState("checklist");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
        <DialogHeader><DialogTitle>Nova aba</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-16 text-center text-lg" placeholder="📝" />
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome da aba" className="flex-1" autoFocus />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-2">Escolha um template ({TAB_TEMPLATES.length} opções)</p>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {TAB_TEMPLATES.map((tpl) => (
                <button key={tpl.type} onClick={() => { setType(tpl.type); setEmoji(tpl.emoji); if (!label.trim()) setLabel(tpl.label); }}
                  className={cn("flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all",
                    type === tpl.type ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20")}>
                  <span className="text-lg">{tpl.emoji} {tpl.label}</span>
                  <span className="text-[11px] text-muted-foreground">{tpl.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => label.trim() && onAdd(label.trim(), emoji.trim() || "📝", type)} disabled={!label.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">Criar aba</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =================== Rename Tab Dialog ===================
function RenameTabDialog({ initialLabel, initialEmoji, onClose, onSave }: { initialLabel: string; initialEmoji: string; onClose: () => void; onSave: (label: string, emoji: string) => void }) {
  const [label, setLabel] = useState(initialLabel);
  const [emoji, setEmoji] = useState(initialEmoji);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-md">
        <DialogHeader><DialogTitle>Renomear aba</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-16 text-center text-lg" placeholder="📝" />
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome da aba" className="flex-1" autoFocus />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => label.trim() && onSave(label.trim(), emoji.trim() || "📝")} disabled={!label.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =================== Panels ===================

function PanelHeader({ emoji, title }: { emoji: string; title: string }) {
  return <div className="flex items-center gap-2 mb-4"><span className="text-lg">{emoji}</span><h2 className="text-base font-bold text-foreground">{title}</h2></div>;
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className="mt-3 h-8 px-3 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center gap-1.5 transition-colors">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>{label}</button>;
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="h-6 w-6 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Excluir">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>;
}

function TaskRow({ task, onUpdate, onRemove }: { task: SimpleTask; onUpdate: (t: SimpleTask) => void; onRemove: () => void }) {
  return <div className="flex items-center gap-2 group rounded-md border border-border bg-card p-2 hover:border-primary/30 transition-colors">
    <input type="checkbox" checked={task.done} onChange={(e) => onUpdate({ ...task, done: e.target.checked })} className="h-4 w-4 accent-blue-600 shrink-0" />
    <input type="text" value={task.text} onChange={(e) => onUpdate({ ...task, text: e.target.value })} placeholder="Digite a tarefa..." className={cn("flex-1 h-8 text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary/50 px-1 text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors", task.done && "line-through text-muted-foreground")} />
    <RemoveBtn onClick={onRemove} />
  </div>;
}

function TarefasPanel({ pageId }: { pageId: string }) {
  const { data: tasks, setData } = useEnterpriseData<SimpleTask[]>(pageId, "tarefas", [{ id: makeId(), text: "", done: false }, { id: makeId(), text: "", done: false }, { id: makeId(), text: "", done: false }]);
  return <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6"><PanelHeader emoji="✅" title="Tarefas" />
    <div className="space-y-2">{tasks.map((t, i) => <TaskRow key={t.id} task={t} onUpdate={(nt) => setData(tasks.map((x, xi) => xi === i ? nt : x))} onRemove={() => setData(tasks.filter((_, xi) => xi !== i))} />)}</div>
    <AddButton onClick={() => setData([...tasks, { id: makeId(), text: "", done: false }])} label="Adicionar tarefa" /></div>;
}

// Produto/serviço de interesse do cliente
interface ClientProduct {
  id: string;
  name: string;
  value: string;
  lastProposal: string; // ISO date
  notes: string;
}

// Tipo de cliente do CRM empresarial
interface EnterpriseClient {
  id: string;
  name: string;
  contact: string;
  email: string;
  whatsapp: string;
  status: "Ativo" | "Pausado" | "Inativo" | "Lead";
  products: ClientProduct[]; // produtos/serviços de interesse com valor, data e notas
  notes: string;
  createdAt: number;
}

const CLIENT_STATUS_COLORS: Record<string, string> = {
  "Ativo": "#16a34a",
  "Pausado": "#ca8a04",
  "Inativo": "#dc2626",
  "Lead": "#2563eb",
};

function normalizeClient(c: Partial<EnterpriseClient> & { id: string }): EnterpriseClient {
  return {
    id: c.id,
    name: c.name ?? "",
    contact: c.contact ?? "",
    email: c.email ?? "",
    whatsapp: c.whatsapp ?? "",
    status: (c.status as EnterpriseClient["status"]) ?? "Lead",
    // Garante que products sempre existe — migração para dados antigos sem este campo
    products: Array.isArray(c.products) ? c.products.map((p) => ({
      id: p.id ?? makeId("prod"),
      name: p.name ?? "",
      value: p.value ?? "",
      lastProposal: p.lastProposal ?? "",
      notes: p.notes ?? "",
    })) : [],
    notes: c.notes ?? "",
    createdAt: c.createdAt ?? Date.now(),
  };
}

function CrmClientesPanel({ pageId }: { pageId: string }) {
  const { data: rawClients, setData } = useEnterpriseData<EnterpriseClient[]>(pageId, "crm-clientes", []);
  // Normaliza clients — garante que todo client tem products: ClientProduct[]
  // (necessário para dados salvos antes do campo products existir)
  const clients = useMemo<EnterpriseClient[]>(
    () => (Array.isArray(rawClients) ? rawClients.map(normalizeClient) : []),
    [rawClients]
  );

  // Migração: se algum client tinha dados antigos (sem products), persiste a versão normalizada.
  // Roda apenas uma vez por mount quando detecta diferença.
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    if (!Array.isArray(rawClients)) return;
    const needsMigration = rawClients.some(
      (c) => !c || !Array.isArray(c.products) || c.products.some((p) => !p || !p.id)
    );
    if (needsMigration) {
      setData(clients);
    }
  }, [rawClients, clients, setData]);

  const { products: catalogProducts } = useEnterpriseProducts(pageId);
  // 🔄 NOVA FONTE DO CATÁLOGO: produtos vindos do menu Estoque + Serviços
  // O usuário só seleciona, e valor + descrição são auto-preenchidos.
  const { data: estoqueItems } = useEnterpriseData<InventoryItem[]>(pageId, "estoque", []);
  const { data: servicosItems } = useEnterpriseData<ServiceItem[]>(pageId, "servicos", []);

  // Catálogo unificado (Estoque + Serviços + catálogo legado de Produtos)
  type CatalogEntry = { id: string; kind: "estoque" | "servico" | "produto"; name: string; value: string; description: string; category: string };
  const catalogEntries = useMemo<CatalogEntry[]>(() => {
    const estoqueArr = Array.isArray(estoqueItems) ? estoqueItems : [];
    const servicosArr = Array.isArray(servicosItems) ? servicosItems : [];
    const fromEstoque: CatalogEntry[] = estoqueArr
      .filter((it) => it && typeof it === "object" && (it.name ?? "").trim() !== "")
      .map((it) => ({
        id: `est_${it.id}`,
        kind: "estoque" as const,
        name: it.name,
        value: it.price ?? "",
        description: it.notes ?? "",
        category: (it.category ?? "").trim(),
      }));
    const fromServicos: CatalogEntry[] = servicosArr
      .filter((s) => s && typeof s === "object" && (s.name ?? "").trim() !== "")
      .map((s) => ({
        id: `svc_${s.id}`,
        kind: "servico" as const,
        name: s.name,
        value: s.price ?? "",
        description: s.info ?? "",
        category: ((s as ServiceItem & { category?: string }).category ?? "").trim(),
      }));
    const fromLegacy: CatalogEntry[] = (Array.isArray(catalogProducts) ? catalogProducts : [])
      .filter((p) => p && p.active && (p.name ?? "").trim() !== "")
      .map((p) => ({
        id: `prod_${p.id}`,
        kind: "produto" as const,
        name: p.name,
        value: p.value ?? "",
        description: p.description ?? "",
        category: "",
      }));
    return [...fromEstoque, ...fromServicos, ...fromLegacy];
  }, [estoqueItems, servicosItems, catalogProducts]);

  // Categorias presentes no catálogo (Estoque + Serviços)
  const catalogCategories = useMemo(() => {
    const set = new Set<string>();
    catalogEntries.forEach((e) => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [catalogEntries]);

  // Estado do filtro de categoria dentro do picker do CRM Clientes
  const [pickerCat, setPickerCat] = useState<string>("Todas");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Estado do dropdown de seleção de produto por cliente (clientId → texto de busca)
  const [pickerQuery, setPickerQuery] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);

  // Fecha o picker ao clicar fora dele
  useEffect(() => {
    if (!pickerOpen) return;
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Não fecha se clicar em qualquer elemento marcado com data-picker
      if (target.closest("[data-picker-root]")) return;
      setPickerOpen(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter !== "Todos" && c.status !== statusFilter) return false;
      if (s) {
        const hay = `${c.name} ${c.contact} ${c.email} ${c.products.map(p => p.name).join(" ")}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [clients, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Todos: clients.length, Ativo: 0, Pausado: 0, Inativo: 0, Lead: 0 };
    clients.forEach((cl) => { c[cl.status] = (c[cl.status] ?? 0) + 1; });
    return c;
  }, [clients]);

  function updateClient(id: string, patch: Partial<EnterpriseClient>) {
    setData(clients.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function addClient() {
    const newClient: EnterpriseClient = { id: makeId("cli"), name: "", contact: "", email: "", whatsapp: "", status: "Lead", products: [], notes: "", createdAt: Date.now() };
    setData([...clients, newClient]);
    setExpandedId(newClient.id);
  }
  function removeClient(id: string) {
    setData(clients.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  }
  function addProductFromCatalog(clientId: string, entry: CatalogEntry) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    // Não duplica pelo nome
    if (client.products.some((p) => p.name === entry.name)) return;
    const newProd: ClientProduct = {
      id: makeId("prod"),
      name: entry.name,
      // Auto-preenche valor e descrição vindos do Estoque/Serviços
      value: entry.value || "",
      lastProposal: "",
      notes: entry.description || "",
    };
    updateClient(clientId, { products: [...client.products, newProd] });
    // Limpa o picker do cliente e fecha
    setPickerOpen(null);
    setPickerQuery((q) => ({ ...q, [clientId]: "" }));
  }
  function updateProduct(clientId: string, productId: string, patch: Partial<ClientProduct>) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      updateClient(clientId, { products: client.products.map((p) => (p.id === productId ? { ...p, ...patch } : p)) });
    }
  }
  function removeProduct(clientId: string, productId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      updateClient(clientId, { products: client.products.filter((p) => p.id !== productId) });
    }
  }

  const FILTERS = ["Todos", "Ativo", "Pausado", "Inativo", "Lead"];

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤝</span>
              <h2 className="text-base font-bold text-foreground">CRM Clientes</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {clients.length} clientes · Gerencie contatos, status e produtos de interesse
            </p>
          </div>
          <button onClick={addClient} className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Novo cliente
          </button>
        </div>

        {/* Filtros + busca */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const isActive = statusFilter === f;
              const color = f !== "Todos" ? CLIENT_STATUS_COLORS[f] : null;
              return (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={cn("inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border transition-all",
                    isActive ? "text-white border-transparent shadow-sm" : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent")}
                  style={isActive && color ? { background: color, borderColor: color } : isActive ? { background: "var(--foreground)", borderColor: "var(--foreground)" } : undefined}>
                  {color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
                  {f}
                  <span className={cn("text-[10px] px-1 rounded font-bold", isActive ? "bg-black/15" : "bg-muted text-muted-foreground")}>{counts[f] ?? 0}</span>
                </button>
              );
            })}
          </div>
          <div className="relative max-w-xs w-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="h-8 pl-9 text-xs" />
          </div>
        </div>

        {/* Lista de clientes — cards expansíveis */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <div className="text-5xl mb-3 opacity-40">🤝</div>
            <p className="text-base font-medium text-foreground mb-1">{clients.length === 0 ? "Nenhum cliente ainda" : "Nenhum cliente encontrado"}</p>
            <p className="text-sm text-muted-foreground mb-4">{clients.length === 0 ? 'Crie o primeiro com o botão "Novo cliente".' : "Tente outros filtros."}</p>
            {clients.length === 0 && <button onClick={addClient} className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>Novo cliente</button>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const isExpanded = expandedId === c.id;
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  {/* Linha principal */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ring-1 ring-black/5 dark:ring-white/10" style={{ background: `linear-gradient(135deg, ${CLIENT_STATUS_COLORS[c.status]} 0%, ${CLIENT_STATUS_COLORS[c.status]}dd 100%)`, color: "#fff" }}>
                      {c.name ? c.name.slice(0, 2).toUpperCase() : "?"}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{c.name || "Sem nome"}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: CLIENT_STATUS_COLORS[c.status], color: "#fff" }}>{c.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {c.contact && <span>{c.contact}</span>}
                        {c.email && <span>· {c.email}</span>}
                        {c.products.length > 0 && <span className="text-blue-600 dark:text-blue-400">· {c.products.length} produto(s) de interesse</span>}
                      </div>
                    </div>
                    {/* Expandir */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>

                  {/* Conteúdo expandido */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-2 border-t border-border space-y-3 bg-muted/10">
                      {/* Campos editáveis */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">Nome</label>
                          <input type="text" value={c.name} onChange={(e) => updateClient(c.id, { name: e.target.value })} placeholder="Nome do cliente" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">Contato</label>
                          <input type="text" value={c.contact} onChange={(e) => updateClient(c.id, { contact: e.target.value })} placeholder="@handle ou nome" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">Email</label>
                          <input type="text" value={c.email} onChange={(e) => updateClient(c.id, { email: e.target.value })} placeholder="email@exemplo.com" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">WhatsApp</label>
                          <input type="text" value={c.whatsapp} onChange={(e) => updateClient(c.id, { whatsapp: e.target.value })} placeholder="11999999999" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">Status</label>
                          <select value={c.status} onChange={(e) => updateClient(c.id, { status: e.target.value as EnterpriseClient["status"] })} className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                            <option>Lead</option><option>Ativo</option><option>Pausado</option><option>Inativo</option>
                          </select>
                        </div>
                      </div>

                      {/* Produtos/Serviços de interesse */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-1.5 block">📦 Produtos / Serviços de interesse</label>
                        {c.products.length === 0 && <p className="text-xs text-muted-foreground italic mb-2">Nenhum produto adicionado.</p>}
                        <div className="space-y-2 mb-2">
                          {c.products.map((p) => (
                            <div key={p.id} className="group rounded-lg border border-border bg-background p-2.5 space-y-2">
                              <div className="flex items-center gap-2">
                                <input type="text" value={p.name} onChange={(e) => updateProduct(c.id, p.id, { name: e.target.value })} placeholder="Nome do produto/serviço" className="flex-1 h-7 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                                <button onClick={() => removeProduct(c.id, p.id)} className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0" title="Excluir produto">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] uppercase tracking-wide text-muted-foreground">Valor</label>
                                  <input type="text" value={p.value} onChange={(e) => updateProduct(c.id, p.id, { value: e.target.value })} placeholder="R$ 2.500" className="w-full h-7 text-xs bg-transparent border border-border rounded px-1.5 focus:outline-none focus:border-primary/50" />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wide text-muted-foreground">Última proposta</label>
                                  <input type="date" value={p.lastProposal} onChange={(e) => updateProduct(c.id, p.id, { lastProposal: e.target.value })} className="w-full h-7 text-xs bg-transparent border border-border rounded px-1.5 focus:outline-none focus:border-primary/50" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wide text-muted-foreground">Anotações</label>
                                <textarea value={p.notes} onChange={(e) => updateProduct(c.id, p.id, { notes: e.target.value })} placeholder="Anotações sobre este produto..." rows={2} className="w-full text-xs bg-transparent border border-border rounded px-1.5 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Seletor único — puxa do Estoque + Serviços (e catálogo legado) */}
                        <div className="relative" data-picker-root>
                          <button
                            type="button"
                            onClick={() => {
                              setPickerOpen(pickerOpen === c.id ? null : c.id);
                              setPickerQuery((q) => ({ ...q, [c.id]: q[c.id] ?? "" }));
                            }}
                            className="w-full h-9 px-3 rounded-md bg-background border border-border hover:border-primary/40 text-xs font-medium text-foreground flex items-center justify-between gap-2 transition-colors"
                          >
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                              Selecionar produto/serviço do catálogo
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform", pickerOpen === c.id && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          {pickerOpen === c.id && (
                            <div className="absolute z-30 mt-1 left-0 right-0 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
                              {/* Linha 1: busca por texto */}
                              <div className="p-2 border-b border-border">
                                <input
                                  type="text"
                                  value={pickerQuery[c.id] ?? ""}
                                  onChange={(e) => setPickerQuery((q) => ({ ...q, [c.id]: e.target.value }))}
                                  placeholder="Buscar produto/serviço..."
                                  autoFocus
                                  className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50"
                                />
                              </div>
                              {/* Linha 2: filtro de categoria (chips) */}
                              {catalogCategories.length > 0 && (
                                <div className="px-2 py-1.5 border-b border-border flex flex-wrap gap-1 items-center">
                                  <span className="text-[10px] text-muted-foreground mr-1">Categoria:</span>
                                  <button
                                    type="button"
                                    onClick={() => setPickerCat("Todas")}
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                                      pickerCat === "Todas"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                                    )}
                                  >
                                    Todas
                                  </button>
                                  {catalogCategories.map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setPickerCat(cat)}
                                      className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                                        pickerCat === cat
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                                      )}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {/* Linha 3: lista de itens agrupados por tipo */}
                              <div className="max-h-64 overflow-y-auto">
                                {catalogEntries.length === 0 ? (
                                  <div className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Nenhum item cadastrado.</p>
                                    <p className="text-[10px] text-muted-foreground">Cadastre produtos em <b>Estoque</b> ou serviços em <b>Serviços</b>.</p>
                                  </div>
                                ) : (
                                  (() => {
                                    const q = (pickerQuery[c.id] ?? "").trim().toLowerCase();
                                    let filteredEntries = catalogEntries;
                                    if (pickerCat !== "Todas") {
                                      filteredEntries = filteredEntries.filter((e) => e.category === pickerCat);
                                    }
                                    if (q) {
                                      filteredEntries = filteredEntries.filter((e) =>
                                        `${e.name} ${e.description}`.toLowerCase().includes(q)
                                      );
                                    }
                                    if (filteredEntries.length === 0) {
                                      return <p className="p-3 text-xs text-muted-foreground text-center">Nenhum resultado.</p>;
                                    }
                                    // Agrupa por kind
                                    const allGroups: { kind: CatalogEntry["kind"]; label: string; emoji: string; items: CatalogEntry[] }[] = [
                                      { kind: "estoque" as const, label: "Produtos (Estoque)", emoji: "📦", items: filteredEntries.filter((e) => e.kind === "estoque") },
                                      { kind: "servico" as const, label: "Serviços", emoji: "🛠️", items: filteredEntries.filter((e) => e.kind === "servico") },
                                      { kind: "produto" as const, label: "Catálogo antigo", emoji: "🏷️", items: filteredEntries.filter((e) => e.kind === "produto") },
                                    ];
                                    const groups = allGroups.filter((g) => g.items.length > 0);

                                    return groups.map((g) => (
                                      <div key={g.kind}>
                                        <div className="sticky top-0 bg-muted/60 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground border-b border-border">
                                          {g.emoji} {g.label} <span className="opacity-60">({g.items.length})</span>
                                        </div>
                                        {g.items.map((entry) => {
                                          const alreadyAdded = c.products.some((p) => p.name === entry.name);
                                          return (
                                            <button
                                              key={entry.id}
                                              type="button"
                                              onClick={() => !alreadyAdded && addProductFromCatalog(c.id, entry)}
                                              disabled={alreadyAdded}
                                              className={cn(
                                                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors border-b border-border/50 last:border-0",
                                                alreadyAdded
                                                  ? "bg-muted/40 text-muted-foreground cursor-default opacity-60"
                                                  : "hover:bg-accent text-foreground cursor-pointer"
                                              )}
                                            >
                                              <span className="flex flex-col min-w-0 gap-0.5">
                                                <span className="flex items-center gap-2">
                                                  <span className="font-medium truncate">{entry.name}</span>
                                                  {entry.category && <span className="text-[9px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">{entry.category}</span>}
                                                </span>
                                                {entry.description && <span className="text-[10px] text-muted-foreground truncate">{entry.description}</span>}
                                              </span>
                                              <span className="flex items-center gap-2 shrink-0">
                                                {entry.value && <span className="text-[10px] text-muted-foreground font-medium">{entry.value}</span>}
                                                {alreadyAdded ? (
                                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓</span>
                                                ) : (
                                                  <span className="text-[10px] text-blue-600 dark:text-blue-400">+</span>
                                                )}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ));
                                  })()
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {catalogEntries.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            💡 {catalogEntries.filter((e) => e.kind === "estoque").length} produto(s) do Estoque · {catalogEntries.filter((e) => e.kind === "servico").length} serviço(s) disponível(is)
                          </p>
                        )}
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-1.5 block">📝 Notas</label>
                        <textarea value={c.notes} onChange={(e) => updateClient(c.id, { notes: e.target.value })} placeholder="Anotações sobre este cliente..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-primary/50 resize-y" />
                      </div>

                      {/* Excluir */}
                      <div className="flex justify-end pt-2 border-t border-border">
                        <button onClick={() => removeClient(c.id)} className="h-8 px-3 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-1.5 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Excluir cliente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EstoquePanel({ pageId }: { pageId: string }) {
  const { data: items, setData } = useEnterpriseData<InventoryItem[]>(pageId, "estoque", []);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("Todas");

  // Migração: garante que itens antigos tenham os campos novos (price, category)
  const normalizedItems = useMemo(() => items.map((it) => ({
    ...it,
    price: it.price ?? "",
    category: it.category ?? "",
  })), [items]);

  // Agrupa itens por categoria para os cards
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    normalizedItems.forEach((it) => {
      const c = (it.category ?? "").trim() || "Sem categoria";
      map.set(c, (map.get(c) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [normalizedItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedItems.filter((it) => {
      const cat = (it.category ?? "").trim() || "Sem categoria";
      if (filterCat !== "Todas" && cat !== filterCat) return false;
      if (q) {
        const hay = `${it.name} ${it.notes ?? ""} ${it.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [normalizedItems, search, filterCat]);

  function setItems(next: InventoryItem[]) { setData(next); }
  function updateAt(i: number, patch: Partial<InventoryItem>) {
    setItems(normalizedItems.map((x, xi) => xi === i ? { ...x, ...patch } : x));
  }

  // Cores para os cards de categoria (paleta consistente)
  const CARD_COLORS = [
    "from-blue-500/15 to-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/25",
    "from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    "from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/25",
    "from-pink-500/15 to-pink-500/5 text-pink-700 dark:text-pink-300 border-pink-500/25",
    "from-purple-500/15 to-purple-500/5 text-purple-700 dark:text-purple-300 border-purple-500/25",
    "from-cyan-500/15 to-cyan-500/5 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
    "from-orange-500/15 to-orange-500/5 text-orange-700 dark:text-orange-300 border-orange-500/25",
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📦" title="Estoque" />
      <p className="text-xs text-muted-foreground mb-4">💡 Itens cadastrados aqui aparecem como opções no CRM Clientes (com valor e notas preenchidos automaticamente).</p>

      {/* Cards de categoria */}
      {normalizedItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-5">
          {/* Card "Todas" */}
          <button
            onClick={() => setFilterCat("Todas")}
            className={cn(
              "group relative rounded-lg border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md",
              filterCat === "Todas"
                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                : "bg-gradient-to-br border-border bg-card text-foreground hover:border-primary/40"
            )}
          >
            <div className="text-xl mb-1">📦</div>
            <div className="text-xs font-bold truncate">Todas</div>
            <div className={cn("text-[10px] mt-0.5", filterCat === "Todas" ? "text-blue-100" : "text-muted-foreground")}>{normalizedItems.length} item(ns)</div>
          </button>
          {/* Cards por categoria */}
          {categories.map(([cat, count], idx) => {
            const colorClass = CARD_COLORS[idx % CARD_COLORS.length];
            const isActive = filterCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(isActive ? "Todas" : cat)}
                className={cn(
                  "group relative rounded-lg border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md bg-gradient-to-br",
                  isActive
                    ? "from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                    : colorClass
                )}
              >
                <div className="text-xl mb-1">📁</div>
                <div className="text-xs font-bold truncate" title={cat}>{cat}</div>
                <div className={cn("text-[10px] mt-0.5", isActive ? "text-blue-100" : "opacity-70")}>{count} item(ns)</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Barra de busca */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar item..." className="h-8 pl-9 text-xs" />
        </div>
        {filterCat !== "Todas" && (
          <button onClick={() => setFilterCat("Todas")} className="h-8 px-3 text-xs rounded-md bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Limpar filtro: {filterCat}
          </button>
        )}
      </div>

      {normalizedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum item. Clique em "+ Adicionar item".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum item encontrado com os filtros.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const realIdx = normalizedItems.findIndex((x) => x.id === item.id);
            return (
              <div key={item.id} className="group rounded-md border border-border bg-card p-2 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-1">
                  <input type="text" value={item.name} onChange={(e) => updateAt(realIdx, { name: e.target.value })} placeholder="Nome do item *" className="flex-1 h-8 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" autoFocus={(item.name ?? "") === ""} />
                  <input type="text" list="estoque-categories" value={item.category} onChange={(e) => updateAt(realIdx, { category: e.target.value })} placeholder="Categoria" className="h-8 text-xs bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none w-32" />
                  <RemoveBtn onClick={() => setItems(normalizedItems.filter((x) => x.id !== item.id))} />
                </div>
                {(item.name ?? "").trim() === "" && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-1">⚠️ Preencha o nome — sem nome, este item não aparece no CRM Clientes.</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input type="text" value={item.quantity} onChange={(e) => updateAt(realIdx, { quantity: e.target.value })} placeholder="Qtd" className="h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  <input type="text" value={item.unit} onChange={(e) => updateAt(realIdx, { unit: e.target.value })} placeholder="Unidade" className="h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  <input type="text" value={item.minStock} onChange={(e) => updateAt(realIdx, { minStock: e.target.value })} placeholder="Mínimo" className="h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  <input type="text" value={item.price} onChange={(e) => updateAt(realIdx, { price: e.target.value })} placeholder="Valor (R$)" className="h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <datalist id="estoque-categories">
        {categories.map(([c]) => <option key={c} value={c === "Sem categoria" ? "" : c} />)}
      </datalist>
      <AddButton onClick={() => setItems([...normalizedItems, { id: makeId(), name: "", quantity: "", unit: "un", minStock: "", price: "", notes: "", category: filterCat !== "Todas" && filterCat !== "Sem categoria" ? filterCat : "" }])} label="Adicionar item" />
    </div>
  );
}


function MetricasPanel({ pageId }: { pageId: string }) {
  const { data: rawMetrics, setData } = useEnterpriseData<MetricItem[]>(pageId, "metricas", []);
  // Migração: garante campos novos
  const metrics = useMemo(() => (Array.isArray(rawMetrics) ? rawMetrics : []).map((m) => ({
    ...m,
    target: m.target ?? "",
    previous: m.previous ?? "",
    category: m.category ?? "",
    notes: m.notes ?? "",
  })), [rawMetrics]);
  const [filterCat, setFilterCat] = useState<string>("Todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    metrics.forEach((m) => { if ((m.category ?? "").trim()) set.add(m.category.trim()); });
    return Array.from(set).sort();
  }, [metrics]);

  const filtered = useMemo(() => {
    if (filterCat === "Todas") return metrics;
    return metrics.filter((m) => (m.category ?? "") === filterCat);
  }, [metrics, filterCat]);

  function parseNum(s: string): number {
    const n = parseFloat(String(s).replace(/[^\d,.-]/g, "").replace(",", "."));
    return isFinite(n) ? n : 0;
  }
  function updateAt(id: string, patch: Partial<MetricItem>) {
    setData(metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📊" title="Métricas" />

      {/* Filtro de categoria */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setFilterCat("Todas")} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterCat === "Todas" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>Todas</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterCat === c ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>{c}</button>
          ))}
        </div>
      )}

      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma métrica. Clique em "+ Adicionar métrica".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma métrica nesta categoria.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            const val = parseNum(m.value);
            const target = parseNum(m.target);
            const prev = parseNum(m.previous);
            const trend = prev > 0 ? ((val - prev) / prev) * 100 : 0;
            const targetProgress = target > 0 ? Math.min((val / target) * 100, 100) : 0;
            return (
              <div key={m.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-foreground truncate">{m.name || "Métrica sem nome"}</p>
                      {m.category && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">{m.category}</span>}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">{m.value || "—"}</span>
                      {m.unit && <span className="text-xs text-muted-foreground">{m.unit}</span>}
                      {prev > 0 && (
                        <span className={cn("text-[10px] font-bold flex items-center gap-0.5", trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {target > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", targetProgress >= 100 ? "bg-emerald-500" : targetProgress >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${targetProgress}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground shrink-0">{targetProgress.toFixed(0)}% de {m.target}</span>
                      </div>
                    )}
                  </div>
                  {m.date && <span className="text-[10px] text-muted-foreground shrink-0">{new Date(m.date + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-2 bg-muted/10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Nome *</label>
                        <input type="text" value={m.name} onChange={(e) => updateAt(m.id, { name: e.target.value })} placeholder="Ex: Vendas mensais" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Valor</label>
                        <input type="text" inputMode="decimal" value={m.value} onChange={(e) => updateAt(m.id, { value: e.target.value })} placeholder="Ex: 1500" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Unidade</label>
                        <input type="text" value={m.unit} onChange={(e) => updateAt(m.id, { unit: e.target.value })} placeholder="Ex: R$, %, un" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Meta (target)</label>
                        <input type="text" inputMode="decimal" value={m.target} onChange={(e) => updateAt(m.id, { target: e.target.value })} placeholder="Ex: 2000" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Valor anterior</label>
                        <input type="text" inputMode="decimal" value={m.previous} onChange={(e) => updateAt(m.id, { previous: e.target.value })} placeholder="Ex: 1200" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Data</label>
                        <input type="date" value={m.date} onChange={(e) => updateAt(m.id, { date: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Categoria</label>
                      <input type="text" list="metricas-cats" value={m.category} onChange={(e) => updateAt(m.id, { category: e.target.value })} placeholder="Ex: Vendas, Tráfego" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      <datalist id="metricas-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Notas</label>
                      <textarea value={m.notes} onChange={(e) => updateAt(m.id, { notes: e.target.value })} placeholder="Anotações..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(metrics.filter((x) => x.id !== m.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...metrics, { id: makeId(), name: "", value: "", unit: "", date: "", target: "", previous: "", category: filterCat !== "Todas" ? filterCat : "", notes: "" }])} label="Adicionar métrica" />
    </div>
  );
}

// =================== Produtos Panel (catálogo de produtos/serviços) ===================

function ProdutosPanel({ pageId }: { pageId: string }) {
  const { products, addProduct, updateProduct, removeProduct } = useEnterpriseProducts(pageId);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function handleAdd() {
    if (!newName.trim()) return;
    addProduct(newName.trim(), newValue.trim(), newDesc.trim());
    setNewName(""); setNewValue(""); setNewDesc(""); setShowForm(false);
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <PanelHeader emoji="🏷️" title="Produtos & Serviços" />
        <button onClick={() => setShowForm(v => !v)} className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Novo produto
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        💡 Os produtos cadastrados aqui aparecem automaticamente no CRM Clientes e na Prospecção com nome e valor pré-preenchidos.
      </p>

      {showForm && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do produto/serviço" className="h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" autoFocus />
            <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Valor (R$ 2.500)" className="h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" className="h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="h-8 px-3 rounded text-xs text-muted-foreground hover:bg-muted">Cancelar</button>
            <button onClick={handleAdd} disabled={!newName.trim()} className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-40">Adicionar</button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-4xl mb-2 opacity-40">🏷️</div>
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado. Clique em "Novo produto".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} placeholder="Nome" className="h-7 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <input type="text" value={p.value} onChange={(e) => updateProduct(p.id, { value: e.target.value })} placeholder="Valor" className="h-7 text-sm bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <input type="text" value={p.description} onChange={(e) => updateProduct(p.id, { description: e.target.value })} placeholder="Descrição" className="h-7 text-xs bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
              </div>
              <button onClick={() => updateProduct(p.id, { active: !p.active })} className={cn("h-7 px-2 rounded text-[10px] font-bold", p.active ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")} title={p.active ? "Ativo" : "Inativo"}>
                {p.active ? "● Ativo" : "○ Inativo"}
              </button>
              <RemoveBtn onClick={() => removeProduct(p.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventosPanel({ pageId }: { pageId: string }) {
  const { data: events, setData } = useEnterpriseData<EventItem[]>(pageId, "eventos", []);
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  // Modo de edição dos emojis dos meses
  const [editMode, setEditMode] = useState(false);
  // Emojis customizados por mês — { "01": "🎁", "02": "", ... } (vazio = sem emoji)
  const { data: customEmojis, setData: setCustomEmojis } = useEnterpriseData<Record<string, string>>(pageId, "eventos-emojis", {});
  const types = ["Reunião", "Evento", "Prazo", "Lançamento", "Outro"];

  const DEFAULT_MONTHS = [
    { id: "01", label: "Janeiro",    emoji: "❄️" },
    { id: "02", label: "Fevereiro",  emoji: "💝" },
    { id: "03", label: "Março",      emoji: "🌱" },
    { id: "04", label: "Abril",      emoji: "🌸" },
    { id: "05", label: "Maio",       emoji: "💐" },
    { id: "06", label: "Junho",      emoji: "☀️" },
    { id: "07", label: "Julho",      emoji: "🍦" },
    { id: "08", label: "Agosto",     emoji: "🌻" },
    { id: "09", label: "Setembro",   emoji: "🍂" },
    { id: "10", label: "Outubro",    emoji: "🎃" },
    { id: "11", label: "Novembro",   emoji: "🦃" },
    { id: "12", label: "Dezembro",   emoji: "🎄" },
  ];

  // Combina defaults com customizações do usuário
  // Se o mês tem entry em customEmojis (mesmo vazio ""), usa ela; senão usa o default
  const MONTHS = useMemo(() => DEFAULT_MONTHS.map((m) => ({
    ...m,
    emoji: m.id in customEmojis ? customEmojis[m.id] : m.emoji,
  })), [customEmojis]);

  function setMonthEmoji(monthId: string, emoji: string) {
    setCustomEmojis({ ...customEmojis, [monthId]: emoji });
  }
  function resetEmojis() {
    setCustomEmojis({});
  }

  // Extrai mês (MM) de uma data ISO (YYYY-MM-DD)
  function getMonth(date: string): string | null {
    if (!date || date.length < 7) return null;
    return date.slice(5, 7);
  }

  // Conta eventos por mês
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MONTHS.forEach((m) => { counts[m.id] = 0; });
    let noDateCount = 0;
    events.forEach((ev) => {
      const m = getMonth(ev.date);
      if (m && counts[m] !== undefined) counts[m]++;
      else noDateCount++;
    });
    return { counts, noDateCount };
  }, [events]);

  // Filtra eventos pelo mês selecionado
  const filtered = useMemo(() => {
    if (selectedMonth === "todos") return events;
    if (selectedMonth === "sem-data") return events.filter((ev) => !getMonth(ev.date));
    return events.filter((ev) => getMonth(ev.date) === selectedMonth);
  }, [events, selectedMonth]);

  function updateAt(i: number, patch: Partial<EventItem>) {
    setData(events.map((x, xi) => xi === i ? { ...x, ...patch } : x));
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-1">
        <PanelHeader emoji="📅" title="Datas & Eventos" />
        {events.length > 0 && (
          <div className="flex items-center gap-1.5">
            {editMode && (
              <button onClick={resetEmojis} className="h-7 px-2.5 text-[10px] rounded-md bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground flex items-center gap-1" title="Restaurar emojis padrão">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Padrão
              </button>
            )}
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn(
                "h-7 px-2.5 text-[10px] rounded-md flex items-center gap-1 font-semibold transition-colors",
                editMode
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
              title={editMode ? "Concluir edição" : "Editar emojis dos meses"}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {editMode ? "Concluir" : "✏️ Emojis"}
            </button>
          </div>
        )}
      </div>

      {/* Cards de meses */}
      {events.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 mb-5">
          {/* Card "Todos" */}
          <button
            onClick={() => !editMode && setSelectedMonth("todos")}
            disabled={editMode}
            className={cn(
              "group relative rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02] hover:shadow-md",
              !editMode && selectedMonth === "todos"
                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                : "border-border bg-card text-foreground hover:border-primary/40",
              editMode && "opacity-50 cursor-default"
            )}
          >
            <div className="text-base mb-0.5">📋</div>
            <div className="text-[11px] font-bold truncate">Todos</div>
            <div className={cn("text-[9px] mt-0.5", !editMode && selectedMonth === "todos" ? "text-blue-100" : "text-muted-foreground")}>{events.length} evento(s)</div>
          </button>
          {/* Cards de cada mês */}
          {MONTHS.map((m) => {
            const isActive = !editMode && selectedMonth === m.id;
            const count = monthCounts.counts[m.id] ?? 0;
            const isCustomized = m.id in customEmojis;
            return (
              <div
                key={m.id}
                className={cn(
                  "group relative rounded-lg border p-2.5 text-left transition-all",
                  editMode
                    ? "border-blue-500/40 bg-blue-500/5"
                    : cn(
                        "hover:scale-[1.02] hover:shadow-md",
                        isActive
                          ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                          : count > 0
                            ? "border-blue-500/30 bg-blue-500/5 text-foreground hover:border-blue-500/50"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )
                )}
              >
                {editMode ? (
                  // Modo edição — input para trocar o emoji
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={m.emoji}
                      onChange={(e) => setMonthEmoji(m.id, e.target.value)}
                      placeholder="—"
                      maxLength={4}
                      className="w-full h-7 text-base text-center bg-background border border-border rounded px-1 focus:outline-none focus:border-blue-500"
                      title="Digite um emoji ou deixe vazio para remover"
                    />
                    <div className="text-[10px] font-bold truncate text-foreground">{m.label}</div>
                    <div className="text-[9px] text-muted-foreground">{count} evento(s)</div>
                    {isCustomized && (
                      <button
                        onClick={() => setMonthEmoji(m.id, DEFAULT_MONTHS.find((d) => d.id === m.id)?.emoji ?? "")}
                        className="text-[8px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                        title="Restaurar padrão deste mês"
                      >
                        ↺ padrão
                      </button>
                    )}
                  </div>
                ) : (
                  // Modo visualização — card clicável
                  <button
                    onClick={() => setSelectedMonth(isActive ? "todos" : m.id)}
                    className="w-full h-full text-left"
                  >
                    <div className="text-base mb-0.5">{m.emoji || "·"}</div>
                    <div className="text-[11px] font-bold truncate">{m.label}</div>
                    <div className={cn("text-[9px] mt-0.5", isActive ? "text-blue-100" : count > 0 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-muted-foreground/60")}>{count} evento(s)</div>
                  </button>
                )}
              </div>
            );
          })}
          {/* Card "Sem data" */}
          {monthCounts.noDateCount > 0 && (
            <button
              onClick={() => !editMode && setSelectedMonth(selectedMonth === "sem-data" ? "todos" : "sem-data")}
              disabled={editMode}
              className={cn(
                "group relative rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                !editMode && selectedMonth === "sem-data"
                  ? "bg-gradient-to-br from-amber-600 to-amber-500 text-white border-amber-600 shadow-md"
                  : "border-amber-500/30 bg-amber-500/5 text-foreground hover:border-amber-500/50",
                editMode && "opacity-50 cursor-default"
              )}
            >
              <div className="text-base mb-0.5">❓</div>
              <div className="text-[11px] font-bold truncate">Sem data</div>
              <div className={cn("text-[9px] mt-0.5", !editMode && selectedMonth === "sem-data" ? "text-amber-100" : "text-amber-600 dark:text-amber-400 font-bold")}>{monthCounts.noDateCount} evento(s)</div>
            </button>
          )}
        </div>
      )}

      {editMode && (
        <p className="text-[10px] text-muted-foreground mb-4 text-center">
          💡 Clique no campo do emoji para editar. Deixe vazio para remover. Clique em "Concluir" quando terminar.
        </p>
      )}

      {/* Filtro ativo */}
      {selectedMonth !== "todos" && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Filtrando por:</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
            {selectedMonth === "sem-data" ? "❓ Sem data" : MONTHS.find((m) => m.id === selectedMonth)?.emoji + " " + MONTHS.find((m) => m.id === selectedMonth)?.label}
          </span>
          <button onClick={() => setSelectedMonth("todos")} className="h-6 px-2 text-[10px] rounded bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Limpar
          </button>
        </div>
      )}

      {/* Lista de eventos filtrados */}
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento. Clique em "+ Adicionar evento".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento neste mês.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev) => {
            const realIdx = events.findIndex((x) => x.id === ev.id);
            const monthInfo = getMonth(ev.date) ? MONTHS.find((m) => m.id === getMonth(ev.date)) : null;
            return (
              <div key={ev.id} className="group grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-md border border-border bg-card p-2 hover:border-primary/30">
                <input type="text" value={ev.title} onChange={(e) => updateAt(realIdx, { title: e.target.value })} placeholder="Título" className="h-8 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <div className="flex items-center gap-1">
                  <input type="date" value={ev.date} onChange={(e) => updateAt(realIdx, { date: e.target.value })} className="h-8 text-xs bg-transparent border border-border rounded px-1 focus:outline-none focus:border-primary/50 flex-1" />
                  {monthInfo && <span className="text-sm shrink-0" title={monthInfo.label}>{monthInfo.emoji}</span>}
                </div>
                <select value={ev.type} onChange={(e) => updateAt(realIdx, { type: e.target.value })} className="h-8 text-xs bg-transparent border border-border rounded px-1 focus:outline-none">{types.map(t => <option key={t}>{t}</option>)}</select>
                <input type="text" value={ev.notes} onChange={(e) => updateAt(realIdx, { notes: e.target.value })} placeholder="Notas" className="h-8 text-sm bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <RemoveBtn onClick={() => setData(events.filter((x) => x.id !== ev.id))} />
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...events, { id: makeId(), title: "", date: selectedMonth !== "todos" && selectedMonth !== "sem-data" ? `${new Date().getFullYear()}-${selectedMonth}-01` : "", type: "Evento", notes: "" }])} label="Adicionar evento" />
    </div>
  );
}

function MetasPanel({ pageId }: { pageId: string }) {
  const { data: rawGoals, setData } = useEnterpriseData<GoalItem[]>(pageId, "metas", []);
  const goals = useMemo(() => (Array.isArray(rawGoals) ? rawGoals : []).map((g) => ({
    ...g,
    priority: g.priority ?? "Média",
    category: g.category ?? "",
    notes: g.notes ?? "",
    stepByStep: Array.isArray((g as GoalItem & { stepByStep?: unknown[] }).stepByStep) ? (g as GoalItem & { stepByStep: { id: string; title: string; description: string; done: boolean }[] }).stepByStep : [],
  })), [rawGoals]);
  const [filterStatus, setFilterStatus] = useState<string>("Todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const PRIORITIES = [
    { value: "Baixa", color: "#6b7280", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Média", color: "#f59e0b", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alta", color: "#ef4444", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  // Calcula progresso efetivo da meta:
  // - Se tem passos: progresso = % de passos concluídos (automático)
  // - Senão: usa o progresso manual salvo
  function getEffectiveProgress(g: GoalItem): number {
    if (g.stepByStep.length > 0) {
      const done = g.stepByStep.filter((s) => s.done).length;
      return Math.round((done / g.stepByStep.length) * 100);
    }
    return g.progress;
  }
  function getGoalStatus(g: GoalItem): { label: string; color: string } {
    const prog = getEffectiveProgress(g);
    if (prog >= 100) return { label: "Concluída", color: "#16a34a" };
    if (g.deadline) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dl = new Date(g.deadline + "T00:00");
      if (dl < today && prog < 100) return { label: "Atrasada", color: "#dc2626" };
    }
    if (prog > 0) return { label: "Em andamento", color: "#2563eb" };
    return { label: "Não iniciada", color: "#6b7280" };
  }
  function daysUntil(deadline: string): number | null {
    if (!deadline) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dl = new Date(deadline + "T00:00");
    return Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  function updateAt(id: string, patch: Partial<GoalItem>) {
    setData(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }
  // Passo a passo da meta
  function addStep(goalId: string) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    updateAt(goalId, { stepByStep: [...goal.stepByStep, { id: makeId("paso"), title: "", description: "", done: false }] });
  }
  function updateStep(goalId: string, stepId: string, patch: Partial<{ title: string; description: string; done: boolean }>) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    updateAt(goalId, { stepByStep: goal.stepByStep.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) });
  }
  function removeStep(goalId: string, stepId: string) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    updateAt(goalId, { stepByStep: goal.stepByStep.filter((s) => s.id !== stepId) });
  }
  function moveStep(goalId: string, stepId: string, direction: "up" | "down") {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const idx = goal.stepByStep.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= goal.stepByStep.length) return;
    const newSteps = [...goal.stepByStep];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    updateAt(goalId, { stepByStep: newSteps });
  }

  const allStatuses = ["Todas", "Não iniciada", "Em andamento", "Atrasada", "Concluída"];
  const goalsWithStatus = goals.map((g) => ({ ...g, _status: getGoalStatus(g), _progress: getEffectiveProgress(g) }));
  const filtered = filterStatus === "Todas" ? goalsWithStatus : goalsWithStatus.filter((g) => g._status.label === filterStatus);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🏁" title="Metas" />

      {/* Filtro de status */}
      {goals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allStatuses.map((s) => {
            const count = s === "Todas" ? goals.length : goalsWithStatus.filter((g) => g._status.label === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={cn("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>
                {s}
                <span className={cn("text-[9px] px-1 rounded font-bold", filterStatus === s ? "bg-black/15" : "bg-muted")}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta. Clique em "+ Adicionar meta".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta com este status.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => {
            const isExpanded = expandedId === g.id;
            const days = daysUntil(g.deadline);
            const priorityInfo = PRIORITIES.find((p) => p.value === g.priority) ?? PRIORITIES[1];
            const sbsDoneCount = g.stepByStep.filter((s) => s.done).length;
            const sbsTotalCount = g.stepByStep.length;
            const effectiveProgress = g._progress;
            return (
              <div key={g.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{g.title || "Meta sem título"}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: g._status.color }}>{g._status.label}</span>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", priorityInfo.bg)}>{g.priority}</span>
                      {g.category && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">{g.category}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", effectiveProgress >= 100 ? "bg-emerald-500" : effectiveProgress >= 50 ? "bg-blue-500" : effectiveProgress >= 25 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${effectiveProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold w-9 text-right">{effectiveProgress}%</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {sbsTotalCount > 0 && <span className="text-purple-600 dark:text-purple-400">👣 {sbsDoneCount}/{sbsTotalCount} passos</span>}
                      {g.deadline && (
                        <span>
                          📅 {new Date(g.deadline + "T00:00").toLocaleDateString("pt-BR")}
                          {days !== null && days >= 0 && effectiveProgress < 100 && <span className="ml-1 text-amber-600 dark:text-amber-400">· {days} dia(s) restante(s)</span>}
                          {days !== null && days < 0 && effectiveProgress < 100 && <span className="ml-1 text-red-600 dark:text-red-400">· {Math.abs(days)} dia(s) atrasada</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-2 bg-muted/10">
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Título da meta *</label>
                      <input type="text" value={g.title} onChange={(e) => updateAt(g.id, { title: e.target.value })} placeholder="Ex: Aumentar vendas em 20%" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Prazo</label>
                        <input type="date" value={g.deadline} onChange={(e) => updateAt(g.id, { deadline: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Prioridade</label>
                        <select value={g.priority} onChange={(e) => updateAt(g.id, { priority: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Categoria</label>
                        <input type="text" value={g.category} onChange={(e) => updateAt(g.id, { category: e.target.value })} placeholder="Ex: Vendas" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    {g.stepByStep.length === 0 && (
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Progresso manual: {g.progress}%</label>
                        <input type="range" min={0} max={100} value={g.progress} onChange={(e) => updateAt(g.id, { progress: parseInt(e.target.value) })} className="w-full accent-blue-600" />
                        <p className="text-[9px] text-muted-foreground mt-1">💡 Adicione passos abaixo para que o progresso seja calculado automaticamente.</p>
                      </div>
                    )}
                    {/* Passo a passo da meta (step-by-step com checklist) */}
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] uppercase text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                          👣 Passo a passo da meta
                          {g.stepByStep.length > 0 && (
                            <span className="text-[9px] bg-purple-500/15 px-1.5 py-0.5 rounded ml-1">
                              {g.stepByStep.filter((s) => s.done).length}/{g.stepByStep.length} concluído(s)
                            </span>
                          )}
                        </label>
                        <button onClick={() => addStep(g.id)} className="h-6 px-2 text-[10px] rounded bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1">+ Passo</button>
                      </div>
                      {g.stepByStep.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">Nenhum passo. Clique em "+ Passo" para criar um plano passo a passo da meta. O progresso será calculado automaticamente.</p>
                      ) : (
                        <div className="space-y-2">
                          {g.stepByStep.map((step, stepIdx) => (
                            <div key={step.id} className={cn("rounded-md border bg-background p-2 transition-all", step.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border")}>
                              <div className="flex items-start gap-2">
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5", step.done ? "bg-emerald-500 text-white" : "bg-purple-500/20 text-purple-600 dark:text-purple-400")}>
                                  {step.done ? "✓" : stepIdx + 1}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={step.done}
                                  onChange={(e) => updateStep(g.id, step.id, { done: e.target.checked })}
                                  className="h-4 w-4 accent-emerald-600 shrink-0 mt-1"
                                  title="Marcar passo como concluído"
                                />
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStep(g.id, step.id, { title: e.target.value })}
                                  placeholder={`Título do passo ${stepIdx + 1}...`}
                                  className={cn("flex-1 h-7 text-sm font-semibold bg-transparent border-b border-transparent focus:border-purple-500/50 px-1 focus:outline-none", step.done && "line-through opacity-60")}
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button onClick={() => moveStep(g.id, step.id, "up")} disabled={stepIdx === 0} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-default" title="Mover para cima">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                  <button onClick={() => moveStep(g.id, step.id, "down")} disabled={stepIdx === g.stepByStep.length - 1} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-default" title="Mover para baixo">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                  <button onClick={() => removeStep(g.id, step.id)} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center" title="Excluir passo">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                </div>
                              </div>
                              <textarea
                                value={step.description}
                                onChange={(e) => updateStep(g.id, step.id, { description: e.target.value })}
                                placeholder="Descrição detalhada do que fazer neste passo..."
                                rows={2}
                                className={cn("mt-1.5 ml-8 w-[calc(100%-2rem)] text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:border-purple-500/50 resize-y", step.done && "opacity-60")}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Notas</label>
                      <textarea value={g.notes} onChange={(e) => updateAt(g.id, { notes: e.target.value })} placeholder="Anotações sobre esta meta..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(goals.filter((x) => x.id !== g.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...goals, { id: makeId(), title: "", deadline: "", progress: 0, notes: "", priority: "Média", category: "", stepByStep: [] }])} label="Adicionar meta" />
    </div>
  );
}

function ProjetosPanel({ pageId }: { pageId: string }) {
  const { data: rawProjects, setData } = useEnterpriseData<ProjectItem[]>(pageId, "projetos", []);
  const projects = useMemo(() => (Array.isArray(rawProjects) ? rawProjects : []).map((p) => ({
    ...p,
    progress: p.progress ?? 0,
    priority: p.priority ?? "Média",
    category: p.category ?? "",
    notes: p.notes ?? "",
    description: p.description ?? "",
    stepByStep: Array.isArray((p as ProjectItem & { stepByStep?: unknown[] }).stepByStep) ? (p as ProjectItem & { stepByStep: { id: string; title: string; description: string; done: boolean }[] }).stepByStep : [],
  })), [rawProjects]);
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const STATUSES = [
    { value: "Planejado", color: "#6b7280", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Em andamento", color: "#2563eb", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "Pausado", color: "#f59e0b", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Concluído", color: "#16a34a", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Cancelado", color: "#dc2626", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];
  const PRIORITIES = [
    { value: "Baixa", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Média", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alta", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  function daysUntil(deadline: string): number | null {
    if (!deadline) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dl = new Date(deadline + "T00:00");
    return Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  // Calcula progresso efetivo do projeto:
  // - Se tem passos: progresso = % de passos concluídos (automático)
  // - Senão: usa o progresso manual salvo
  function getEffectiveProgress(p: ProjectItem): number {
    if (p.stepByStep.length > 0) {
      const done = p.stepByStep.filter((s) => s.done).length;
      return Math.round((done / p.stepByStep.length) * 100);
    }
    return p.progress;
  }
  function updateAt(id: string, patch: Partial<ProjectItem>) {
    setData(projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  // Passo a passo do projeto
  function addStep(projId: string) {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    updateAt(projId, { stepByStep: [...proj.stepByStep, { id: makeId("paso"), title: "", description: "", done: false }] });
  }
  function updateStep(projId: string, stepId: string, patch: Partial<{ title: string; description: string; done: boolean }>) {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    updateAt(projId, { stepByStep: proj.stepByStep.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) });
  }
  function removeStep(projId: string, stepId: string) {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    updateAt(projId, { stepByStep: proj.stepByStep.filter((s) => s.id !== stepId) });
  }
  function moveStep(projId: string, stepId: string, direction: "up" | "down") {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    const idx = proj.stepByStep.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= proj.stepByStep.length) return;
    const newSteps = [...proj.stepByStep];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    updateAt(projId, { stepByStep: newSteps });
  }

  const allFilters = ["Todos", ...STATUSES.map((s) => s.value)];
  const filtered = filterStatus === "Todos" ? projects : projects.filter((p) => p.status === filterStatus);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📁" title="Projetos" />

      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allFilters.map((s) => {
            const count = s === "Todos" ? projects.length : projects.filter((p) => p.status === s).length;
            const statusInfo = STATUSES.find((st) => st.value === s);
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={cn("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>
                {statusInfo && <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusInfo.color }} />}
                {s}
                <span className={cn("text-[9px] px-1 rounded font-bold", filterStatus === s ? "bg-black/15" : "bg-muted")}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto. Clique em "+ Adicionar projeto".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto com este status.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id;
            const days = daysUntil(p.deadline);
            const statusInfo = STATUSES.find((s) => s.value === p.status) ?? STATUSES[0];
            const priorityInfo = PRIORITIES.find((pr) => pr.value === p.priority) ?? PRIORITIES[1];
            const sbsDoneCount = p.stepByStep.filter((s) => s.done).length;
            const sbsTotalCount = p.stepByStep.length;
            const effectiveProgress = getEffectiveProgress(p);
            return (
              <div key={p.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{p.name || "Projeto sem nome"}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", statusInfo.bg)}>{p.status}</span>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", priorityInfo.bg)}>{p.priority}</span>
                      {p.category && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">{p.category}</span>}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground truncate mb-1">{p.description}</p>}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", effectiveProgress >= 100 ? "bg-emerald-500" : effectiveProgress >= 50 ? "bg-blue-500" : effectiveProgress >= 25 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${effectiveProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold w-9 text-right">{effectiveProgress}%</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {p.responsible && <span>👤 {p.responsible}</span>}
                      {sbsTotalCount > 0 && <span className="text-purple-600 dark:text-purple-400">👣 {sbsDoneCount}/{sbsTotalCount} passos</span>}
                      {p.deadline && (
                        <span>
                          📅 {new Date(p.deadline + "T00:00").toLocaleDateString("pt-BR")}
                          {days !== null && days < 0 && effectiveProgress < 100 && p.status !== "Concluído" && p.status !== "Cancelado" && <span className="ml-1 text-red-600 dark:text-red-400">· atrasado</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-2 bg-muted/10">
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Nome do projeto *</label>
                      <input type="text" value={p.name} onChange={(e) => updateAt(p.id, { name: e.target.value })} placeholder="Ex: Lançamento de produto" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Descrição</label>
                      <input type="text" value={p.description} onChange={(e) => updateAt(p.id, { description: e.target.value })} placeholder="Breve descrição" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Status</label>
                        <select value={p.status} onChange={(e) => updateAt(p.id, { status: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Prioridade</label>
                        <select value={p.priority} onChange={(e) => updateAt(p.id, { priority: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          {PRIORITIES.map((pr) => <option key={pr.value} value={pr.value}>{pr.value}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Prazo</label>
                        <input type="date" value={p.deadline} onChange={(e) => updateAt(p.id, { deadline: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Responsável</label>
                        <input type="text" value={p.responsible} onChange={(e) => updateAt(p.id, { responsible: e.target.value })} placeholder="Nome" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Categoria</label>
                        <input type="text" value={p.category} onChange={(e) => updateAt(p.id, { category: e.target.value })} placeholder="Ex: Marketing" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      {p.stepByStep.length === 0 && (
                        <div>
                          <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Progresso manual: {p.progress}%</label>
                          <input type="range" min={0} max={100} value={p.progress} onChange={(e) => updateAt(p.id, { progress: parseInt(e.target.value) })} className="w-full accent-blue-600" />
                        </div>
                      )}
                    </div>
                    {/* Passo a passo do projeto (step-by-step com checklist) */}
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] uppercase text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                          👣 Passo a passo do projeto
                          {p.stepByStep.length > 0 && (
                            <span className="text-[9px] bg-purple-500/15 px-1.5 py-0.5 rounded ml-1">
                              {p.stepByStep.filter((s) => s.done).length}/{p.stepByStep.length} concluído(s)
                            </span>
                          )}
                        </label>
                        <button onClick={() => addStep(p.id)} className="h-6 px-2 text-[10px] rounded bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1">+ Passo</button>
                      </div>
                      {p.stepByStep.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">Nenhum passo. Clique em "+ Passo" para criar um plano passo a passo do projeto.</p>
                      ) : (
                        <div className="space-y-2">
                          {p.stepByStep.map((step, stepIdx) => (
                            <div key={step.id} className={cn("rounded-md border bg-background p-2 transition-all", step.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border")}>
                              <div className="flex items-start gap-2">
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5", step.done ? "bg-emerald-500 text-white" : "bg-purple-500/20 text-purple-600 dark:text-purple-400")}>
                                  {step.done ? "✓" : stepIdx + 1}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={step.done}
                                  onChange={(e) => updateStep(p.id, step.id, { done: e.target.checked })}
                                  className="h-4 w-4 accent-emerald-600 shrink-0 mt-1"
                                  title="Marcar passo como concluído"
                                />
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStep(p.id, step.id, { title: e.target.value })}
                                  placeholder={`Título do passo ${stepIdx + 1}...`}
                                  className={cn("flex-1 h-7 text-sm font-semibold bg-transparent border-b border-transparent focus:border-purple-500/50 px-1 focus:outline-none", step.done && "line-through opacity-60")}
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button onClick={() => moveStep(p.id, step.id, "up")} disabled={stepIdx === 0} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-default" title="Mover para cima">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                  <button onClick={() => moveStep(p.id, step.id, "down")} disabled={stepIdx === p.stepByStep.length - 1} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-default" title="Mover para baixo">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                  <button onClick={() => removeStep(p.id, step.id)} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center" title="Excluir passo">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                </div>
                              </div>
                              <textarea
                                value={step.description}
                                onChange={(e) => updateStep(p.id, step.id, { description: e.target.value })}
                                placeholder="Descrição detalhada do que fazer neste passo..."
                                rows={2}
                                className={cn("mt-1.5 ml-8 w-[calc(100%-2rem)] text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:border-purple-500/50 resize-y", step.done && "opacity-60")}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Notas</label>
                      <textarea value={p.notes} onChange={(e) => updateAt(p.id, { notes: e.target.value })} placeholder="Anotações..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(projects.filter((x) => x.id !== p.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...projects, { id: makeId(), name: "", status: "Planejado", deadline: "", responsible: "", notes: "", progress: 0, priority: "Média", category: "", description: "", stepByStep: [] }])} label="Adicionar projeto" />
    </div>
  );
}

function ProcessosPanel({ pageId }: { pageId: string }) {
  const { data: rawProcesses, setData } = useEnterpriseData<ProcessItem[]>(pageId, "processos", []);
  const processes = useMemo(() => (Array.isArray(rawProcesses) ? rawProcesses : []).map((p) => ({
    ...p,
    status: p.status ?? "Ativo",
    lastRun: p.lastRun ?? "",
    notes: p.notes ?? "",
    checklist: Array.isArray(p.checklist) ? p.checklist : [],
    stepByStep: Array.isArray((p as ProcessItem & { stepByStep?: unknown[] }).stepByStep) ? (p as ProcessItem & { stepByStep: { id: string; title: string; description: string; done: boolean }[] }).stepByStep : [],
  })), [rawProcesses]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateAt(id: string, patch: Partial<ProcessItem>) {
    setData(processes.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function addChecklistItem(procId: string) {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    updateAt(procId, { checklist: [...proc.checklist, { id: makeId("step"), text: "", done: false }] });
  }
  function updateChecklistItem(procId: string, itemId: string, patch: Partial<{ text: string; done: boolean }>) {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    updateAt(procId, { checklist: proc.checklist.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) });
  }
  function removeChecklistItem(procId: string, itemId: string) {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    updateAt(procId, { checklist: proc.checklist.filter((it) => it.id !== itemId) });
  }
  // Passo a passo (step-by-step com checklist)
  function addStep(procId: string) {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    updateAt(procId, { stepByStep: [...proc.stepByStep, { id: makeId("paso"), title: "", description: "", done: false }] });
  }
  function updateStep(procId: string, stepId: string, patch: Partial<{ title: string; description: string; done: boolean }>) {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    updateAt(procId, { stepByStep: proc.stepByStep.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) });
  }
  function removeStep(procId: string, stepId: string) {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    updateAt(procId, { stepByStep: proc.stepByStep.filter((s) => s.id !== stepId) });
  }
  function moveStep(procId: string, stepId: string, direction: "up" | "down") {
    const proc = processes.find((p) => p.id === procId);
    if (!proc) return;
    const idx = proc.stepByStep.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= proc.stepByStep.length) return;
    const newSteps = [...proc.stepByStep];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    updateAt(procId, { stepByStep: newSteps });
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="⚙️" title="Processos" />
      {processes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum processo. Clique em "+ Adicionar processo".</p>
      ) : (
        <div className="space-y-2">
          {processes.map((p) => {
            const isExpanded = expandedId === p.id;
            const doneCount = p.checklist.filter((it) => it.done).length;
            const totalCount = p.checklist.length;
            const sbsDoneCount = p.stepByStep.filter((s) => s.done).length;
            const sbsTotalCount = p.stepByStep.length;
            const totalDone = doneCount + sbsDoneCount;
            const totalAll = totalCount + sbsTotalCount;
            const progress = totalAll > 0 ? (totalDone / totalAll) * 100 : 0;
            return (
              <div key={p.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{p.name || "Processo sem nome"}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", p.status === "Ativo" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>{p.status}</span>
                      {p.frequency && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">🔄 {p.frequency}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {p.owner && <span>👤 {p.owner}</span>}
                      {sbsTotalCount > 0 && <span className="text-purple-600 dark:text-purple-400">👣 {sbsDoneCount}/{sbsTotalCount} passos</span>}
                      {totalCount > 0 && <span>✅ {doneCount}/{totalCount} etapas</span>}
                      {p.lastRun && <span>📅 Última: {new Date(p.lastRun + "T00:00").toLocaleDateString("pt-BR")}</span>}
                    </div>
                    {totalAll > 0 && (
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", progress >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-3 bg-muted/10">
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Nome do processo *</label>
                      <input type="text" value={p.name} onChange={(e) => updateAt(p.id, { name: e.target.value })} placeholder="Ex: Onboarding de cliente" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Status</label>
                        <select value={p.status} onChange={(e) => updateAt(p.id, { status: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          <option>Ativo</option>
                          <option>Inativo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Responsável</label>
                        <input type="text" value={p.owner} onChange={(e) => updateAt(p.id, { owner: e.target.value })} placeholder="Nome" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Frequência</label>
                        <input type="text" value={p.frequency} onChange={(e) => updateAt(p.id, { frequency: e.target.value })} placeholder="Ex: Diário, Semanal" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Última execução</label>
                        <input type="date" value={p.lastRun} onChange={(e) => updateAt(p.id, { lastRun: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    {/* Passo a passo (step-by-step com checklist) */}
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] uppercase text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                          👣 Passo a passo
                          {p.stepByStep.length > 0 && (
                            <span className="text-[9px] bg-purple-500/15 px-1.5 py-0.5 rounded ml-1">
                              {p.stepByStep.filter((s) => s.done).length}/{p.stepByStep.length} concluído(s)
                            </span>
                          )}
                        </label>
                        <button onClick={() => addStep(p.id)} className="h-6 px-2 text-[10px] rounded bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1">+ Passo</button>
                      </div>
                      {p.stepByStep.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">Nenhum passo. Clique em "+ Passo" para criar um guia passo a passo detalhado.</p>
                      ) : (
                        <div className="space-y-2">
                          {p.stepByStep.map((step, stepIdx) => (
                            <div key={step.id} className={cn("rounded-md border bg-background p-2 transition-all", step.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border")}>
                              {/* Header do passo — número + checkbox + título + controles */}
                              <div className="flex items-start gap-2">
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5", step.done ? "bg-emerald-500 text-white" : "bg-purple-500/20 text-purple-600 dark:text-purple-400")}>
                                  {step.done ? "✓" : stepIdx + 1}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={step.done}
                                  onChange={(e) => updateStep(p.id, step.id, { done: e.target.checked })}
                                  className="h-4 w-4 accent-emerald-600 shrink-0 mt-1"
                                  title="Marcar passo como concluído"
                                />
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStep(p.id, step.id, { title: e.target.value })}
                                  placeholder={`Título do passo ${stepIdx + 1}...`}
                                  className={cn("flex-1 h-7 text-sm font-semibold bg-transparent border-b border-transparent focus:border-purple-500/50 px-1 focus:outline-none", step.done && "line-through opacity-60")}
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button onClick={() => moveStep(p.id, step.id, "up")} disabled={stepIdx === 0} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-default" title="Mover para cima">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                  <button onClick={() => moveStep(p.id, step.id, "down")} disabled={stepIdx === p.stepByStep.length - 1} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-default" title="Mover para baixo">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                  <button onClick={() => removeStep(p.id, step.id)} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center" title="Excluir passo">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                </div>
                              </div>
                              {/* Descrição detalhada do passo */}
                              <textarea
                                value={step.description}
                                onChange={(e) => updateStep(p.id, step.id, { description: e.target.value })}
                                placeholder="Descrição detalhada do que fazer neste passo..."
                                rows={2}
                                className={cn("mt-1.5 ml-8 w-[calc(100%-2rem)] text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:border-purple-500/50 resize-y", step.done && "opacity-60")}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Checklist de etapas */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] uppercase text-muted-foreground font-bold">Etapas do processo (checklist)</label>
                        <button onClick={() => addChecklistItem(p.id)} className="h-6 px-2 text-[10px] rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1">+ Etapa</button>
                      </div>
                      {p.checklist.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">Nenhuma etapa. Clique em "+ Etapa" para adicionar.</p>
                      ) : (
                        <div className="space-y-1">
                          {p.checklist.map((it) => (
                            <div key={it.id} className="flex items-center gap-2 group">
                              <input type="checkbox" checked={it.done} onChange={(e) => updateChecklistItem(p.id, it.id, { done: e.target.checked })} className="h-4 w-4 accent-emerald-600 shrink-0" />
                              <input type="text" value={it.text} onChange={(e) => updateChecklistItem(p.id, it.id, { text: e.target.value })} placeholder="Descrição da etapa..." className={cn("flex-1 h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50", it.done && "line-through opacity-60")} />
                              <button onClick={() => removeChecklistItem(p.id, it.id)} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Notas</label>
                      <textarea value={p.notes} onChange={(e) => updateAt(p.id, { notes: e.target.value })} placeholder="Anotações..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(processes.filter((x) => x.id !== p.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...processes, { id: makeId(), name: "", steps: "", owner: "", frequency: "", notes: "", status: "Ativo", lastRun: "", checklist: [], stepByStep: [] }])} label="Adicionar processo" />
    </div>
  );
}

function MarketingPanel({ pageId }: { pageId: string }) {
  const { data: rawCampaigns, setData } = useEnterpriseData<MarketingItem[]>(pageId, "marketing", []);
  const campaigns = useMemo(() => (Array.isArray(rawCampaigns) ? rawCampaigns : []).map((c) => ({
    ...c,
    startDate: c.startDate ?? "",
    endDate: c.endDate ?? "",
    category: c.category ?? "",
    notes: c.notes ?? "",
    results: c.results ?? "",
  })), [rawCampaigns]);
  const [filterStatus, setFilterStatus] = useState<string>("Todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const STATUSES = [
    { value: "Planejada", color: "#6b7280", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Ativa", color: "#16a34a", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Pausada", color: "#f59e0b", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Concluída", color: "#2563eb", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  ];
  const PLATFORMS: Record<string, string> = {
    "Instagram": "📷", "Facebook": "📘", "Google Ads": "🔍", "TikTok": "🎵",
    "YouTube": "📺", "LinkedIn": "💼", "Email": "📧", "WhatsApp": "💬", "Twitter": "🐦",
  };

  function parseNum(s: string): number {
    const n = parseFloat(String(s).replace(/[^\d,.-]/g, "").replace(",", "."));
    return isFinite(n) ? n : 0;
  }
  function updateAt(id: string, patch: Partial<MarketingItem>) {
    setData(campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  const allFilters = ["Todas", ...STATUSES.map((s) => s.value)];
  const filtered = filterStatus === "Todas" ? campaigns : campaigns.filter((c) => c.status === filterStatus);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📢" title="Marketing" />

      {campaigns.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allFilters.map((s) => {
            const count = s === "Todas" ? campaigns.length : campaigns.filter((c) => c.status === s).length;
            const statusInfo = STATUSES.find((st) => st.value === s);
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={cn("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>
                {statusInfo && <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusInfo.color }} />}
                {s}
                <span className={cn("text-[9px] px-1 rounded font-bold", filterStatus === s ? "bg-black/15" : "bg-muted")}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha. Clique em "+ Adicionar campanha".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha com este status.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            const statusInfo = STATUSES.find((s) => s.value === c.status) ?? STATUSES[0];
            const budget = parseNum(c.budget);
            const results = parseNum(c.results);
            const roi = budget > 0 ? ((results - budget) / budget) * 100 : 0;
            const platformIcon = PLATFORMS[c.platform] ?? "📱";
            return (
              <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base shrink-0">{platformIcon}</span>
                      <p className="text-sm font-bold text-foreground truncate">{c.campaign || "Campanha sem nome"}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", statusInfo.bg)}>{c.status}</span>
                      {c.platform && <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">{c.platform}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {budget > 0 && <span>💰 R$ {budget.toFixed(2)}</span>}
                      {results > 0 && (
                        <span className={cn("font-bold", roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          📈 ROI: {roi >= 0 ? "+" : ""}{roi.toFixed(0)}%
                        </span>
                      )}
                      {c.startDate && <span>📅 {new Date(c.startDate + "T00:00").toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-2 bg-muted/10">
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Nome da campanha *</label>
                      <input type="text" value={c.campaign} onChange={(e) => updateAt(c.id, { campaign: e.target.value })} placeholder="Ex: Black Friday 2026" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Plataforma</label>
                        <input type="text" list="marketing-platforms" value={c.platform} onChange={(e) => updateAt(c.id, { platform: e.target.value })} placeholder="Ex: Instagram" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                        <datalist id="marketing-platforms">{Object.keys(PLATFORMS).map((p) => <option key={p} value={p} />)}</datalist>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Orçamento (R$)</label>
                        <input type="text" inputMode="decimal" value={c.budget} onChange={(e) => updateAt(c.id, { budget: e.target.value })} placeholder="Ex: 500" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Resultado (R$)</label>
                        <input type="text" inputMode="decimal" value={c.results} onChange={(e) => updateAt(c.id, { results: e.target.value })} placeholder="Ex: 1500" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Status</label>
                        <select value={c.status} onChange={(e) => updateAt(c.id, { status: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Data início</label>
                        <input type="date" value={c.startDate} onChange={(e) => updateAt(c.id, { startDate: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Data fim</label>
                        <input type="date" value={c.endDate} onChange={(e) => updateAt(c.id, { endDate: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Categoria</label>
                        <input type="text" value={c.category} onChange={(e) => updateAt(c.id, { category: e.target.value })} placeholder="Ex: Promoção" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    {budget > 0 && results > 0 && (
                      <div className="rounded-md border border-border bg-background p-2 text-xs">
                        <span className="text-muted-foreground">ROI calculado: </span>
                        <span className={cn("font-bold", roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {roi >= 0 ? "+" : ""}{roi.toFixed(1)}% (lucro: R$ {(results - budget).toFixed(2)})
                        </span>
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Notas</label>
                      <textarea value={c.notes} onChange={(e) => updateAt(c.id, { notes: e.target.value })} placeholder="Anotações..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(campaigns.filter((x) => x.id !== c.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...campaigns, { id: makeId(), campaign: "", platform: "", budget: "", status: "Planejada", results: "", startDate: "", endDate: "", category: "", notes: "" }])} label="Adicionar campanha" />
    </div>
  );
}

function ReunioesPanel({ pageId }: { pageId: string }) {
  const { data: rawMeetings, setData } = useEnterpriseData<MeetingItem[]>(pageId, "reunioes", []);
  const meetings = useMemo(() => (Array.isArray(rawMeetings) ? rawMeetings : []).map((m) => ({
    ...m,
    time: m.time ?? "",
    location: m.location ?? "",
    status: m.status ?? "Agendada",
    decisions: m.decisions ?? "",
    actionItems: Array.isArray(m.actionItems) ? m.actionItems : [],
  })), [rawMeetings]);
  const [filterStatus, setFilterStatus] = useState<string>("Todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const STATUSES = [
    { value: "Agendada", color: "#2563eb", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "Realizada", color: "#16a34a", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Cancelada", color: "#dc2626", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  function updateAt(id: string, patch: Partial<MeetingItem>) {
    setData(meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function addActionItem(meetingId: string) {
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return;
    updateAt(meetingId, { actionItems: [...m.actionItems, { id: makeId("act"), text: "", done: false }] });
  }
  function updateActionItem(meetingId: string, itemId: string, patch: Partial<{ text: string; done: boolean }>) {
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return;
    updateAt(meetingId, { actionItems: m.actionItems.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) });
  }
  function removeActionItem(meetingId: string, itemId: string) {
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return;
    updateAt(meetingId, { actionItems: m.actionItems.filter((it) => it.id !== itemId) });
  }

  const allFilters = ["Todas", ...STATUSES.map((s) => s.value)];
  const filtered = filterStatus === "Todas" ? meetings : meetings.filter((m) => m.status === filterStatus);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🗓️" title="Reuniões" />

      {meetings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allFilters.map((s) => {
            const count = s === "Todas" ? meetings.length : meetings.filter((m) => m.status === s).length;
            const statusInfo = STATUSES.find((st) => st.value === s);
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={cn("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>
                {statusInfo && <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusInfo.color }} />}
                {s}
                <span className={cn("text-[9px] px-1 rounded font-bold", filterStatus === s ? "bg-black/15" : "bg-muted")}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião. Clique em "+ Adicionar reunião".</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião com este status.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            const statusInfo = STATUSES.find((s) => s.value === m.status) ?? STATUSES[0];
            const doneActions = m.actionItems.filter((it) => it.done).length;
            return (
              <div key={m.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{m.title || "Reunião sem título"}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", statusInfo.bg)}>{m.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {m.date && <span>📅 {new Date(m.date + "T00:00").toLocaleDateString("pt-BR")}</span>}
                      {m.time && <span>🕐 {m.time}</span>}
                      {m.participants && <span>👥 {m.participants}</span>}
                      {m.location && <span>📍 {m.location}</span>}
                      {m.actionItems.length > 0 && <span>✅ {doneActions}/{m.actionItems.length} ações</span>}
                    </div>
                    {m.agenda && <p className="text-xs text-muted-foreground truncate mt-1">📋 {m.agenda}</p>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-2 bg-muted/10">
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Título da reunião *</label>
                      <input type="text" value={m.title} onChange={(e) => updateAt(m.id, { title: e.target.value })} placeholder="Ex: Reunião de planejamento" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Status</label>
                        <select value={m.status} onChange={(e) => updateAt(m.id, { status: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Data</label>
                        <input type="date" value={m.date} onChange={(e) => updateAt(m.id, { date: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Hora</label>
                        <input type="time" value={m.time} onChange={(e) => updateAt(m.id, { time: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Local / Link</label>
                        <input type="text" value={m.location} onChange={(e) => updateAt(m.id, { location: e.target.value })} placeholder="Sala ou URL" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Participantes</label>
                      <input type="text" value={m.participants} onChange={(e) => updateAt(m.id, { participants: e.target.value })} placeholder="Ex: João, Maria, Pedro" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Pauta</label>
                      <textarea value={m.agenda} onChange={(e) => updateAt(m.id, { agenda: e.target.value })} placeholder="Tópicos a serem discutidos..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground font-bold block mb-0.5">Decisões tomadas</label>
                      <textarea value={m.decisions} onChange={(e) => updateAt(m.id, { decisions: e.target.value })} placeholder="O que foi decidido..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    {/* Action items */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] uppercase text-muted-foreground font-bold">Itens de ação (action items)</label>
                        <button onClick={() => addActionItem(m.id)} className="h-6 px-2 text-[10px] rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1">+ Ação</button>
                      </div>
                      {m.actionItems.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">Nenhuma ação. Clique em "+ Ação" para adicionar.</p>
                      ) : (
                        <div className="space-y-1">
                          {m.actionItems.map((it) => (
                            <div key={it.id} className="flex items-center gap-2 group">
                              <input type="checkbox" checked={it.done} onChange={(e) => updateActionItem(m.id, it.id, { done: e.target.checked })} className="h-4 w-4 accent-emerald-600 shrink-0" />
                              <input type="text" value={it.text} onChange={(e) => updateActionItem(m.id, it.id, { text: e.target.value })} placeholder="O que precisa ser feito..." className={cn("flex-1 h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50", it.done && "line-through opacity-60")} />
                              <button onClick={() => removeActionItem(m.id, it.id)} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(meetings.filter((x) => x.id !== m.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...meetings, { id: makeId(), title: "", date: "", participants: "", agenda: "", decisions: "", time: "", location: "", status: "Agendada", actionItems: [] }])} label="Adicionar reunião" />
    </div>
  );
}

// =================== Custom Tab Panels ===================

function CustomChecklistPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  const { data: items, setData } = useEnterpriseData<SimpleTask[]>(pageId, `custom-${tabId}`, []);
  return <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6"><PanelHeader emoji="✅" title="Checklist" />
    <div className="space-y-2">{items.map((t, i) => <TaskRow key={t.id} task={t} onUpdate={(nt) => setData(items.map((x, xi) => xi === i ? nt : x))} onRemove={() => setData(items.filter((_, xi) => xi !== i))} />)}</div>
    <AddButton onClick={() => setData([...items, { id: makeId(), text: "", done: false }])} label="Adicionar item" /></div>;
}

function CustomNotesPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  const { data: notes, setData } = useEnterpriseData<string>(pageId, `custom-${tabId}`, "");
  return <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6"><PanelHeader emoji="📝" title="Anotações" />
    <textarea value={notes} onChange={(e) => setData(e.target.value)} placeholder="Escreva suas anotações aqui..." rows={20} className="w-full text-sm bg-card border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-y" /></div>;
}

function CustomTablePanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  const { data: rows, setData } = useEnterpriseData<Record<string, string>[]>(pageId, `custom-${tabId}`, []);
  const { data: columns } = useEnterpriseData<string[]>(pageId, `custom-${tabId}-cols`, ["Coluna 1", "Coluna 2", "Coluna 3"]);
  return <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6"><PanelHeader emoji="📊" title="Tabela" />
    {rows.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma linha. Clique em "+ Adicionar linha".</p> : <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm"><thead><tr className="bg-muted/50 border-b border-border">{columns.map((col, ci) => <th key={ci} className="px-2 py-2 text-left text-[10px] uppercase font-bold text-muted-foreground">{col}</th>)}<th className="w-8" /></tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri} className="border-b border-border last:border-b-0 group hover:bg-muted/20">{columns.map((_, ci) => <td key={ci} className="px-1 py-1"><input type="text" value={Object.values(row)[ci] ?? ""} onChange={(e) => setData(rows.map((r, rii) => rii === ri ? { ...r, [ci]: e.target.value } : r))} placeholder="..." className="w-full h-7 text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary/50 px-1 focus:outline-none" /></td>)}<td className="px-1"><RemoveBtn onClick={() => setData(rows.filter((_, rii) => rii !== ri))} /></td></tr>)}</tbody></table></div>}
    <AddButton onClick={() => setData([...rows, {}])} label="Adicionar linha" /></div>;
}

function CustomLinksPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  const { data: links, setData } = useEnterpriseData<{ id: string; title: string; url: string }[]>(pageId, `custom-${tabId}`, []);
  return <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6"><PanelHeader emoji="🔗" title="Links" />
    <div className="space-y-2">{links.map((l, i) => <div key={l.id} className="group flex items-center gap-2 rounded-md border border-border bg-card p-2 hover:border-primary/30">
      <input type="text" value={l.title} onChange={(e) => setData(links.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))} placeholder="Título" className="flex-1 h-8 text-sm bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
      <input type="text" value={l.url} onChange={(e) => setData(links.map((x, xi) => xi === i ? { ...x, url: e.target.value } : x))} placeholder="https://..." className="flex-1 h-8 text-sm bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
      {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded text-muted-foreground hover:text-primary flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></a>}
      <RemoveBtn onClick={() => setData(links.filter((_, xi) => xi !== i))} /></div>)}</div>
    <AddButton onClick={() => setData([...links, { id: makeId(), title: "", url: "" }])} label="Adicionar link" /></div>;
}

// ============================================================================
// NOVOS TEMPLATES DE ABAS CUSTOMIZADAS
// ============================================================================

// 📇 Contatos — nome, telefone, email, observação
function CustomContactsPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Contact = { id: string; name: string; phone: string; email: string; notes: string };
  const { data: contacts, setData } = useEnterpriseData<Contact[]>(pageId, `custom-${tabId}`, []);
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📇" title="Contatos" />
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato. Clique em "+ Adicionar contato".</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={c.id} className="group rounded-lg border border-border bg-card p-3 hover:border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={c.name} onChange={(e) => setData(contacts.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} placeholder="Nome *" className="flex-1 h-8 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <RemoveBtn onClick={() => setData(contacts.filter((_, xi) => xi !== i))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={c.phone} onChange={(e) => setData(contacts.map((x, xi) => xi === i ? { ...x, phone: e.target.value } : x))} placeholder="📞 Telefone / WhatsApp" className="h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                <input type="email" value={c.email} onChange={(e) => setData(contacts.map((x, xi) => xi === i ? { ...x, email: e.target.value } : x))} placeholder="✉️ Email" className="h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
              </div>
              <input type="text" value={c.notes} onChange={(e) => setData(contacts.map((x, xi) => xi === i ? { ...x, notes: e.target.value } : x))} placeholder="Observações..." className="mt-2 w-full h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={() => setData([...contacts, { id: makeId(), name: "", phone: "", email: "", notes: "" }])} label="Adicionar contato" />
    </div>
  );
}

// 💵 Financeiro simples — entradas/saídas com saldo automático
function CustomSimpleFinancePanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Transaction = { id: string; date: string; description: string; category: string; type: "entrada" | "saida"; value: string };
  const { data: transactions, setData } = useEnterpriseData<Transaction[]>(pageId, `custom-${tabId}`, []);
  function parseNum(s: string): number { const n = parseFloat(String(s).replace(/[^\d,.-]/g, "").replace(",", ".")); return isFinite(n) ? n : 0; }
  function formatBRL(n: number): string { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  const entradas = transactions.filter((t) => t.type === "entrada").reduce((acc, t) => acc + parseNum(t.value), 0);
  const saidas = transactions.filter((t) => t.type === "saida").reduce((acc, t) => acc + parseNum(t.value), 0);
  const saldo = entradas - saidas;
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="💵" title="Financeiro Simples" />
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
          <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">Entradas</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(entradas)}</p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center">
          <p className="text-[10px] uppercase text-red-600 dark:text-red-400 font-bold">Saídas</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatBRL(saidas)}</p>
        </div>
        <div className={cn("rounded-lg border p-3 text-center", saldo >= 0 ? "border-blue-500/30 bg-blue-500/5" : "border-amber-500/30 bg-amber-500/5")}>
          <p className="text-[10px] uppercase text-muted-foreground font-bold">Saldo</p>
          <p className={cn("text-sm font-bold", saldo >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400")}>{formatBRL(saldo)}</p>
        </div>
      </div>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação. Clique em "+ Adicionar transação".</p>
      ) : (
        <div className="space-y-1.5">
          {transactions.map((t, i) => (
            <div key={t.id} className="group grid grid-cols-12 gap-2 items-center rounded-md border border-border bg-card p-2 hover:border-primary/30">
              <input type="date" value={t.date} onChange={(e) => setData(transactions.map((x, xi) => xi === i ? { ...x, date: e.target.value } : x))} className="col-span-2 h-8 text-xs bg-transparent border border-border rounded px-1 focus:outline-none" />
              <input type="text" value={t.description} onChange={(e) => setData(transactions.map((x, xi) => xi === i ? { ...x, description: e.target.value } : x))} placeholder="Descrição" className="col-span-4 h-8 text-sm bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
              <input type="text" value={t.category} onChange={(e) => setData(transactions.map((x, xi) => xi === i ? { ...x, category: e.target.value } : x))} placeholder="Categoria" className="col-span-2 h-8 text-xs bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
              <select value={t.type} onChange={(e) => setData(transactions.map((x, xi) => xi === i ? { ...x, type: e.target.value as "entrada" | "saida" } : x))} className={cn("col-span-1 h-8 text-xs bg-transparent border border-border rounded px-1 focus:outline-none", t.type === "entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                <option value="entrada">↑</option>
                <option value="saida">↓</option>
              </select>
              <input type="text" inputMode="decimal" value={t.value} onChange={(e) => setData(transactions.map((x, xi) => xi === i ? { ...x, value: e.target.value } : x))} placeholder="R$" className={cn("col-span-2 h-8 text-xs text-right font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none", t.type === "entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")} />
              <div className="col-span-1 flex justify-end"><RemoveBtn onClick={() => setData(transactions.filter((_, xi) => xi !== i))} /></div>
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={() => setData([...transactions, { id: makeId(), date: new Date().toISOString().slice(0, 10), description: "", category: "", type: "saida", value: "" }])} label="Adicionar transação" />
    </div>
  );
}

// 💡 Ideias — brainstorm com título, descrição e status
function CustomIdeasPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Idea = { id: string; title: string; description: string; status: string };
  const { data: ideas, setData } = useEnterpriseData<Idea[]>(pageId, `custom-${tabId}`, []);
  const STATUSES = [
    { value: "💡 Nova", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "🔄 Em análise", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "✅ Aprovada", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "❌ Descartada", bg: "bg-muted text-muted-foreground" },
  ];
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="💡" title="Ideias" />
      {ideas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ideia. Clique em "+ Adicionar ideia".</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ideas.map((idea, i) => {
            const statusInfo = STATUSES.find((s) => s.value === idea.status) ?? STATUSES[0];
            return (
              <div key={idea.id} className="group rounded-lg border border-border bg-card p-3 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={idea.title} onChange={(e) => setData(ideas.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))} placeholder="Título da ideia *" className="flex-1 h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  <select value={idea.status} onChange={(e) => setData(ideas.map((x, xi) => xi === i ? { ...x, status: e.target.value } : x))} className={cn("h-7 text-[10px] font-bold rounded px-1.5 border-0 focus:outline-none cursor-pointer", statusInfo.bg)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                  </select>
                  <RemoveBtn onClick={() => setData(ideas.filter((_, xi) => xi !== i))} />
                </div>
                <textarea value={idea.description} onChange={(e) => setData(ideas.map((x, xi) => xi === i ? { ...x, description: e.target.value } : x))} placeholder="Descreva a ideia..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...ideas, { id: makeId(), title: "", description: "", status: "💡 Nova" }])} label="Adicionar ideia" />
    </div>
  );
}

// 🔄 Hábitos — nome + checkbox diário (últimos 7 dias)
function CustomHabitsPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Habit = { id: string; name: string; history: Record<string, boolean> };
  const { data: habits, setData } = useEnterpriseData<Habit[]>(pageId, `custom-${tabId}`, []);
  // Gera últimos 7 dias
  const days = useMemo(() => {
    const arr: { key: string; label: string; weekday: string }[] = [];
    const today = new Date();
    const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ key, label: String(d.getDate()), weekday: weekdays[d.getDay()] });
    }
    return arr;
  }, []);
  function toggle(habitId: string, dayKey: string) {
    setData(habits.map((h) => h.id === habitId ? { ...h, history: { ...h.history, [dayKey]: !h.history[dayKey] } } : h));
  }
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🔄" title="Hábitos" />
      <p className="text-xs text-muted-foreground mb-3">Marque os dias em que você cumpriu cada hábito (últimos 7 dias).</p>
      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum hábito. Clique em "+ Adicionar hábito".</p>
      ) : (
        <div className="space-y-2">
          {/* Header com dias */}
          <div className="hidden sm:grid grid-cols-[1fr_repeat(7,32px)_32px] gap-1 px-2 text-[10px] text-center text-muted-foreground font-bold">
            <div className="text-left">Hábito</div>
            {days.map((d) => <div key={d.key}><div className="opacity-60">{d.weekday}</div><div>{d.label}</div></div>)}
            <div></div>
          </div>
          {habits.map((h) => {
            const doneCount = days.filter((d) => h.history[d.key]).length;
            return (
              <div key={h.id} className="grid grid-cols-[1fr_repeat(7,32px)_32px] gap-1 items-center rounded-md border border-border bg-card p-2 hover:border-primary/30">
                <input type="text" value={h.name} onChange={(e) => setData(habits.map((x) => x.id === h.id ? { ...x, name: e.target.value } : x))} placeholder="Nome do hábito *" className="h-8 text-sm font-medium bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                {days.map((d) => (
                  <button key={d.key} onClick={() => toggle(h.id, d.key)} className={cn("h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors", h.history[d.key] ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70")} title={d.key}>
                    {h.history[d.key] ? "✓" : ""}
                  </button>
                ))}
                <div className="flex items-center justify-center">
                  <button onClick={() => setData(habits.filter((x) => x.id !== h.id))} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...habits, { id: makeId(), name: "", history: {} }])} label="Adicionar hábito" />
    </div>
  );
}

// 📦 Estoque simples — item, quantidade, observação
function CustomSimpleInventoryPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Item = { id: string; name: string; quantity: string; notes: string };
  const { data: items, setData } = useEnterpriseData<Item[]>(pageId, `custom-${tabId}`, []);
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📦" title="Estoque Simples" />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum item. Clique em "+ Adicionar item".</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => {
            const qty = parseFloat(String(it.quantity).replace(",", ".")) || 0;
            const isLow = qty > 0 && qty <= 5;
            const isOut = qty <= 0 && it.quantity !== "";
            return (
              <div key={it.id} className="group flex items-center gap-2 rounded-md border border-border bg-card p-2 hover:border-primary/30">
                <input type="text" value={it.name} onChange={(e) => setData(items.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} placeholder="Nome do item *" className="flex-1 h-8 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <div className="flex items-center gap-1">
                  <input type="text" inputMode="decimal" value={it.quantity} onChange={(e) => setData(items.map((x, xi) => xi === i ? { ...x, quantity: e.target.value } : x))} placeholder="Qtd" className={cn("w-16 h-8 text-sm text-center font-bold bg-transparent border-b focus:outline-none", isOut ? "border-red-500 text-red-600 dark:text-red-400" : isLow ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-border")} />
                  {isOut && <span className="text-[9px] font-bold text-red-600 dark:text-red-400">SEM</span>}
                  {isLow && <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">BAIXO</span>}
                </div>
                <input type="text" value={it.notes} onChange={(e) => setData(items.map((x, xi) => xi === i ? { ...x, notes: e.target.value } : x))} placeholder="Obs." className="w-32 h-8 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                <RemoveBtn onClick={() => setData(items.filter((_, xi) => xi !== i))} />
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...items, { id: makeId(), name: "", quantity: "", notes: "" }])} label="Adicionar item" />
    </div>
  );
}

// 📆 Agenda — compromissos com data, horário, local
function CustomAgendaPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Appointment = { id: string; title: string; date: string; time: string; location: string; notes: string };
  const { data: appts, setData } = useEnterpriseData<Appointment[]>(pageId, `custom-${tabId}`, []);
  // Ordena por data+hora
  const sorted = useMemo(() => [...appts].sort((a, b) => {
    const da = a.date + " " + a.time;
    const db = b.date + " " + b.time;
    return da.localeCompare(db);
  }), [appts]);
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📆" title="Agenda" />
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum compromisso. Clique em "+ Adicionar compromisso".</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => {
            const realIdx = appts.findIndex((x) => x.id === a.id);
            const isPast = a.date && new Date(a.date + "T00:00") < new Date(new Date().toDateString());
            return (
              <div key={a.id} className={cn("group rounded-lg border bg-card p-3 hover:border-primary/30", isPast ? "border-border/50 opacity-60" : "border-border")}>
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={a.title} onChange={(e) => setData(appts.map((x, xi) => xi === realIdx ? { ...x, title: e.target.value } : x))} placeholder="Compromisso *" className="flex-1 h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  {isPast && <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">passado</span>}
                  <RemoveBtn onClick={() => setData(appts.filter((_, xi) => xi !== realIdx))} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">📅</span>
                    <input type="date" value={a.date} onChange={(e) => setData(appts.map((x, xi) => xi === realIdx ? { ...x, date: e.target.value } : x))} className="flex-1 h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">🕐</span>
                    <input type="time" value={a.time} onChange={(e) => setData(appts.map((x, xi) => xi === realIdx ? { ...x, time: e.target.value } : x))} className="flex-1 h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-muted-foreground">📍</span>
                    <input type="text" value={a.location} onChange={(e) => setData(appts.map((x, xi) => xi === realIdx ? { ...x, location: e.target.value } : x))} placeholder="Local" className="flex-1 h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  </div>
                </div>
                <input type="text" value={a.notes} onChange={(e) => setData(appts.map((x, xi) => xi === realIdx ? { ...x, notes: e.target.value } : x))} placeholder="Observações..." className="mt-2 w-full h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...appts, { id: makeId(), title: "", date: "", time: "", location: "", notes: "" }])} label="Adicionar compromisso" />
    </div>
  );
}

// 🎯 Metas pessoais — título, progresso, prioridade
function CustomPersonalGoalsPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Goal = { id: string; title: string; progress: number; priority: string; deadline: string; notes: string };
  const { data: goals, setData } = useEnterpriseData<Goal[]>(pageId, `custom-${tabId}`, []);
  const PRIORITIES = [
    { value: "Baixa", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Média", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alta", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🎯" title="Metas Pessoais" />
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta. Clique em "+ Adicionar meta".</p>
      ) : (
        <div className="space-y-2">
          {goals.map((g, i) => {
            const priorityInfo = PRIORITIES.find((p) => p.value === g.priority) ?? PRIORITIES[1];
            return (
              <div key={g.id} className="group rounded-lg border border-border bg-card p-3 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={g.title} onChange={(e) => setData(goals.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))} placeholder="Título da meta *" className="flex-1 h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  <select value={g.priority} onChange={(e) => setData(goals.map((x, xi) => xi === i ? { ...x, priority: e.target.value } : x))} className={cn("h-7 text-[10px] font-bold rounded px-1.5 border-0 focus:outline-none cursor-pointer", priorityInfo.bg)}>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
                  </select>
                  <input type="date" value={g.deadline} onChange={(e) => setData(goals.map((x, xi) => xi === i ? { ...x, deadline: e.target.value } : x))} className="h-8 text-xs bg-transparent border border-border rounded px-1 focus:outline-none" />
                  <RemoveBtn onClick={() => setData(goals.filter((_, xi) => xi !== i))} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", g.progress >= 100 ? "bg-emerald-500" : g.progress >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${g.progress}%` }} />
                  </div>
                  <input type="range" min={0} max={100} value={g.progress} onChange={(e) => setData(goals.map((x, xi) => xi === i ? { ...x, progress: parseInt(e.target.value) } : x))} className="w-24 accent-blue-600" />
                  <span className="text-xs font-bold w-9 text-right">{g.progress}%</span>
                </div>
                <input type="text" value={g.notes} onChange={(e) => setData(goals.map((x, xi) => xi === i ? { ...x, notes: e.target.value } : x))} placeholder="Observações..." className="mt-2 w-full h-7 text-xs bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...goals, { id: makeId(), title: "", progress: 0, priority: "Média", deadline: "", notes: "" }])} label="Adicionar meta" />
    </div>
  );
}

// ⭐ Avaliações — item, nota (1-5 estrelas), comentário
function CustomReviewsPanel({ pageId, tabId }: { pageId: string; tabId: string }) {
  type Review = { id: string; item: string; rating: number; comment: string; date: string };
  const { data: reviews, setData } = useEnterpriseData<Review[]>(pageId, `custom-${tabId}`, []);
  const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  function renderStars(rating: number, onClick?: (n: number) => void) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onClick?.(n)}
            disabled={!onClick}
            className={cn("text-base leading-none", onClick && "cursor-pointer hover:scale-110 transition-transform", n <= rating ? "text-amber-400" : "text-muted-foreground/40")}
          >
            ★
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="⭐" title="Avaliações" />
      {reviews.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-amber-500">{avg.toFixed(1)}</span>
          {renderStars(Math.round(avg))}
          <span className="text-xs text-muted-foreground">({reviews.length} avaliação(ões))</span>
        </div>
      )}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma avaliação. Clique em "+ Adicionar avaliação".</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r, i) => (
            <div key={r.id} className="group rounded-lg border border-border bg-card p-3 hover:border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={r.item} onChange={(e) => setData(reviews.map((x, xi) => xi === i ? { ...x, item: e.target.value } : x))} placeholder="Item avaliado *" className="flex-1 h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                {renderStars(r.rating, (n) => setData(reviews.map((x, xi) => xi === i ? { ...x, rating: n } : x)))}
                <input type="date" value={r.date} onChange={(e) => setData(reviews.map((x, xi) => xi === i ? { ...x, date: e.target.value } : x))} className="h-8 text-xs bg-transparent border border-border rounded px-1 focus:outline-none" />
                <RemoveBtn onClick={() => setData(reviews.filter((_, xi) => xi !== i))} />
              </div>
              <textarea value={r.comment} onChange={(e) => setData(reviews.map((x, xi) => xi === i ? { ...x, comment: e.target.value } : x))} placeholder="Comentário sobre a avaliação..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={() => setData([...reviews, { id: makeId(), item: "", rating: 5, comment: "", date: new Date().toISOString().slice(0, 10) }])} label="Adicionar avaliação" />
    </div>
  );
}

