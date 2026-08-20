"use client";

import { useCallback, useSyncExternalStore } from "react";
import { makeId } from "@/lib/finance";

// =================== Cartões de crédito ===================
export interface CreditInvoiceItem {
  id: string;
  description: string;
  value: number;
  /** ISO date (yyyy-mm-dd) of the purchase */
  date: string;
  /** Number of installments total */
  installments: number;
  /** Which installment is currently being paid (1-based) */
  currentInstallment: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreditCard {
  id: string;
  name: string;
  /** Last 4 digits */
  lastFour?: string;
  /** Brand: visa, mastercard, etc. */
  brand?: string;
  /** Day of month the invoice closes (1-31) */
  closingDay: number;
  /** Day of month the invoice is due (1-31) */
  dueDay: number;
  /** Credit limit */
  limit: number;
  /** Color (hex) */
  color: string;
  /** Emoji */
  emoji?: string;
  /** Invoice items (purchases, subscriptions) */
  items: CreditInvoiceItem[];
  createdAt: number;
  updatedAt: number;
}

const CARDS_KEY = "dashboard.personal.creditCards.v1";
const CARDS_EVENT = "dashboard:credit-cards-change";
let cardsCache: CreditCard[] | null = null;
const cardsListeners = new Set<() => void>();

function sanitizeItem(raw: unknown): CreditInvoiceItem | null {
  if (!raw || typeof raw !== "object") return null;
  const i = raw as Record<string, unknown>;
  if (typeof i.id !== "string" || typeof i.description !== "string") return null;
  return {
    id: i.id,
    description: i.description,
    value: typeof i.value === "number" ? i.value : 0,
    date: typeof i.date === "string" ? i.date : "",
    installments: typeof i.installments === "number" ? i.installments : 1,
    currentInstallment: typeof i.currentInstallment === "number" ? i.currentInstallment : 1,
    createdAt: typeof i.createdAt === "number" ? i.createdAt : Date.now(),
    updatedAt: typeof i.updatedAt === "number" ? i.updatedAt : Date.now(),
  };
}

function sanitizeCard(raw: unknown): CreditCard | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== "string" || typeof c.name !== "string") return null;
  return {
    id: c.id,
    name: c.name,
    lastFour: typeof c.lastFour === "string" ? c.lastFour : undefined,
    brand: typeof c.brand === "string" ? c.brand : undefined,
    closingDay: typeof c.closingDay === "number" && c.closingDay >= 1 && c.closingDay <= 31 ? c.closingDay : 1,
    dueDay: typeof c.dueDay === "number" && c.dueDay >= 1 && c.dueDay <= 31 ? c.dueDay : 10,
    limit: typeof c.limit === "number" ? c.limit : 0,
    color: typeof c.color === "string" ? c.color : "#2563eb",
    emoji: typeof c.emoji === "string" ? c.emoji : "💳",
    items: Array.isArray(c.items) ? c.items.map((i) => sanitizeItem(i)).filter((i): i is CreditInvoiceItem => i !== null) : [],
    createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
    updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : Date.now(),
  };
}

function readCards(): CreditCard[] {
  if (cardsCache !== null) return cardsCache;
  if (typeof window === "undefined") { cardsCache = []; return cardsCache; }
  try {
    const raw = window.localStorage.getItem(CARDS_KEY);
    if (!raw) { cardsCache = []; return cardsCache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { cardsCache = []; return cardsCache; }
    cardsCache = parsed.map(sanitizeCard).filter((c): c is CreditCard => c !== null);
  } catch { cardsCache = []; }
  return cardsCache;
}

function writeCards(next: CreditCard[]) {
  cardsCache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CARDS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CARDS_EVENT));
  } catch {}
}

function subscribeCards(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CARDS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CARDS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY_CARDS: CreditCard[] = [];

export function useCreditCards() {
  const cards = useSyncExternalStore(subscribeCards, readCards, () => EMPTY_CARDS);

  const addCard = useCallback((input: Omit<CreditCard, "id" | "items" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const card: CreditCard = { ...input, id: makeId("card"), items: [], createdAt: now, updatedAt: now };
    writeCards([...readCards(), card]);
    return card;
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<Omit<CreditCard, "id">>) => {
    writeCards(readCards().map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)));
  }, []);

  const removeCard = useCallback((id: string) => {
    writeCards(readCards().filter((c) => c.id !== id));
  }, []);

  const addItem = useCallback((cardId: string, input: Omit<CreditInvoiceItem, "id" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const item: CreditInvoiceItem = { ...input, id: makeId("item"), createdAt: now, updatedAt: now };
    writeCards(readCards().map((c) => c.id === cardId ? { ...c, items: [...c.items, item], updatedAt: Date.now() } : c));
    return item;
  }, []);

  const updateItem = useCallback((cardId: string, itemId: string, patch: Partial<Omit<CreditInvoiceItem, "id">>) => {
    writeCards(readCards().map((c) => c.id === cardId ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, ...patch, updatedAt: Date.now() } : i), updatedAt: Date.now() } : c));
  }, []);

  const removeItem = useCallback((cardId: string, itemId: string) => {
    writeCards(readCards().map((c) => c.id === cardId ? { ...c, items: c.items.filter((i) => i.id !== itemId), updatedAt: Date.now() } : c));
  }, []);

  /** Mark next installment as paid */
  const payNextInstallment = useCallback((cardId: string, itemId: string) => {
    writeCards(readCards().map((c) => {
      if (c.id !== cardId) return c;
      return {
        ...c,
        items: c.items.map((i) => {
          if (i.id !== itemId) return i;
          const next = Math.min(i.currentInstallment + 1, i.installments);
          return { ...i, currentInstallment: next, updatedAt: Date.now() };
        }),
        updatedAt: Date.now(),
      };
    }));
  }, []);

  return { cards, addCard, updateCard, removeCard, addItem, updateItem, removeItem, payNextInstallment };
}

