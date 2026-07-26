"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEnterpriseData } from "@/hooks/use-enterprise-data";
import type { PageCard } from "@/lib/pages";

interface BusinessPlanManagerProps {
  page: PageCard;
  onClose: () => void;
}

function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function parseNum(s: string): number {
  const n = parseFloat(String(s).replace(/[^\d,.-]/g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
}
function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MODULES = [
  { id: "visao", label: "Visão & Valores", emoji: "🎯", color: "#1e3a8a" },
  { id: "swot", label: "Análise SWOT", emoji: "🔍", color: "#7c2d12" },
  { id: "metas", label: "Metas 2026", emoji: "🏁", color: "#166534" },
  { id: "trimestral", label: "Planej. Trimestral", emoji: "📅", color: "#0d9488" },
  { id: "crescimento", label: "Estratégia de Crescimento", emoji: "📈", color: "#7c3aed" },
  { id: "financeiro", label: "Projeções Financeiras", emoji: "💰", color: "#0891b2" },
  { id: "concorrentes", label: "Concorrentes", emoji: "⚔️", color: "#dc2626" },
  { id: "kpis", label: "Indicadores (KPIs)", emoji: "📊", color: "#2563eb" },
  { id: "lancamentos", label: "Calendário de Lançamentos", emoji: "🚀", color: "#db2777" },
  { id: "longo-prazo", label: "Visão de Longo Prazo", emoji: "🔭", color: "#1e1b4b" },
  { id: "riscos", label: "Gestão de Riscos", emoji: "⚠️", color: "#ea580c" },
];

export function BusinessPlanManager({ page, onClose }: BusinessPlanManagerProps) {
  const [activeModule, setActiveModule] = useState<string>("visao");

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#1c1917"} 0%, ${page.color ?? "#1c1917"}dd 100%)`, color: "#fff" }}>
              {page.emoji || page.title.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1>
              <p className="text-[11px] text-muted-foreground">Planejamento estratégico para crescimento empresarial</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FontScaleControl />
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Módulos nav */}
      <nav className="border-b border-border bg-card px-4 sm:px-6 py-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 sections-tabs-scroll">
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-[88px] h-[68px] rounded-lg border transition-all shrink-0",
                  isActive ? "border-transparent text-white shadow-md scale-105" : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                style={isActive ? { background: mod.color } : undefined}
              >
                <span className="text-lg">{mod.emoji}</span>
                <span className="text-[9px] font-semibold text-center leading-tight px-1">{mod.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        {activeModule === "visao" && <VisaoValoresModule pageId={page.id} />}
        {activeModule === "swot" && <SwotModule pageId={page.id} />}
        {activeModule === "metas" && <MetasModule pageId={page.id} />}
        {activeModule === "trimestral" && <TrimestralModule pageId={page.id} />}
        {activeModule === "crescimento" && <CrescimentoModule pageId={page.id} />}
        {activeModule === "financeiro" && <FinanceiroModule pageId={page.id} />}
        {activeModule === "concorrentes" && <ConcorrentesModule pageId={page.id} />}
        {activeModule === "kpis" && <KpisModule pageId={page.id} />}
        {activeModule === "lancamentos" && <LancamentosModule pageId={page.id} />}
        {activeModule === "longo-prazo" && <LongoPrazoModule pageId={page.id} />}
        {activeModule === "riscos" && <RiscosModule pageId={page.id} />}
      </div>
    </div>
  );
}

// ============================================================================
// Componentes auxiliares
// ============================================================================

function PanelHeader({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="mt-4 h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
      {label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0" title="Excluir">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold block mb-0.5">{children}</label>;
}

// ============================================================================
// 1. 🎯 VISÃO & VALORES
// ============================================================================

function VisaoValoresModule({ pageId }: { pageId: string }) {
  const { data: visao, setData } = useEnterpriseData<{
    missao: string;
    visao: string;
    valores: string;
    posicionamento: string;
    publico: string;
    diferencial: string;
  }>(pageId, "bp-visao", { missao: "", visao: "", valores: "", posicionamento: "", publico: "", diferencial: "" });

  function update(patch: Partial<typeof visao>) {
    setData({ ...visao, ...patch });
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🎯" title="Visão & Valores" subtitle="A base do seu plano estratégico — quem você é e para onde vai." />

      <div className="space-y-4">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <Label>🎯 Missão — por que sua empresa existe?</Label>
          <textarea value={visao.missao} onChange={(e) => update({ missao: e.target.value })} placeholder="Ex: Tornar a vida das pessoas mais produtiva através de soluções digitais inovadoras..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-blue-500/50 resize-y" />
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <Label>🔭 Visão — onde quer chegar?</Label>
          <textarea value={visao.visao} onChange={(e) => update({ visao: e.target.value })} placeholder="Ex: Ser referência nacional em soluções digitais até 2030..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500/50 resize-y" />
        </div>

        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          <Label>💎 Valores — princípios que guiam suas decisões</Label>
          <textarea value={visao.valores} onChange={(e) => update({ valores: e.target.value })} placeholder="Ex: Inovação, transparência, foco no cliente, excelência..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-purple-500/50 resize-y" />
          <p className="text-[10px] text-muted-foreground mt-1">Separe os valores por vírgula ou linha.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <Label>📍 Posicionamento de mercado</Label>
            <textarea value={visao.posicionamento} onChange={(e) => update({ posicionamento: e.target.value })} placeholder="Ex: Premium, baixo custo, nicho..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/50 resize-y" />
          </div>
          <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-4">
            <Label>👥 Público-alvo</Label>
            <textarea value={visao.publico} onChange={(e) => update({ publico: e.target.value })} placeholder="Ex: Empreendedores 25-45 anos, classe B, urbanos..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-pink-500/50 resize-y" />
          </div>
        </div>

        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
          <Label>⭐ Diferencial competitivo — o que torna sua empresa única?</Label>
          <textarea value={visao.diferencial} onChange={(e) => update({ diferencial: e.target.value })} placeholder="Ex: Único serviço com IA personalizada + suporte humano 24/7..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-teal-500/50 resize-y" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. 🔍 ANÁLISE SWOT
// ============================================================================

function SwotModule({ pageId }: { pageId: string }) {
  const { data: swot, setData } = useEnterpriseData<{
    forcas: string[];
    fraquezas: string[];
    oportunidades: string[];
    ameacas: string[];
  }>(pageId, "bp-swot", { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] });

  function update(key: keyof typeof swot, items: string[]) {
    setData({ ...swot, [key]: items });
  }

  function addItem(key: keyof typeof swot) {
    update(key, [...swot[key], ""]);
  }
  function updateItem(key: keyof typeof swot, idx: number, value: string) {
    update(key, swot[key].map((it, i) => (i === idx ? value : it)));
  }
  function removeItem(key: keyof typeof swot, idx: number) {
    update(key, swot[key].filter((_, i) => i !== idx));
  }

  const quadrants = [
    { key: "forcas" as const, title: "Forças", emoji: "💪", desc: "Vantagens internas", color: "border-emerald-500/40 bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { key: "fraquezas" as const, title: "Fraquezas", emoji: "⚠️", desc: "Limitações internas", color: "border-amber-500/40 bg-amber-500/5", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { key: "oportunidades" as const, title: "Oportunidades", emoji: "🌟", desc: "Fatores externos positivos", color: "border-blue-500/40 bg-blue-500/5", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { key: "ameacas" as const, title: "Ameaças", emoji: "🚨", desc: "Fatores externos negativos", color: "border-red-500/40 bg-red-500/5", badge: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🔍" title="Análise SWOT" subtitle="Matriz estratégica: Forças, Fraquezas, Oportunidades e Ameaças." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrants.map((q) => (
          <div key={q.key} className={cn("rounded-xl border p-4", q.color)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{q.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{q.title}</p>
                  <p className="text-[10px] text-muted-foreground">{q.desc}</p>
                </div>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", q.badge)}>{swot[q.key].filter((s) => s.trim()).length}</span>
            </div>
            <div className="space-y-1.5">
              {swot[q.key].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 group">
                  <input type="text" value={item} onChange={(e) => updateItem(q.key, idx, e.target.value)} placeholder={`${q.title.slice(0, -1)}...`} className="flex-1 h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                  <button onClick={() => removeItem(q.key, idx)} className="h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => addItem(q.key)} className="mt-2 h-7 w-full text-[11px] rounded border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              + Adicionar {q.title.slice(0, -1).toLowerCase()}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. 🏁 METAS 2026
// ============================================================================

interface Meta { id: string; titulo: string; prazo: string; prioridade: string; categoria: string; progresso: number; notas: string; passoAPasso: { id: string; titulo: string; done: boolean }[] }

function MetasModule({ pageId }: { pageId: string }) {
  const { data: metas, setData } = useEnterpriseData<Meta[]>(pageId, "bp-metas", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("Todas");

  const PRIORIDADES = [
    { value: "Baixa", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Média", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alta", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  const categorias = useMemo(() => {
    const set = new Set<string>();
    metas.forEach((m) => { if ((m.categoria ?? "").trim()) set.add(m.categoria.trim()); });
    return Array.from(set).sort();
  }, [metas]);

  function getProgress(m: Meta): number {
    if (m.passoAPasso.length > 0) {
      const done = m.passoAPasso.filter((p) => p.done).length;
      return Math.round((done / m.passoAPasso.length) * 100);
    }
    return m.progresso;
  }
  function update(id: string, patch: Partial<Meta>) {
    setData(metas.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function addPasso(metaId: string) {
    const m = metas.find((x) => x.id === metaId);
    if (!m) return;
    update(metaId, { passoAPasso: [...m.passoAPasso, { id: makeId("p"), titulo: "", done: false }] });
  }
  function updatePasso(metaId: string, passoId: string, patch: Partial<{ titulo: string; done: boolean }>) {
    const m = metas.find((x) => x.id === metaId);
    if (!m) return;
    update(metaId, { passoAPasso: m.passoAPasso.map((p) => (p.id === passoId ? { ...p, ...patch } : p)) });
  }
  function removePasso(metaId: string, passoId: string) {
    const m = metas.find((x) => x.id === metaId);
    if (!m) return;
    update(metaId, { passoAPasso: m.passoAPasso.filter((p) => p.id !== passoId) });
  }

  const filtered = filterCat === "Todas" ? metas : metas.filter((m) => m.categoria === filterCat);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🏁" title="Metas 2026" subtitle="Defina metas SMART (específicas, mensuráveis, alcançáveis, relevantes e com prazo)." />

      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setFilterCat("Todas")} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterCat === "Todas" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>Todas</button>
          {categorias.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterCat === c ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>{c}</button>
          ))}
        </div>
      )}

      {metas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta. Clique em "+ Nova meta".</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            const progress = getProgress(m);
            const prioInfo = PRIORIDADES.find((p) => p.value === m.prioridade) ?? PRIORIDADES[1];
            return (
              <div key={m.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{m.titulo || "Meta sem título"}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", prioInfo.bg)}>{m.prioridade}</span>
                      {m.categoria && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{m.categoria}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : progress >= 25 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs font-bold w-9 text-right">{progress}%</span>
                    </div>
                    {m.prazo && <p className="text-[10px] mt-1 text-muted-foreground">📅 {new Date(m.prazo + "T00:00").toLocaleDateString("pt-BR")}</p>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-2 bg-muted/10">
                    <div>
                      <Label>Título da meta *</Label>
                      <input type="text" value={m.titulo} onChange={(e) => update(m.id, { titulo: e.target.value })} placeholder="Ex: Aumentar receita em 30%" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <Label>Prazo</Label>
                        <input type="date" value={m.prazo} onChange={(e) => update(m.id, { prazo: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <select value={m.prioridade} onChange={(e) => update(m.id, { prioridade: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                          {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <input type="text" value={m.categoria} onChange={(e) => update(m.id, { categoria: e.target.value })} placeholder="Ex: Vendas" className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    {m.passoAPasso.length === 0 ? (
                      <div>
                        <Label>Progresso manual: {m.progresso}%</Label>
                        <input type="range" min={0} max={100} value={m.progresso} onChange={(e) => update(m.id, { progresso: parseInt(e.target.value) })} className="w-full accent-blue-600" />
                      </div>
                    ) : null}
                    {/* Passo a passo */}
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <Label>👣 Passo a passo ({m.passoAPasso.filter((p) => p.done).length}/{m.passoAPasso.length})</Label>
                        <button onClick={() => addPasso(m.id)} className="h-5 px-2 text-[10px] rounded bg-purple-600 text-white">+ Passo</button>
                      </div>
                      {m.passoAPasso.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-1.5 mb-1">
                          <input type="checkbox" checked={p.done} onChange={(e) => updatePasso(m.id, p.id, { done: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
                          <span className={cn("text-[10px] font-bold w-4 text-center", p.done ? "text-emerald-500" : "text-purple-600 dark:text-purple-400")}>{p.done ? "✓" : idx + 1}</span>
                          <input type="text" value={p.titulo} onChange={(e) => updatePasso(m.id, p.id, { titulo: e.target.value })} placeholder={`Passo ${idx + 1}...`} className={cn("flex-1 h-6 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-purple-500/50", p.done && "line-through opacity-60")} />
                          <button onClick={() => removePasso(m.id, p.id)} className="h-5 w-5 rounded text-muted-foreground hover:text-destructive text-[10px]">×</button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <textarea value={m.notas} onChange={(e) => update(m.id, { notas: e.target.value })} placeholder="Anotações..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button onClick={() => setData(metas.filter((x) => x.id !== m.id))} className="h-7 px-2.5 text-[11px] rounded text-destructive hover:bg-destructive/10">Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...metas, { id: makeId("meta"), titulo: "", prazo: "", prioridade: "Média", categoria: filterCat !== "Todas" ? filterCat : "", progresso: 0, notas: "", passoAPasso: [] }])} label="Nova meta" />
    </div>
  );
}

// ============================================================================
// 4. 📅 PLANEJAMENTO TRIMESTRAL
// ============================================================================

interface AcaoTrimestral { id: string; titulo: string; responsavel: string; prazo: string; done: boolean }

function TrimestralModule({ pageId }: { pageId: string }) {
  const TRIMESTRES = [
    { id: "Q1", label: "1º Trimestre", meses: "Jan - Mar", color: "border-blue-500/40 bg-blue-500/5", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { id: "Q2", label: "2º Trimestre", meses: "Abr - Jun", color: "border-emerald-500/40 bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { id: "Q3", label: "3º Trimestre", meses: "Jul - Set", color: "border-amber-500/40 bg-amber-500/5", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { id: "Q4", label: "4º Trimestre", meses: "Out - Dez", color: "border-purple-500/40 bg-purple-500/5", badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  ];

  const { data: dados, setData } = useEnterpriseData<Record<string, { objetivo: string; acoes: AcaoTrimestral[] }>>(pageId, "bp-trimestral", {});
  // Inicializa trimestres vazios se não existirem
  const trimestres = useMemo(() => {
    const result: Record<string, { objetivo: string; acoes: AcaoTrimestral[] }> = {};
    for (const t of TRIMESTRES) {
      result[t.id] = dados[t.id] ?? { objetivo: "", acoes: [] };
    }
    return result;
  }, [dados]);

  function updateTrimestre(triId: string, patch: Partial<{ objetivo: string; acoes: AcaoTrimestral[] }>) {
    setData({ ...dados, [triId]: { ...trimestres[triId], ...patch } });
  }
  function addAcao(triId: string) {
    updateTrimestre(triId, { acoes: [...trimestres[triId].acoes, { id: makeId("acao"), titulo: "", responsavel: "", prazo: "", done: false }] });
  }
  function updateAcao(triId: string, acaoId: string, patch: Partial<AcaoTrimestral>) {
    updateTrimestre(triId, { acoes: trimestres[triId].acoes.map((a) => (a.id === acaoId ? { ...a, ...patch } : a)) });
  }
  function removeAcao(triId: string, acaoId: string) {
    updateTrimestre(triId, { acoes: trimestres[triId].acoes.filter((a) => a.id !== acaoId) });
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📅" title="Planejamento Trimestral" subtitle="Divida o ano em 4 trimestres com objetivos e ações." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRIMESTRES.map((t) => {
          const dadosTri = trimestres[t.id];
          const doneCount = dadosTri.acoes.filter((a) => a.done).length;
          const totalCount = dadosTri.acoes.length;
          const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          return (
            <div key={t.id} className={cn("rounded-xl border p-4", t.color)}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.meses}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", t.badge)}>{progress}%</span>
              </div>
              <textarea value={dadosTri.objetivo} onChange={(e) => updateTrimestre(t.id, { objetivo: e.target.value })} placeholder="Objetivo principal do trimestre..." rows={2} className="w-full text-xs bg-background border border-border rounded px-2 py-1 mb-2 focus:outline-none focus:border-primary/50 resize-y" />
              <div className="space-y-1">
                {dadosTri.acoes.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 group rounded bg-background/50 p-1">
                    <input type="checkbox" checked={a.done} onChange={(e) => updateAcao(t.id, a.id, { done: e.target.checked })} className="h-4 w-4 accent-emerald-600 shrink-0" />
                    <input type="text" value={a.titulo} onChange={(e) => updateAcao(t.id, a.id, { titulo: e.target.value })} placeholder="Ação..." className={cn("flex-1 h-6 text-xs bg-transparent border-0 focus:outline-none", a.done && "line-through opacity-60")} />
                    <input type="text" value={a.responsavel} onChange={(e) => updateAcao(t.id, a.id, { responsavel: e.target.value })} placeholder="Resp." className="w-16 h-6 text-[10px] bg-transparent border-b border-border focus:outline-none" />
                    <button onClick={() => removeAcao(t.id, a.id)} className="h-5 w-5 rounded text-muted-foreground hover:text-destructive text-[10px] shrink-0">×</button>
                  </div>
                ))}
              </div>
              <button onClick={() => addAcao(t.id)} className="mt-2 h-7 w-full text-[11px] rounded border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40">+ Ação</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 5. 📈 ESTRATÉGIA DE CRESCIMENTO
// ============================================================================

interface Iniciativa { id: string; titulo: string; tipo: string; descricao: string; status: string; impacto: string; responsavel: string; prazo: string }

function CrescimentoModule({ pageId }: { pageId: string }) {
  const { data: iniciativas, setData } = useEnterpriseData<Iniciativa[]>(pageId, "bp-crescimento", []);
  const [filterTipo, setFilterTipo] = useState<string>("Todos");

  const TIPOS = [
    { value: "Novo mercado", emoji: "🌍", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "Novo produto", emoji: "📦", bg: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
    { value: "Parceria", emoji: "🤝", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Canal de venda", emoji: "🛒", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Marketing", emoji: "📢", bg: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
    { value: "Internacionalização", emoji: "✈️", bg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
  ];
  const STATUS = [
    { value: "💡 Ideia", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "🔄 Em análise", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "✅ Aprovada", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "🚀 Em execução", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "🎉 Concluída", bg: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400" },
  ];
  const IMPACTOS = [
    { value: "Baixo", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Médio", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alto", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  function update(id: string, patch: Partial<Iniciativa>) {
    setData(iniciativas.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  const tiposPresentes = useMemo(() => {
    const set = new Set<string>();
    iniciativas.forEach((i) => { if (i.tipo) set.add(i.tipo); });
    return Array.from(set);
  }, [iniciativas]);
  const filtered = filterTipo === "Todos" ? iniciativas : iniciativas.filter((i) => i.tipo === filterTipo);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📈" title="Estratégia de Crescimento" subtitle="Iniciativas para expandir o negócio: novos mercados, produtos, parcerias e canais." />

      {tiposPresentes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setFilterTipo("Todos")} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterTipo === "Todos" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>Todos</button>
          {tiposPresentes.map((t) => {
            const tipoInfo = TIPOS.find((x) => x.value === t);
            return (
              <button key={t} onClick={() => setFilterTipo(t)} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterTipo === t ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>
                {tipoInfo?.emoji} {t}
              </button>
            );
          })}
        </div>
      )}

      {iniciativas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma iniciativa. Clique em "+ Nova iniciativa".</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => {
            const tipoInfo = TIPOS.find((t) => t.value === i.tipo);
            const statusInfo = STATUS.find((s) => s.value === i.status) ?? STATUS[0];
            const impactoInfo = IMPACTOS.find((imp) => imp.value === i.impacto) ?? IMPACTOS[1];
            return (
              <div key={i.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-base">{tipoInfo?.emoji ?? "📋"}</span>
                  <input type="text" value={i.titulo} onChange={(e) => update(i.id, { titulo: e.target.value })} placeholder="Título da iniciativa *" className="flex-1 min-w-[150px] h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  <select value={i.tipo} onChange={(e) => update(i.id, { tipo: e.target.value })} className={cn("h-7 text-[10px] font-bold rounded px-1.5 border-0 focus:outline-none", tipoInfo?.bg ?? "bg-muted")}>
                    <option value="">Sem tipo</option>
                    {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.value}</option>)}
                  </select>
                  <select value={i.status} onChange={(e) => update(i.id, { status: e.target.value })} className={cn("h-7 text-[10px] font-bold rounded px-1.5 border-0 focus:outline-none", statusInfo.bg)}>
                    {STATUS.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                  </select>
                  <select value={i.impacto} onChange={(e) => update(i.id, { impacto: e.target.value })} className={cn("h-7 text-[10px] font-bold rounded px-1.5 border-0 focus:outline-none", impactoInfo.bg)}>
                    {IMPACTOS.map((imp) => <option key={imp.value} value={imp.value}>{imp.value}</option>)}
                  </select>
                  <RemoveBtn onClick={() => setData(iniciativas.filter((x) => x.id !== i.id))} />
                </div>
                <textarea value={i.descricao} onChange={(e) => update(i.id, { descricao: e.target.value })} placeholder="Descreva a iniciativa..." rows={2} className="w-full text-xs bg-background border border-border rounded px-2 py-1 mb-2 focus:outline-none focus:border-primary/50 resize-y" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Responsável</Label>
                    <input type="text" value={i.responsavel} onChange={(e) => update(i.id, { responsavel: e.target.value })} placeholder="Nome" className="w-full h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <input type="date" value={i.prazo} onChange={(e) => update(i.id, { prazo: e.target.value })} className="w-full h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...iniciativas, { id: makeId("ini"), titulo: "", tipo: "", descricao: "", status: "💡 Ideia", impacto: "Médio", responsavel: "", prazo: "" }])} label="Nova iniciativa" />
    </div>
  );
}

// ============================================================================
// 6. 💰 PROJEÇÕES FINANCEIRAS
// ============================================================================

function FinanceiroModule({ pageId }: { pageId: string }) {
  const { data: proj, setData } = useEnterpriseData<{
    receitaAtual: string;
    receitaMeta: string;
    investimentos: { id: string; item: string; valor: string; retorno: string }[];
    custosFixos: string;
    custosVariaveis: string;
    pontoEquilibrio: string;
    notas: string;
  }>(pageId, "bp-financeiro", {
    receitaAtual: "", receitaMeta: "", investimentos: [], custosFixos: "", custosVariaveis: "", pontoEquilibrio: "", notas: ""
  });

  function update(patch: Partial<typeof proj>) { setData({ ...proj, ...patch }); }
  function addInvest() { update({ investimentos: [...proj.investimentos, { id: makeId("inv"), item: "", valor: "", retorno: "" }] }); }
  function updateInvest(id: string, patch: Partial<{ item: string; valor: string; retorno: string }>) {
    update({ investimentos: proj.investimentos.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }
  function removeInvest(id: string) { update({ investimentos: proj.investimentos.filter((i) => i.id !== id) }); }

  const receitaAtual = parseNum(proj.receitaAtual);
  const receitaMeta = parseNum(proj.receitaMeta);
  const crescimento = receitaAtual > 0 ? ((receitaMeta - receitaAtual) / receitaAtual) * 100 : 0;
  const totalInvest = proj.investimentos.reduce((acc, i) => acc + parseNum(i.valor), 0);
  const totalRetorno = proj.investimentos.reduce((acc, i) => acc + parseNum(i.retorno), 0);
  const roiMedio = totalInvest > 0 ? ((totalRetorno - totalInvest) / totalInvest) * 100 : 0;
  const custosFixos = parseNum(proj.custosFixos);
  const custosVariaveis = parseNum(proj.custosVariaveis);
  const margemContribuicao = receitaMeta - custosVariaveis;
  const pe = margemContribuicao > 0 ? (custosFixos / margemContribuicao) * 100 : 0;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="💰" title="Projeções Financeiras" subtitle="Planeje receita, investimentos e ponto de equilíbrio." />

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">Receita atual</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatBRL(receitaAtual)}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">Meta 2026</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(receitaMeta)}</p>
        </div>
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">Crescimento</p>
          <p className={cn("text-sm font-bold", crescimento >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{crescimento >= 0 ? "+" : ""}{crescimento.toFixed(0)}%</p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">ROI médio</p>
          <p className={cn("text-sm font-bold", roiMedio >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{roiMedio >= 0 ? "+" : ""}{roiMedio.toFixed(0)}%</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Receita atual (mensal)</Label>
            <input type="text" inputMode="decimal" value={proj.receitaAtual} onChange={(e) => update({ receitaAtual: e.target.value })} placeholder="R$" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <Label>Meta de receita 2026 (mensal)</Label>
            <input type="text" inputMode="decimal" value={proj.receitaMeta} onChange={(e) => update({ receitaMeta: e.target.value })} placeholder="R$" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Custos fixos (mensal)</Label>
            <input type="text" inputMode="decimal" value={proj.custosFixos} onChange={(e) => update({ custosFixos: e.target.value })} placeholder="R$" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <Label>Custos variáveis (mensal)</Label>
            <input type="text" inputMode="decimal" value={proj.custosVariaveis} onChange={(e) => update({ custosVariaveis: e.target.value })} placeholder="R$" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        {pe > 0 && (
          <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 text-sm">
            <span className="text-muted-foreground">Ponto de equilíbrio estimado: </span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{pe.toFixed(1)}% da meta de receita</span>
            <p className="text-[10px] text-muted-foreground mt-1">Acima deste percentual, a empresa gera lucro.</p>
          </div>
        )}

        {/* Investimentos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>💼 Investimentos necessários</Label>
            <button onClick={addInvest} className="h-6 px-2 text-[10px] rounded bg-blue-600 text-white">+ Investimento</button>
          </div>
          {proj.investimentos.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic">Nenhum investimento cadastrado.</p>
          ) : (
            <div className="space-y-1.5">
              {proj.investimentos.map((inv) => (
                <div key={inv.id} className="grid grid-cols-12 gap-2 items-center rounded border border-border bg-background p-2">
                  <input type="text" value={inv.item} onChange={(e) => updateInvest(inv.id, { item: e.target.value })} placeholder="Item (ex: Nova máquina)" className="col-span-5 h-7 text-xs bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  <input type="text" inputMode="decimal" value={inv.valor} onChange={(e) => updateInvest(inv.id, { valor: e.target.value })} placeholder="Valor R$" className="col-span-3 h-7 text-xs text-right bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                  <input type="text" inputMode="decimal" value={inv.retorno} onChange={(e) => updateInvest(inv.id, { retorno: e.target.value })} placeholder="Retorno R$" className="col-span-3 h-7 text-xs text-right bg-transparent border-b border-emerald-500/30 focus:border-emerald-500/50 px-1 focus:outline-none" />
                  <div className="col-span-1 flex justify-end"><RemoveBtn onClick={() => removeInvest(inv.id)} /></div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold pt-1">
                <div className="col-span-5 text-muted-foreground">TOTAL</div>
                <div className="col-span-3 text-right text-red-600 dark:text-red-400">{formatBRL(totalInvest)}</div>
                <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400">{formatBRL(totalRetorno)}</div>
                <div className="col-span-1"></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label>Notas financeiras</Label>
          <textarea value={proj.notas} onChange={(e) => update({ notas: e.target.value })} placeholder="Observações, premissas, riscos financeiros..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. ⚔️ CONCORRENTES
// ============================================================================

interface Concorrente { id: string; nome: string; pontosFortes: string; pontosFracos: string; preco: string; seuDiferencial: string; ameaca: string }

function ConcorrentesModule({ pageId }: { pageId: string }) {
  const { data: concorrentes, setData } = useEnterpriseData<Concorrente[]>(pageId, "bp-concorrentes", []);
  function update(id: string, patch: Partial<Concorrente>) {
    setData(concorrentes.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="⚔️" title="Análise de Concorrentes" subtitle="Mapeie a concorrência e identifique seu diferencial competitivo." />
      {concorrentes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum concorrente. Clique em "+ Adicionar concorrente".</p>
      ) : (
        <div className="space-y-2">
          {concorrentes.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={c.nome} onChange={(e) => update(c.id, { nome: e.target.value })} placeholder="Nome do concorrente *" className="flex-1 h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                <input type="text" value={c.preco} onChange={(e) => update(c.id, { preco: e.target.value })} placeholder="Preço médio" className="w-28 h-8 text-xs text-right bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                <RemoveBtn onClick={() => setData(concorrentes.filter((x) => x.id !== c.id))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
                  <Label>💪 Pontos fortes</Label>
                  <textarea value={c.pontosFortes} onChange={(e) => update(c.id, { pontosFortes: e.target.value })} placeholder="O que eles fazem bem?" rows={2} className="w-full text-xs bg-background border border-border rounded px-1.5 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                </div>
                <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
                  <Label>⚠️ Pontos fracos</Label>
                  <textarea value={c.pontosFracos} onChange={(e) => update(c.id, { pontosFracos: e.target.value })} placeholder="Onde eles falham?" rows={2} className="w-full text-xs bg-background border border-border rounded px-1.5 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="rounded border border-blue-500/30 bg-blue-500/5 p-2">
                  <Label>⭐ Seu diferencial</Label>
                  <textarea value={c.seuDiferencial} onChange={(e) => update(c.id, { seuDiferencial: e.target.value })} placeholder="Como você é melhor?" rows={2} className="w-full text-xs bg-background border border-border rounded px-1.5 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                </div>
                <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2">
                  <Label>🚨 Nível de ameaça</Label>
                  <select value={c.ameaca} onChange={(e) => update(c.id, { ameaca: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50">
                    <option value="">Selecione...</option>
                    <option value="Baixa">Baixa — não compete diretamente</option>
                    <option value="Média">Média — compete em alguns pontos</option>
                    <option value="Alta">Alta — ameaça direta</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={() => setData([...concorrentes, { id: makeId("conc"), nome: "", pontosFortes: "", pontosFracos: "", preco: "", seuDiferencial: "", ameaca: "" }])} label="Adicionar concorrente" />
    </div>
  );
}

// ============================================================================
// 8. 📊 INDICADORES (KPIs)
// ============================================================================

interface Kpi { id: string; nome: string; valor: string; meta: string; anterior: string; unidade: string; categoria: string }

function KpisModule({ pageId }: { pageId: string }) {
  const { data: kpis, setData } = useEnterpriseData<Kpi[]>(pageId, "bp-kpis", []);
  const [filterCat, setFilterCat] = useState<string>("Todas");
  function update(id: string, patch: Partial<Kpi>) {
    setData(kpis.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  }
  const categorias = useMemo(() => {
    const set = new Set<string>();
    kpis.forEach((k) => { if ((k.categoria ?? "").trim()) set.add(k.categoria.trim()); });
    return Array.from(set).sort();
  }, [kpis]);
  const filtered = filterCat === "Todas" ? kpis : kpis.filter((k) => k.categoria === filterCat);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="📊" title="Indicadores (KPIs)" subtitle="Métricas-chave para acompanhar o crescimento: CAC, LTV, churn, receita, margem." />
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setFilterCat("Todas")} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterCat === "Todas" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>Todas</button>
          {categorias.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={cn("text-[10px] px-2 py-0.5 rounded-full border", filterCat === c ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>{c}</button>
          ))}
        </div>
      )}
      {kpis.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum KPI. Clique em "+ Novo KPI".</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((k) => {
            const val = parseNum(k.valor);
            const meta = parseNum(k.meta);
            const anterior = parseNum(k.anterior);
            const trend = anterior > 0 ? ((val - anterior) / anterior) * 100 : 0;
            const progress = meta > 0 ? Math.min((val / meta) * 100, 100) : 0;
            return (
              <div key={k.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={k.nome} onChange={(e) => update(k.id, { nome: e.target.value })} placeholder="Nome do KPI *" className="flex-1 h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  {k.categoria && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{k.categoria}</span>}
                  <RemoveBtn onClick={() => setData(kpis.filter((x) => x.id !== k.id))} />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl font-bold text-foreground">{k.valor || "—"}</span>
                  {k.unidade && <span className="text-xs text-muted-foreground">{k.unidade}</span>}
                  {anterior > 0 && (
                    <span className={cn("text-[10px] font-bold", trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
                    </span>
                  )}
                </div>
                {meta > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">Meta: {k.meta}</span>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1.5">
                  <div>
                    <Label>Valor</Label>
                    <input type="text" inputMode="decimal" value={k.valor} onChange={(e) => update(k.id, { valor: e.target.value })} placeholder="0" className="w-full h-7 text-xs bg-background border border-border rounded px-1 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <Label>Meta</Label>
                    <input type="text" inputMode="decimal" value={k.meta} onChange={(e) => update(k.id, { meta: e.target.value })} placeholder="0" className="w-full h-7 text-xs bg-background border border-border rounded px-1 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <Label>Anterior</Label>
                    <input type="text" inputMode="decimal" value={k.anterior} onChange={(e) => update(k.id, { anterior: e.target.value })} placeholder="0" className="w-full h-7 text-xs bg-background border border-border rounded px-1 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <input type="text" value={k.unidade} onChange={(e) => update(k.id, { unidade: e.target.value })} placeholder="R$ %" className="w-full h-7 text-xs bg-background border border-border rounded px-1 focus:outline-none focus:border-primary/50" />
                  </div>
                </div>
                <div className="mt-1.5">
                  <Label>Categoria</Label>
                  <input type="text" value={k.categoria} onChange={(e) => update(k.id, { categoria: e.target.value })} placeholder="Ex: Vendas, Marketing" className="w-full h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...kpis, { id: makeId("kpi"), nome: "", valor: "", meta: "", anterior: "", unidade: "", categoria: filterCat !== "Todas" ? filterCat : "" }])} label="Novo KPI" />
    </div>
  );
}

// ============================================================================
// 9. 🚀 CALENDÁRIO DE LANÇAMENTOS
// ============================================================================

interface Lancamento { id: string; produto: string; mes: string; status: string; responsavel: string; notas: string }

function LancamentosModule({ pageId }: { pageId: string }) {
  const { data: lancamentos, setData } = useEnterpriseData<Lancamento[]>(pageId, "bp-lancamentos", []);
  const MESES = [
    { num: "01", label: "Janeiro", emoji: "❄️" }, { num: "02", label: "Fevereiro", emoji: "💝" },
    { num: "03", label: "Março", emoji: "🌱" }, { num: "04", label: "Abril", emoji: "🌸" },
    { num: "05", label: "Maio", emoji: "💐" }, { num: "06", label: "Junho", emoji: "☀️" },
    { num: "07", label: "Julho", emoji: "🍦" }, { num: "08", label: "Agosto", emoji: "🌻" },
    { num: "09", label: "Setembro", emoji: "🍂" }, { num: "10", label: "Outubro", emoji: "🎃" },
    { num: "11", label: "Novembro", emoji: "🦃" }, { num: "12", label: "Dezembro", emoji: "🎄" },
  ];
  const STATUS = [
    { value: "Planejado", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Em produção", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "Pronto", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Lançado", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Cancelado", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];
  function update(id: string, patch: Partial<Lancamento>) {
    setData(lancamentos.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  const [filterMes, setFilterMes] = useState<string>("Todos");

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🚀" title="Calendário de Lançamentos" subtitle="Planeje produtos e serviços para lançar ao longo do ano." />
      {/* Filtro de meses */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-7 gap-1.5 mb-4">
        <button onClick={() => setFilterMes("Todos")} className={cn("text-[10px] px-1 py-1 rounded border", filterMes === "Todos" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border")}>📋 Todos</button>
        {MESES.map((m) => {
          const count = lancamentos.filter((l) => l.mes === m.num).length;
          return (
            <button key={m.num} onClick={() => setFilterMes(filterMes === m.num ? "Todos" : m.num)} className={cn("text-[10px] px-1 py-1 rounded border flex flex-col items-center", filterMes === m.num ? "bg-blue-600 text-white border-blue-600" : count > 0 ? "border-blue-500/30 bg-blue-500/5" : "bg-background text-muted-foreground border-border")}>
              <span>{m.emoji}</span>
              <span className="text-[9px]">{m.label.slice(0, 3)}</span>
              {count > 0 && <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400">{count}</span>}
            </button>
          );
        })}
      </div>
      {lancamentos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento. Clique em "+ Novo lançamento".</p>
      ) : (
        <div className="space-y-2">
          {lancamentos.filter((l) => filterMes === "Todos" || l.mes === filterMes).map((l) => {
            const statusInfo = STATUS.find((s) => s.value === l.status) ?? STATUS[0];
            const mesInfo = MESES.find((m) => m.num === l.mes);
            return (
              <div key={l.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-base">{mesInfo?.emoji ?? "📅"}</span>
                  <input type="text" value={l.produto} onChange={(e) => update(l.id, { produto: e.target.value })} placeholder="Produto/serviço *" className="flex-1 min-w-[150px] h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  <select value={l.mes} onChange={(e) => update(l.id, { mes: e.target.value })} className="h-7 text-xs bg-background border border-border rounded px-1 focus:outline-none focus:border-primary/50">
                    <option value="">Sem mês</option>
                    {MESES.map((m) => <option key={m.num} value={m.num}>{m.label}</option>)}
                  </select>
                  <select value={l.status} onChange={(e) => update(l.id, { status: e.target.value })} className={cn("h-7 text-[10px] font-bold rounded px-1.5 border-0 focus:outline-none", statusInfo.bg)}>
                    {STATUS.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                  </select>
                  <RemoveBtn onClick={() => setData(lancamentos.filter((x) => x.id !== l.id))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Responsável</Label>
                    <input type="text" value={l.responsavel} onChange={(e) => update(l.id, { responsavel: e.target.value })} placeholder="Nome" className="w-full h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <input type="text" value={l.notas} onChange={(e) => update(l.id, { notas: e.target.value })} placeholder="Detalhes..." className="w-full h-7 text-xs bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...lancamentos, { id: makeId("lanc"), produto: "", mes: filterMes !== "Todos" ? filterMes : "", status: "Planejado", responsavel: "", notas: "" }])} label="Novo lançamento" />
    </div>
  );
}

// ============================================================================
// 10. 🔭 VISÃO DE LONGO PRAZO
// ============================================================================

function LongoPrazoModule({ pageId }: { pageId: string }) {
  const { data: visao, setData } = useEnterpriseData<{
    ano1: string;
    ano3: string;
    ano5: string;
    fatorSucesso: string;
    obstacles: string;
    legado: string;
  }>(pageId, "bp-longo-prazo", { ano1: "", ano3: "", ano5: "", fatorSucesso: "", obstacles: "", legado: "" });
  function update(patch: Partial<typeof visao>) { setData({ ...visao, ...patch }); }

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="🔭" title="Visão de Longo Prazo" subtitle="Onde você quer chegar em 1, 3 e 5 anos?" />
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <Label>📅 Em 1 ano (2027)</Label>
          <textarea value={visao.ano1} onChange={(e) => update({ ano1: e.target.value })} placeholder="Ex: Dobrar a receita, lançar 2 produtos novos, expandir para 3 cidades..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-blue-500/50 resize-y" />
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <Label>📅 Em 3 anos (2029)</Label>
          <textarea value={visao.ano3} onChange={(e) => update({ ano3: e.target.value })} placeholder="Ex: Ser referência regional, equipe de 50 pessoas, receita de R$ 5M/ano..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500/50 resize-y" />
        </div>
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          <Label>📅 Em 5 anos (2031)</Label>
          <textarea value={visao.ano5} onChange={(e) => update({ ano5: e.target.value })} placeholder="Ex: Expansão nacional/internacional, marca consolidada, IPO..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-purple-500/50 resize-y" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
            <Label>⭐ Fator crítico de sucesso</Label>
            <textarea value={visao.fatorSucesso} onChange={(e) => update({ fatorSucesso: e.target.value })} placeholder="O que precisa acontecer para alcançar a visão?" rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-teal-500/50 resize-y" />
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <Label>🚧 Maiores obstáculos</Label>
            <textarea value={visao.obstacles} onChange={(e) => update({ obstacles: e.target.value })} placeholder="O que pode impedir de chegar lá?" rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-red-500/50 resize-y" />
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <Label>🏆 Legado — que marca quer deixar?</Label>
          <textarea value={visao.legado} onChange={(e) => update({ legado: e.target.value })} placeholder="Ex: Transformar a vida de 1 milhão de pessoas através dos nossos produtos..." rows={3} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. ⚠️ GESTÃO DE RISCOS
// ============================================================================

interface Risco { id: string; descricao: string; probabilidade: string; impacto: string; mitigacao: string; status: string }

function RiscosModule({ pageId }: { pageId: string }) {
  const { data: riscos, setData } = useEnterpriseData<Risco[]>(pageId, "bp-riscos", []);
  function update(id: string, patch: Partial<Risco>) {
    setData(riscos.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  const PROB = [
    { value: "Baixa", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Média", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alta", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];
  const IMPACTO = [
    { value: "Baixo", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Médio", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { value: "Alto", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];
  const STATUS = [
    { value: "Identificado", bg: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
    { value: "Em mitigação", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    { value: "Mitigado", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { value: "Materializado", bg: "bg-red-500/15 text-red-600 dark:text-red-400" },
  ];

  function getSeveridade(prob: string, imp: string): "Baixa" | "Média" | "Alta" | "Crítica" {
    const p = PROB.findIndex((x) => x.value === prob);
    const i = IMPACTO.findIndex((x) => x.value === imp);
    if (p === -1 || i === -1) return "Baixa";
    const score = p + i;
    if (score >= 4) return "Crítica";
    if (score >= 3) return "Alta";
    if (score >= 1) return "Média";
    return "Baixa";
  }
  const SEV_COLORS = {
    "Baixa": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    "Média": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    "Alta": "bg-red-500/15 text-red-600 dark:text-red-400",
    "Crítica": "bg-red-700/20 text-red-700 dark:text-red-300 font-bold",
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="⚠️" title="Gestão de Riscos" subtitle="Identifique riscos, avalie severidade e defina plano de mitigação." />
      {riscos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum risco. Clique em "+ Novo risco".</p>
      ) : (
        <div className="space-y-2">
          {riscos.map((r) => {
            const sev = getSeveridade(r.probabilidade, r.impacto);
            const statusInfo = STATUS.find((s) => s.value === r.status) ?? STATUS[0];
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <input type="text" value={r.descricao} onChange={(e) => update(r.id, { descricao: e.target.value })} placeholder="Descrição do risco *" className="flex-1 min-w-[150px] h-8 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", SEV_COLORS[sev])}>Severidade: {sev}</span>
                  <RemoveBtn onClick={() => setData(riscos.filter((x) => x.id !== r.id))} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <Label>Probabilidade</Label>
                    <select value={r.probabilidade} onChange={(e) => update(r.id, { probabilidade: e.target.value })} className={cn("w-full h-7 text-xs font-bold rounded px-1.5 border-0 focus:outline-none", PROB.find((p) => p.value === r.probabilidade)?.bg)}>
                      <option value="">-</option>
                      {PROB.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Impacto</Label>
                    <select value={r.impacto} onChange={(e) => update(r.id, { impacto: e.target.value })} className={cn("w-full h-7 text-xs font-bold rounded px-1.5 border-0 focus:outline-none", IMPACTO.find((i) => i.value === r.impacto)?.bg)}>
                      <option value="">-</option>
                      {IMPACTO.map((i) => <option key={i.value} value={i.value}>{i.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select value={r.status} onChange={(e) => update(r.id, { status: e.target.value })} className={cn("w-full h-7 text-xs font-bold rounded px-1.5 border-0 focus:outline-none", statusInfo.bg)}>
                      {STATUS.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label>🛡️ Plano de mitigação</Label>
                  <textarea value={r.mitigacao} onChange={(e) => update(r.id, { mitigacao: e.target.value })} placeholder="O que fazer para reduzir o risco?" rows={2} className="w-full text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 resize-y" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddButton onClick={() => setData([...riscos, { id: makeId("risco"), descricao: "", probabilidade: "Média", impacto: "Médio", mitigacao: "", status: "Identificado" }])} label="Novo risco" />
    </div>
  );
}
