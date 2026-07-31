"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { fileToResizedDataURL, isImageFile } from "@/lib/image";
import type { PageCard } from "@/lib/pages";

interface FitnessManagerProps {
  page: PageCard;
  onClose: () => void;
}

// =================== Tipos ===================
interface Measurement {
  id: string;
  date: string;
  cintura?: number;
  barriga?: number;
  quadril?: number;
  peso?: number;
}

interface Meal {
  id: string;
  title: string;
  items: { id: string; text: string; done: boolean }[];
}

interface WeekMeals {
  week: number;
  meals: Meal[];
}

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  prep: string;
  emoji: string;
  categoryId: string | null;
  photo?: string; // data URL comprimida
  createdAt: number;
}

interface RecipeCategory {
  id: string;
  name: string;
  emoji: string;
  color: string; // cor de fundo hex
}

// =================== Hook de localStorage ===================
const MEAS_KEY = "dashboard.fitness.measurements.v1";
const MEALS_KEY = "dashboard.fitness.meals.v1";
const RECIPES_KEY = "dashboard.fitness.recipes.v1";
const RECIPE_CATS_KEY = "dashboard.fitness.recipeCategories.v1";
const EVENT = "dashboard:fitness-change";

const DEFAULT_RECIPE_CATEGORIES: RecipeCategory[] = [
  { id: "cat_cafe", name: "Café da manhã", emoji: "☕", color: "#d97706" },
  { id: "cat_almoco", name: "Almoço", emoji: "🍽️", color: "#16a34a" },
  { id: "cat_janta", name: "Janta", emoji: "🌙", color: "#7c3aed" },
  { id: "cat_lanche", name: "Lanche", emoji: "🥪", color: "#0891b2" },
  { id: "cat_sobremesa", name: "Sobremesa", emoji: "🍰", color: "#db2777" },
  { id: "cat_bebida", name: "Bebida", emoji: "🥤", color: "#ea580c" },
];

function makeId(p: string) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function useFitnessStore<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setData(JSON.parse(raw) as T);
    } catch {}
    setLoaded(true);
    const handler = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) setData(JSON.parse(raw) as T);
      } catch {}
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [key]);

  const save = useCallback((next: T) => {
    setData(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
  }, [key]);

  return { data, save, loaded };
}

const DEFAULT_MEALS: WeekMeals[] = [1, 2, 3, 4].map(week => ({
  week,
  meals: [
    { id: makeId("meal"), title: "Café da manhã", items: [] },
    { id: makeId("meal"), title: "Fruta", items: [] },
    { id: makeId("meal"), title: "Almoço/Janta", items: [] },
    { id: makeId("meal"), title: "Sobremesa", items: [] },
  ],
}));

