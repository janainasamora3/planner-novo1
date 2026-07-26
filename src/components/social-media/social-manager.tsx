"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSocialMedia } from "@/hooks/use-social-media";
import { useCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type SocialClient,
  type SocialPost,
} from "@/lib/social-media";
import type { Client } from "@/lib/clients-crm";
import type { Category } from "@/lib/categories";
import { ClientEditorDialog } from "./client-editor-dialog";
import { ClientDetailTabs } from "./client-detail-tabs";
import { useAllClientDetails } from "@/hooks/use-client-detail";
import { PostEditorDialog } from "./post-editor-dialog";
import { CategoryBar } from "./category-bar";
import { CategoryEditorDialog } from "./category-editor-dialog";
import { ProspecaoCRM } from "./prospecao-crm";
import { BancoHeadlineView } from "./banco-headline-view";
import { CrmEquipeView } from "./crm-equipe-view";
import { CrmClientesView } from "./crm-clientes-view";
import { FinanceiroView } from "./financeiro-view";
import { OffboardingView } from "./offboarding-view";
import { LinksView } from "./links-view";
import { FuturoView } from "./futuro-view";
import { PrecificacaoPanel } from "./precificacao-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { FontScaleControl } from "@/components/font-scale-control";
import { cn } from "@/lib/utils";

interface SocialManagerProps {
  open: boolean;
  onClose: () => void;
}

type View = "clients" | "client-detail";

