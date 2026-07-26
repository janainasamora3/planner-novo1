"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PageCard } from "@/lib/pages";

interface PlanejamentoManagerProps {
  page: PageCard;
  onClose: () => void;
}

// =================== Tipos ===================
interface CarExpense { id: string; type: string; description?: string; value: number; date?: string; createdAt: number; }
interface CarExpenseType { id: string; name: string; emoji: string; color: string; }
interface PackingItem { id: string; name: string; packed: boolean; }
interface PackingCategory { id: string; name: string; emoji: string; items: PackingItem[]; }
interface DocumentItem { id: string; name: string; emoji: string; checked: boolean; }
interface DesejoCategory { id: string; name: string; emoji: string; color: string; description?: string; }

interface PlanningItem {
  id: string; title: string; description?: string; emoji?: string; color: string;
  status: "pendente" | "planejado" | "concluido" | "cancelado"; link?: string;
  createdAt: number; updatedAt: number;
  targetValue: number; savedValue: number; savingSince?: string; date?: string;
  location?: string; places?: string; valorEstimado?: string; carExpenses?: CarExpense[];
  category?: string; budget?: number;
  priority?: "muito_importante" | "importante" | "nao_importa";
  previsao?: string; precoPago?: number; adquirido?: boolean; dataComprado?: string;
  packingChecklist?: PackingCategory[]; documentsChecklist?: DocumentItem[];
}

type CategoryId = "viagens" | "passeios" | "desejos";

interface Category { id: CategoryId; label: string; emoji: string; color: string; description: string; gradient: string; hint: string; }

const CATEGORIES: Category[] = [
  { id: "viagens", label: "Viagens", emoji: "✈️", color: "#155e75", description: "Destinos e roteiros de viagem", gradient: "linear-gradient(135deg, #0e7490 0%, #155e75 50%, #0a0a0a 100%)", hint: "Cadastre destinos, hospedagem, passeios da viagem e organize a mala" },
  { id: "passeios", label: "Passeios", emoji: "🎟️", color: "#7c2d12", description: "Passeios, eventos e programas", gradient: "linear-gradient(135deg, #c2410c 0%, #7c2d12 50%, #0a0a0a 100%)", hint: "Cadastre passeios, restaurantes, eventos — com valor estimado e organização de mala" },
  { id: "desejos", label: "Lista de Desejos", emoji: "🌟", color: "#831843", description: "Coisas que você quer ter/fazer", gradient: "linear-gradient(135deg, #be185d 0%, #831843 50%, #0a0a0a 100%)", hint: "Anotar tudo que você quer comprar, com planejamento e priorização" },
];

const STATUS_LABELS = { pendente: "Pendente", planejado: "Planejado", concluido: "Concluído", cancelado: "Cancelado" };
const STATUS_COLORS = { pendente: "#ca8a04", planejado: "#2563eb", concluido: "#16a34a", cancelado: "#dc2626" };
const STATUS_EMOJIS = { pendente: "⏳", planejado: "📅", concluido: "✅", cancelado: "❌" };
const PRIORITY_LABELS = { muito_importante: "Muito Importante", importante: "Importante", nao_importa: "Não Importa" };
const PRIORITY_COLORS = { muito_importante: "#92400e", importante: "#ca8a04", nao_importa: "#2563eb" };
const PRIORITY_EMOJIS = { muito_importante: "🔴", importante: "🟡", nao_importa: "🔵" };

const DESEJO_CATEGORIES_DEFAULT: DesejoCategory[] = [
  { id: "cat_casa", name: "Casa", emoji: "🏠", color: "#7c2d12", description: "Itens para casa" },
  { id: "cat_pessoal", name: "Pessoal", emoji: "👤", color: "#1e3a8a", description: "Uso pessoal" },
  { id: "cat_hobby", name: "Hobby/Mimos", emoji: "⭐", color: "#831843", description: "Presentes e hobbies" },
  { id: "cat_trabalho", name: "Trabalho", emoji: "💼", color: "#166534", description: "Itens profissionais" },
];
const DESEJO_CATEGORIES_KEY = "dashboard.planejamento.desejoCategorias.v2";

const CAR_EXPENSE_TYPES_DEFAULT: CarExpenseType[] = [
  { id: "gasolina", name: "Gasolina", emoji: "⛽", color: "#dc2626" },
  { id: "pedagio", name: "Pedágio", emoji: "🚧", color: "#ca8a04" },
  { id: "revisao", name: "Revisão", emoji: "🔧", color: "#7c3aed" },
  { id: "estacionamento", name: "Estacionamento", emoji: "🅿️", color: "#0891b2" },
  { id: "multa", name: "Multa", emoji: "📄", color: "#dc2626" },
  { id: "lava_jato", name: "Lava Jato", emoji: "🚿", color: "#0ea5e9" },
  { id: "outro", name: "Outro", emoji: "💸", color: "#71717a" },
];
const CAR_EXPENSE_TYPES_KEY = "dashboard.planejamento.carExpenseTypes.v1";

const DEFAULT_PACKING: PackingCategory[] = [
  { id: "pc_roupas", name: "Roupas", emoji: "👕", items: [{id:"p1",name:"Camisetas",packed:false},{id:"p2",name:"Calças/Shorts",packed:false},{id:"p3",name:"Meias",packed:false},{id:"p4",name:"Underwear",packed:false},{id:"p5",name:"Pijama",packed:false},{id:"p6",name:"Casaco/Jaqueta",packed:false}] },
  { id: "pc_sapatos", name: "Sapatos", emoji: "👟", items: [{id:"s1",name:"Tênis",packed:false},{id:"s2",name:"Sandalha",packed:false},{id:"s3",name:"Sapato social",packed:false}] },
  { id: "pc_maquiagem", name: "Maquiagem", emoji: "💄", items: [{id:"m1",name:"Base",packed:false},{id:"m2",name:"Batom",packed:false},{id:"m3",name:"Máscara de cílios",packed:false},{id:"m4",name:"Pincéis",packed:false},{id:"m5",name:"Demaquilante",packed:false}] },
  { id: "pc_higiene", name: "Higiene", emoji: "🧴", items: [{id:"h1",name:"Escova de dente",packed:false},{id:"h2",name:"Pasta de dente",packed:false},{id:"h3",name:"Shampoo/Condicionador",packed:false},{id:"h4",name:"Sabonete",packed:false},{id:"h5",name:"Desodorante",packed:false},{id:"h6",name:"Perfume",packed:false}] },
  { id: "pc_eletronicos", name: "Eletrônicos", emoji: "📱", items: [{id:"e1",name:"Celular + carregador",packed:false},{id:"e2",name:"Fone de ouvido",packed:false},{id:"e3",name:"Power bank",packed:false},{id:"e4",name:"Notebook + carregador",packed:false},{id:"e5",name:"Adaptador de tomada",packed:false}] },
  { id: "pc_outros", name: "Outros", emoji: "🎒", items: [{id:"o1",name:"Óculos de sol",packed:false},{id:"o2",name:"Chave",packed:false},{id:"o3",name:"Garrafa de água",packed:false},{id:"o4",name:"Snacks",packed:false}] },
];

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {id:"d1",name:"RG",emoji:"🪪",checked:false},{id:"d2",name:"CPF",emoji:"📄",checked:false},
  {id:"d3",name:"Passaporte",emoji:"📘",checked:false},{id:"d4",name:"CNH",emoji:"🚗",checked:false},
  {id:"d5",name:"Cartão de embarque",emoji:"✈️",checked:false},{id:"d6",name:"Reserva de hotel",emoji:"🏨",checked:false},
  {id:"d7",name:"Seguro viagem",emoji:"🛡️",checked:false},{id:"d8",name:"Vouchers",emoji:"🎫",checked:false},
  {id:"d9",name:"Comprovante de vacina",emoji:"💉",checked:false},{id:"d10",name:"Dinheiro/Cartões",emoji:"💳",checked:false},
];

