"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BackupSectionProps {
  /** Mostra/oculta o manual de backup (acordeão) */
  defaultManualOpen?: boolean;
}

/**
 * Retorna TODAS as chaves do localStorage que pertencem ao app.
 * Usa o prefixo "dashboard." como critério — isso garante que TODAS
 * as chaves atuais e futuras sejam incluídas no backup, sem precisar
 * manter uma lista hardcoded.
 */
function collectAllAppKeys(): string[] {
  if (typeof window === "undefined") return [];
  const allKeys: string[] = [];
  try {
    const rawKeys = Object.keys(window.localStorage);
    for (const k of rawKeys) {
      if (k.startsWith("dashboard.")) {
        allKeys.push(k);
      }
    }
  } catch {
    // ignore
  }
  return allKeys;
}

/**
 * Verifica se uma chave pertence ao app (deve ser exportada/importada/resetada).
 * Usa o prefixo "dashboard." como critério único e robusto.
 */
function isAppKey(key: string): boolean {
  return key.startsWith("dashboard.");
}

export function BackupSection({ defaultManualOpen = false }: BackupSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = useState(defaultManualOpen);
  const [confirmingReset, setConfirmingReset] = useState(false);

  /** Exporta TODO o estado do app como um arquivo JSON */
  function handleExport() {
    if (typeof window === "undefined") return;
    const allKeys = collectAllAppKeys();
    const data: Record<string, unknown> = {};

    for (const key of allKeys) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }

    const payload = {
      __type: "dashboard-backup",
      __version: 2,
      __exportedAt: new Date().toISOString(),
      __keyCount: allKeys.length,
      data,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `dashboard-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const count = Object.keys(data).length;
    toast({
      title: "Backup exportado",
      description: `${count} itens salvos (tarefas, livros, planejamento, finanças, caverna, CRM, social media — tudo incluído).`,
    });
  }

  /** Importa um arquivo JSON de backup, sobrescrevendo o estado atual */
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        __type?: string;
        __exportedAt?: string;
        data?: Record<string, unknown>;
      };

      // Validação básica
      if (parsed.__type !== "dashboard-backup" || !parsed.data) {
        toast({
          title: "Arquivo inválido",
          description: "Este arquivo não é um backup válido do Dashboard.",
          variant: "destructive",
        });
        return;
      }

      if (
        !confirm(
          "Importar backup vai SUBSCREVER todos os dados atuais. Deseja continuar?\n\n" +
          `Backup de: ${new Date(parsed.__exportedAt ?? new Date().toISOString()).toLocaleString("pt-BR")}\n` +
          `Itens no backup: ${Object.keys(parsed.data).length}`
        )
      ) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Aplica todas as chaves do backup.
      // Aceita QUALQUER chave começando com "dashboard." — isso cobre
      // tanto as chaves antigas quanto as novas (tasks, books, planejamento,
      // finanças, caverna, etc.)
      let applied = 0;
      for (const [key, value] of Object.entries(parsed.data)) {
        if (isAppKey(key)) {
          const str = typeof value === "string" ? value : JSON.stringify(value);
          window.localStorage.setItem(key, str);
          applied++;
        }
      }

      toast({
        title: "Backup restaurado",
        description: `${applied} itens importados. Recarregando...`,
      });

      // Pequeno delay pro toast aparecer antes do reload
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast({
        title: "Erro ao importar",
        description: err instanceof Error ? err.message : "Arquivo corrompido.",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /** Reseta tudo para os defaults (limpa localStorage e recarrega) */
  function handleReset() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 4000);
      return;
    }
    if (typeof window === "undefined") return;
    if (!confirm("Apagar TODOS os dados e voltar pro estado inicial? Isso não pode ser desfeito.")) {
      setConfirmingReset(false);
      return;
    }
    // Remove TODAS as chaves do app — incluindo as dinâmicas
    const allKeys = collectAllAppKeys();
    for (const key of allKeys) {
      window.localStorage.removeItem(key);
    }
    toast({ title: "Dados resetados", description: "Recarregando..." });
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <section className="mt-20 pt-8 border-t border-border">
      <div className="max-w-3xl mx-auto">
        {/* Título */}
        <div className="text-center mb-6">
          <h2 className="text-base font-medium text-foreground/70 mb-1">💾 Backup &amp; Restauração</h2>
          <p className="text-xs text-foreground/65">
            Salve seus dados em um arquivo ou restaure de um backup anterior.
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={handleExport}
            className="h-9 px-4 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-300 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exportar backup
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Importar backup
          </button>

          <button
            onClick={handleReset}
            className={`h-9 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
              confirmingReset
                ? "bg-red-600 hover:bg-red-500 border-red-500 text-white"
                : "bg-red-600/10 hover:bg-red-600/20 border-red-500/30 text-red-300"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {confirmingReset ? "Clique de novo pra confirmar" : "Resetar tudo"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Manual de backup (acordeão) */}
        <div className="rounded-xl bg-muted/20 border border-border overflow-hidden">
          <button
            onClick={() => setManualOpen(!manualOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Manual de backup — como funciona
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`text-foreground/65 transition-transform ${manualOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {manualOpen && (
            <div className="px-4 sm:px-6 py-5 space-y-5 text-sm text-foreground/70 border-t border-border">
              {/* O que é */}
              <div>
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-400">1.</span> O que é o backup?
                </h3>
                <p className="leading-relaxed text-foreground/60">
                  O backup é um arquivo <code className="px-1 py-0.5 rounded bg-accent text-emerald-300 text-xs">.json</code> que
                  contém <strong className="text-foreground/80">TODOS os seus dados</strong>: páginas do dashboard,
                  tarefas e calendário, livros e agenda de leitura, planejamento (viagens, passeios, desejos),
                  finanças (transações, metas, saídas fixas), modo caverna (hábitos), clientes de social media,
                  posts, prospects do CRM, anotações, e muito mais.
                </p>
                <p className="leading-relaxed text-foreground/60 mt-2">
                  Tudo fica salvo apenas no <strong className="text-foreground/80">navegador</strong> (localStorage).
                  Se você limpar os dados do navegador, perderá tudo — por isso o backup é importante.
                </p>
              </div>

              {/* Exportar */}
              <div>
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-400">2.</span> Como exportar (salvar)
                </h3>
                <ol className="space-y-1.5 text-foreground/60 ml-4">
                  <li><span className="text-foreground/65">a)</span> Clique em <strong className="text-emerald-300">"Exportar backup"</strong></li>
                  <li><span className="text-foreground/65">b)</span> O navegador vai baixar um arquivo <code className="px-1 py-0.5 rounded bg-accent text-emerald-300 text-xs">dashboard-backup-AAAA-MM-DD-HH-MM-SS.json</code></li>
                  <li><span className="text-foreground/65">c)</span> Guarde esse arquivo em local seguro (Google Drive, pendrive, etc.)</li>
                </ol>
                <p className="text-[11px] text-foreground/65 mt-2 italic">
                  Dica: faça backup toda vez que adicionar muitos dados novos.
                </p>
              </div>

              {/* Importar */}
              <div>
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-400">3.</span> Como importar (restaurar em outro dispositivo)
                </h3>
                <ol className="space-y-1.5 text-foreground/60 ml-4">
                  <li><span className="text-foreground/65">a)</span> No outro dispositivo, abra o dashboard</li>
                  <li><span className="text-foreground/65">b)</span> Vá até a seção 💾 Backup no final da página</li>
                  <li><span className="text-foreground/65">c)</span> Clique em <strong className="text-blue-300">"Importar backup"</strong></li>
                  <li><span className="text-foreground/65">d)</span> Selecione o arquivo <code className="px-1 py-0.5 rounded bg-accent text-blue-300 text-xs">.json</code> que você salvou antes</li>
                  <li><span className="text-foreground/65">e)</span> Confirme — <strong className="text-amber-300">todos os dados atuais serão substituídos</strong></li>
                  <li><span className="text-foreground/65">f)</span> A página recarrega automaticamente com os dados do backup</li>
                </ol>
                <p className="text-[11px] text-amber-300/70 mt-2">
                  ⚠️ A importação sobrescreve tudo. Se tiver dados importantes sem backup, exporte antes.
                </p>
              </div>

              {/* Resetar */}
              <div>
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-400">4.</span> Resetar tudo
                </h3>
                <p className="leading-relaxed text-foreground/60">
                  O botão <strong className="text-red-300">"Resetar tudo"</strong> apaga todos os dados e
                  volta pro estado inicial. Precisa clicar <strong>duas vezes</strong>
                  pra confirmar. Use só se quiser recomeçar do zero.
                </p>
              </div>

              {/* Onde os dados ficam */}
              <div>
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-400">5.</span> Onde os dados ficam salvos?
                </h3>
                <p className="leading-relaxed text-foreground/60 mb-2">
                  Os dados ficam no <strong className="text-foreground/80">localStorage do navegador</strong> —
                  isso significa:
                </p>
                <ul className="space-y-1 text-foreground/60 ml-4 text-[13px]">
                  <li>✓ Funciona offline</li>
                  <li>✓ Rápido (não precisa de internet)</li>
                  <li>✗ Não sincroniza entre dispositivos automaticamente</li>
                  <li>✗ Se limpar o navegador, perde tudo (faça backup!)</li>
                  <li>✗ Cada navegador/computador tem seus dados separados</li>
                </ul>
              </div>

              {/* Melhor prática */}
              <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
                <h3 className="text-emerald-300 font-medium mb-1 flex items-center gap-1.5 text-sm">
                  ✨ Melhor prática
                </h3>
                <p className="text-[13px] text-foreground/70 leading-relaxed">
                  Faça backup <strong>semanalmente</strong> ou sempre que fizer grandes mudanças.
                  Guarde pelo menos <strong>2 cópias</strong> em lugares diferentes
                  (ex: Google Drive + pendrive). Se precisar mudar de computador, é só importar o backup.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-foreground/55 mt-6">
          Backup inclui: páginas, tarefas &amp; calendário, livros (capas, leituras, agenda),
          habit tracker, planejamento (viagens, passeios, desejos, gastos, checklists),
          finanças (transações, metas, saídas fixas, categorias), modo caverna (hábitos),
          clientes CRM, social media completo, módulos empresariais, tema e preferências
        </p>
      </div>
    </section>
  );
}
