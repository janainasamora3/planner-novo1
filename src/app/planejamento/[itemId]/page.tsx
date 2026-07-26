"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import { usePlanejamento } from "@/hooks/use-planejamento";
import { BRIEFING_TEMPLATE, BRIEFING_ID } from "@/lib/planejamento";
import { fileToResizedDataURL, isImageFile } from "@/lib/image";
import { PRESET_EMOJIS } from "@/lib/presets";
import { cn } from "@/lib/utils";


interface PageProps {
  params: Promise<{ itemId: string }>;
}

/**
 * Página própria de um sub-card do Planejamento.
 *
 * Rota: /planejamento/[itemId]
 *
 * Mostra a capa editável (emoji + cor + imagem) e o conteúdo em modo
 * edição inline — o usuário edita direto na página e salva.
 */
export default function PlanejamentoItemPage({ params }: PageProps) {
  const { itemId } = use(params);
  const router = useRouter();
  const { items, updateItem, removeItem } = usePlanejamento();
  const { toast } = useToast();

  const item = items.find((i) => i.id === itemId) || null;

  // AUTO-INJEÇÃO ROBUSTA: se for o Briefing e estiver sem conteúdo,
  // injeta o template IMEDIATAMENTE no store. Esse efeito roda a cada
  // render, garantindo que mesmo se o cache em memória tiver dados antigos,
  // o template será injetado e o componente re-renderiza com o novo conteúdo.
  useEffect(() => {
    if (!item) return;
    if (item.id !== BRIEFING_ID) return;
    if (item.content && item.content.trim() !== "") return;
    // Briefing vazio — injeta o template.
    updateItem(item.id, { content: BRIEFING_TEMPLATE });
  }, [item, updateItem]);

  if (!item) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6">
        <span className="text-5xl">🤔</span>
        <h1 className="text-xl font-semibold">Card não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          O card que você procura não existe mais. Ele pode ter sido excluído.
        </p>
        <Link href="/planejamento">
          <Button className="bg-blue-600 hover:bg-blue-500 text-foreground border-0">
            Voltar ao Planejamento
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PlanejamentoItemPageContent
      key={item.id}
      itemId={item.id}
      initialTitle={item.title}
      initialEmoji={item.emoji}
      initialColor={item.color}
      initialImageUrl={item.imageUrl}
      initialContent={item.content}
      updatedAt={item.updatedAt}
      createdAt={item.createdAt}
      isBriefing={item.id === BRIEFING_ID}
      onSave={(data) => {
        updateItem(item.id, data);
        toast({ title: "Card salvo", description: data.title });
      }}
      onDelete={() => {
        if (confirm(`Excluir "${item.title}"?`)) {
          removeItem(item.id);
          toast({
            title: "Card excluído",
            description: item.title,
            variant: "destructive",
          });
          router.push("/planejamento");
        }
      }}
      onToast={toast}
    />
  );
}

// ---------- Conteúdo editável ----------