const STORAGE_PREFIX = "dashboard.planejamento.categoria.";

function makeId(prefix: string): string { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }
function formatBRL(v: number): string { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatShortBR(iso: string): string { if (!iso) return ""; const [y,m,d] = iso.split("-"); return `${d}/${m}`; }
function daysBetween(fromISO: string, toISO?: string): number { if (!fromISO) return 0; const from = new Date(fromISO+"T00:00:00"); const to = toISO ? new Date(toISO+"T00:00:00") : new Date(); if (Number.isNaN(from.getTime())) return 0; return Math.max(0, Math.floor((to.getTime()-from.getTime())/86400000)); }

// =================== Hook de localStorage ===================
function useCategoryItems(categoryId: CategoryId | null) {
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const storageKey = categoryId ? `${STORAGE_PREFIX}${categoryId}` : null;

  useEffect(() => {
    if (!storageKey) { setItems([]); setLoaded(true); return; }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) { setItems([]); }
      else {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.map((it): PlanningItem | null => {
            if (!it || typeof it !== "object") return null;
            const x = it as Record<string, unknown>;
            if (typeof x.id !== "string" || typeof x.title !== "string") return null;
            const sr = x.status; const status = sr==="pendente"||sr==="planejado"||sr==="concluido"||sr==="cancelado" ? sr : "pendente";
            return { id:x.id, title:x.title, description:typeof x.description==="string"?x.description:undefined, emoji:typeof x.emoji==="string"?x.emoji:undefined, color:typeof x.color==="string"?x.color:"#3f3f46", date:typeof x.date==="string"?x.date:undefined, targetValue:typeof x.targetValue==="number"?x.targetValue:0, savedValue:typeof x.savedValue==="number"?x.savedValue:0, savingSince:typeof x.savingSince==="string"?x.savingSince:undefined, status, link:typeof x.link==="string"?x.link:undefined, location:typeof x.location==="string"?x.location:undefined, places:typeof x.places==="string"?x.places:undefined, valorEstimado:typeof x.valorEstimado==="string"?x.valorEstimado:undefined, category:typeof x.category==="string"?x.category:undefined, budget:typeof x.budget==="number"?x.budget:undefined, priority:x.priority==="muito_importante"||x.priority==="importante"||x.priority==="nao_importa"?x.priority:undefined, previsao:typeof x.previsao==="string"?x.previsao:undefined, precoPago:typeof x.precoPago==="number"?x.precoPago:undefined, adquirido:Boolean(x.adquirido), dataComprado:typeof x.dataComprado==="string"?x.dataComprado:undefined, packingChecklist:Array.isArray(x.packingChecklist)?x.packingChecklist:undefined, documentsChecklist:Array.isArray(x.documentsChecklist)?x.documentsChecklist:undefined, carExpenses:Array.isArray(x.carExpenses)?x.carExpenses:undefined, createdAt:typeof x.createdAt==="number"?x.createdAt:Date.now(), updatedAt:typeof x.updatedAt==="number"?x.updatedAt:Date.now() };
          }).filter((it): it is PlanningItem => it !== null));
        } else setItems([]);
      }
    } catch { setItems([]); }
    setLoaded(true);
  }, [storageKey]);

  const persist = useCallback((next: PlanningItem[]) => { if (!storageKey) return; try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch {} }, [storageKey]);
  const addItem = useCallback((input: Omit<PlanningItem, "id"|"createdAt"|"updatedAt">) => { const now=Date.now(); const ni={...input,id:makeId("plan"),createdAt:now,updatedAt:now}; setItems(p=>{const n=[...p,ni];persist(n);return n;}); return ni; }, [persist]);
  const updateItem = useCallback((id: string, patch: Partial<Omit<PlanningItem,"id">>) => { setItems(p=>{const n=p.map(it=>it.id===id?{...it,...patch,updatedAt:Date.now()}:it);persist(n);return n;}); }, [persist]);
  const removeItem = useCallback((id: string) => { setItems(p=>{const n=p.filter(it=>it.id!==id);persist(n);return n;}); }, [persist]);
  return { items, loaded, addItem, updateItem, removeItem };
}

// =================== Hook de categorias de desejos ===================
function useDesejoCategories() {
  const [categories, setCategories] = useState<DesejoCategory[]>(DESEJO_CATEGORIES_DEFAULT);
  useEffect(() => { try { const raw=window.localStorage.getItem(DESEJO_CATEGORIES_KEY); if(raw){const p=JSON.parse(raw); if(Array.isArray(p)){const c=p.map((x,i):DesejoCategory|null=>{if(typeof x==="string")return{id:`cat_m${i}`,name:x,emoji:"🏷️",color:"#3f3f46"};if(!x||typeof x!=="object")return null;const y=x as Record<string,unknown>;if(typeof y.name!=="string")return null;return{id:typeof y.id==="string"?y.id:`cat_${i}`,name:y.name,emoji:typeof y.emoji==="string"&&y.emoji?y.emoji:"🏷️",color:typeof y.color==="string"?y.color:"#3f3f46",description:typeof y.description==="string"?y.description:undefined};}).filter((x):x is DesejoCategory=>x!==null);if(c.length>0){setCategories(c);try{window.localStorage.setItem(DESEJO_CATEGORIES_KEY,JSON.stringify(c));}catch{}}}}}catch{} }, []);
  const persist=(n:DesejoCategory[])=>{setCategories(n);try{window.localStorage.setItem(DESEJO_CATEGORIES_KEY,JSON.stringify(n));}catch{}};
  const addCategory=(name:string,emoji:string,color:string,description?:string):DesejoCategory|null=>{const t=name.trim();if(!t)return null;if(categories.some(c=>c.name.toLowerCase()===t.toLowerCase()))return null;const nc={id:`cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,name:t,emoji:emoji||"🏷️",color:color||"#3f3f46",description:description?.trim()||undefined};persist([...categories,nc]);return nc;};
  const updateCategory=(id:string,patch:Partial<Omit<DesejoCategory,"id">>)=>{persist(categories.map(c=>c.id===id?{...c,...patch}:c));};
  const removeCategory=(id:string)=>{persist(categories.filter(c=>c.id!==id));};
  const resetCategories=()=>{persist(DESEJO_CATEGORIES_DEFAULT);};
  return { categories, addCategory, updateCategory, removeCategory, resetCategories };
}

// =================== Hook de tipos de gasto ===================
function useCarExpenseTypes() {
  const [types, setTypes] = useState<CarExpenseType[]>(CAR_EXPENSE_TYPES_DEFAULT);
  useEffect(() => { try { const raw = window.localStorage.getItem(CAR_EXPENSE_TYPES_KEY); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) { const c = p.map((t): CarExpenseType | null => { if (!t || typeof t !== "object") return null; const x = t as Record<string, unknown>; if (typeof x.id !== "string" || typeof x.name !== "string") return null; return { id: x.id, name: x.name, emoji: typeof x.emoji === "string" ? x.emoji : "💸", color: typeof x.color === "string" ? x.color : "#71717a" }; }).filter((t): t is CarExpenseType => t !== null); if (c.length > 0) setTypes(c); } } } catch {} }, []);
  const persist = (n: CarExpenseType[]) => { setTypes(n); try { window.localStorage.setItem(CAR_EXPENSE_TYPES_KEY, JSON.stringify(n)); } catch {} };
  const addType = (name: string, emoji: string, color: string): CarExpenseType | undefined => { const t = name.trim(); if (!t) return; if (types.some((x) => x.name.toLowerCase() === t.toLowerCase())) return; const nt = { id: `tipo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, name: t, emoji: emoji || "💸", color: color || "#71717a" }; persist([...types, nt]); return nt; };
  const updateType = (id: string, patch: Partial<Omit<CarExpenseType, "id">>) => { persist(types.map((t) => (t.id === id ? { ...t, ...patch } : t))); };
  const removeType = (id: string) => { persist(types.filter((t) => t.id !== id)); };
  const resetTypes = () => { persist(CAR_EXPENSE_TYPES_DEFAULT); };
  const getTypeInfo = (id: string): CarExpenseType => { return types.find((t) => t.id === id) ?? { id: "outro", name: "Outro", emoji: "💸", color: "#71717a" }; };
  return { types, addType, updateType, removeType, resetTypes, getTypeInfo };
}

