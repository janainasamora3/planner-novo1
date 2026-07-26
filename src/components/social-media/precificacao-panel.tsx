"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useEnterpriseData } from "@/hooks/use-enterprise-data";
import { useEnterpriseProducts } from "@/hooks/use-enterprise-products";

// ============================================================================
// PRECIFICAÇÃO — calculadora de preço + simulador de descontos
// Componente reutilizável — usado no EnterpriseManager e no Social Media Manager
// ============================================================================

interface PricingProfile {
  id: string;
  name: string;          // nome do produto sendo precificado
  materials: string;     // custo materiais (R$)
  laborHours: string;    // horas de trabalho
  laborRate: string;     // valor/hora (R$)
  overheadValue: string; // custos fixos em R$ (aluguel, luz, etc.)
  profitPct: string;     // margem de lucro desejada %
  notes: string;
}

interface DiscountItem {
  id: string;
  productName: string;
  basePrice: string;
  quantity: string;
  discountPct: string; // não usado mais por item — mantido para compat
}

// Tipo interno para itens de estoque (parcial — só precisamos de alguns campos)
interface InventoryItemLike {
  id: string;
  name: string;
  price?: string;
  notes?: string;
  category?: string;
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

function PanelHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{emoji}</span>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}

export function PrecificacaoPanel({ pageId }: { pageId: string }) {
  const [subView, setSubView] = useState<"calculadora" | "desconto">("calculadora");

  // Catálogo de produtos (Estoque + Produtos catalog legado) para usar no Desconto
  const { data: estoqueItems } = useEnterpriseData<InventoryItemLike[]>(pageId, "estoque", []);
  const { products: catalogProducts } = useEnterpriseProducts(pageId);

  type CatalogItem = { id: string; name: string; price: string; source: "estoque" | "produto" };
  const catalogItems = useMemo<CatalogItem[]>(() => {
    const fromEstoque: CatalogItem[] = (Array.isArray(estoqueItems) ? estoqueItems : [])
      .filter((it) => it && typeof it === "object" && (it.name ?? "").trim() !== "")
      .map((it) => ({ id: `est_${it.id}`, name: it.name, price: it.price ?? "", source: "estoque" as const }));
    const fromLegacy: CatalogItem[] = (Array.isArray(catalogProducts) ? catalogProducts : [])
      .filter((p) => p && p.active && (p.name ?? "").trim() !== "")
      .map((p) => ({ id: `prod_${p.id}`, name: p.name, price: p.value ?? "", source: "produto" as const }));
    return [...fromEstoque, ...fromLegacy];
  }, [estoqueItems, catalogProducts]);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      <PanelHeader emoji="💰" title="Precificação" />
      <p className="text-xs text-muted-foreground mb-4">💡 Calcule quanto cobrar pelos seus produtos e simule descontos para clientes.</p>

      {/* Sub-nav */}
      <div className="flex gap-1 mb-5 border-b border-border">
        <button
          onClick={() => setSubView("calculadora")}
          className={cn(
            "h-9 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors",
            subView === "calculadora"
              ? "border-teal-600 text-teal-700 dark:text-teal-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          🧮 Calculadora de Preço
        </button>
        <button
          onClick={() => setSubView("desconto")}
          className={cn(
            "h-9 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors",
            subView === "desconto"
              ? "border-teal-600 text-teal-700 dark:text-teal-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          🏷️ Desconto
        </button>
      </div>

      {subView === "calculadora" && <CalculadoraPreco pageId={pageId} />}
      {subView === "desconto" && <DescontoSimulador pageId={pageId} catalogItems={catalogItems} />}
    </div>
  );
}

function CalculadoraPreco({ pageId }: { pageId: string }) {
  const { data: profiles, setData } = useEnterpriseData<PricingProfile[]>(pageId, "precificacao", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function addProfile() {
    const newProfile: PricingProfile = {
      id: makeId("prc"),
      name: "",
      materials: "",
      laborHours: "",
      laborRate: "",
      overheadValue: "",
      profitPct: "30",
      notes: "",
    };
    setData([...profiles, newProfile]);
    setExpandedId(newProfile.id);
  }
  function updateProfile(id: string, patch: Partial<PricingProfile>) {
    setData(profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeProfile(id: string) {
    setData(profiles.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function calcPrice(p: PricingProfile): { cost: number; finalPrice: number; breakdown: { label: string; value: number }[] } {
    const materials = parseNum(p.materials);
    const hours = parseNum(p.laborHours);
    const rate = parseNum(p.laborRate);
    const labor = hours * rate;
    const overhead = parseNum(p.overheadValue);
    const totalCost = materials + labor + overhead;
    const profitPct = parseNum(p.profitPct);
    const profit = totalCost * (profitPct / 100);
    const finalPrice = totalCost + profit;
    return {
      cost: totalCost,
      finalPrice,
      breakdown: [
        { label: "Materiais", value: materials },
        { label: `Mão de obra (${hours}h × ${formatBRL(rate)})`, value: labor },
        { label: "Custos fixos", value: overhead },
        { label: `Lucro (${profitPct}%)`, value: profit },
      ],
    };
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {profiles.length} produto(s) precificado(s)
        </p>
        <button onClick={addProfile} className="h-8 px-3 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Novo cálculo
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-4xl mb-2 opacity-40">💰</div>
          <p className="text-sm text-muted-foreground">Nenhum cálculo de preço ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Novo cálculo" para descobrir quanto cobrar por um produto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const isExpanded = expandedId === p.id;
            const calc = calcPrice(p);
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    💰
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {p.name || "Produto sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Custo: {formatBRL(calc.cost)} · Preço sugerido: <span className="text-teal-600 dark:text-teal-400 font-bold">{formatBRL(calc.finalPrice)}</span>
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-180")}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border space-y-3 bg-muted/10">
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Nome do produto *</label>
                      <input type="text" value={p.name} onChange={(e) => updateProfile(p.id, { name: e.target.value })} placeholder="Ex: T-shirt personalizada" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" autoFocus={p.name === ""} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Custo de materiais (R$)</label>
                        <input type="text" inputMode="decimal" value={p.materials} onChange={(e) => updateProfile(p.id, { materials: e.target.value })} placeholder="Ex: 25,00" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Horas de trabalho</label>
                        <input type="text" inputMode="decimal" value={p.laborHours} onChange={(e) => updateProfile(p.id, { laborHours: e.target.value })} placeholder="Ex: 2" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Valor/hora (R$)</label>
                        <input type="text" inputMode="decimal" value={p.laborRate} onChange={(e) => updateProfile(p.id, { laborRate: e.target.value })} placeholder="Ex: 30,00" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Custos fixos (R$)</label>
                        <input type="text" inputMode="decimal" value={p.overheadValue} onChange={(e) => updateProfile(p.id, { overheadValue: e.target.value })} placeholder="Ex: 15,00" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                        <p className="text-[9px] text-muted-foreground mt-0.5">Aluguel, luz, internet, etc. (valor fixo por unidade)</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Margem de lucro desejada (%)</label>
                      <input type="text" inputMode="decimal" value={p.profitPct} onChange={(e) => updateProfile(p.id, { profitPct: e.target.value })} placeholder="Ex: 30" className="w-full h-8 text-sm bg-background border border-border rounded px-2 focus:outline-none focus:border-primary/50" />
                    </div>

                    <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-teal-700 dark:text-teal-400 font-bold mb-2">📊 Resultado</p>
                      <div className="space-y-1">
                        {calc.breakdown.map((b, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{b.label}</span>
                            <span className="font-medium text-foreground">{formatBRL(b.value)}</span>
                          </div>
                        ))}
                        <div className="border-t border-teal-500/30 pt-1 mt-1 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">Preço sugerido</span>
                          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{formatBRL(calc.finalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold block mb-1">Notas</label>
                      <textarea value={p.notes} onChange={(e) => updateProfile(p.id, { notes: e.target.value })} placeholder="Anotações sobre este cálculo..." rows={2} className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-primary/50 resize-y" />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border">
                      <button onClick={() => removeProfile(p.id)} className="h-8 px-3 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-1.5 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Excluir cálculo
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
  );
}

function DescontoSimulador({ pageId, catalogItems }: { pageId: string; catalogItems: { id: string; name: string; price: string; source: "estoque" | "produto" }[] }) {
  const { data: items, setData } = useEnterpriseData<DiscountItem[]>(pageId, "precificacao-desconto", []);
  const { data: discountTotalPct, setData: setDiscountTotalPct } = useEnterpriseData<string>(pageId, "precificacao-desconto-pct", "0");

  function addItem(catalogId?: string) {
    let newItem: DiscountItem;
    if (catalogId) {
      const cat = catalogItems.find((c) => c.id === catalogId);
      if (!cat) return;
      newItem = {
        id: makeId("dsc"),
        productName: cat.name,
        basePrice: cat.price || "",
        quantity: "1",
        discountPct: "",
      };
    } else {
      newItem = {
        id: makeId("dsc"),
        productName: "",
        basePrice: "",
        quantity: "1",
        discountPct: "",
      };
    }
    setData([...items, newItem]);
  }
  function updateItem(id: string, patch: Partial<DiscountItem>) {
    setData(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeItem(id: string) {
    setData(items.filter((it) => it.id !== id));
  }

  const rows = items.map((it) => {
    const base = parseNum(it.basePrice);
    const qty = parseNum(it.quantity) || 1;
    const subtotal = base * qty;
    return { it, base, qty, subtotal };
  });
  const totalSubtotal = rows.reduce((acc, r) => acc + r.subtotal, 0);
  const discountPctTotal = parseNum(discountTotalPct);
  const totalDiscount = totalSubtotal * (discountPctTotal / 100);
  const totalFinal = totalSubtotal - totalDiscount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Selecione produtos e quantidade. O desconto total é aplicado sobre o valor de tudo.
        </p>
        <button onClick={() => addItem()} className="h-8 px-3 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Adicionar item
        </button>
      </div>

      {catalogItems.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-2">📦 Produtos cadastrados — clique para adicionar</p>
          <div className="flex flex-wrap gap-1.5">
            {catalogItems.map((cp) => (
              <button
                key={cp.id}
                onClick={() => addItem(cp.id)}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 transition-all"
              >
                {cp.name}
                {cp.price && <span className="text-[10px] opacity-70">· {cp.price}</span>}
                <span className="text-[10px]">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-4xl mb-2 opacity-40">🏷️</div>
          <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique nos produtos acima ou em "Adicionar item" para começar.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground font-bold border-b border-border">
            <div className="col-span-5">Produto</div>
            <div className="col-span-2 text-right">Preço unit.</div>
            <div className="col-span-1 text-right">Qtd</div>
            <div className="col-span-3 text-right">Subtotal</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.it.id} className="sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center rounded-lg border border-border bg-card p-3 sm:p-2 hover:border-primary/30 space-y-2 sm:space-y-0">
                <div className="sm:col-span-5">
                  <label className="sm:hidden text-[9px] uppercase text-muted-foreground font-bold block">Produto</label>
                  <input type="text" value={r.it.productName} onChange={(e) => updateItem(r.it.id, { productName: e.target.value })} placeholder="Nome do produto" className="w-full h-8 text-sm font-semibold bg-transparent border-b border-transparent focus:border-primary/50 px-1 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="sm:hidden text-[9px] uppercase text-muted-foreground font-bold block">Preço unit.</label>
                  <input type="text" inputMode="decimal" value={r.it.basePrice} onChange={(e) => updateItem(r.it.id, { basePrice: e.target.value })} placeholder="R$" className="w-full h-8 text-xs text-right bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                </div>
                <div className="sm:col-span-1">
                  <label className="sm:hidden text-[9px] uppercase text-muted-foreground font-bold block">Qtd</label>
                  <input type="text" inputMode="numeric" value={r.it.quantity} onChange={(e) => updateItem(r.it.id, { quantity: e.target.value })} placeholder="1" className="w-full h-8 text-xs text-right bg-transparent border-b border-border focus:border-primary/50 px-1 focus:outline-none" />
                </div>
                <div className="sm:col-span-3 text-right">
                  <label className="sm:hidden text-[9px] uppercase text-muted-foreground font-bold block">Subtotal</label>
                  <span className="text-sm font-semibold text-foreground">{formatBRL(r.subtotal)}</span>
                </div>
                <div className="sm:col-span-1 flex items-center justify-end">
                  <button onClick={() => removeItem(r.it.id)} className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0" title="Excluir">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border-2 border-teal-500/40 bg-teal-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({items.length} item(ns)):</span>
              <span className="font-medium text-foreground">{formatBRL(totalSubtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>
                Desconto total (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={discountTotalPct}
                  onChange={(e) => setDiscountTotalPct(e.target.value)}
                  placeholder="0"
                  className="w-20 h-8 text-sm font-bold text-right bg-background border border-amber-500/30 rounded px-2 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-muted-foreground w-24 text-right">
                  − {formatBRL(totalDiscount)}
                </span>
              </div>
            </div>

            <div className="border-t border-teal-500/30 pt-2 flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Valor final:</span>
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatBRL(totalFinal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
