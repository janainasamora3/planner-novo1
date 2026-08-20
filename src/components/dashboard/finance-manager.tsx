"use client";

import { useEffect, useState } from "react";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { FinanceiroView } from "@/components/social-media/financeiro-view";
import { CreditCardsView } from "@/components/dashboard/credit-cards-view";
import { LoansView } from "@/components/dashboard/loans-view";
import { cn } from "@/lib/utils";
import type { PageCard } from "@/lib/pages";

interface FinanceManagerProps {
  page: PageCard;
  onClose: () => void;
}

type FinanceTab = "transactions" | "cards" | "loans";

/**
 * Tela cheia do card Finanças — agora com 3 abas:
 * - Transações (FinanceiroView original)
 * - Cartões (faturas de cartão de crédito com parcelas)
 * - Empréstimos (peguei / emprestei)
 */
export function FinanceManager({ page, onClose }: FinanceManagerProps) {
  const [tab, setTab] = useState<FinanceTab>("transactions");

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const tabs: { id: FinanceTab; label: string; icon: string }[] = [
    { id: "transactions", label: "Transações", icon: "💰" },
    { id: "cards", label: "Cartões", icon: "💳" },
    { id: "loans", label: "Empréstimos", icon: "🏦" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#14532d"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "💸"}</div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1>
              <p className="text-[11px] text-muted-foreground">
                {tab === "transactions" && "Financeiro · Transações"}
                {tab === "cards" && "Cartões · Faturas e parcelas"}
                {tab === "loans" && "Empréstimos · Peguei / Emprestei"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2"><FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" /></div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-border bg-card px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 -mb-px",
                tab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto bg-background">
        {tab === "transactions" && <FinanceiroView />}
        {tab === "cards" && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <CreditCardsView />
            <div className="h-20" />
          </div>
        )}
        {tab === "loans" && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <LoansView />
            <div className="h-20" />
          </div>
        )}
      </div>
    </div>
  );
}