// =================== Componente principal ===================
export function FitnessManager({ page, onClose }: FitnessManagerProps) {
  const [view, setView] = useState<"medidas" | "refeicoes" | "receitas">("medidas");

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#166534"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "🥗"}</div>
            <div><h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1><p className="text-[11px] text-muted-foreground">Fitness & Nutrição</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2"><FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" /></div>
      </header>

      {/* Submenu */}
      <nav className="border-b border-border bg-card px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setView("medidas")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "medidas" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>📏 Medidas</button>
          <button onClick={() => setView("refeicoes")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "refeicoes" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>🍽️ Refeições</button>
          <button onClick={() => setView("receitas")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "receitas" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>📄 Receitas</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto bg-background">
        {view === "medidas" && <MedidasView />}
        {view === "refeicoes" && <RefeicoesView />}
        {view === "receitas" && <ReceitasView />}
      </div>
    </div>
  );
}

// =================== Medidas ===================
function MedidasView() {
  const { data: measurements, save, loaded } = useFitnessStore<Measurement[]>(MEAS_KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), cintura: "", barriga: "", quadril: "", peso: "" });

  function handleAdd() {
    const m: Measurement = { id: makeId("med"), date: form.date, cintura: form.cintura ? parseFloat(form.cintura) : undefined, barriga: form.barriga ? parseFloat(form.barriga) : undefined, quadril: form.quadril ? parseFloat(form.quadril) : undefined, peso: form.peso ? parseFloat(form.peso) : undefined };
    save([...measurements, m]);
    setForm({ date: new Date().toISOString().slice(0, 10), cintura: "", barriga: "", quadril: "", peso: "" });
    setShowForm(false);
  }

  const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date));
  const areas = ["cintura", "barriga", "quadril", "peso"] as const;
  const labels: Record<string, string> = { cintura: "Cintura", barriga: "Barriga", quadril: "Quadril", peso: "Peso" };

  // Calcular diferença entre primeira e última medição
  const first = sorted[sorted.length - 1];
  const last = sorted[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">📏 Medidas Corporais</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+ Registrar</Button>
      </div>

      {/* Form inline */}
      {showForm && (
        <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 text-sm bg-background border-border" />
            <Input type="number" step="0.1" value={form.cintura} onChange={(e) => setForm({ ...form, cintura: e.target.value })} placeholder="Cintura (cm)" className="h-8 text-sm bg-background border-border" />
            <Input type="number" step="0.1" value={form.barriga} onChange={(e) => setForm({ ...form, barriga: e.target.value })} placeholder="Barriga (cm)" className="h-8 text-sm bg-background border-border" />
            <Input type="number" step="0.1" value={form.quadril} onChange={(e) => setForm({ ...form, quadril: e.target.value })} placeholder="Quadril (cm)" className="h-8 text-sm bg-background border-border" />
            <Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="Peso (kg)" className="h-8 text-sm bg-background border-border" />
          </div>
          <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button><Button size="sm" onClick={handleAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Salvar</Button></div>
        </div>
      )}

      {/* Resumo de mudanças */}
      {first && last && first.id !== last.id && (
        <div className="grid grid-cols-4 gap-2">
          {areas.map((a) => {
            const f = first[a]; const l = last[a];
            if (!f || !l) return null;
            const diff = l - f;
            const isGood = (a === "peso" || a === "barriga" || a === "cintura" || a === "quadril") ? diff < 0 : diff > 0;
            return (
              <div key={a} className="bg-card border border-border rounded-lg p-3 text-center">
                <div className="text-[9px] uppercase text-muted-foreground">{labels[a]}</div>
                <div className={cn("text-lg font-bold", diff === 0 ? "text-muted-foreground" : isGood ? "text-emerald-500" : "text-red-500")}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}</div>
                <div className="text-[9px] text-muted-foreground">{f} → {l}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabela */}
      {loaded && sorted.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-[10px] uppercase text-muted-foreground">
                <th className="text-left px-3 py-2 font-bold sticky left-0 bg-muted/30 z-10 min-w-[80px]">📅 Data</th>
                <th className="text-center px-3 py-2 font-bold">Cintura</th>
                <th className="text-center px-3 py-2 font-bold">Barriga</th>
                <th className="text-center px-3 py-2 font-bold">Quadril</th>
                <th className="text-center px-3 py-2 font-bold">Peso</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/10 group">
                  <td className="px-3 py-2 text-xs text-foreground font-medium sticky left-0 bg-card z-10">{new Date(m.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</td>
                  <td className="text-center px-3 py-2 text-xs text-muted-foreground">{m.cintura ? `${m.cintura}cm` : "—"}</td>
                  <td className="text-center px-3 py-2 text-xs text-muted-foreground">{m.barriga ? `${m.barriga}cm` : "—"}</td>
                  <td className="text-center px-3 py-2 text-xs text-muted-foreground">{m.quadril ? `${m.quadril}cm` : "—"}</td>
                  <td className="text-center px-3 py-2 text-xs text-muted-foreground">{m.peso ? `${m.peso}kg` : "—"}</td>
                  <td className="px-1"><button onClick={() => save(measurements.filter((x) => x.id !== m.id))} className="text-muted-foreground hover:text-destructive text-[10px] opacity-0 group-hover:opacity-100">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : loaded ? (
        <div className="text-center py-16"><div className="text-6xl mb-3 opacity-40">📏</div><p className="text-sm text-muted-foreground">Nenhuma medição registrada.</p></div>
      ) : null}
      <div className="h-8" />
    </div>
  );
}

// =================== Refeições ===================
function RefeicoesView() {
  const { data: weeks, save, loaded } = useFitnessStore<WeekMeals[]>(MEALS_KEY, DEFAULT_MEALS);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  function addItem(weekIdx: number, mealId: string) {
    const text = (newItemText[mealId] ?? "").trim();
    if (!text) return;
    const next = [...weeks];
    next[weekIdx] = { ...next[weekIdx], meals: next[weekIdx].meals.map((m) => m.id === mealId ? { ...m, items: [...m.items, { id: makeId("item"), text, done: false }] } : m) };
    save(next);
    setNewItemText((prev) => ({ ...prev, [mealId]: "" }));
  }

  function toggleItem(weekIdx: number, mealId: string, itemId: string) {
    const next = [...weeks];
    next[weekIdx] = { ...next[weekIdx], meals: next[weekIdx].meals.map((m) => m.id === mealId ? { ...m, items: m.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i) } : m) };
    save(next);
  }

  function removeItem(weekIdx: number, mealId: string, itemId: string) {
    const next = [...weeks];
    next[weekIdx] = { ...next[weekIdx], meals: next[weekIdx].meals.map((m) => m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m) };
    save(next);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
      <h2 className="text-base font-bold flex items-center gap-2">🍽️ Planejamento de Refeições</h2>
      {loaded && weeks.map((w, wIdx) => (
        <div key={w.week} className="rounded-xl border border-border overflow-hidden">
          <button onClick={() => setExpandedWeek(expandedWeek === w.week ? null : w.week)} className="w-full flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("transition-transform", expandedWeek === w.week ? "rotate-90" : "")}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-sm font-bold">Refeições - Semana {w.week}</span>
          </button>
          {expandedWeek === w.week && (
            <div className="p-3 space-y-2">
              {w.meals.map((meal) => (
                <div key={meal.id} className="rounded-lg border border-border overflow-hidden">
                  <button onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)} className="w-full flex items-center gap-2 p-2 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={cn("transition-transform", expandedMeal === meal.id ? "rotate-90" : "")}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-xs font-bold">{meal.title}</span>
                    {meal.items.length > 0 && <span className="text-[9px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded">{meal.items.filter((i) => i.done).length}/{meal.items.length}</span>}
                  </button>
                  {expandedMeal === meal.id && (
                    <div className="p-2 space-y-1">
                      {meal.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <button onClick={() => toggleItem(wIdx, meal.id, item.id)} className={cn("h-4 w-4 rounded border flex items-center justify-center text-[9px] shrink-0", item.done ? "bg-emerald-500 text-white border-emerald-500" : "border-border bg-background")}>{item.done ? "✓" : ""}</button>
                          <span className={cn("text-xs flex-1", item.done && "line-through text-muted-foreground")}>{item.text}</span>
                          <button onClick={() => removeItem(wIdx, meal.id, item.id)} className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                      ))}
                      <div className="flex gap-1 pt-1">
                        <Input value={newItemText[meal.id] ?? ""} onChange={(e) => setNewItemText((prev) => ({ ...prev, [meal.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(wIdx, meal.id); } }} placeholder="+ Adicionar item..." className="h-7 text-xs bg-muted/30 border-border" />
                        <Button size="sm" onClick={() => addItem(wIdx, meal.id)} className="h-7 px-2 bg-blue-600 hover:bg-blue-500 text-white border-0 text-[10px]">+</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="h-8" />
    </div>
  );
}

// =================== Receitas ===================
function ReceitasView() {
  const { data: recipes, save: saveRecipes, loaded } = useFitnessStore<Recipe[]>(RECIPES_KEY, []);
  const { data: categories, save: saveCategories } = useFitnessStore<RecipeCategory[]>(RECIPE_CATS_KEY, DEFAULT_RECIPE_CATEGORIES);
  const { toast } = useToast();

  const [filterCat, setFilterCat] = useState<string | "all" | "none">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state (novo)
  const [fTitle, setFTitle] = useState("");
  const [fEmoji, setFEmoji] = useState("🍽️");
  const [fCategory, setFCategory] = useState<string>("");
  const [fIngredients, setFIngredients] = useState("");
  const [fPrep, setFPrep] = useState("");
  const [fPhoto, setFPhoto] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setFTitle(""); setFEmoji("🍽️"); setFCategory(""); setFIngredients(""); setFPrep(""); setFPhoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhoto(file: File) {
    if (!isImageFile(file)) { toast({ title: "Apenas imagens", variant: "destructive" }); return; }
    try {
      const dataUrl = await fileToResizedDataURL(file, 1000, 0.82);
      setFPhoto(dataUrl);
    } catch {
      toast({ title: "Erro ao processar imagem", variant: "destructive" });
    }
  }

  function handleAdd() {
    if (!fTitle.trim()) return;
    saveRecipes([...recipes, {
      id: makeId("rec"),
      title: fTitle.trim(),
      ingredients: fIngredients.trim(),
      prep: fPrep.trim(),
      emoji: fEmoji,
      categoryId: fCategory || null,
      photo: fPhoto,
      createdAt: Date.now(),
    }]);
    resetForm();
    setShowForm(false);
    toast({ title: "Receita adicionada!" });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    saveRecipes(recipes.filter((x) => x.id !== id));
    toast({ title: "Receita excluída", variant: "destructive" });
  }

  const editingRecipe = recipes.find((r) => r.id === editingId) ?? null;

  const catName = (id: string | null) => {
    if (!id) return null;
    return categories.find((c) => c.id === id) ?? null;
  };

  const filtered = recipes
    .filter((r) => {
      if (filterCat === "all") return true;
      if (filterCat === "none") return !r.categoryId;
      return r.categoryId === filterCat;
    })
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.ingredients.toLowerCase().includes(q) || r.prep.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold flex items-center gap-2">📄 Receitas</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCatManager(true)} className="text-xs h-8">🏷️ Categorias</Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-8">
            {showForm ? "✕ Fechar" : "+ Nova receita"}
          </Button>
        </div>
      </div>

      {/* Busca */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar receita por nome ou ingrediente..." className="h-9 text-sm bg-muted/20 border-border" />

      {/* Filtro de categorias */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setFilterCat("all")} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterCat === "all" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>
          Todas ({recipes.length})
        </button>
        {categories.map((c) => {
          const count = recipes.filter((r) => r.categoryId === c.id).length;
          const active = filterCat === c.id;
          return (
            <button key={c.id} onClick={() => setFilterCat(active ? "all" : c.id)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1", active ? "text-white border-transparent" : "bg-card text-muted-foreground border-border hover:border-foreground/30")} style={active ? { background: c.color, borderColor: c.color } : undefined}>
              <span>{c.emoji}</span> {c.name} ({count})
            </button>
          );
        })}
        {recipes.some((r) => !r.categoryId) && (
          <button onClick={() => setFilterCat(filterCat === "none" ? "all" : "none")} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterCat === "none" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>
            Sem categoria ({recipes.filter((r) => !r.categoryId).length})
          </button>
        )}
      </div>

      {/* Form nova receita */}
      {showForm && (
        <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Nova receita</span>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>

          {/* Upload de foto */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              {fPhoto ? (
                <div className="relative">
                  <img src={fPhoto} alt="preview" className="h-20 w-20 rounded-lg object-cover border border-border" />
                  <button onClick={() => setFPhoto(undefined)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center shadow-md">✕</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/30 flex flex-col items-center justify-center text-muted-foreground text-[9px] gap-1 transition-colors">
                  <span className="text-xl">📷</span> Adicionar foto
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
            </div>
            <div className="flex-1 grid grid-cols-[3rem_1fr] gap-2">
              <Input value={fEmoji} onChange={(e) => setFEmoji(e.target.value)} maxLength={4} className="w-full h-9 text-center bg-background border-border text-lg" />
              <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Nome da receita..." className="h-9 text-sm bg-background border-border" />
            </div>
          </div>

          {/* Categoria */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase text-muted-foreground font-bold">Categoria:</span>
            <button onClick={() => setFCategory("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", !fCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Sem categoria</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setFCategory(c.id)} className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1", fCategory === c.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30")} style={fCategory === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>

          <textarea value={fIngredients} onChange={(e) => setFIngredients(e.target.value)} placeholder="Ingredientes (um por linha)..." rows={3} className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y" />
          <textarea value={fPrep} onChange={(e) => setFPrep(e.target.value)} placeholder="Modo de preparo..." rows={3} className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y" />
          <Button size="sm" onClick={handleAdd} disabled={!fTitle.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Salvar receita</Button>
        </div>
      )}

      {/* Lista em cards */}
      {loaded && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const cat = catName(r.categoryId);
            return (
              <div key={r.id} onClick={() => setEditingId(r.id)} className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-foreground/30 hover:shadow-md transition-all group">
                {/* Foto */}
                <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
                  {r.photo ? (
                    <img src={r.photo} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-5xl opacity-50" style={{ background: cat ? `linear-gradient(135deg, ${cat.color}22 0%, transparent 100%)` : undefined }}>{r.emoji}</div>
                  )}
                  {/* Badge da categoria */}
                  {cat && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1" style={{ background: cat.color }}>
                      {cat.emoji} {cat.name}
                    </span>
                  )}
                  {/* Delete */}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.title); }} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive transition-colors flex items-center justify-center text-[10px]">✕</button>
                </div>
                {/* Conteúdo */}
                <div className="p-3 space-y-1">
                  <h3 className="text-sm font-bold flex items-center gap-1.5 line-clamp-1">{r.emoji} {r.title}</h3>
                  {r.ingredients && <p className="text-[11px] text-muted-foreground line-clamp-2 whitespace-pre-line">{r.ingredients}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : loaded ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3 opacity-40">📄</div>
          <p className="text-sm text-muted-foreground">{recipes.length === 0 ? "Nenhuma receita ainda. Clique em \"Nova receita\"." : "Nenhuma receita encontrada com esse filtro."}</p>
        </div>
      ) : null}

      {/* Modal editar/ver receita */}
      {editingRecipe && (
        <RecipeEditorModal
          recipe={editingRecipe}
          categories={categories}
          onClose={() => setEditingId(null)}
          onSave={(updated) => {
            saveRecipes(recipes.map((r) => r.id === updated.id ? updated : r));
            toast({ title: "Receita atualizada!" });
            setEditingId(null);
          }}
        />
      )}

      {/* Modal gerenciar categorias */}
      {showCatManager && (
        <CategoryManagerModal
          categories={categories}
          recipes={recipes}
          onClose={() => setShowCatManager(false)}
          onSave={(next) => { saveCategories(next); toast({ title: "Categorias atualizadas!" }); }}
        />
      )}

      <div className="h-8" />
    </div>
  );
}

// =================== Editor de Receita (modal) ===================
function RecipeEditorModal({
  recipe,
  categories,
  onClose,
  onSave,
}: {
  recipe: Recipe;
  categories: RecipeCategory[];
  onClose: () => void;
  onSave: (r: Recipe) => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [emoji, setEmoji] = useState(recipe.emoji);
  const [categoryId, setCategoryId] = useState<string>(recipe.categoryId ?? "");
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [prep, setPrep] = useState(recipe.prep);
  const [photo, setPhoto] = useState<string | undefined>(recipe.photo);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handlePhoto(file: File) {
    if (!isImageFile(file)) { toast({ title: "Apenas imagens", variant: "destructive" }); return; }
    try {
      const dataUrl = await fileToResizedDataURL(file, 1000, 0.82);
      setPhoto(dataUrl);
    } catch { toast({ title: "Erro ao processar imagem", variant: "destructive" }); }
  }

  function handleSave() {
    if (!title.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    onSave({ ...recipe, title: title.trim(), emoji, categoryId: categoryId || null, ingredients: ingredients.trim(), prep: prep.trim(), photo });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header com foto */}
        <div className="relative aspect-[16/9] bg-muted/30 overflow-hidden">
          {photo ? (
            <img src={photo} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-7xl opacity-60">{emoji}</div>
          )}
          <button onClick={onClose} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-destructive flex items-center justify-center">✕</button>
          <button onClick={() => fileRef.current?.click()} className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] hover:bg-black/80 flex items-center gap-1">📷 {photo ? "Trocar foto" : "Adicionar foto"}</button>
          {photo && <button onClick={() => setPhoto(undefined)} className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-destructive text-white text-[11px] hover:bg-destructive/90">🗑️ Remover</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="h-9 text-center text-lg bg-background border-border" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm font-bold bg-background border-border" />
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setCategoryId("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", !categoryId ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Sem categoria</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCategoryId(c.id)} className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1", categoryId === c.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30")} style={categoryId === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Ingredientes</label>
            <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} placeholder="Um por linha..." className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Modo de preparo</label>
            <textarea value={prep} onChange={(e) => setPrep(e.target.value)} rows={4} placeholder="Passo a passo..." className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0">💾 Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== Gerenciador de Categorias (modal) ===================
const CAT_PALETTE = ["#d97706", "#16a34a", "#7c3aed", "#0891b2", "#db2777", "#ea580c", "#2563eb", "#dc2626", "#65a30d", "#9333ea", "#0d9488", "#ca8a04"];

function CategoryManagerModal({
  categories,
  recipes,
  onClose,
  onSave,
}: {
  categories: RecipeCategory[];
  recipes: Recipe[];
  onClose: () => void;
  onSave: (c: RecipeCategory[]) => void;
}) {
  const [list, setList] = useState<RecipeCategory[]>(categories);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState(CAT_PALETTE[0]);

  function addCategory() {
    if (!name.trim()) return;
    setList([...list, { id: makeId("cat"), name: name.trim(), emoji: emoji || "🏷️", color }]);
    setName(""); setEmoji("🏷️"); setColor(CAT_PALETTE[0]);
  }

  function removeCategory(id: string) {
    const count = recipes.filter((r) => r.categoryId === id).length;
    if (count > 0) {
      if (!confirm(`Existem ${count} receita(s) usando esta categoria. As receitas ficarão sem categoria. Continuar?`)) return;
    } else {
      if (!confirm("Excluir esta categoria?")) return;
    }
    setList(list.filter((c) => c.id !== id));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">🏷️ Categorias de Receitas</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {/* Lista */}
          <div className="space-y-1.5">
            {list.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma categoria ainda.</p>}
            {list.map((c) => {
              const count = recipes.filter((r) => r.categoryId === c.id).length;
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border group">
                  <span className="h-7 w-7 rounded-md flex items-center justify-center text-sm shrink-0" style={{ background: c.color }}>{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{c.name}</div>
                    <div className="text-[9px] text-muted-foreground">{count} receita{count !== 1 ? "s" : ""}</div>
                  </div>
                  <button onClick={() => removeCategory(c.id)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              );
            })}
          </div>

          {/* Nova */}
          <div className="border-t border-border pt-3 space-y-2">
            <div className="text-[10px] uppercase text-muted-foreground font-bold">Nova categoria</div>
            <div className="flex items-center gap-2">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-12 h-9 text-center text-lg bg-background border-border" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Bolos)" className="flex-1 h-9 text-sm bg-background border-border" onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CAT_PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-md border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
            <Button size="sm" onClick={addCategory} disabled={!name.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Adicionar categoria</Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={() => { onSave(list); onClose(); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">💾 Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
