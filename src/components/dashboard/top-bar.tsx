"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FontScaleControl } from "@/components/font-scale-control";

interface TopBarProps {
  onAddToNegocios: () => void;
  onAddToPessoal: () => void;
  onReset: () => void;
}

/**
 * Barra superior — botão "Nova" (Negócios) à esquerda, título central,
 * ícone de mais opções + toggle de tema à direita.
 */
export function TopBar({ onAddToNegocios, onAddToPessoal: _onAddToPessoal, onReset }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Lado esquerdo: ícones de controle + Nova (Negócios) */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <IconButton label="Voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
            <IconButton label="Avançar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
          </div>

          <NewButton label="Nova" onClick={onAddToNegocios} />
        </div>

        {/* Centro: título da página */}
        <div className="flex-1 flex justify-center min-w-0">
          <h1 className="text-base sm:text-lg font-medium text-foreground truncate text-center">
            Vida Pessoal
          </h1>
        </div>

        {/* Lado direito: controle de fonte + ícone de mais opções + toggle de tema */}
        <div className="flex items-center gap-1">
          {/* Controle de tamanho de fonte (A-/A/A+) */}
          <FontScaleControl />

          <div className="hidden sm:flex items-center gap-1">
            <IconButton label="Mais opções" onClick={onReset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
              </svg>
            </IconButton>
          </div>

          {/* Toggle de tema (sol/lua) */}
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </div>
    </header>
  );
}

function NewButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="h-8 px-3 text-xs gap-1.5 bg-transparent border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500"
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Button>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-accent transition-colors"
    >
      {children}
    </button>
  );
}