// =================== Componente principal ===================
export function PlanejamentoManager({ page, onClose }: PlanejamentoManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { if (selectedItemId) setSelectedItemId(null); else if (selectedCategory) setSelectedCategory(null); else onClose(); } }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, selectedCategory, selectedItemId]);

  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategory) ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (selectedItemId) setSelectedItemId(null); else if (selectedCategory) setSelectedCategory(null); else onClose(); }} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#1e3a8a"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "🗓️"}</div>
            <div><h1 className="text-base font-bold text-foreground leading-tight">{currentCategory ? currentCategory.label : page.title}</h1><p className="text-[11px] text-muted-foreground">{currentCategory ? currentCategory.description : "Planejamento pessoal"}</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2"><FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" /></div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
        {!selectedCategory ? <CategoryGrid onSelect={setSelectedCategory} /> : selectedItemId ? <ItemDetail categoryId={selectedCategory} itemId={selectedItemId} onBack={() => setSelectedItemId(null)} /> : <CategoryItemsList categoryId={selectedCategory} onOpenItem={(id) => setSelectedItemId(id)} />}
      </div>
    </div>
  );
}

// =================== Grid de categorias ===================
function CategoryGrid({ onSelect }: { onSelect: (id: CategoryId) => void }) {
  const counts = useMemo(() => {
    const result: Record<CategoryId, number> = { viagens: 0, passeios: 0, desejos: 0 };
    if (typeof window === "undefined") return result;
    CATEGORIES.forEach((cat) => { try { const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${cat.id}`); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) result[cat.id] = p.filter((it: unknown) => it && typeof it === "object" && typeof (it as Record<string, unknown>).id === "string").length; } } catch {} });
    return result;
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6"><h2 className="text-lg font-bold text-foreground">Escolha uma categoria</h2><p className="text-xs text-muted-foreground mt-1">Clique em uma das opções abaixo para ver e adicionar itens</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => onSelect(cat.id)} className="group relative rounded-3xl p-7 text-left transition-all hover:scale-[1.03] hover:shadow-2xl overflow-hidden border border-border min-h-[200px]" style={{ background: cat.gradient }}>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="absolute top-4 right-4 text-7xl opacity-30 group-hover:opacity-50 transition-opacity">{cat.emoji}</div>
            <div className="relative">
              <div className="text-5xl mb-3">{cat.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-1">{cat.label}</h3>
              <p className="text-xs text-white/70 mb-2 max-w-[220px]">{cat.description}</p>
              <p className="text-[10px] text-white/50 italic mb-4 max-w-[220px]">{cat.hint}</p>
              <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold text-white">{counts[cat.id]} {counts[cat.id] === 1 ? "item" : "itens"}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// =================== Lista de itens ===================
function CategoryItemsList({ categoryId, onOpenItem }: { categoryId: CategoryId; onOpenItem: (id: string) => void }) {
  const { items, loaded, addItem, updateItem, removeItem } = useCategoryItems(categoryId);
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const desejoCats = useDesejoCategories();
  const [selectedDesejoCat, setSelectedDesejoCat] = useState<string>("todos");
  const [showCatManager, setShowCatManager] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === categoryId)!;
  const editingItem = items.find((it) => it.id === editingId) ?? null;

  function openNew() { setEditingId(null); setEditorOpen(true); }
  function openEdit(id: string) { setEditingId(id); setEditorOpen(true); }
  function handleSubmit(data: Omit<PlanningItem, "id"|"createdAt"|"updatedAt">) { if (editingId) { updateItem(editingId, data); toast({ title: "Item atualizado", description: data.title }); } else { addItem(data); toast({ title: "Item adicionado", description: data.title }); } setEditingId(null); }
  function handleDelete(id: string) { const it = items.find((x) => x.id === id); removeItem(id); toast({ title: "Item excluído", description: it?.title, variant: "destructive" }); setEditorOpen(false); setEditingId(null); }
  function handleCycleStatus(id: string, current: PlanningItem["status"]) { const order: PlanningItem["status"][] = ["pendente","planejado","concluido","cancelado"]; updateItem(id, { status: order[(order.indexOf(current)+1)%order.length] }); }
  function handleToggleAdquirido(id: string, current: boolean) { updateItem(id, { adquirido: !current, dataComprado: !current ? new Date().toISOString().slice(0,10) : undefined }); }
  function handleAddSaving(id: string, amount: number) { const it = items.find((x) => x.id === id); if (!it) return; updateItem(id, { savedValue: Math.max(0, it.savedValue + amount), savingSince: it.savingSince ?? new Date().toISOString().slice(0,10) }); }

  const filteredItems = useMemo(() => {
    let r = items;
    if (categoryId === "desejos" && selectedDesejoCat !== "todos") { r = selectedDesejoCat === "adquiridos" ? r.filter((it) => it.adquirido) : r.filter((it) => it.category === selectedDesejoCat); }
    if (search.trim()) { const s = search.toLowerCase(); r = r.filter((it) => (it.title??"").toLowerCase().includes(s) || (it.description??"").toLowerCase().includes(s) || (it.location??"").toLowerCase().includes(s) || (it.category??"").toLowerCase().includes(s)); }
    return r;
  }, [items, search, categoryId, selectedDesejoCat]);

  const stats = useMemo(() => {
    const total = items.length; const totalTarget = items.reduce((a,it)=>a+(it.targetValue??it.budget??0),0); const totalSaved = items.reduce((a,it)=>a+(it.savedValue??0),0);
    const totalFalta = items.reduce((a,it)=>{const t=it.targetValue??it.budget??0;const s=it.savedValue??0;return a+Math.max(0,t-s);},0);
    const concluido = items.filter((it) => it.status === "concluido").length; const adquirido = items.filter((it) => it.adquirido).length;
    return { total, totalTarget, totalSaved, totalFalta, concluido, adquirido };
  }, [items]);

  const desejoCatStats = useMemo(() => { if (categoryId !== "desejos") return []; return desejoCats.categories.map((c) => ({ ...c, count: items.filter((it) => it.category === c.name).length })); }, [items, categoryId, desejoCats.categories]);

  if (!loaded) return <div className="min-h-[400px] flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-border border-t-blue-500 animate-spin" /></div>;
  const isViagensPasseios = categoryId === "viagens" || categoryId === "passeios";

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-xl font-bold text-foreground">{stats.total}</div><div className="text-[9px] text-muted-foreground uppercase">Total</div></div>
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-xl font-bold text-emerald-600">{formatBRL(stats.totalSaved)}</div><div className="text-[9px] text-muted-foreground uppercase">Guardado</div></div>
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-xl font-bold text-amber-600">{formatBRL(stats.totalFalta)}</div><div className="text-[9px] text-muted-foreground uppercase">Falta</div></div>
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-xl font-bold" style={{ color: STATUS_COLORS.concluido }}>{categoryId === "desejos" ? stats.adquirido : stats.concluido}</div><div className="text-[9px] text-muted-foreground uppercase">{categoryId === "desejos" ? "Adquiridos" : "Concluídos"}</div></div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-base font-bold flex items-center gap-2"><span className="text-2xl">{cat.emoji}</span>{cat.label} ({items.length})</h2><p className="text-[11px] text-muted-foreground mt-0.5">{cat.hint}</p></div>
        <div className="flex items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar..." className="h-8 max-w-[200px] text-xs bg-muted/30 border-border" />
          {categoryId === "desejos" && <Button size="sm" variant="ghost" onClick={() => setShowCatManager(true)} className="text-muted-foreground">🏷️ Categorias</Button>}
          <Button size="sm" onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+ Nova</Button>
        </div>
      </div>

      {categoryId === "desejos" && (
        <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-2">
          <button onClick={() => setSelectedDesejoCat("todos")} className={cn("inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-bold transition-colors", selectedDesejoCat === "todos" ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:bg-muted")}>🛍️ Todos ({items.length})</button>
          {desejoCatStats.map((c) => (<button key={c.id} onClick={() => setSelectedDesejoCat(c.name)} className={cn("inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-bold transition-colors", selectedDesejoCat === c.name ? "text-white" : "bg-muted/40 text-muted-foreground hover:bg-muted")} style={selectedDesejoCat === c.name ? { background: c.color } : undefined} title={c.description}>{c.emoji} {c.name} ({c.count})</button>))}
          <button onClick={() => setSelectedDesejoCat("adquiridos")} className={cn("inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-bold transition-colors", selectedDesejoCat === "adquiridos" ? "bg-emerald-600 text-white" : "bg-muted/40 text-muted-foreground hover:bg-muted")}>✓ Adquiridos ({stats.adquirido})</button>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card"><div className="text-6xl mb-3 opacity-40">{cat.emoji}</div><p className="text-sm text-muted-foreground mb-3">{items.length === 0 ? `Nenhum item em ${cat.label.toLowerCase()} ainda.` : "Nenhum item nesta categoria."}</p>{items.length === 0 && <Button variant="ghost" size="sm" onClick={openNew} className="text-blue-500">+ Adicionar primeiro item</Button>}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.slice().sort((a,b)=>b.createdAt-a.createdAt).map((item) => {
            const target = item.targetValue ?? item.budget ?? 0; const saved = item.savedValue ?? 0; const falta = Math.max(0, target - saved); const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0; const isComplete = target > 0 && saved >= target;
            return (
              <div key={item.id} onClick={() => { if (categoryId === "desejos") openEdit(item.id); else onOpenItem(item.id); }} className="group relative rounded-2xl border border-border overflow-hidden cursor-pointer hover:border-foreground/30 transition-all hover:shadow-lg">
                <div className="h-20 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${item.color} 0%, #0a0a0a 100%)` }}>
                  <div className="absolute inset-0 bg-black/20" /><div className="absolute top-3 right-3 text-4xl opacity-50">{item.emoji || cat.emoji}</div>
                  <div className="absolute top-3 left-3 right-16"><h3 className="text-sm font-bold text-white line-clamp-2">{item.title}</h3>{item.date && <p className="text-[10px] text-white/70 mt-0.5">📅 {formatShortBR(item.date)}</p>}</div>
                  <button onClick={(e) => { e.stopPropagation(); handleCycleStatus(item.id, item.status); }} className="absolute bottom-2 left-3 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-transform hover:scale-105" style={{ background: `${STATUS_COLORS[item.status]}30`, color: "#fff", backdropFilter: "blur(4px)" }} title="Clique para mudar status">{STATUS_EMOJIS[item.status]} {STATUS_LABELS[item.status]}</button>
                </div>
                <div className="p-3 space-y-2">
                  {item.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>}
                  {target > 0 && (<div className="space-y-1"><div className="flex items-center justify-between text-[10px]"><span className="text-emerald-600 font-bold">{formatBRL(saved)}</span><span className="text-muted-foreground">/ {formatBRL(target)}</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full transition-all", isComplete ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${progress}%` }} /></div>{falta > 0 ? <p className="text-[10px] text-amber-500 font-bold">Faltam: {formatBRL(falta)}</p> : <p className="text-[10px] text-emerald-600 font-bold">✅ Valor atingido!</p>}</div>)}
                  {target > 0 && falta > 0 && (<div className="flex gap-1 pt-1">{[50,100,500].map((v) => (<button key={v} onClick={(e) => { e.stopPropagation(); handleAddSaving(item.id, v); }} className="flex-1 h-7 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 text-[10px] font-bold transition-colors">+ {formatBRL(v)}</button>))}</div>)}
                  {categoryId === "desejos" && item.category && <span className="inline-block text-[10px] bg-muted text-foreground px-2 py-0.5 rounded">🏷️ {item.category}</span>}
                  {categoryId === "desejos" && item.priority && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ background: `${PRIORITY_COLORS[item.priority]}20`, color: PRIORITY_COLORS[item.priority] }}>{PRIORITY_EMOJIS[item.priority]} {PRIORITY_LABELS[item.priority]}</span>}
                  {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline">🔗 Link</a>}
                  <div className="flex gap-2 pt-1"><button onClick={(e) => { e.stopPropagation(); openEdit(item.id); }} className="flex-1 h-7 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-medium transition-colors">✏️ Editar</button><button onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir "${item.title}"?`)) handleDelete(item.id); }} className="h-7 px-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[10px] font-medium transition-colors">🗑️</button></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editorOpen && <PlanningItemEditor item={editingItem} category={cat} desejoCategories={categoryId === "desejos" ? desejoCats.categories : undefined} onClose={() => { setEditorOpen(false); setEditingId(null); }} onSubmit={handleSubmit} onDelete={editingId ? () => handleDelete(editingId) : undefined} />}
      {categoryId === "desejos" && showCatManager && <DesejoCategoryManager categories={desejoCats.categories} onAdd={desejoCats.addCategory} onUpdate={desejoCats.updateCategory} onRemove={desejoCats.removeCategory} onReset={desejoCats.resetCategories} onClose={() => setShowCatManager(false)} />}
    </div>
  );
}

// =================== Detalhe do item ===================
function ItemDetail({ categoryId, itemId, onBack }: { categoryId: CategoryId; itemId: string; onBack: () => void }) {
  const { items, updateItem, removeItem } = useCategoryItems(categoryId);
  const { toast } = useToast();
  const carExpenseTypes = useCarExpenseTypes();
  const [editorOpen, setEditorOpen] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const item = items.find((it) => it.id === itemId) ?? null;
  const cat = CATEGORIES.find((c) => c.id === categoryId)!;
  const hasChecklists = categoryId === "viagens" || categoryId === "passeios";

  useEffect(() => { if (item && hasChecklists) { if (!item.packingChecklist || item.packingChecklist.length === 0) updateItem(itemId, { packingChecklist: DEFAULT_PACKING }); if (!item.documentsChecklist || item.documentsChecklist.length === 0) updateItem(itemId, { documentsChecklist: DEFAULT_DOCUMENTS }); } }, [item, hasChecklists, itemId, updateItem]);

  if (!item) return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center"><p className="text-sm text-muted-foreground">Item não encontrado.</p><Button onClick={onBack} className="mt-3">Voltar</Button></div>;

  const target = item.targetValue ?? item.budget ?? 0; const saved = item.savedValue ?? 0; const falta = Math.max(0, target - saved); const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0; const isComplete = target > 0 && saved >= target; const daysSaving = item.savingSince ? daysBetween(item.savingSince) : 0; const avgPerDay = daysSaving > 0 ? saved / daysSaving : 0;

  function togglePackingItem(catId: string, itemId2: string) { if (!item?.packingChecklist) return; updateItem(item.id, { packingChecklist: item.packingChecklist.map((c) => c.id === catId ? { ...c, items: c.items.map((it) => it.id === itemId2 ? { ...it, packed: !it.packed } : it) } : c) }); }
  function toggleDocument(docId: string) { if (!item?.documentsChecklist) return; updateItem(item.id, { documentsChecklist: item.documentsChecklist.map((d) => d.id === docId ? { ...d, checked: !d.checked } : d) }); }
  function handleAddSaving(amount: number) { if (!item) return; updateItem(item.id, { savedValue: Math.max(0, item.savedValue + amount), savingSince: item.savingSince ?? new Date().toISOString().slice(0,10) }); toast({ title: `+ ${formatBRL(amount)} guardados!`, description: `Total: ${formatBRL(item.savedValue + amount)}` }); }
  function handleAddCarExpense(expense: Omit<CarExpense, "id"|"createdAt">) { if (!item) return; updateItem(item.id, { carExpenses: [...(item.carExpenses ?? []), { ...expense, id: makeId("car"), createdAt: Date.now() }] }); }
  function handleRemoveCarExpense(id: string) { if (!item?.carExpenses) return; updateItem(item.id, { carExpenses: item.carExpenses.filter((e) => e.id !== id) }); }

  const packingStats = item.packingChecklist ? { total: item.packingChecklist.reduce((a,c)=>a+c.items.length,0), packed: item.packingChecklist.reduce((a,c)=>a+c.items.filter((it)=>it.packed).length,0) } : { total: 0, packed: 0 };
  const docStats = item.documentsChecklist ? { total: item.documentsChecklist.length, checked: item.documentsChecklist.filter((d) => d.checked).length } : { total: 0, checked: 0 };
  const carTotal = (item.carExpenses ?? []).reduce((a, e) => a + e.value, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${item.color} 0%, #0a0a0a 100%)` }}>
        <div className="absolute top-4 right-4 text-6xl opacity-40">{item.emoji || cat.emoji}</div>
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          <button onClick={() => setEditorOpen(true)} className="h-8 w-8 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white text-sm transition-colors" title="Editar">✏️</button>
          <button onClick={() => { if (confirm(`Excluir "${item.title}"?`)) { removeItem(item.id); toast({ title: "Item excluído", variant: "destructive" }); onBack(); } }} className="h-8 w-8 rounded-md bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm flex items-center justify-center text-white text-sm transition-colors" title="Excluir">🗑️</button>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: `${STATUS_COLORS[item.status]}30`, color: "#fff", backdropFilter: "blur(4px)" }}>{STATUS_EMOJIS[item.status]} {STATUS_LABELS[item.status]}</span>
            {item.date && <span className="text-[10px] text-white/70">📅 {formatShortBR(item.date)}</span>}
            {(categoryId === "viagens" || categoryId === "passeios") && item.location && <span className="text-[10px] text-white/70">📍 {item.location}</span>}
            {categoryId === "desejos" && item.category && <span className="text-[10px] text-white/70">🏷️ {item.category}</span>}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{item.title}</h2>
          {item.description && <p className="text-xs text-white/70 max-w-[500px]">{item.description}</p>}
          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[11px] text-blue-300 hover:underline">🔗 Abrir link</a>}
        </div>
      </div>

      {target > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold flex items-center gap-2">💰 Economia</h3>{isComplete && <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-2 py-1 rounded-full font-bold">✅ Meta atingida!</span>}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><div className="text-[10px] uppercase text-muted-foreground">Meta</div><div className="text-base font-bold text-foreground">{formatBRL(target)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Guardado</div><div className="text-base font-bold text-emerald-600">{formatBRL(saved)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Falta</div><div className="text-base font-bold text-amber-600">{formatBRL(falta)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Progresso</div><div className="text-base font-bold" style={{ color: isComplete ? "#16a34a" : "#fafafa" }}>{progress.toFixed(0)}%</div></div>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden"><div className={cn("h-full transition-all", isComplete ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${progress}%` }} /></div>
          {item.savingSince && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border"><div><div className="text-[10px] uppercase text-muted-foreground">Dias guardando</div><div className="text-sm font-bold">{daysSaving} dias</div></div><div><div className="text-[10px] uppercase text-muted-foreground">Média/dia</div><div className="text-sm font-bold">{formatBRL(avgPerDay)}</div></div></div>}
          {falta > 0 && <div className="flex gap-1.5 pt-2 flex-wrap">{[50,100,200,500,1000].map((v) => (<button key={v} onClick={() => handleAddSaving(v)} className="h-8 px-3 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 text-[11px] font-bold transition-colors">+ {formatBRL(v)}</button>))}<button onClick={() => { const v = prompt("Quanto adicionar? (R$)"); if (v) { const n = parseFloat(v.replace(",", ".")); if (n > 0) handleAddSaving(n); } }} className="h-8 px-3 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 text-[11px] font-bold transition-colors">+ Outro valor</button></div>}
        </div>
      )}

      {hasChecklists && (item.carExpenses ?? []).length >= 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">💸 Gastos</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTypeManager(true)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors" title="Gerenciar tipos de gasto">🏷️ Tipos</button>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-600">{(item.carExpenses ?? []).length} gastos · {formatBRL(carTotal)}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-card border border-amber-500/30 rounded-lg p-3"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase text-muted-foreground font-bold">Total Gasto</p><p className="text-2xl font-bold text-amber-600">{formatBRL(carTotal)}</p></div><div className="text-4xl opacity-50">💸</div></div></div>
          {(item.carExpenses ?? []).length > 0 && <div className="space-y-1.5">{(item.carExpenses ?? []).slice().sort((a,b)=>(b.date??"").localeCompare(a.date??"")).map((e) => { const info = carExpenseTypes.getTypeInfo(e.type); return (<div key={e.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border group"><span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-base shrink-0" style={{ background: `${info.color}20`, color: info.color }}>{info.emoji}</span><div className="flex-1 min-w-0"><p className="text-xs font-bold text-foreground">{info.name}</p><p className="text-[10px] text-muted-foreground">{e.date ? formatShortBR(e.date) : "Sem data"}{e.description && ` · ${e.description}`}</p></div><span className="text-sm font-bold text-foreground tabular-nums">{formatBRL(e.value)}</span><button onClick={() => handleRemoveCarExpense(e.id)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100 transition-opacity px-1">✕</button></div>); })}</div>}
          <CarExpenseForm types={carExpenseTypes.types} onAdd={handleAddCarExpense} />
          {showTypeManager && <CarExpenseTypeManager types={carExpenseTypes.types} onAdd={carExpenseTypes.addType} onUpdate={carExpenseTypes.updateType} onRemove={carExpenseTypes.removeType} onReset={carExpenseTypes.resetTypes} onClose={() => setShowTypeManager(false)} />}
        </div>
      )}

      {hasChecklists && item.packingChecklist && item.packingChecklist.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold flex items-center gap-2">🎒 Checklist de Mala</h3><span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: packingStats.packed === packingStats.total && packingStats.total > 0 ? "#16a34a30" : "#ca8a0430", color: packingStats.packed === packingStats.total && packingStats.total > 0 ? "#16a34a" : "#ca8a04" }}>{packingStats.packed}/{packingStats.total}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full transition-all", packingStats.packed === packingStats.total && packingStats.total > 0 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${packingStats.total > 0 ? (packingStats.packed / packingStats.total) * 100 : 0}%` }} /></div>
          <div className="space-y-2">{item.packingChecklist.map((pc) => (<div key={pc.id} className="rounded-lg border border-border overflow-hidden"><div className="flex items-center gap-2 p-2.5 bg-muted/30"><span className="text-lg">{pc.emoji}</span><span className="text-xs font-bold flex-1 text-left">{pc.name}</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: pc.items.filter((it) => it.packed).length === pc.items.length && pc.items.length > 0 ? "#16a34a30" : "#71717a30", color: pc.items.filter((it) => it.packed).length === pc.items.length && pc.items.length > 0 ? "#16a34a" : "#a1a1aa" }}>{pc.items.filter((it) => it.packed).length}/{pc.items.length}</span></div><div className="p-2.5 space-y-1">{pc.items.map((it) => (<div key={it.id} className="flex items-center gap-2"><button onClick={() => togglePackingItem(pc.id, it.id)} className={cn("h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", it.packed ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background hover:border-foreground/40")}>{it.packed ? "✓" : ""}</button><span className={cn("text-xs flex-1", it.packed && "line-through text-muted-foreground")}>{it.name}</span></div>))}</div></div>))}</div>
        </div>
      )}

      {hasChecklists && item.documentsChecklist && item.documentsChecklist.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold flex items-center gap-2">📋 Documentos</h3><span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: docStats.checked === docStats.total && docStats.total > 0 ? "#16a34a30" : "#ca8a0430", color: docStats.checked === docStats.total && docStats.total > 0 ? "#16a34a" : "#ca8a04" }}>{docStats.checked}/{docStats.total}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full transition-all", docStats.checked === docStats.total && docStats.total > 0 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${docStats.total > 0 ? (docStats.checked / docStats.total) * 100 : 0}%` }} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">{item.documentsChecklist.map((doc) => (<div key={doc.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors"><button onClick={() => toggleDocument(doc.id)} className={cn("h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors", doc.checked ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background hover:border-foreground/40")}>{doc.checked ? "✓" : ""}</button><span className="text-base">{doc.emoji}</span><span className={cn("text-xs flex-1", doc.checked && "line-through text-muted-foreground")}>{doc.name}</span></div>))}</div>
        </div>
      )}

      {editorOpen && <PlanningItemEditor item={item} category={cat} onClose={() => setEditorOpen(false)} onSubmit={(data) => { updateItem(item.id, data); toast({ title: "Item atualizado", description: data.title }); setEditorOpen(false); }} onDelete={() => { if (confirm(`Excluir "${item.title}"?`)) { removeItem(item.id); toast({ title: "Item excluído", variant: "destructive" }); setEditorOpen(false); onBack(); } }} />}
    </div>
  );
}

// =================== Form de gasto ===================
function CarExpenseForm({ types, onAdd }: { types: CarExpenseType[]; onAdd: (expense: Omit<CarExpense, "id"|"createdAt">) => void }) {
  const [type, setType] = useState(types[0]?.id ?? "outro");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { toast } = useToast();
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); const v = parseFloat(value.replace(",", ".")); if (!v || v <= 0) return; onAdd({ type, value: v, description: description.trim() || undefined, date: date || undefined }); toast({ title: "Gasto adicionado" }); setValue(""); setDescription(""); }
  return <form onSubmit={handleSubmit} className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border"><div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Tipo</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-8 text-sm bg-background border border-border rounded-md px-2">{types.map((t) => (<option key={t.id} value={t.id}>{t.emoji} {t.name}</option>))}</select></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Valor (R$) *</label><Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" required autoFocus className="h-8 text-sm bg-background border-border tabular-nums" /></div></div><div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Data</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm bg-background border-border" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Descrição (opcional)</label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Posto Shell..." className="h-8 text-sm bg-background border-border" /></div></div><Button type="submit" size="sm" disabled={!value} className="w-full bg-amber-600 hover:bg-amber-500 text-white border-0">+ Adicionar gasto</Button></form>;
}

// =================== Gerenciador de tipos de gasto ===================
function CarExpenseTypeManager({ types, onAdd, onUpdate, onRemove, onReset, onClose }: {
  types: CarExpenseType[]; onAdd: (name: string, emoji: string, color: string) => CarExpenseType | undefined; onUpdate: (id: string, patch: Partial<Omit<CarExpenseType, "id">>) => void; onRemove: (id: string) => void; onReset: () => void; onClose: () => void;
}) {
  const [newName, setNewName] = useState(""); const [newEmoji, setNewEmoji] = useState("💸"); const [newColor, setNewColor] = useState("#71717a"); const [editingId, setEditingId] = useState<string | null>(null); const { toast } = useToast();
  function handleAdd() { if (!newName.trim()) return; const r = onAdd(newName, newEmoji, newColor); if (!r) { toast({ title: "Tipo já existe", variant: "destructive" }); return; } setNewName(""); setNewEmoji("💸"); setNewColor("#71717a"); toast({ title: "Tipo criado", description: `${newEmoji} ${newName}` }); }
  function handleStartEdit(id: string) { const t = types.find((x) => x.id === id); if (!t) return; setEditingId(id); setNewName(t.name); setNewEmoji(t.emoji); setNewColor(t.color); }
  function handleSaveEdit() { if (!editingId || !newName.trim()) return; onUpdate(editingId, { name: newName.trim(), emoji: newEmoji, color: newColor }); toast({ title: "Tipo atualizado" }); setEditingId(null); setNewName(""); setNewEmoji("💸"); setNewColor("#71717a"); }
  const isEditing = editingId !== null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">🏷️ Tipos de Gasto</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button></div>
        <div className="space-y-1.5">{types.map((t) => (<div key={t.id} className="flex items-center gap-2 p-2 rounded-md border" style={{ background: `${t.color}10`, borderColor: `${t.color}40` }}><span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-base shrink-0" style={{ background: t.color, color: "#fff" }}>{t.emoji}</span><span className="text-sm font-bold text-foreground flex-1">{t.name}</span><button onClick={() => handleStartEdit(t.id)} className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-1">✏️</button><button onClick={() => { if (confirm(`Excluir tipo "${t.name}"?`)) { onRemove(t.id); toast({ title: "Tipo excluído" }); } }} className="text-muted-foreground hover:text-destructive text-xs px-1.5 py-1">🗑️</button></div>))}</div>
        <div className="pt-3 border-t border-border space-y-2"><label className="text-[10px] uppercase text-muted-foreground font-bold">{isEditing ? "Editar tipo" : "Novo tipo"}</label><div className="grid grid-cols-[60px_1fr] gap-2"><Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={4} placeholder="💸" className="h-8 text-center bg-muted/30 border-border" /><Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); isEditing ? handleSaveEdit() : handleAdd(); } }} placeholder="Ex: Refeição, Hotel..." autoFocus className="h-8 text-sm bg-muted/30 border-border" /></div><div className="flex items-center gap-2"><label className="text-[10px] uppercase text-muted-foreground font-bold">Cor:</label><input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-7 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" /><span className="text-xs font-mono text-muted-foreground">{newColor}</span><span className="inline-flex items-center gap-1.5 h-7 px-2 rounded-full text-[10px] font-bold text-white ml-auto" style={{ background: newColor }}>{newEmoji} {newName || "Tipo"}</span></div><div className="flex gap-2">{isEditing && <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setNewName(""); setNewEmoji("💸"); setNewColor("#71717a"); }} className="flex-1">Cancelar</Button>}<Button size="sm" onClick={isEditing ? handleSaveEdit : handleAdd} disabled={!newName.trim()} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white border-0">{isEditing ? "💾 Salvar" : "+ Adicionar"}</Button></div></div>
        <div className="pt-3 border-t border-border"><Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground w-full">↻ Restaurar tipos padrão</Button></div>
      </div>
    </div>
  );
}

// =================== Editor de item ===================
function PlanningItemEditor({ item, category, desejoCategories, onClose, onSubmit, onDelete }: {
  item?: PlanningItem | null; category: Category; desejoCategories?: DesejoCategory[]; onClose: () => void; onSubmit: (data: Omit<PlanningItem, "id"|"createdAt"|"updatedAt">) => void; onDelete?: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? category.emoji);
  const [color, setColor] = useState(item?.color ?? category.color);
  const [date, setDate] = useState(item?.date ?? "");
  const [targetValue, setTargetValue] = useState(item?.targetValue?.toString() ?? "");
  const [savedValue, setSavedValue] = useState(item?.savedValue?.toString() ?? "");
  const [savingSince, setSavingSince] = useState(item?.savingSince ?? "");
  const [status, setStatus] = useState<PlanningItem["status"]>(item?.status ?? "pendente");
  const [link, setLink] = useState(item?.link ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [places, setPlaces] = useState(item?.places ?? "");
  const [valorEstimado, setValorEstimado] = useState(item?.valorEstimado ?? "");
  const cats = desejoCategories ?? DESEJO_CATEGORIES_DEFAULT;
  const [desejoCategory, setDesejoCategory] = useState(item?.category ?? cats[0]?.name ?? "Pessoal");
  const [priority, setPriority] = useState<NonNullable<PlanningItem["priority"]>>(item?.priority ?? "importante");
  const [previsao, setPrevisao] = useState(item?.previsao ?? "");
  const [precoPago, setPrecoPago] = useState(item?.precoPago?.toString() ?? "");
  const isViagensPasseios = category.id === "viagens" || category.id === "passeios";
  const isDesejos = category.id === "desejos";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    const tv = targetValue ? parseFloat(targetValue.replace(",", ".")) : 0; const sv = savedValue ? parseFloat(savedValue.replace(",", ".")) : 0;
    onSubmit({ title: title.trim(), description: description.trim() || undefined, emoji: emoji.trim() || undefined, color, date: date || undefined, targetValue: tv, savedValue: sv, savingSince: savingSince || undefined, status, link: link.trim() || undefined, location: isViagensPasseios ? (location.trim() || undefined) : undefined, places: isViagensPasseios ? (places.trim() || undefined) : undefined, valorEstimado: isViagensPasseios ? (valorEstimado.trim() || undefined) : undefined, category: isDesejos ? desejoCategory : undefined, budget: isDesejos ? tv : undefined, priority: isDesejos ? priority : undefined, previsao: isDesejos ? (previsao || undefined) : undefined, precoPago: isDesejos && precoPago ? parseFloat(precoPago.replace(",", ".")) : undefined, adquirido: isDesejos ? (item?.adquirido ?? false) : undefined, dataComprado: item?.dataComprado });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{item ? "Editar" : "Novo"} — {category.emoji} {category.label}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button></div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="text-[10px] uppercase text-muted-foreground font-bold">{isDesejos ? "Produto *" : "Título *"}</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={category.id === "viagens" ? "Ex: Viagem para Paris" : category.id === "passeios" ? "Ex: Show da Taylor Swift" : "Ex: Tênis, Academia..."} autoFocus required className="h-9 bg-muted/30 border-border" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Emoji</label><Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="h-9 bg-muted/30 border-border" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Cor</label><div className="flex items-center gap-2 h-9"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" /><span className="text-xs font-mono text-muted-foreground">{color}</span></div></div></div>
          {isViagensPasseios && (<><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">📍 Local</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Curitiba..." className="h-9 bg-muted/30 border-border" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">📅 Data</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm bg-muted/30 border-border" /></div></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">📋 Lugares</label><textarea value={places} onChange={(e) => setPlaces(e.target.value)} placeholder="Ex: Almoço: Restaurante X..." rows={3} className="w-full bg-muted/30 border border-border rounded-md p-2 text-sm resize-y" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">🔗 URL</label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="h-9 text-sm bg-muted/30 border-border" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">💰 Valor Estimado (texto)</label><Input value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} placeholder="Ex: R$ 100,00 o casal" className="h-9 text-sm bg-muted/30 border-border" /></div></>)}
          {isDesejos && (<><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">🏷️ Categoria</label><select value={desejoCategory} onChange={(e) => setDesejoCategory(e.target.value)} className="w-full h-9 text-sm bg-muted/30 border border-border rounded-md px-2">{cats.map((c) => (<option key={c.id} value={c.name}>{c.emoji} {c.name}</option>))}</select></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">⬆⬇ Prioridade</label><select value={priority} onChange={(e) => setPriority(e.target.value as NonNullable<PlanningItem["priority"]>)} className="w-full h-9 text-sm bg-muted/30 border border-border rounded-md px-2"><option value="muito_importante">🔴 Muito Importante</option><option value="importante">🟡 Importante</option><option value="nao_importa">🔵 Não Importa</option></select></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">📅 Previsão</label><Input type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} className="h-9 text-sm bg-muted/30 border-border" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">💵 Preço pago</label><Input type="number" step="0.01" min="0" value={precoPago} onChange={(e) => setPrecoPago(e.target.value)} placeholder="0,00" className="h-9 text-sm bg-muted/30 border-border tabular-nums" /></div></div></>)}
          <div><label className="text-[10px] uppercase text-muted-foreground font-bold">📝 Notas</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anotações..." rows={2} className="w-full bg-muted/30 border border-border rounded-md p-2 text-sm resize-y" /></div>
          <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as PlanningItem["status"])} className="w-full h-9 text-sm bg-muted/30 border border-border rounded-md px-2"><option value="pendente">⏳ Pendente</option><option value="planejado">📅 Planejado</option><option value="concluido">✅ Concluído</option><option value="cancelado">❌ Cancelado</option></select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-muted-foreground font-bold">{isDesejos ? "Valor do produto (R$)" : "Valor que vou gastar (R$)"}</label><Input type="number" step="0.01" min="0" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="0,00" className="h-9 text-sm bg-muted/30 border-border tabular-nums" /></div><div><label className="text-[10px] uppercase text-muted-foreground font-bold">Quanto já guardei (R$)</label><Input type="number" step="0.01" min="0" value={savedValue} onChange={(e) => setSavedValue(e.target.value)} placeholder="0,00" className="h-9 text-sm bg-muted/30 border-border tabular-nums" /></div></div>
          {targetValue && (() => { const tv = parseFloat(targetValue.replace(",", ".")) || 0; const sv = parseFloat((savedValue ?? "0").replace(",", ".")) || 0; const falta = Math.max(0, tv - sv); const pct = tv > 0 ? Math.min(100, (sv / tv) * 100) : 0; return <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2.5 text-[11px]"><p className="text-emerald-600 font-bold mb-0.5">💡 Cálculo automático</p><p>• Meta: <strong>{formatBRL(tv)}</strong></p><p>• Guardado: <strong className="text-emerald-600">{formatBRL(sv)}</strong> ({pct.toFixed(0)}%)</p><p>• <strong className="text-amber-600">Faltam: {formatBRL(falta)}</strong></p></div>; })()}
          <div><label className="text-[10px] uppercase text-muted-foreground font-bold">Comecei a guardar em (opcional)</label><Input type="date" value={savingSince} onChange={(e) => setSavingSince(e.target.value)} className="h-9 text-sm bg-muted/30 border-border" /></div>
          {isViagensPasseios && !item && <div className="text-[10px] text-blue-500 bg-blue-500/10 border border-blue-500/30 rounded p-2">💡 Ao salvar, o item terá checklist de mala e documentos — ambos editáveis</div>}
          <div className="flex gap-2 pt-2">{onDelete && <Button type="button" variant="ghost" onClick={() => { if (confirm("Excluir este item?")) onDelete(); }} className="text-destructive hover:text-destructive">Excluir</Button>}<Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!title.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">{item ? "Salvar" : "Adicionar"}</Button></div>
        </form>
      </div>
    </div>
  );
}

// =================== Gerenciador de categorias (Desejos) ===================
function DesejoCategoryManager({ categories, onAdd, onUpdate, onRemove, onReset, onClose }: {
  categories: DesejoCategory[]; onAdd: (name: string, emoji: string, color: string, description?: string) => DesejoCategory | null; onUpdate: (id: string, patch: Partial<Omit<DesejoCategory, "id">>) => void; onRemove: (id: string) => void; onReset: () => void; onClose: () => void;
}) {
  const [newName, setNewName] = useState(""); const [newEmoji, setNewEmoji] = useState("🏷️"); const [newColor, setNewColor] = useState("#3f3f46"); const [newDescription, setNewDescription] = useState(""); const [editingId, setEditingId] = useState<string | null>(null); const { toast } = useToast();
  function handleAdd() { if (!newName.trim()) return; const r = onAdd(newName, newEmoji, newColor, newDescription); if (!r) { toast({ title: "Categoria já existe", variant: "destructive" }); return; } setNewName(""); setNewEmoji("🏷️"); setNewColor("#3f3f46"); setNewDescription(""); toast({ title: "Categoria criada" }); }
  function handleStartEdit(id: string) { const c = categories.find((x) => x.id === id); if (!c) return; setEditingId(id); setNewName(c.name); setNewEmoji(c.emoji); setNewColor(c.color); setNewDescription(c.description ?? ""); }
  function handleSaveEdit() { if (!editingId || !newName.trim()) return; onUpdate(editingId, { name: newName.trim(), emoji: newEmoji, color: newColor, description: newDescription.trim() || undefined }); toast({ title: "Categoria atualizada" }); setEditingId(null); setNewName(""); setNewEmoji("🏷️"); setNewColor("#3f3f46"); setNewDescription(""); }
  const isEditing = editingId !== null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">🏷️ Gerenciar Categorias</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button></div>
        <div className="space-y-1.5">{categories.map((cat) => (<div key={cat.id} className="flex items-center gap-2 p-2 rounded-md border" style={{ background: `${cat.color}10`, borderColor: `${cat.color}40` }}><span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-base shrink-0" style={{ background: cat.color, color: "#fff" }}>{cat.emoji}</span><div className="flex-1 min-w-0"><p className="text-sm font-bold text-foreground">{cat.name}</p>{cat.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{cat.description}</p>}</div><button onClick={() => handleStartEdit(cat.id)} className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-1">✏️</button><button onClick={() => { if (confirm(`Excluir categoria "${cat.name}"?`)) { onRemove(cat.id); toast({ title: "Categoria excluída" }); } }} className="text-muted-foreground hover:text-destructive text-xs px-1.5 py-1">🗑️</button></div>))}</div>
        <div className="pt-3 border-t border-border space-y-2"><label className="text-[10px] uppercase text-muted-foreground font-bold">{isEditing ? "Editar categoria" : "Nova categoria"}</label><div className="grid grid-cols-[60px_1fr] gap-2"><Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={4} placeholder="🏷️" className="h-8 text-center bg-muted/30 border-border" /><Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); isEditing ? handleSaveEdit() : handleAdd(); } }} placeholder="Nome da categoria..." autoFocus className="h-8 text-sm bg-muted/30 border-border" /></div><Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Descrição (opcional)..." className="h-8 text-xs bg-muted/30 border-border" /><div className="flex items-center gap-2"><label className="text-[10px] uppercase text-muted-foreground font-bold">Cor:</label><input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-7 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" /><span className="text-xs font-mono text-muted-foreground">{newColor}</span><span className="inline-flex items-center gap-1.5 h-7 px-2 rounded-full text-[10px] font-bold text-white ml-auto" style={{ background: newColor }}>{newEmoji} {newName || "Categoria"}</span></div><div className="flex gap-2">{isEditing && <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setNewName(""); setNewEmoji("🏷️"); setNewColor("#3f3f46"); setNewDescription(""); }} className="flex-1">Cancelar</Button>}<Button size="sm" onClick={isEditing ? handleSaveEdit : handleAdd} disabled={!newName.trim()} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">{isEditing ? "💾 Salvar" : "+ Adicionar"}</Button></div></div>
        <div className="pt-3 border-t border-border"><Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground w-full">↻ Restaurar categorias padrão</Button></div>
      </div>
    </div>
  );
}
