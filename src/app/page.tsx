"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SECTIONS, type PageCard, type SectionId } from "@/lib/pages";
import { usePages } from "@/hooks/use-pages";
import { TopBar } from "@/components/dashboard/top-bar";
import { PageSection } from "@/components/dashboard/page-section";
import { AddPageDialog } from "@/components/dashboard/add-page-dialog";
import { PageDetailDialog } from "@/components/dashboard/page-detail-dialog";
import { CardContextMenu, type ContextMenuState } from "@/components/dashboard/card-context-menu";
import { SocialManager } from "@/components/social-media/social-manager";
import { EnterpriseManager } from "@/components/dashboard/enterprise-manager";
import { BusinessPlanManager } from "@/components/dashboard/business-plan-manager";
import { BooksManager } from "@/components/dashboard/books-manager";
import { TasksManager } from "@/components/dashboard/tasks-manager";
import { ModoCavernaManager } from "@/components/dashboard/modo-caverna-manager";
import { PlanejamentoManager } from "@/components/dashboard/planejamento-manager";
import { FinanceManager } from "@/components/dashboard/finance-manager";
import { IdeasManager } from "@/components/dashboard/ideas-manager";
import { QuickTasksManager } from "@/components/dashboard/quick-tasks-manager";
import { CalendarTasks } from "@/components/dashboard/calendar-tasks";
import { BackupSection } from "@/components/dashboard/backup-section";

interface DragState {
  draggingId: string | null;
  dragOverCardId: string | null;
  dragOverSection: SectionId | null;
}