export function SocialManager({ open, onClose }: SocialManagerProps) {
  const {
    clients,
    posts,
    addClient,
    updateClient,
    removeClient,
    addPost,
    updatePost,
    removePost,
    resetAll,
  } = useSocialMedia();
  const { categories, updateCategory, resetAll: resetCategories } = useCategories();
  const { toast } = useToast();

  const [view, setView] = useState<View>("clients");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  // Sempre começa na página inicial (null) — não persiste o menu selecionado,
  // assim toda vez que abre o Social Media mostra a home com os 8 menus + cards.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  function selectCategory(id: string) {
    // String vazia = toggle off (volta para a home)
    setSelectedCategoryId(id || null);
  }

  // Limpa qualquer seleção persistida de versões antigas (que salvavam no localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("dashboard.social.selectedCategory");
    }
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const editingClient = useMemo(
    () => clients.find((c) => c.id === editingClientId) ?? null,
    [clients, editingClientId]
  );

  const editingPost = useMemo(
    () => posts.find((p) => p.id === editingPostId) ?? null,
    [posts, editingPostId]
  );

  const filteredClients = useMemo(
    () => clients.filter((c) => c.active === (statusFilter === "active")),
    [clients, statusFilter]
  );

  const clientPosts = useMemo(() => {
    if (!selectedClientId) return [];
    return posts
      .filter((p) => p.clientId === selectedClientId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, selectedClientId]);

  function openNewClient() {
    setEditingClientId(null);
    setClientDialogOpen(true);
  }

  function openEditClient(id: string) {
    setEditingClientId(id);
    setClientDialogOpen(true);
  }

  function openNewPost() {
    setEditingPostId(null);
    setPostDialogOpen(true);
  }

  function openEditPost(id: string) {
    setEditingPostId(id);
    setPostDialogOpen(true);
  }

  function openClientDetail(id: string) {
    setSelectedClientId(id);
    setView("client-detail");
  }

  function handleSubmitClient(data: {
    name: string;
    handle: string;
    emoji: string;
    color: string;
    active: boolean;
    startDate: string;
    endDate: string;
  }) {
    if (editingClientId) {
      updateClient(editingClientId, data);
      toast({ title: "Cliente atualizado", description: data.name });
    } else {
      const c = addClient(data);
      toast({ title: "Cliente criado", description: data.name });
      void c;
    }
    setEditingClientId(null);
  }

  function handleSubmitPost(data: {
    caption: string;
    imageUrl: string;
    scheduledDate: string;
    internalNotes: string;
  }) {
    if (!selectedClientId) return;
    if (editingPostId) {
      updatePost(editingPostId, data);
      toast({ title: "Post atualizado" });
    } else {
      addPost({ ...data, clientId: selectedClientId });
      toast({ title: "Post criado" });
    }
    setEditingPostId(null);
  }

  function handleDeleteClient(id: string) {
    removeClient(id);
    if (selectedClientId === id) {
      setSelectedClientId(null);
      setView("clients");
    }
    toast({ title: "Cliente excluído", variant: "destructive" });
  }

  function handleDeletePost(id: string) {
    removePost(id);
    toast({ title: "Post excluído", variant: "destructive" });
  }

  function handleReset() {
    if (confirm("Restaurar clientes, posts e menus de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      resetCategories();
      toast({ title: "Dados restaurados" });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          {view === "client-detail" ? (
            <button
              onClick={() => setView("clients")}
              className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Voltar para clientes"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h1 className="text-base sm:text-lg font-medium text-foreground">
              {view === "client-detail" && selectedClient
                ? selectedClient.name
                : "Social Media"}
            </h1>
            {view === "client-detail" && selectedClient?.handle && (
              <span className="text-sm text-foreground/65">{selectedClient.handle}</span>
            )}
            {/* Mostra o menu selecionado como breadcrumb no header */}
            {view === "clients" && selectedCategory && (
              <span className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-md text-xs text-foreground/70 bg-accent border border-border">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: selectedCategory.color }}
                />
                {selectedCategory.emoji && <span>{selectedCategory.emoji}</span>}
                {selectedCategory.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-xs text-foreground/70 hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            Restaurar demo
          </button>
          <FontScaleControl />
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-background">
        {view === "client-detail" && selectedClient ? (
          <ClientDetailTabs
            client={socialClientToClient(selectedClient)}
            onBack={() => setView("clients")}
            onEditClient={() => selectedClient && openEditClient(selectedClient.id)}
            onUpdateClient={(id, patch) => updateClient(id, patch)}
          />
        ) : (
          <>
            {/* Category bar — sempre no topo */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6 pb-4 border-b border-border">
              <CategoryBar
                categories={categories}
                selectedId={selectedCategoryId}
                onSelect={selectCategory}
                onEdit={(cat) => {
                  setEditingCategory(cat);
                  setCategoryDialogOpen(true);
                }}
              />
              <p className="text-[11px] text-foreground/55 mt-2">
                Dica: clique direito em um menu para editar nome, emoji e cor.
              </p>
            </div>

            {/* Conteúdo varia conforme o menu selecionado */}
            {selectedCategoryId === "cat_prospect" ? (
              <ProspecaoCRM />
            ) : selectedCategoryId === "cat_head" ? (
              <BancoHeadlineView />
            ) : selectedCategoryId === "cat_crm_eq" ? (
              <CrmEquipeView />
            ) : selectedCategoryId === "cat_crm_cli" ? (
              <CrmClientesView />
            ) : selectedCategoryId === "cat_fin" ? (
              <FinanceiroView />
            ) : selectedCategoryId === "cat_off" ? (
              <OffboardingView />
            ) : selectedCategoryId === "cat_links" ? (
              <LinksView />
            ) : selectedCategoryId === "cat_futuro" ? (
              <FuturoView />
            ) : selectedCategoryId === "cat_prec" ? (
              <PrecificacaoPanel pageId="social-media" />
            ) : (
              <ClientsView
                clients={filteredClients}
                allPosts={posts}
                statusFilter={statusFilter}
                onFilterChange={setStatusFilter}
                onNewClient={openNewClient}
                onOpenClient={openClientDetail}
                onEditClient={openEditClient}
              />
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <ClientEditorDialog
        key={`client-${clientDialogOpen}-${editingClientId ?? "new"}`}
        open={clientDialogOpen}
        onOpenChange={(o) => {
          setClientDialogOpen(o);
          if (!o) setEditingClientId(null);
        }}
        editingClient={editingClient}
        onSubmit={handleSubmitClient}
        onDelete={handleDeleteClient}
      />

      <PostEditorDialog
        key={`post-${postDialogOpen}-${editingPostId ?? "new"}-${selectedClientId}`}
        open={postDialogOpen}
        onOpenChange={(o) => {
          setPostDialogOpen(o);
          if (!o) setEditingPostId(null);
        }}
        editingPost={editingPost}
        clientName={selectedClient?.name ?? ""}
        onSubmit={handleSubmitPost}
        onDelete={handleDeletePost}
      />

      <CategoryEditorDialog
        key={`cat-${categoryDialogOpen}-${editingCategory?.id ?? "none"}`}
        open={categoryDialogOpen}
        onOpenChange={(o) => {
          setCategoryDialogOpen(o);
          if (!o) setEditingCategory(null);
        }}
        editingCategory={editingCategory}
        onSubmit={(data) => {
          if (editingCategory) {
            updateCategory(editingCategory.id, data);
            toast({ title: "Menu atualizado", description: data.name });
          }
          setEditingCategory(null);
        }}
      />
    </div>
  );
}

// =================== CLIENTS GRID VIEW ===================

function ClientsView({
  clients,
  allPosts: _allPosts,
  statusFilter,
  onFilterChange,
  onNewClient,
  onOpenClient,
  onEditClient,
}: {
  clients: SocialClient[];
  allPosts: SocialPost[];
  statusFilter: "active" | "inactive";
  onFilterChange: (f: "active" | "inactive") => void;
  onNewClient: () => void;
  onOpenClient: (id: string) => void;
  onEditClient: (id: string) => void;
}) {
  const activeCount = clients.filter((c) => c.active).length;
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Busca todos os ClientDetails para contar ContentEntry (posts IG/IN/YT)
  const allDetails = useAllClientDetails();

  // Helper: conta posts (ContentEntry) de um cliente
  function getPostCount(clientId: string): number {
    const detail = allDetails.find((d) => d.clientId === clientId);
    if (!detail) return 0;
    return (detail.instagram?.length ?? 0) + (detail.linkedin?.length ?? 0) + (detail.youtube?.length ?? 0);
  }
  function getPendingCount(clientId: string): number {
    const detail = allDetails.find((d) => d.clientId === clientId);
    if (!detail) return 0;
    const all = [...(detail.instagram ?? []), ...(detail.linkedin ?? []), ...(detail.youtube ?? [])];
    return all.filter((e) => !e.posted).length;
  }

  const filteredClients = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) =>
      `${c.name} ${c.handle} ${c.niche ?? ""} ${c.responsible ?? ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [clients, search]);

  return (
    <div className="bg-background text-foreground min-h-full">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header da seção */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide">
              Gerenciamento de redes sociais
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Gerencie todos os seus clientes de social media em um só lugar. Crie posts,
            acompanhe o status de cada publicação e organize por cliente.
          </p>
        </div>

        {/* Filtros + ações */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <FilterTab
              active={statusFilter === "active"}
              onClick={() => onFilterChange("active")}
              label="Clientes ativos"
              count={activeCount}
            />
            <FilterTab
              active={statusFilter === "inactive"}
              onClick={() => onFilterChange("inactive")}
              label="Clientes inativos"
              count={clients.length - activeCount}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {searchOpen ? (
              <div className="relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="h-8 pl-8 w-48 sm:w-64 text-xs"
                  autoFocus
                  onBlur={() => !search && setSearchOpen(false)}
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setSearchOpen(false); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                    aria-label="Limpar busca"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <ActionButton label="Buscar" onClick={() => setSearchOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </ActionButton>
            )}
            <button
              onClick={onNewClient}
              className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              Nova
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Grid de clientes */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <div className="text-5xl mb-3 opacity-40">👥</div>
            <p className="text-base font-medium text-foreground mb-1">
              {search
                ? "Nenhum cliente encontrado"
                : statusFilter === "active"
                  ? "Nenhum cliente ativo"
                  : "Nenhum cliente inativo"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? "Tente outro termo de busca."
                : 'Crie o primeiro cliente com o botão "Nova".'}
            </p>
            {!search && (
              <button
                onClick={onNewClient}
                className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Novo cliente
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredClients.map((client, idx) => (
              <ClientCard
                key={client.id}
                client={client}
                index={idx + 1}
                postCount={getPostCount(client.id)}
                pendingCount={getPendingCount(client.id)}
                onOpen={() => onOpenClient(client.id)}
                onEdit={() => onEditClient(client.id)}
              />
            ))}
            <button
              onClick={onNewClient}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 aspect-[4/3] w-full transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/[0.03]"
            >
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted-foreground group-hover:text-blue-500 transition-colors">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-500 transition-colors">
                Novo cliente
              </span>
            </button>
          </div>
        )}

        {/* Footer com contagem */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {filteredClients.length} de {clients.length} clientes · {activeCount} ativos
          </p>
          <p className="text-[11px] text-muted-foreground">
            💡 Clique num cliente para ver detalhes
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border transition-all",
        active
          ? "bg-foreground text-background border-foreground shadow-sm"
          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent"
      )}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M4 21v-1a8 8 0 0116 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-bold tabular-nums",
            active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ActionButton({
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
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent border border-border bg-card transition-colors"
    >
      {children}
    </button>
  );
}

function ClientCard({
  client,
  index,
  postCount,
  pendingCount,
  onOpen,
  onEdit,
}: {
  client: SocialClient;
  index: number;
  postCount: number;
  pendingCount: number;
  onOpen: () => void;
  onEdit: () => void;
}) {
  function formatDateRange(start?: string, end?: string): string {
    if (!start && !end) return "";
    const fmt = (d: string) =>
      new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `Início: ${fmt(start)}`;
    if (end) return `Até: ${fmt(end)}`;
    return "";
  }

  const dateRange = formatDateRange(client.startDate, client.endDate);

  return (
    <div
      className="group relative flex flex-col rounded-xl bg-card border border-border overflow-hidden transition-all duration-200 hover:border-foreground/25 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
      onClick={onOpen}
    >
      {/* Topo: número + botão editar */}
      <div className="flex items-center justify-between p-2.5 pb-1">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
          {index}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Editar cliente"
          title="Editar cliente"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Conteúdo central — avatar + nome + handle + datas */}
      <div className="flex flex-col items-center justify-center px-3 pb-3 flex-1">
        <div
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shrink-0 mb-2.5 ring-2 ring-background shadow-md"
          style={{
            background: `linear-gradient(135deg, ${client.color} 0%, ${client.color}dd 100%)`,
            color: "#ffffff",
          }}
        >
          {client.emoji || client.name.slice(0, 2).toUpperCase()}
        </div>

        <p className="text-sm font-bold text-foreground text-center px-2 line-clamp-1">
          {client.name}
        </p>

        {client.handle && (
          <p className="text-[11px] text-muted-foreground text-center px-2 line-clamp-1 mt-0.5">
            @{client.handle.replace(/^@/, "")}
          </p>
        )}

        {dateRange ? (
          <p className="text-[10px] text-muted-foreground/80 text-center px-2 mt-1.5 line-clamp-1 font-medium">
            {dateRange}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground/80 text-center px-2 mt-1.5">
            {postCount} {postCount === 1 ? "post" : "posts"}
            {pendingCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
                · {pendingCount} pendente{pendingCount === 1 ? "" : "s"}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Rodapé — mini stats */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {postCount} posts
        </span>
        {pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            {pendingCount} pend.
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Em dia
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Converte SocialClient (modelo simples do Social Media) para Client (modelo rico do CRM).
 * Necessário porque o ClientDetailTabs espera um Client completo, mas a home do
 * Social Media trabalha com SocialClient. Campos ausentes ficam undefined.
 */
function socialClientToClient(sc: SocialClient): Client {
  return {
    id: sc.id,
    name: sc.name,
    emoji: sc.emoji,
    color: sc.color,
    handle: sc.handle,
    status: sc.active ? "ativo" : "inativo",
    startDate: sc.startDate,
    endDate: sc.endDate,
    value: sc.value,
    responsible: sc.responsible,
    email: sc.email,
    whatsapp: sc.whatsapp,
    niche: sc.niche,
    serviceTypeIds: sc.serviceTypeIds ?? [],
    postFrequency: sc.postFrequency,
    notes: sc.notes,
    contractFile: undefined,
    contractFileName: undefined,
    terminationContractFile: undefined,
    terminationContractFileName: undefined,
    createdAt: sc.createdAt,
    updatedAt: sc.updatedAt,
  };
}

// =================== CLIENT DETAIL VIEW (posts) ===================

function ClientDetailView({
  client,
  posts,
  onNewPost,
  onEditPost,
  onDeletePost,
  onEditClient,
}: {
  client: SocialClient | null;
  posts: SocialPost[];
  onNewPost: () => void;
  onEditPost: (id: string) => void;
  onDeletePost: (id: string) => void;
  onEditClient: () => void;
}) {
  if (!client) return null;

  const pending = posts.filter((p) => p.status === "pending").length;
  const approved = posts.filter((p) => p.status === "approved").length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header do cliente */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-2xl shrink-0"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${client.color}40 0%, transparent 70%), linear-gradient(135deg, ${client.color} 0%, #0a0a0a 100%)`,
            }}
          >
            {client.emoji || client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
            {client.handle && (
              <p className="text-sm text-foreground/65">{client.handle}</p>
            )}
            {(client.startDate || client.endDate) && (
              <p className="text-xs text-foreground/55 mt-0.5">
                {client.startDate && new Date(client.startDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                {client.startDate && client.endDate && " → "}
                {client.endDate && new Date(client.endDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEditClient}
            className="h-9 px-3 rounded-lg bg-accent hover:bg-accent border border-border text-foreground/80 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Editar
          </button>
          <button
            onClick={onNewPost}
            className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Novo post
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="flex gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <p className="text-[10px] text-foreground/65 uppercase tracking-wide">Total</p>
          <p className="text-lg font-semibold text-foreground">{posts.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <p className="text-[10px] text-foreground/65 uppercase tracking-wide">Aguardando</p>
          <p className="text-lg font-semibold text-amber-400">{pending}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <p className="text-[10px] text-foreground/65 uppercase tracking-wide">Aprovados</p>
          <p className="text-lg font-semibold text-emerald-400">{approved}</p>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-40">📭</div>
          <p className="text-foreground/65 text-sm">
            Nenhum post ainda. Crie o primeiro com o botão "Novo post".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={() => onEditPost(post.id)}
              onDelete={() => onDeletePost(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: SocialPost;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/25 transition-colors group">
      {/* Imagem */}
      <div className="aspect-square bg-black/40 relative">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-3xl">
            📝
          </div>
        )}
        {/* Status badge */}
        <span
          className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
          style={{
            background: `${STATUS_COLORS[post.status]}30`,
            color: STATUS_COLORS[post.status],
            border: `1px solid ${STATUS_COLORS[post.status]}60`,
          }}
        >
          {STATUS_LABELS[post.status]}
        </span>
        {/* Ações */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-md bg-black/60 backdrop-blur-sm border border-border text-foreground/80 hover:text-foreground hover:bg-black/80 flex items-center justify-center"
            aria-label="Editar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="h-7 w-7 rounded-md bg-black/60 backdrop-blur-sm border border-border text-foreground/80 hover:text-foreground hover:bg-red-500/40 flex items-center justify-center"
            aria-label="Excluir"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 space-y-2">
        <p className="text-sm text-foreground/85 line-clamp-3 whitespace-pre-wrap leading-snug">
          {post.caption}
        </p>
        {post.scheduledDate && (
          <p className="text-[11px] text-foreground/65 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {new Date(post.scheduledDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
        {post.internalNotes && (
          <p className="text-[11px] text-foreground/55 italic line-clamp-1 border-t border-border pt-2">
            🔒 {post.internalNotes}
          </p>
        )}
      </div>
    </div>
  );
}