interface ContentProps {
  itemId: string;
  initialTitle: string;
  initialEmoji: string;
  initialColor: string;
  initialImageUrl?: string;
  initialContent?: string;
  createdAt: number;
  updatedAt: number;
  isBriefing?: boolean;
  onSave: (data: {
    title: string;
    emoji: string;
    color: string;
    imageUrl: string;
    content: string;
  }) => void;
  onDelete: () => void;
  onToast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

function PlanejamentoItemPageContent({
  initialTitle,
  initialEmoji,
  initialColor,
  initialImageUrl = "",
  initialContent = "",
  createdAt,
  updatedAt,
  isBriefing = false,
  onSave,
  onDelete,
  onToast,
}: ContentProps) {
  const [title, setTitle] = useState(initialTitle);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [color, setColor] = useState(initialColor);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [content, setContent] = useState(initialContent);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sincroniza quando o conteúdo inicial muda externamente (ex: template
  // do Briefing injetado pelo store após a montagem do componente).
  // Só re-sincroniza se o usuário ainda não editou o campo (conteúdo local
  // igual ao último initialContent conhecido).
  const lastInitialContent = useRef(initialContent);
  useEffect(() => {
    if (
      initialContent !== lastInitialContent.current &&
      content === lastInitialContent.current
    ) {
      setContent(initialContent);
    }
    lastInitialContent.current = initialContent;
  }, [initialContent, content]);

  const hasImage = !!imageUrl;
  const isDirty =
    title !== initialTitle ||
    emoji !== initialEmoji ||
    color !== initialColor ||
    imageUrl !== initialImageUrl ||
    content !== (initialContent || "");

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
      const dataUrl = await fileToResizedDataURL(file, 1200, 0.85);
      setImageUrl(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha ao processar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    if (!title.trim()) {
      onToast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    onSave({
      title: title.trim(),
      emoji: emoji.trim(),
      color,
      imageUrl,
      content: content.trim(),
    });
  }

  function handleRestoreTemplate() {
    if (
      !confirm(
        "Restaurar o template original do Briefing? Todas as suas alterações neste card serão perdidas."
      )
    ) {
      return;
    }
    setContent(BRIEFING_TEMPLATE);
    onToast({ title: "Template restaurado", description: "Clique em Salvar para confirmar." });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/planejamento"
              className="h-9 px-3 rounded-md border border-border hover:bg-muted flex items-center gap-1.5 transition-colors shrink-0 text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Planejamento</span>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold leading-tight truncate">
                {title || "Sem título"}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Atualizado em {new Date(updatedAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isBriefing && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRestoreTemplate}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs sm:text-sm h-9 gap-1.5"
                title="Restaurar o template original do Briefing"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">Restaurar template</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              className="text-red-600 dark:text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs sm:text-sm h-9"
            >
              Excluir
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-foreground border-0 h-9 text-xs sm:text-sm gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Capa */}
        <section className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            Capa da página
          </Label>

          <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-border">
            {hasImage ? (
              <>
                <img
                  src={imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 backdrop-blur-sm border border-border text-foreground hover:bg-red-500/60 flex items-center justify-center transition-colors"
                  aria-label="Remover imagem"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 30% 20%, ${color}55 0%, transparent 60%), linear-gradient(135deg, ${color} 0%, #0a0a0a 100%)`,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent" />
              </div>
            )}

            {/* Emoji overlay grande */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl sm:text-8xl font-semibold drop-shadow-2xl select-none">
                {emoji || title.slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>

            {/* Botão de upload no canto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-3 right-3 h-9 px-3 rounded-md bg-black/70 backdrop-blur-sm border border-border text-foreground hover:bg-black/90 flex items-center gap-2 text-xs transition-colors"
            >
              {uploading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-border border-t-blue-400 animate-spin" />
                  Processando...
                </>
              ) : hasImage ? (
                "Trocar imagem"
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Carregar foto
                </>
              )}
            </button>
          </div>

          {uploadError && (
            <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
          )}
        </section>

        {/* Título */}
        <section className="space-y-2">
          <Label htmlFor="pl-page-title" className="text-muted-foreground text-xs uppercase tracking-wide">
            Título
          </Label>
          <Input
            id="pl-page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Briefing, Tom de voz, Funil..."
            className="bg-muted/40 border-border text-foreground text-lg h-12 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
          />
        </section>

        {/* Emoji + Cor lado a lado */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Ícone (emoji ou iniciais)
            </Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="📝 ou BR"
              maxLength={4}
              className="bg-muted/40 border-border text-foreground focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "h-8 w-8 rounded-md bg-muted/50 hover:bg-muted text-base flex items-center justify-center transition-colors",
                    emoji === e && "ring-2 ring-blue-500/50"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Cor do card
            </Label>
            <ColorPicker value={color} onChange={setColor} />
            <p className="text-[11px] text-muted-foreground/70">
              Usada no gradiente de fundo quando não há imagem de capa.
            </p>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="space-y-2">
          <Label htmlFor="pl-page-content" className="text-muted-foreground text-xs uppercase tracking-wide">
            Notas / Conteúdo
          </Label>
          <Textarea
            id="pl-page-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Anotações livres sobre esta página... (suporta quebra de linha)"
            rows={12}
            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 resize-y min-h-[200px]"
          />
          <p className="text-[11px] text-muted-foreground/70">
            {content.length} caracteres
          </p>
        </section>

        {/* Barra de ação inferior */}
        <section className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground/70">
            Criado em {new Date(createdAt).toLocaleDateString("pt-BR")}
          </p>
          <div className="flex gap-2">
            <Link href="/planejamento">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-foreground border-0"
            >
              Salvar alterações
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
