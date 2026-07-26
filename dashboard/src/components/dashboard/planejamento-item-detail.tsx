"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanejamentoItem } from "@/lib/planejamento";

interface PlanejamentoItemDetailProps {
  item: PlanejamentoItem | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

/**
 * Dialog de visualização de um sub-card do Planejamento.
 * Mostra a capa (imagem ou gradient + emoji) e o conteúdo.
 */
export function PlanejamentoItemDetail({ item, onOpenChange, onEdit }: PlanejamentoItemDetailProps) {
  const open = !!item;
  const color = item?.color || "#1c1c1c";
  const hasImage = !!item?.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl p-0 overflow-hidden">
        {item && (
          <>
            {/* Header com imagem OU gradient igual ao do card */}
            <div
              className="relative h-40 flex items-center justify-center overflow-hidden"
              style={
                hasImage
                  ? undefined
                  : {
                      background: `radial-gradient(circle at 30% 20%, ${color}55 0%, transparent 60%), linear-gradient(135deg, ${color} 0%, #0a0a0a 100%)`,
                    }
              }
            >
              {hasImage ? (
                <>
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </>
              ) : (
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />
              )}

              <span className="relative text-6xl font-semibold drop-shadow-lg select-none">
                {item.emoji || item.title.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  {item.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground/70">
                  Atualizado em {new Date(item.updatedAt).toLocaleString("pt-BR")}
                </p>
              </DialogHeader>

              {item.content ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
                    {item.content}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground/70 text-sm italic">
                  Este card ainda não tem anotações. Clique em editar para adicionar conteúdo.
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-500 text-foreground border-0"
                >
                  Editar card
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
