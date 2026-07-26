"use client";

import { useCallback, useSyncExternalStore } from "react";
import { makeId } from "@/lib/finance";

// =================== Metas de economia ===================
export interface SavingsGoal {
  id: string; title: string; emoji?: string; color: string;
  targetValue: number; savedValue: number; deadline?: string;
  type: "deadline" | "monthly" | "open"; monthlyTarget?: number;
  contributions?: { id: string; date: string; amount: number }[];
  completedMonths?: { id: string; month: number; year: number; completed: boolean }[];
  createdAt: number; updatedAt: number;
}

const GOALS_KEY = "dashboard.social.finance.goals.v1";
const GOALS_EVENT = "dashboard:finance-goals-change";
let goalsCache: SavingsGoal[] | null = null;
const goalsListeners = new Set<() => void>();

function sanitizeGoal(raw: unknown): SavingsGoal | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  if (typeof g.id !== "string" || typeof g.title !== "string") return null;
  const typeRaw = g.type;
  const type: SavingsGoal["type"] = typeRaw === "deadline" || typeRaw === "monthly" || typeRaw === "open" ? typeRaw : "open";
  return { id: g.id, title: g.title, emoji: typeof g.emoji === "string" ? g.emoji : undefined, color: typeof g.color === "string" ? g.color : "#16a34a", targetValue: typeof g.targetValue === "number" ? g.targetValue : 0, savedValue: typeof g.savedValue === "number" ? g.savedValue : 0, deadline: typeof g.deadline === "string" ? g.deadline : undefined, type, monthlyTarget: typeof g.monthlyTarget === "number" ? g.monthlyTarget : undefined, contributions: Array.isArray(g.contributions) ? g.contributions : [], completedMonths: Array.isArray(g.completedMonths) ? g.completedMonths : [], createdAt: typeof g.createdAt === "number" ? g.createdAt : Date.now(), updatedAt: typeof g.updatedAt === "number" ? g.updatedAt : Date.now() };
}

function readGoals(): SavingsGoal[] {
  if (goalsCache !== null) return goalsCache;
  if (typeof window === "undefined") { goalsCache = []; return goalsCache; }
  try { const raw = window.localStorage.getItem(GOALS_KEY); if (!raw) { goalsCache = []; return goalsCache; } const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) { goalsCache = []; return goalsCache; } goalsCache = parsed.map((g) => sanitizeGoal(g)).filter((g): g is SavingsGoal => g !== null); } catch { goalsCache = []; }
  return goalsCache;
}

function writeGoals(next: SavingsGoal[]) { goalsCache = next; if (typeof window === "undefined") return; try { window.localStorage.setItem(GOALS_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(GOALS_EVENT)); } catch {} }
function subscribeGoals(cb: () => void): () => void { if (typeof window === "undefined") return () => {}; window.addEventListener(GOALS_EVENT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(GOALS_EVENT, cb); window.removeEventListener("storage", cb); }; }
const EMPTY_GOALS: SavingsGoal[] = [];

