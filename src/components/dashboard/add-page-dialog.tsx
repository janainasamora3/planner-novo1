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
import { SECTIONS, type PageCard, type SectionId } from "@/lib/pages";
import { fileToResizedDataURL, isImageFile } from "@/lib/image";
import { cn } from "@/lib/utils";

interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection: SectionId;
  /** Quando passado, edita em vez de criar */
  editingPage?: PageCard | null;
  onSubmit: (data: {
    section: SectionId;
    title: string;
    emoji: string;
    color: string;
    imageUrl: string;
    content: string;
    special?: string | undefined;
  }) => void;
  onDelete?: (id: string) => void;
}

const PRESET_COLORS = [
  "#1e3a8a", "#7c2d12", "#14532d", "#1e1b4b",
  "#831843", "#155e75", "#713f12", "#1c1917",
  "#3f3f46", "#0a0a0a", "#166534", "#7f1d1d",
];

const PRESET_EMOJIS = [
  "📱","🎧","👑","🛒","♟️","🤝","✅","🧠",
  "🗓️","💸","📚","🏃","🥗","🔐","🩺","📖",
  "🔑","✈️","🧹","🌹","📸","💡","🎯","🚀",
];

// Templates rápidos para a seção Vida Pessoal
const TEMPLATES = [
  { title: "Tarefas", emoji: "✅", color: "#7c2d12", special: "quick-tasks", desc: "Lista de tarefas sem data + sortear" },
  { title: "Modo Caverna", emoji: "🧠", color: "#1e293b", special: "caverna", desc: "Habit tracker diário" },
  { title: "Planejamento", emoji: "🗓️", color: "#1e3a8a", special: "planejamento", desc: "Viagens, passeios, desejos" },
  { title: "Finanças", emoji: "💸", color: "#14532d", special: "finance", desc: "Transações, metas, contas fixas" },
  { title: "Livros", emoji: "📖", color: "#3f3f46", special: "books", desc: "Acervo + agenda de leitura" },
  { title: "Ideias", emoji: "💡", color: "#1e1b4b", special: "ideas", desc: "Anotações + checklist" },
];

export function AddPageDialog({
  open,
  onOpenChange,
  defaultSection,
  editingPage,
  onSubmit,
  onDelete,
}: AddPageDialogProps) {
  const isEditing = !!editingPage;

  // Inicialização lazy — roda UMA vez quando o componente é montado.
  // Como o parent usa `key` que muda ao abrir/fechar/editar, isso garante
  // que o estado interno sincronize com editingPage/defaultSection.
  const [section, setSection] = useState<SectionId>(
    editingPage?.section ?? defaultSection
  );
  const [title, setTitle] = useState(editingPage?.title ?? "");
  const [emoji, setEmoji] = useState(editingPage?.emoji ?? "");
  const [color, setColor] = useState(editingPage?.color ?? PRESET_COLORS[0]);
  const [imageUrl, setImageUrl] = useState(editingPage?.imageUrl ?? "");
  const [content, setContent] = useState(editingPage?.content ?? "");
  // Tipo especial da página (enterprise, quick-tasks, ideas, etc.)
  // Default: "enterprise" quando cria na seção "negocios", undefined em "pessoal"
  const [specialType, setSpecialType] = useState<string | undefined>(
    editingPage ? editingPage.special : defaultSection === "negocios" ? "enterprise" : undefined
  );
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
      // Limpa o input para permitir re-selecionar o mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      section,
      title: title.trim(),
      emoji: emoji.trim(),
      color,
      imageUrl,
      content: content.trim(),
      special: specialType,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar página" : "Nova página"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Capa / foto de upload */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">
              Capa do card
            </Label>
            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-border bg-muted/20 flex items-center justify-center">
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
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 backdrop-blur-sm border border-border text-foreground/80 hover:text-foreground hover:bg-red-500/40 flex items-center justify-center transition-colors"
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
                  className="h-8 text-xs gap-2 bg-transparent border-border text-foreground/80 hover:bg-muted/40 hover:text-foreground"
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
                <p className="text-[11px] text-foreground/65 leading-snug">
                  {imageUrl
                    ? "A imagem será a capa do card. Sem imagem, usa o gradiente + emoji."
                    : "Opcional — sem imagem, o card usa gradiente + emoji."}
                </p>
                {uploadError && (
                  <p className="text-[11px] text-red-400">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Seção</Label>
            <div className="flex gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    section === s.id
                      ? "bg-blue-600/15 border-blue-500/50 text-white"
                      : "bg-muted/20 border-border text-foreground/60 hover:border-foreground/25"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de página (templates) */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de página</Label>
            <div className="grid grid-cols-2 gap-2">
              {/* Nenhuma (página simples) */}
              <button
                type="button"
                onClick={() => setSpecialType(undefined)}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all",
                  !specialType ? "border-foreground bg-foreground/5 scale-[1.02]" : "border-border bg-muted/20 hover:border-foreground/25"
                )}
              >
                <p className="text-xs font-bold flex items-center gap-1">📄 Página simples</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Apenas anotações</p>
              </button>
              {/* Empresarial */}
              <button
                type="button"
                onClick={() => setSpecialType("enterprise")}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all",
                  specialType === "enterprise" ? "border-blue-500 bg-blue-600/10 scale-[1.02]" : "border-border bg-muted/20 hover:border-foreground/25"
                )}
              >
                <p className="text-xs font-bold flex items-center gap-1">🏢 Empresarial</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tarefas, CRM, Financeiro</p>
              </button>
            </div>
            {/* Templates da Vida Pessoal */}
            {section === "pessoal" && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.special}
                    type="button"
                    onClick={() => {
                      setSpecialType(tpl.special);
                      setTitle(tpl.title);
                      setEmoji(tpl.emoji);
                      setColor(tpl.color);
                    }}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all",
                      specialType === tpl.special ? "border-foreground bg-foreground/5 scale-[1.02]" : "border-border bg-muted/20 hover:border-foreground/25"
                    )}
                  >
                    <p className="text-xs font-bold flex items-center gap-1">{tpl.emoji} {tpl.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="page-title" className="text-foreground/70 text-xs uppercase tracking-wide">
              Título
            </Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Finanças, Tarefas, Academia..."
              autoFocus
              required
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
            />
          </div>

          {/* Emoji / Iniciais */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">
              Ícone (emoji ou iniciais)
            </Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="💳 ou FIN"
              maxLength={4}
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="h-8 w-8 rounded-md bg-accent hover:bg-accent text-base flex items-center justify-center transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-wide">Cor do card</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-md border-2 transition-all ${
                    color === c ? "border-blue-500 scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-foreground/65">
              Usada no gradiente de fundo quando não há imagem de capa.
            </p>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="page-content" className="text-foreground/70 text-xs uppercase tracking-wide">
              Notas (opcional)
            </Label>
            <Textarea
              id="page-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Anotações livres sobre esta página..."
              rows={3}
              className="bg-muted/30 border-border text-foreground placeholder:text-foreground/55 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingPage && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir "${editingPage.title}"?`)) {
                    onDelete(editingPage.id);
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
              {isEditing ? "Salvar" : "Criar página"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
