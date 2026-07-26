"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PageCard } from "@/lib/pages";

interface PageDetailDialogProps {
  page: PageCard | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function PageDetailDialog({ page, onOpenChange, onEdit }: PageDetailDialogProps) {
  const open = !!page;
  const color = page?.color || "#1c1c1c";
  const hasImage = !!page?.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl p-0 overflow-hidden">
        {page && (
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
                    src={page.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </>
              ) : (
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />
              )}

              {/* Ícone central — emoji se houver */}
              <span className="relative text-6xl font-semibold drop-shadow-lg select-none">
                {page.emoji || page.title.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  {page.title}
                </DialogTitle>
                <p className="text-xs text-foreground/65">
                  Atualizado em {new Date(page.updatedAt).toLocaleString("pt-BR")}
                </p>
              </DialogHeader>

              {page.content ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground/75 whitespace-pre-wrap leading-relaxed text-sm">
                    {page.content}
                  </p>
                </div>
              ) : (
                <p className="text-foreground/65 text-sm italic">
                  Esta página ainda não tem anotações. Clique em editar para adicionar conteúdo.
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                >
                  Editar página
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