export function useSavingsGoals() {
  const goals = useSyncExternalStore(subscribeGoals, readGoals, () => EMPTY_GOALS);
  const addGoal = useCallback((input: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt">) => { const now = Date.now(); const goal: SavingsGoal = { ...input, id: makeId("goal"), createdAt: now, updatedAt: now }; writeGoals([...readGoals(), goal]); return goal; }, []);
  const updateGoal = useCallback((id: string, patch: Partial<Omit<SavingsGoal, "id">>) => { writeGoals(readGoals().map((g) => (g.id === id ? { ...g, ...patch, updatedAt: Date.now() } : g))); }, []);
  const removeGoal = useCallback((id: string) => { writeGoals(readGoals().filter((g) => g.id !== id)); }, []);
  const addContribution = useCallback((goalId: string, amount: number) => { const goal = readGoals().find((g) => g.id === goalId); if (!goal || amount <= 0) return; const contribution = { id: makeId("contrib"), date: new Date().toISOString().slice(0, 10), amount }; writeGoals(readGoals().map((g) => g.id === goalId ? { ...g, savedValue: g.savedValue + amount, contributions: [...(g.contributions ?? []), contribution], updatedAt: Date.now() } : g)); }, []);
  return { goals, addGoal, updateGoal, removeGoal, addContribution };
}

// =================== Saídas fixas ===================
export interface FixedExpense {
  id: string; description: string; value: number; dueDay: number; category?: string;
  paidThisMonth?: { month: number; year: number } | null;
  paymentHistory?: { id: string; month: number; year: number; paidAt: number }[];
  createdAt: number; updatedAt: number;
}

const FIXED_KEY = "dashboard.social.finance.fixedExpenses.v1";
const FIXED_EVENT = "dashboard:finance-fixed-change";
let fixedCache: FixedExpense[] | null = null;
const fixedListeners = new Set<() => void>();

function sanitizeFixed(raw: unknown): FixedExpense | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  if (typeof f.id !== "string" || typeof f.description !== "string") return null;
  return { id: f.id, description: f.description, value: typeof f.value === "number" ? f.value : 0, dueDay: typeof f.dueDay === "number" && f.dueDay >= 1 && f.dueDay <= 31 ? f.dueDay : 1, category: typeof f.category === "string" ? f.category : undefined, paidThisMonth: f.paidThisMonth && typeof f.paidThisMonth === "object" ? (f.paidThisMonth as { month: number; year: number }) : null, paymentHistory: Array.isArray(f.paymentHistory) ? f.paymentHistory : [], createdAt: typeof f.createdAt === "number" ? f.createdAt : Date.now(), updatedAt: typeof f.updatedAt === "number" ? f.updatedAt : Date.now() };
}

function readFixed(): FixedExpense[] {
  if (fixedCache !== null) return fixedCache;
  if (typeof window === "undefined") { fixedCache = []; return fixedCache; }
  try { const raw = window.localStorage.getItem(FIXED_KEY); if (!raw) { fixedCache = []; return fixedCache; } const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) { fixedCache = []; return fixedCache; } fixedCache = parsed.map((f) => sanitizeFixed(f)).filter((f): f is FixedExpense => f !== null); } catch { fixedCache = []; }
  return fixedCache;
}

function writeFixed(next: FixedExpense[]) { fixedCache = next; if (typeof window === "undefined") return; try { window.localStorage.setItem(FIXED_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(FIXED_EVENT)); } catch {} }
function subscribeFixed(cb: () => void): () => void { if (typeof window === "undefined") return () => {}; window.addEventListener(FIXED_EVENT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(FIXED_EVENT, cb); window.removeEventListener("storage", cb); }; }
const EMPTY_FIXED: FixedExpense[] = [];

export function useFixedExpenses() {
  const fixedExpenses = useSyncExternalStore(subscribeFixed, readFixed, () => EMPTY_FIXED);
  const addFixed = useCallback((input: Omit<FixedExpense, "id" | "createdAt" | "updatedAt">) => { const now = Date.now(); const fx: FixedExpense = { ...input, id: makeId("fix"), createdAt: now, updatedAt: now }; writeFixed([...readFixed(), fx]); return fx; }, []);
  const updateFixed = useCallback((id: string, patch: Partial<Omit<FixedExpense, "id">>) => { writeFixed(readFixed().map((f) => (f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f))); }, []);
  const removeFixed = useCallback((id: string) => { writeFixed(readFixed().filter((f) => f.id !== id)); }, []);
  const togglePaid = useCallback((id: string, month: number, year: number) => {
    const fx = readFixed().find((f) => f.id === id); if (!fx) return;
    const isPaid = fx.paidThisMonth?.month === month && fx.paidThisMonth?.year === year;
    if (isPaid) { writeFixed(readFixed().map((f) => f.id === id ? { ...f, paidThisMonth: null, updatedAt: Date.now() } : f)); }
    else { const paymentEntry = { id: makeId("pay"), month, year, paidAt: Date.now() }; writeFixed(readFixed().map((f) => f.id === id ? { ...f, paidThisMonth: { month, year }, paymentHistory: [...(f.paymentHistory ?? []), paymentEntry], updatedAt: Date.now() } : f)); }
  }, []);
  return { fixedExpenses, addFixed, updateFixed, removeFixed, togglePaid };
}

