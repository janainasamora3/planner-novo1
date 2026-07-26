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
import type { SocialPost } from "@/lib/social-media";
import { fileToResizedDataURL, isImageFile } from "@/lib/image";

interface PostEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost?: SocialPost | null;
  clientName: string;
  onSubmit: (data: {
    caption: string;
    imageUrl: string;
    scheduledDate: string;
    internalNotes: string;
  }) => void;
  onDelete?: (id: string) => void;
}

export function PostEditorDialog({
  open,
  onOpenChange,
  editingPost,
  clientName,
  onSubmit,
  onDelete,
}: PostEditorDialogProps) {
  const isEditing = !!editingPost;
  const [caption, setCaption] = useState(editingPost?.caption ?? "");
  const [imageUrl, setImageUrl] = useState(editingPost?.imageUrl ?? "");
  const [scheduledDate, setScheduledDate] = useState(editingPost?.scheduledDate ?? "");
  const [internalNotes, setInternalNotes] = useState(editingPost?.internalNotes ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isImageFile(file)) {
      setUploadError("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Imagem muito grande (máx 10MB).");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await fileToResizedDataURL(file, 720, 0.75);
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
    if (!caption.trim()) return;
    onSubmit({
      caption: caption.trim(),
      imageUrl,
      scheduledDate,
      internalNotes: internalNotes.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar post" : "Novo post"} <span className="text-foreground/65 text-sm font-normal">· {clientName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Imagem */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Mídia do post</Label>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border aspect-square bg-black">
                <img src={imageUrl} alt="Prévia do post" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 backdrop-blur-sm border border-border text-foreground/80 hover:text-foreground hover:bg-red-500/40 flex items-center justify-center transition-colors"
                  aria-label="Remover imagem"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-square rounded-lg border-2 border-dashed border-border hover:border-blue-500/40 hover:bg-blue-500/[0.03] transition-colors flex flex-col items-center justify-center gap-2 text-foreground/65 hover:text-blue-400"
              >
                {uploading ? (
                  <span className="h-6 w-6 rounded-full border-2 border-border border-t-blue-400 animate-spin" />
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm">Carregar imagem do post</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
          </div>

          {/* Legenda */}
          <div className="space-y-2">
            <Label htmlFor="post-caption" className="text-foreground/70 text-xs uppercase tracking-wide">
              Legenda
            </Label>
            <Textarea
              id="post-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Texto da postagem... use #hashtags e @menções"
              rows={4}
              required
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 resize-none"
            />
            <p className="text-[11px] text-foreground/65">{caption.length} caracteres</p>
          </div>

          {/* Data agendada */}
          <div className="space-y-2">
            <Label htmlFor="post-date" className="text-foreground/70 text-xs uppercase tracking-wide">
              Data agendada (opcional)
            </Label>
            <Input
              id="post-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
            />
          </div>

          {/* Notas internas */}
          <div className="space-y-2">
            <Label htmlFor="post-notes" className="text-foreground/70 text-xs uppercase tracking-wide">
              Notas internas (não visíveis para o cliente)
            </Label>
            <Textarea
              id="post-notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Referências, briefing, observações..."
              rows={2}
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingPost && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm("Excluir este post?")) {
                    onDelete(editingPost.id);
                    onOpenChange(false);
                  }
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground/60 hover:text-foreground hover:bg-muted/40"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              {isEditing ? "Salvar" : "Criar post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