export default function Home() {
  const { pages, loaded, addPage, updatePage, removePage, movePage, resetAll } = usePages();
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogSection, setAddDialogSection] = useState<SectionId>("pessoal");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState<PageCard | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    draggingId: null,
    dragOverCardId: null,
    dragOverSection: null,
  });
  const [socialManagerOpen, setSocialManagerOpen] = useState(false);
  const [enterprisePage, setEnterprisePage] = useState<PageCard | null>(null);
  const [businessPlanPage, setBusinessPlanPage] = useState<PageCard | null>(null);
  const [booksPage, setBooksPage] = useState<PageCard | null>(null);
  const [tasksPage, setTasksPage] = useState<PageCard | null>(null);
  const [cavernaPage, setCavernaPage] = useState<PageCard | null>(null);
  const [planejamentoPage, setPlanejamentoPage] = useState<PageCard | null>(null);
  const [financePage, setFinancePage] = useState<PageCard | null>(null);
  const [ideasPage, setIdeasPage] = useState<PageCard | null>(null);
  const [quickTasksPage, setQuickTasksPage] = useState<PageCard | null>(null);

  const editingPage = useMemo(
    () => pages.find((p) => p.id === editingPageId) || null,
    [pages, editingPageId]
  );

  const negociosPages = useMemo(
    () => pages.filter((p) => p.section === "negocios"),
    [pages]
  );
  const pessoalPages = useMemo(
    () => pages.filter((p) => p.section === "pessoal"),
    [pages]
  );

  function openAddDialog(section: SectionId) {
    setAddDialogSection(section);
    setEditingPageId(null);
    setAddDialogOpen(true);
  }

  /** Abre uma página — roteia para Social Manager se for especial, senão mostra detalhe. */
  function openPage(page: PageCard) {
    if (page.special === "social-media") {
      setSocialManagerOpen(true);
    } else if (page.special === "enterprise") {
      setEnterprisePage(page);
    } else if (page.special === "business-plan") {
      setBusinessPlanPage(page);
    } else if (page.special === "books") {
      setBooksPage(page);
    } else if (page.special === "tasks") {
      setTasksPage(page);
    } else if (page.special === "caverna") {
      setCavernaPage(page);
    } else if (page.special === "planejamento") {
      setPlanejamentoPage(page);
    } else if (page.special === "finance") {
      setFinancePage(page);
    } else if (page.special === "ideas") {
      setIdeasPage(page);
    } else if (page.special === "quick-tasks") {
      setQuickTasksPage(page);
    } else {
      setDetailPage(page);
    }
  }

  function openEditDialog(pageId: string) {
    setEditingPageId(pageId);
    setAddDialogOpen(true);
    setDetailPage(null);
  }

  function handleSubmit(data: {
    section: SectionId;
    title: string;
    emoji: string;
    color: string;
    imageUrl: string;
    content: string;
    special?: "enterprise" | undefined;
  }) {
    if (editingPageId) {
      updatePage(editingPageId, data);
      toast({ title: "Página atualizada", description: data.title });
    } else {
      addPage(data);
      toast({ title: "Página criada", description: data.title });
    }
    setEditingPageId(null);
  }

  function handleDelete(id: string) {
    const page = pages.find((p) => p.id === id);
    removePage(id);
    toast({
      title: "Página excluída",
      description: page?.title,
      variant: "destructive",
    });
  }

  function handleDuplicate(id: string) {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    addPage({
      section: page.section,
      title: `${page.title} (cópia)`,
      emoji: page.emoji,
      color: page.color,
      imageUrl: page.imageUrl,
      content: page.content,
      // Preserva o tipo de página (enterprise, social-media, etc.)
      special: page.special,
    });
    toast({ title: "Página duplicada", description: `${page.title} (cópia)` });
  }

  function handleContextMenu(e: React.MouseEvent, pageId: string) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pageId });
  }

  function handleReset() {
    if (confirm("Restaurar páginas padrão? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Páginas restauradas" });
    }
  }

  // ----- Drag & Drop handlers -----

  function handleCardDragStart(e: React.DragEvent, page: PageCard) {
    setDragState({
      draggingId: page.id,
      dragOverCardId: null,
      dragOverSection: null,
    });
    e.dataTransfer.effectAllowed = "move";
    // Necessário para o Firefox disparar o dragstart corretamente
    e.dataTransfer.setData("text/plain", page.id);
  }

  function handleCardDragEnd() {
    setDragState({ draggingId: null, dragOverCardId: null, dragOverSection: null });
  }

  function handleCardDragOver(e: React.DragEvent, target: PageCard) {
    if (!dragState.draggingId) return;
    if (dragState.draggingId === target.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragState((prev) =>
      prev.dragOverCardId === target.id
        ? prev
        : { ...prev, dragOverCardId: target.id, dragOverSection: target.section }
    );
  }

  function handleCardDrop(e: React.DragEvent, target: PageCard) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = dragState.draggingId;
    if (!sourceId || sourceId === target.id) {
      handleCardDragEnd();
      return;
    }
    movePage(sourceId, target.section, target.id);
    toast({
      title: "Página movida",
      description: `Antes de "${target.title}"`,
    });
    handleCardDragEnd();
  }

  function handleSectionDragOver(e: React.DragEvent, sectionId: SectionId) {
    if (!dragState.draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragState((prev) =>
      prev.dragOverSection === sectionId && !prev.dragOverCardId
        ? prev
        : { ...prev, dragOverSection: sectionId, dragOverCardId: null }
    );
  }

  function handleSectionDrop(e: React.DragEvent, sectionId: SectionId) {
    e.preventDefault();
    const sourceId = dragState.draggingId;
    if (!sourceId) {
      handleCardDragEnd();
      return;
    }
    // Se houver card-alvo mais específico, deixa o handler do card cuidar.
    if (dragState.dragOverCardId) {
      handleCardDragEnd();
      return;
    }
    const source = pages.find((p) => p.id === sourceId);
    movePage(sourceId, sectionId, null);
    if (source && source.section !== sectionId) {
      const sectionLabel = SECTIONS.find((s) => s.id === sectionId)?.title;
      toast({
        title: "Página movida",
        description: `"${source.title}" → ${sectionLabel}`,
      });
    }
    handleCardDragEnd();
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const dragHandlers = {
    dragState,
    onCardDragStart: handleCardDragStart,
    onCardDragEnd: handleCardDragEnd,
    onCardDragOver: handleCardDragOver,
    onCardDrop: handleCardDrop,
    onSectionDragOver: handleSectionDragOver,
    onSectionDrop: handleSectionDrop,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar
        onAddToNegocios={() => openAddDialog("negocios")}
        onAddToPessoal={() => openAddDialog("pessoal")}
        onReset={handleReset}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
          {SECTIONS.map((section) => (
            <PageSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              count={section.id === "negocios" ? negociosPages.length : pessoalPages.length}
              pages={section.id === "negocios" ? negociosPages : pessoalPages}
              onAdd={() => openAddDialog(section.id)}
              onOpenPage={openPage}
              onContextMenu={handleContextMenu}
              {...dragHandlers}
            />
          ))}
        </div>

        <footer className="mt-16 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground/55">
            {pages.length} páginas · Dados salvos localmente · Arraste cards para reorganizar
          </p>
        </footer>

        {/* Calendário de tarefas — entre os cards e o backup */}
        <div className="mt-8 pt-6 border-t border-border">
          <CalendarTasks />
        </div>

        {/* Seção de backup — bem lá embaixo, depois do calendário */}
        <div className="mt-8 pt-6 border-t border-border">
          <BackupSection />
        </div>
      </main>

      {/* Dialog de criar/editar — key força remount quando abertura muda para
          que o estado interno do form sincronize com defaultSection/editingPage. */}
      <AddPageDialog
        key={`${addDialogOpen}-${editingPageId ?? "new"}-${addDialogSection}`}
        open={addDialogOpen}
        onOpenChange={(o) => {
          setAddDialogOpen(o);
          if (!o) setEditingPageId(null);
        }}
        defaultSection={addDialogSection}
        editingPage={editingPage}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      {/* Dialog de visualização */}
      <PageDetailDialog
        page={detailPage}
        onOpenChange={(o) => !o && setDetailPage(null)}
        onEdit={() => detailPage && openEditDialog(detailPage.id)}
      />

      {/* Menu de contexto */}
      <CardContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* Gerenciador de Social Media */}
      <SocialManager open={socialManagerOpen} onClose={() => setSocialManagerOpen(false)} />

      {/* Gerenciador de Empresa (cards de negócios) */}
      {enterprisePage && (
        <EnterpriseManager page={enterprisePage} onClose={() => setEnterprisePage(null)} />
      )}

      {/* Plano Empresarial (planejamento estratégico) */}
      {businessPlanPage && (
        <BusinessPlanManager page={businessPlanPage} onClose={() => setBusinessPlanPage(null)} />
      )}

      {/* Gerenciador de Livros (rastreador de leitura) */}
      {booksPage && (
        <BooksManager page={booksPage} onClose={() => setBooksPage(null)} />
      )}

      {/* Gerenciador de Tarefas & Calendário */}
      {tasksPage && (
        <TasksManager page={tasksPage} onClose={() => setTasksPage(null)} />
      )}

      {/* Modo Caverna (timer Pomodoro) */}
      {cavernaPage && (
        <ModoCavernaManager page={cavernaPage} onClose={() => setCavernaPage(null)} />
      )}

      {/* Planejamento (27 cards) */}
      {planejamentoPage && (
        <PlanejamentoManager page={planejamentoPage} onClose={() => setPlanejamentoPage(null)} />
      )}

      {/* Gerenciador de Finanças */}
      {financePage && (
        <FinanceManager page={financePage} onClose={() => setFinancePage(null)} />
      )}

      {/* Gerenciador de Ideias */}
      {ideasPage && (
        <IdeasManager page={ideasPage} onClose={() => setIdeasPage(null)} />
      )}

      {/* Gerenciador de Tarefas Rápidas */}
      {quickTasksPage && (
        <QuickTasksManager page={quickTasksPage} onClose={() => setQuickTasksPage(null)} />
      )}
    </div>
  );
}
