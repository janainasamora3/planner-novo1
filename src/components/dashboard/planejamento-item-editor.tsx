"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlanejamentoItem } from "@/lib/planejamento";
import { fileToResizedDataURL, isImageFile } from "@/lib/image";
import { PRESET_EMOJIS, PRESET_COLORS } from "@/lib/presets";
import { ColorPicker } from "@/components/ui/color-picker";

interface PlanejamentoItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando passado, edita em vez de criar. */
  editingItem?: PlanejamentoItem | null;
  defaultTitle?: string;
  onSubmit: (data: {
    title: string;
    emoji: string;
    color: string;
    imageUrl: string;
    content: string;
  }) => void;
  onDelete?: (id: string) => void;
}

/**
 * Editor de sub-card do Planejamento — capa editável (emoji + cor + imagem)
 * + conteúdo livre. Mesma identidade visual do AddPageDialog, mas sem o
 * seletor de seção (sub-cards não têm seção).
 */
export function PlanejamentoItemEditor({
  open,
  onOpenChange,
  editingItem,
  defaultTitle,
  onSubmit,
  onDelete,
}: PlanejamentoItemEditorProps) {
  const isEditing = !!editingItem;

  const [title, setTitle] = useState(editingItem?.title ?? defaultTitle ?? "");
  const [emoji, setEmoji] = useState(editingItem?.emoji ?? "");
  const [color, setColor] = useState(editingItem?.color ?? PRESET_COLORS[0]);
  const [imageUrl, setImageUrl] = useState(editingItem?.imageUrl ?? "");
  const [content, setContent] = useState(editingItem?.content ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isImageFile(file)) {
      setUploadError("Selecione um arquivo de imagem (PNG, JPG, WebP...)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Imagem muito grande (máx 10MB).");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await fileToResizedDataURL(file, 800, 0.82);
      setImageUrl(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha ao processar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      emoji: emoji.trim(),
      color,
      imageUrl,
      content: content.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar card" : "Novo card"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Capa / foto de upload */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Capa do card
            </Label>
            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Pré-visualização da capa"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 backdrop-blur-sm border border-border text-foreground hover:text-foreground hover:bg-red-500/40 flex items-center justify-center transition-colors"
                      aria-label="Remover imagem"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 30% 20%, ${color}33 0%, transparent 60%), linear-gradient(135deg, ${color} 0%, #0a0a0a 100%)`,
                    }}
                  >
                    <span className="text-xl opacity-80">
                      {emoji || title.slice(0, 2).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações de upload */}
              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 text-xs gap-2 bg-transparent border-border text-foreground hover:bg-muted hover:text-foreground"
                >
                  {uploading ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-border border-t-blue-400 animate-spin" />
                      Processando...
                    </>
                  ) : imageUrl ? (
                    "Trocar imagem"
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Carregar foto
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground/70 leading-snug">
                  {imageUrl
                    ? "A imagem será a capa do card. Sem imagem, usa o gradiente + emoji."
                    : "Opcional — sem imagem, o card usa gradiente + emoji."}
                </p>
                {uploadError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="pl-item-title" className="text-muted-foreground text-xs uppercase tracking-wide">
              Título
            </Label>
            <Input
              id="pl-item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Briefing, Tom de voz, Funil..."
              autoFocus
              required
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
            />
          </div>

          {/* Emoji / Iniciais */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Ícone (emoji ou iniciais)
            </Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="📝 ou BR"
              maxLength={4}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="h-8 w-8 rounded-md bg-muted/50 hover:bg-muted text-base flex items-center justify-center transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Cor do card</Label>
            <ColorPicker value={color} onChange={setColor} />
            <p className="text-[11px] text-muted-foreground/70">
              Usada no gradiente de fundo quando não há imagem de capa.
            </p>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="pl-item-content" className="text-muted-foreground text-xs uppercase tracking-wide">
              Notas (opcional)
            </Label>
            <Textarea
              id="pl-item-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Anotações livres sobre este card..."
              rows={4}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingItem && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir "${editingItem.title}"?`)) {
                    onDelete(editingItem.id);
                    onOpenChange(false);
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-foreground border-0"
            >
              {isEditing ? "Salvar" : "Criar card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