// =================== Categorias personalizadas ===================
export interface FinanceCategory { id: string; name: string; color: string; emoji?: string; defaultType?: "entrada" | "saida"; }

const CATS_KEY = "dashboard.social.finance.categories.v1";
const CATS_EVENT = "dashboard:finance-cats-change";
let catsCache: FinanceCategory[] | null = null;
const catsListeners = new Set<() => void>();

const DEFAULT_CATEGORIES: FinanceCategory[] = [
  { id: "cat_default_1", name: "Gestão de social media", color: "#2563eb", emoji: "📱", defaultType: "entrada" },
  { id: "cat_default_2", name: "Tráfego pago", color: "#7c3aed", emoji: "📢", defaultType: "saida" },
  { id: "cat_default_3", name: "Equipe", color: "#ca8a04", emoji: "👥", defaultType: "saida" },
  { id: "cat_default_4", name: "Ferramentas", color: "#0891b2", emoji: "🔧", defaultType: "saida" },
  { id: "cat_default_5", name: "Produção de conteúdo", color: "#dc2626", emoji: "🎬", defaultType: "saida" },
];

function readCats(): FinanceCategory[] {
  if (catsCache !== null) return catsCache;
  if (typeof window === "undefined") { catsCache = DEFAULT_CATEGORIES; return catsCache; }
  try { const raw = window.localStorage.getItem(CATS_KEY); if (!raw) { catsCache = DEFAULT_CATEGORIES; return catsCache; } const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) { catsCache = DEFAULT_CATEGORIES; return catsCache; } catsCache = parsed.map((c): FinanceCategory | null => { if (!c || typeof c !== "object") return null; const x = c as Record<string, unknown>; if (typeof x.id !== "string" || typeof x.name !== "string") return null; const dt = x.defaultType; return { id: x.id, name: x.name, color: typeof x.color === "string" ? x.color : "#3f3f46", emoji: typeof x.emoji === "string" ? x.emoji : undefined, defaultType: dt === "entrada" || dt === "saida" ? dt : undefined }; }).filter((c): c is FinanceCategory => c !== null); if (catsCache.length === 0) catsCache = DEFAULT_CATEGORIES; } catch { catsCache = DEFAULT_CATEGORIES; }
  return catsCache;
}

function writeCats(next: FinanceCategory[]) { catsCache = next; if (typeof window === "undefined") return; try { window.localStorage.setItem(CATS_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(CATS_EVENT)); } catch {} }
function subscribeCats(cb: () => void): () => void { if (typeof window === "undefined") return () => {}; window.addEventListener(CATS_EVENT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(CATS_EVENT, cb); window.removeEventListener("storage", cb); }; }

export function useFinanceCategories() {
  const categories = useSyncExternalStore(subscribeCats, readCats, () => DEFAULT_CATEGORIES);
  const addCategory = useCallback((input: Omit<FinanceCategory, "id">) => { const cat: FinanceCategory = { ...input, id: makeId("cat") }; writeCats([...readCats(), cat]); return cat; }, []);
  const updateCategory = useCallback((id: string, patch: Partial<Omit<FinanceCategory, "id">>) => { writeCats(readCats().map((c) => (c.id === id ? { ...c, ...patch } : c))); }, []);
  const removeCategory = useCallback((id: string) => { writeCats(readCats().filter((c) => c.id !== id)); }, []);
  const resetCategories = useCallback(() => { writeCats(DEFAULT_CATEGORIES); }, []);
  return { categories, addCategory, updateCategory, removeCategory, resetCategories };
}