// =================== Empréstimos ===================
export interface LoanPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Loan {
  id: string;
  /** "borrow" (peguei emprestado) | "lend" (emprestei a alguém) */
  type: "borrow" | "lend";
  description: string;
  /** Total principal amount */
  principal: number;
  /** Interest rate % */
  interestRate: number;
  /** Number of installments total */
  installments: number;
  /** Installment value (computed if 0) */
  installmentValue: number;
  /** ISO date of first payment */
  startDate: string;
  /** Counterparty (person/company) */
  counterparty: string;
  /** Notes */
  notes?: string;
  /** Payments made */
  payments: LoanPayment[];
  color: string;
  emoji?: string;
  createdAt: number;
  updatedAt: number;
}

const LOANS_KEY = "dashboard.personal.loans.v1";
const LOANS_EVENT = "dashboard:loans-change";
let loansCache: Loan[] | null = null;
const loansListeners = new Set<() => void>();

function sanitizePayment(raw: unknown): LoanPayment | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string") return null;
  return {
    id: p.id,
    date: typeof p.date === "string" ? p.date : "",
    amount: typeof p.amount === "number" ? p.amount : 0,
    note: typeof p.note === "string" ? p.note : undefined,
  };
}

function sanitizeLoan(raw: unknown): Loan | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  if (typeof l.id !== "string" || typeof l.description !== "string") return null;
  const typeRaw = l.type;
  const type: Loan["type"] = typeRaw === "borrow" || typeRaw === "lend" ? typeRaw : "borrow";
  return {
    id: l.id,
    type,
    description: l.description,
    principal: typeof l.principal === "number" ? l.principal : 0,
    interestRate: typeof l.interestRate === "number" ? l.interestRate : 0,
    installments: typeof l.installments === "number" ? l.installments : 1,
    installmentValue: typeof l.installmentValue === "number" ? l.installmentValue : 0,
    startDate: typeof l.startDate === "string" ? l.startDate : "",
    counterparty: typeof l.counterparty === "string" ? l.counterparty : "",
    notes: typeof l.notes === "string" ? l.notes : undefined,
    payments: Array.isArray(l.payments) ? l.payments.map(sanitizePayment).filter((p): p is LoanPayment => p !== null) : [],
    color: typeof l.color === "string" ? l.color : "#7c3aed",
    emoji: typeof l.emoji === "string" ? l.emoji : "🏦",
    createdAt: typeof l.createdAt === "number" ? l.createdAt : Date.now(),
    updatedAt: typeof l.updatedAt === "number" ? l.updatedAt : Date.now(),
  };
}

function readLoans(): Loan[] {
  if (loansCache !== null) return loansCache;
  if (typeof window === "undefined") { loansCache = []; return loansCache; }
  try {
    const raw = window.localStorage.getItem(LOANS_KEY);
    if (!raw) { loansCache = []; return loansCache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { loansCache = []; return loansCache; }
    loansCache = parsed.map(sanitizeLoan).filter((l): l is Loan => l !== null);
  } catch { loansCache = []; }
  return loansCache;
}

function writeLoans(next: Loan[]) {
  loansCache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOANS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(LOANS_EVENT));
  } catch {}
}

function subscribeLoans(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LOANS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LOANS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY_LOANS: Loan[] = [];

export function useLoans() {
  const loans = useSyncExternalStore(subscribeLoans, readLoans, () => EMPTY_LOANS);

  const addLoan = useCallback((input: Omit<Loan, "id" | "payments" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const loan: Loan = { ...input, id: makeId("loan"), payments: [], createdAt: now, updatedAt: now };
    writeLoans([...readLoans(), loan]);
    return loan;
  }, []);

  const updateLoan = useCallback((id: string, patch: Partial<Omit<Loan, "id">>) => {
    writeLoans(readLoans().map((l) => (l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l)));
  }, []);

  const removeLoan = useCallback((id: string) => {
    writeLoans(readLoans().filter((l) => l.id !== id));
  }, []);

  const addPayment = useCallback((loanId: string, input: Omit<LoanPayment, "id">) => {
    const payment: LoanPayment = { ...input, id: makeId("pay") };
    writeLoans(readLoans().map((l) => l.id === loanId ? { ...l, payments: [...l.payments, payment], updatedAt: Date.now() } : l));
    return payment;
  }, []);

  const removePayment = useCallback((loanId: string, paymentId: string) => {
    writeLoans(readLoans().map((l) => l.id === loanId ? { ...l, payments: l.payments.filter((p) => p.id !== paymentId), updatedAt: Date.now() } : l));
  }, []);

  return { loans, addLoan, updateLoan, removeLoan, addPayment, removePayment };
}
