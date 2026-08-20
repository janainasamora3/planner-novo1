"use client";

import { useMemo, useState } from "react";
import { useSubCategories } from "@/hooks/use-subcategories";
import { useToast } from "@/hooks/use-toast";
import { SUB_CONTENT_TYPES, type SubCategory } from "@/lib/subcategories";
import { SubCategoryBar } from "./subcategory-bar";
import { SubCategoryEditorDialog } from "./subcategory-editor-dialog";
import { FunilKanbanView } from "./funil-kanban-view";
import { ContatosListView } from "./contatos-list-view";
import { BlocoAnotacoesView } from "./bloco-anotacoes-view";

export function ProspecaoCRM() {
  const { subcategories, updateSubCategory, resetAll: resetSubs } = useSubCategories("cat_prospect");
  const { toast } = useToast();

  // Subcategoria selecionada — persiste em localStorage
  const [selectedSubId, setSelectedSubId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem("dashboard.social.selectedSub_prospect");
    return stored || subcategories[0]?.id || null;
  });

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);

  function selectSub(id: string) {
    setSelectedSubId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dashboard.social.selectedSub_prospect", id);
    }
  }

  const selectedSub = useMemo(
    () => subcategories.find((s) => s.id === selectedSubId) ?? subcategories[0] ?? null,
    [subcategories, selectedSubId]
  );

  const contentType = selectedSub ? SUB_CONTENT_TYPES[selectedSub.id] : undefined;

  function handleReset() {
    if (confirm("Restaurar sub-menus padrão? Suas alterações serão perdidas.")) {
      resetSubs();
      toast({ title: "Sub-menus restaurados" });
    }
  }

  return (
    <div>
      {/* SubCategory bar — abas horizontais com underline colorido */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-2">
        <SubCategoryBar
          subcategories={subcategories}
          selectedId={selectedSub?.id ?? null}
          onSelect={selectSub}
          onEdit={(sub) => {
            setEditingSub(sub);
            setSubDialogOpen(true);
          }}
        />
      </div>

      {/* Conteúdo varia conforme a subcategoria selecionada */}
      {contentType === "lista" ? (
        <ContatosListView />
      ) : contentType === "notas" ? (
        <BlocoAnotacoesView />
      ) : (
        <FunilKanbanView />
      )}

      {/* Dialog de editar subcategoria */}
      <SubCategoryEditorDialog
        key={`sub-${subDialogOpen}-${editingSub?.id ?? "none"}`}
        open={subDialogOpen}
        onOpenChange={(o) => {
          setSubDialogOpen(o);
          if (!o) setEditingSub(null);
        }}
        editingSubCategory={editingSub}
        onSubmit={(data) => {
          if (editingSub) {
            updateSubCategory(editingSub.id, data);
            toast({ title: "Sub-menu atualizado", description: data.name });
          }
          setEditingSub(null);
        }}
      />
    </div>
  );
}
