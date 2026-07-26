"use client";

import { useMemo, useState } from "react";
import { useSocialMedia } from "@/hooks/use-social-media";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type SocialPost,
  type PostStatus,
} from "@/lib/social-media";

interface ApprovalViewProps {
  token: string;
  onExit: () => void;
}

export function ApprovalView({ token, onExit }: ApprovalViewProps) {
  const { clients, posts, setPostStatus } = useSocialMedia();
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const client = useMemo(
    () => clients.find((c) => c.token === token) ?? null,
    [clients, token]
  );

  const clientPosts = useMemo(() => {
    if (!client) return [];
    return posts
      .filter((p) => p.clientId === client.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, client]);

  if (!client) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold mb-2">Link inválido</h1>
          <p className="text-sm text-foreground/50 mb-6">
            Este link de aprovação não corresponde a nenhum cliente ativo.
            Verifique com o seu gestor de social media.
          </p>
          <button
            onClick={onExit}
            className="h-10 px-4 rounded-lg bg-accent hover:bg-muted/60 text-sm font-medium transition-colors"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  function handleAction(post: SocialPost, action: PostStatus) {
    const feedback = feedbackDrafts[post.id]?.trim() ?? "";
    setPostStatus(post.id, action, feedback || undefined);
  }

  const pendingCount = clientPosts.filter((p) => p.status === "pending").length;
  const approvedCount = clientPosts.filter((p) => p.status === "approved").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${client.color} 0%, #0a0a0a 100%)` }}
            >
              {client.emoji || client.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold leading-tight">{client.name}</h1>
              <p className="text-xs text-foreground/65">Aprovação de postagens</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="text-xs text-foreground/65 hover:text-foreground/70 px-2 py-1 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-foreground/65 uppercase tracking-wide mb-1">Aguardando</p>
            <p className="text-2xl font-semibold text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-foreground/65 uppercase tracking-wide mb-1">Aprovados</p>
            <p className="text-2xl font-semibold text-emerald-400">{approvedCount}</p>
          </div>
        </div>

        {/* Lista de posts */}
        {clientPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-40">📭</div>
            <p className="text-foreground/65 text-sm">Nenhuma postagem para aprovar no momento.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {clientPosts.map((post) => (
              <ApprovalPostCard
                key={post.id}
                post={post}
                feedbackDraft={feedbackDrafts[post.id] ?? ""}
                onFeedbackChange={(text) =>
                  setFeedbackDrafts((prev) => ({ ...prev, [post.id]: text }))
                }
                onAction={(action) => handleAction(post, action)}
              />
            ))}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground/55">
            Tela de aprovação · {client.name}
          </p>
        </footer>
      </main>
    </div>
  );
}

function ApprovalPostCard({
  post,
  feedbackDraft,
  onFeedbackChange,
  onAction,
}: {
  post: SocialPost;
  feedbackDraft: string;
  onFeedbackChange: (text: string) => void;
  onAction: (action: PostStatus) => void;
}) {
  const isPending = post.status === "pending";
  const isResolved = post.status === "approved" || post.status === "rejected";

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Imagem */}
      {post.imageUrl && (
        <div className="aspect-video bg-black/40 sm:aspect-[4/3]">
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        {/* Status atual */}
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${STATUS_COLORS[post.status]}30`,
              color: STATUS_COLORS[post.status],
              border: `1px solid ${STATUS_COLORS[post.status]}60`,
            }}
          >
            {STATUS_LABELS[post.status]}
          </span>
          {post.scheduledDate && (
            <span className="text-[11px] text-foreground/65">
              Agendado para {new Date(post.scheduledDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Legenda */}
        <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
          {post.caption}
        </p>

        {/* Feedback anterior (se houver) */}
        {post.feedback && !isPending && (
          <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-lg p-3">
            <p className="text-[11px] text-blue-300/80 font-medium mb-1">Seu feedback:</p>
            <p className="text-xs text-blue-100/80 italic">{post.feedback}</p>
          </div>
        )}

        {/* Ações — só para posts pendentes ou com alterações solicitadas */}
        {(isPending || post.status === "changes_requested") && (
          <>
            <div>
              <label className="text-[11px] text-foreground/50 uppercase tracking-wide block mb-1.5">
                Feedback (opcional, exceto para "pedir alterações")
              </label>
              <textarea
                value={feedbackDraft}
                onChange={(e) => onFeedbackChange(e.target.value)}
                placeholder="Ex: Ajustar a primeira frase, trocar a hashtag..."
                rows={2}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/55 focus:border-blue-500/50 focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAction("approved")}
                className="flex-1 min-w-[120px] h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Aprovar
              </button>
              <button
                onClick={() => {
                  if (!feedbackDraft.trim()) {
                    alert("Por favor, descreva o que precisa ser alterado.");
                    return;
                  }
                  onAction("changes_requested");
                }}
                className="flex-1 min-w-[120px] h-10 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Pedir alterações
              </button>
              <button
                onClick={() => onAction("rejected")}
                className="flex-1 min-w-[120px] h-10 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Rejeitar
              </button>
            </div>
          </>
        )}

        {/* Mensagem final para posts já resolvidos */}
        {isResolved && (
          <div className="flex items-center gap-2 text-sm text-foreground/50 italic">
            {post.status === "approved" ? (
              <>
                <span className="text-emerald-400">✓</span> Você aprovou este post.
              </>
            ) : (
              <>
                <span className="text-red-400">✗</span> Você rejeitou este post.
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
